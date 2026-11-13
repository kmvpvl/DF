import { Order, OrderStatus, Role, User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { GraphQLContext } from '../types/types';
import { authorize } from '../utils/auth';
import { getYearRange } from '../utils/common';
import { ProductService } from './product.service';
import { PushService } from './push.service';
import { CreateOrderInput, CreateOrderProductInput } from '../types/order';

export class OrderService {
    static removeDoubles(
        ctx: GraphQLContext,
        order: CreateOrderInput
    ): CreateOrderInput {
        const uniqueWithMax = Object.values(
            order.products.reduce<Record<string, CreateOrderProductInput>>(
                (acc, current) => {
                    const existing = acc[current.productId];

                    // Если объекта с таким id еще нет ИЛИ текущая версия больше существующей
                    if (!existing || current.quantity > existing.quantity) {
                        acc[current.productId] = current;
                    }

                    return acc;
                },
                {}
            )
        );
        return {
            ...order,
            products: uniqueWithMax,
        };
    }
    static async checkAvailability(
        ctx: GraphQLContext,
        order: CreateOrderInput
    ): Promise<CreateOrderInput> {
        const stocks = ProductService.getPublicProductsWithStock(ctx);
        const userDraft = prisma.order.findFirst({
            where: {
                status: OrderStatus.DRAFT,
                customerUserId: ctx.userId,
                locationId: ctx.locationId,
            },
            include: {
                products: true,
            },
        });
        const calcData = await Promise.all([stocks, userDraft]);
        for (const product of order.products) {
            const stock = calcData[0].find((el) => el.id === product.productId);
            if (stock !== undefined && stock.stockBalances.length > 0) {
                const balances = stock.stockBalances[0];
                const delta =
                    balances.physical_balance - balances.reserved_balance;
                //console.log(delta);
                const oldQty = calcData[1]?.products.find(
                    (el) => el.productId === product.productId
                )?.quantity;
                if (oldQty) {
                    if (delta + oldQty < product.quantity)
                        product.quantity = oldQty + delta;
                }
            }
        }
        return order;
    }
    static async normalizeOrder(
        ctx: GraphQLContext,
        order: CreateOrderInput
    ): Promise<CreateOrderInput> {
        return OrderService.checkAvailability(
            ctx,
            OrderService.removeDoubles(ctx, order)
        );
    }

    static async getEffectivePrice(
        ctx: GraphQLContext,
        productId: string,
        qty: number,
        variantionLabel?: string,
        modifierIds: string[] = []
    ): Promise<number> {
        const locationId = ctx.locationId;

        if (!locationId) {
            throw new Error('Location ID is missing in context');
        }

        // 1. Проверяем тип пользователя
        let isLegalEntity = false;
        if (ctx.userId) {
            const user = await prisma.user.findFirst({
                where: { id: ctx.userId },
                select: { entityType: true },
            });
            if (user?.entityType === 'LEGAL_ENTITY') {
                isLegalEntity = true;
            }
        }

        // 2. Запрашиваем продукт
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                isPublic: true,
            },
            include: {
                variants: {
                    include: {
                        locationPrices: {
                            where: { locationId: locationId },
                        },
                    },
                },
                modifierGroups: {
                    include: {
                        modifiers: {
                            include: {
                                locationPrices: {
                                    where: { locationId: locationId },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!product) {
            throw new Error(
                `Product with ID ${productId} not found or inactive`
            );
        }

        // 3. Валидация правил групп модификаторов
        for (const group of product.modifierGroups) {
            const groupModifierIds = group.modifiers.map((m) => m.id);
            const selectedInGroupCount = modifierIds.filter((id) =>
                groupModifierIds.includes(id)
            ).length;

            if (
                group.isRequired &&
                selectedInGroupCount < Math.max(1, group.minSelect)
            ) {
                throw new Error(`Modifier group "${group.title}" is required.`);
            }
            if (
                !group.isRequired &&
                group.minSelect > 0 &&
                selectedInGroupCount > 0 &&
                selectedInGroupCount < group.minSelect
            ) {
                throw new Error(
                    `Minimum ${group.minSelect} options required for "${group.title}".`
                );
            }
            if (group.maxSelect > 0 && selectedInGroupCount > group.maxSelect) {
                throw new Error(
                    `Maximum ${group.maxSelect} options allowed for "${group.title}".`
                );
            }
        }

        // 4. Определяем нужный вариант товара
        let targetVariant;
        if (variantionLabel) {
            targetVariant = product.variants.find((v) => {
                const labelObj = v.label as Record<string, string>;
                return Object.values(labelObj).includes(variantionLabel);
            });
        } else {
            // Если массив не пустой, берем первый дефолтный вариант
            targetVariant = product.variants[0];
        }

        if (!targetVariant) {
            throw new Error(`Variant not found for product ${productId}`);
        }

        // 🔥 ИСПРАВЛЕНИЕ: Берем первый элемент из массива [0]
        const locationPriceConfig = targetVariant.locationPrices[0];

        if (!locationPriceConfig || !locationPriceConfig.isAvailable) {
            throw new Error(
                `Product variant is not available in location ${locationId}`
            );
        }

        // 5. Выбираем базочную цену и скидки
        let basePrice: number;
        let discountsJson: any;

        if (isLegalEntity) {
            basePrice =
                locationPriceConfig.legalEntityPrice ??
                locationPriceConfig.individualPrice;
            discountsJson = locationPriceConfig.legalDiscounts;
        } else {
            basePrice = locationPriceConfig.individualPrice;
            discountsJson = locationPriceConfig.individualDiscounts;
        }

        // 6. Расчет скидочных тиров
        const discounts = (discountsJson as any) || [];
        if (discounts.length > 0) {
            const sortedDiscounts = [...discounts].sort(
                (a, b) => b.threshold - a.threshold
            );
            const applicableDiscount = sortedDiscounts.find(
                (tier) => qty >= tier.threshold
            );

            if (applicableDiscount) {
                const discountAmount =
                    (basePrice * applicableDiscount.discount) / 100;
                basePrice = basePrice - discountAmount;
            }
        }

        // 7. Считаем стоимость выбранных модификаторов
        let totalModifiersPrice = 0;
        const allModifiers = product.modifierGroups.flatMap(
            (group) => group.modifiers
        );

        for (const modifierId of modifierIds) {
            const modifier = allModifiers.find((m) => m.id === modifierId);

            if (!modifier) {
                throw new Error(
                    `Modifier ${modifierId} is not valid for product ${productId}`
                );
            }

            // 🔥 ИСПРАВЛЕНИЕ: Здесь тоже берем первый элемент массива [0]
            const modLocationConfig = modifier.locationPrices[0];

            if (!modLocationConfig || !modLocationConfig.isAvailable) {
                throw new Error(
                    `Modifier ${modifierId} is not available in location ${locationId}`
                );
            }

            let modPrice = isLegalEntity
                ? (modLocationConfig.legalEntityPrice ??
                  modLocationConfig.individualPrice)
                : modLocationConfig.individualPrice;

            totalModifiersPrice += modPrice;
        }

        const finalUnitPrice = basePrice + totalModifiersPrice;
        return finalUnitPrice * qty;
    }

    static async Draft(data: CreateOrderInput, ctx: GraphQLContext) {
        //await PushService.send("cmmwb15ct0001favlab1tw2yi", {title: "TEST", body: "Test body"}, "/tool");
        let newData: CreateOrderInput | null;
        await authorize(ctx, Role.CUSTOMER);
        const normalizedOrder = await this.normalizeOrder(ctx, data);
        if (normalizedOrder.id === undefined) {
            //
            const { start, end } = getYearRange(new Date());
            const aggregate = await prisma.order.aggregate({
                where: {
                    locationId: ctx.locationId,
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                },
                _max: {
                    numberInt: true,
                },
            });

            const orderNumber = (aggregate._max.numberInt ?? 0) + 1;
            // 1. Map the products into an array of Promises
            const productDataPromises = normalizedOrder.products.map(
                async (el, idx) => {
                    const price = await this.getEffectivePrice(
                        ctx,
                        el.productId,
                        el.quantity
                    );
                    return {
                        product: {
                            connect: { id: el.productId },
                        },
                        quantity: el.quantity,
                        sortOrder: idx,
                        variationLabel: el.variationLabel,
                        price: price,
                    };
                }
            );

            // 2. Wait for all prices to resolve concurrently
            const resolvedProducts = await Promise.all(productDataPromises);

            // 3. Create the order with the fully resolved data
            return await prisma.order.create({
                data: {
                    ...normalizedOrder,
                    customerName: '',
                    customerUserId: ctx.userId,
                    number: `${String(new Date().getFullYear()).slice(-2)}-${orderNumber}`,
                    numberInt: orderNumber,
                    status: OrderStatus.DRAFT,
                    locationId: ctx.locationId!,
                    products: {
                        create: resolvedProducts,
                    },
                },
            });
        } else {
            newData = await prisma.order.findFirst({
                where: {
                    locationId: ctx.locationId,
                    customerUserId: ctx.userId,
                    id: data.id,
                },
                include: {
                    products: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
            if (!newData)
                throw Error(
                    `INCONSTISTENCY: Order id = "${data.id}" not found`
                );
            // 1. Map the products into an array of Promises
            const productDataPromises = normalizedOrder.products.map(
                async (el, idx) => {
                    const price = await this.getEffectivePrice(
                        ctx,
                        el.productId,
                        el.quantity
                    );
                    return {
                        product: {
                            connect: { id: el.productId },
                        },
                        quantity: el.quantity,
                        sortOrder: idx,
                        variationLabel: el.variationLabel,
                        price: isNaN(price) ? 1000 : 0,
                    };
                }
            );

            // 2. Wait for all prices to resolve concurrently
            const resolvedProducts = await Promise.all(productDataPromises);

            const updatedOrder = await prisma.order.update({
                where: { id: data.id },
                data: {
                    products: {
                        deleteMany: { orderId: data.id },
                        create: resolvedProducts,
                    },
                },
                include: {
                    products: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
            //console.log(updatedOrder);
            return updatedOrder;
        }
    }
    static async getDraft(ctx: GraphQLContext): Promise<Order | null> {
        await authorize(ctx, Role.CUSTOMER);
        const data = await prisma.order.findFirst({
            where: {
                status: OrderStatus.DRAFT,
                locationId: ctx.locationId,
                customerUserId: ctx.userId,
            },
            include: {
                products: {
                    include: { product: true },
                },
            },
        });
        //console.log(data);
        return data;
    }
    /*static async Reserve1(
        data: ReservesInput,
        ctx: GraphQLContext
    ): Promise<BasketMovementGroupResult | null> {
        // Явно указываем тип Promise<MovementGroupResult> для транзакции
        await prisma.$transaction(async (tx) => {
            await authorize(ctx, Role.CUSTOMER);

            if (!ctx.locationId) throw new Error('Location ID is required');

            let group: MovementGroup | null = null;

            group = await tx.movementGroup.findFirst({
                where: { userId: ctx.userId },
            });
            if (group) {
                await tx.movement.deleteMany({
                    where: { groupId: group.id },
                });
            }

            if (!group) {
                group = await tx.movementGroup.create({
                    data: {
                        label: 'RESERVE',
                        userId: ctx.userId!,
                    },
                });
            }

            for (const product of data.reserves) {
                const res_created = await tx.movement.create({
                    data: {
                        type: 'RESERVE',
                        quantity: product.quantity,
                        productId: product.productId,
                        locationId: ctx.locationId,
                        groupId: group.id,
                        userId: ctx.userId,
                    },
                });
            }
        });
        return this.getReservesByCustomer(ctx);
    }

    static async getReservesByCustomer(
        ctx: GraphQLContext
    ): Promise<BasketMovementGroupResult | null> {
        const group = await prisma.movementGroup.findMany({
            where: { userId: ctx.userId, label: 'RESERVE' },
        });
        if (group.length > 1) {
            // надо удалить лишнее бронирование и объединить все в одно
        }
        if (group.length === 1) {
            const movements = await prisma.movement.findMany({
                where: { userId: ctx.userId, groupId: group[0].id },
            });
            const ret: BasketMovementGroupResult = {
                ...group[0],
                basket: movements.map((el) => {
                    return { productId: el.productId, quantity: el.quantity };
                }),
            };
            return ret;
        } else {
            return null;
        }
    }*/
}
