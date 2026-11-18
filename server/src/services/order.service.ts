import { Order, OrderStatus, Role, User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { GraphQLContext } from '../types/types';
import { authorize } from '../utils/auth';
import { getYearRange } from '../utils/common';
import { ProductService } from './product.service';
import { PushService } from './push.service';
import {
    CreateOrderInput,
    CreateOrderProductInput,
    IOrder,
    IOrderProduct,
} from '../types/order';
import { MLString } from '../lib/mlstring';
import { IPushMessage } from '../types/pushes';

function getNewOrderPushMessage(
    orderNumber: string,
    customerName: string
): IPushMessage {
    return {
        title: {
            default: 'New order received',
            ts: {
                de: 'Neue Bestellung eingegangen',
                fr: 'Nouvelle commande reçue',
                es: 'Nuevo pedido recibido',
                ru: 'Поступил новый заказ',
                it: 'Nuovo ordine ricevuto',
                sr: 'Primljena je nova porudžbina',
            },
        },
        body: {
            default: `Order #${orderNumber} from ${customerName}`,
            ts: {
                de: `Bestellung #${orderNumber} von ${customerName}`,
                fr: `Commande n° ${orderNumber} de ${customerName}`,
                es: `Pedido n.º ${orderNumber} de ${customerName}`,
                ru: `Заказ №${orderNumber} от ${customerName}`,
                it: `Ordine n. ${orderNumber} da ${customerName}`,
                sr: `Porudžbina br. ${orderNumber} od ${customerName}`,
            },
        },
    };
}

function getOrderPushUrl(orderId: string): string {
    return `/tool/Orders/${encodeURIComponent(orderId)}`;
}

export class OrderService {
    static removeDoubles(
        ctx: GraphQLContext,
        order: CreateOrderInput
    ): CreateOrderInput {
        const uniqueWithMax = Object.values(
            order.products.reduce<Record<string, CreateOrderProductInput>>(
                (acc, current) => {
                    const existing =
                        acc[`${current.productId}-${current.variantLabel}`];

                    // Если объекта с таким id еще нет ИЛИ текущая версия больше существующей
                    if (!existing || current.quantity > existing.quantity) {
                        acc[`${current.productId}-${current.variantLabel}`] =
                            current;
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
                const balances = stock.stockBalances.find(
                    (s) => s.variantLabel === product.variantLabel
                );
                const delta = balances
                    ? balances.physical_balance - balances.reserved_balance
                    : 0;
                //console.log(delta);
                const oldQty = calcData[1]?.products.find(
                    (el) =>
                        el.productId === product.productId &&
                        el.variantLabel === product.variantLabel
                )?.quantity;
                if (oldQty && calcData[1]?.id) {
                    if (delta + oldQty < product.quantity) {
                        product.quantity = oldQty + delta;
                        PushService.sendLocationManagers(
                            ctx,
                            {
                                body: `Product: ${new MLString(stock.name as any).toString()} - ${product.variantLabel}\nUser: ${calcData[1]?.customerName}`,
                                title: 'Not enough',
                            },
                            getOrderPushUrl(calcData[1].id)
                        );
                    }
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
        let newData: Order | null;
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
                        el.quantity,
                        el.variantLabel ?? undefined
                    );
                    return {
                        product: {
                            connect: { id: el.productId },
                        },
                        quantity: el.quantity,
                        sortOrder: idx,
                        variantLabel: el.variantLabel,
                        price: price,
                    };
                }
            );

            // 2. Wait for all prices to resolve concurrently
            const resolvedProducts = await Promise.all(productDataPromises);

            // 3. Create the order with the fully resolved data
            const totalPrice = resolvedProducts.reduce(
                (sum, p) => sum + p.price,
                0
            );
            return await prisma.order.create({
                data: {
                    ...normalizedOrder,
                    customerName: normalizedOrder.customerName ?? '',
                    customerUserId: ctx.userId,
                    number: `${String(new Date().getFullYear()).slice(-2)}-${orderNumber}`,
                    numberInt: orderNumber,
                    status: OrderStatus.DRAFT,
                    locationId: ctx.locationId!,
                    totalPrice: totalPrice,
                    deliveryFee: 0,
                    products: {
                        create: resolvedProducts,
                    },
                },
                include: {
                    products: {
                        include: {
                            product: {
                                include: {
                                    variants: true,
                                    modifierGroups: true,
                                    comboItems: true,
                                },
                            },
                        },
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
                        el.quantity,
                        el.variantLabel ?? undefined
                    );

                    return {
                        product: {
                            connect: { id: el.productId },
                        },
                        quantity: el.quantity,
                        sortOrder: idx,
                        variantLabel: el.variantLabel,
                        price: isNaN(price) ? Infinity : price,
                    };
                }
            );

            // 2. Wait for all prices to resolve concurrently
            const resolvedProducts = await Promise.all(productDataPromises);

            const totalPrice = resolvedProducts.reduce(
                (sum, p) => sum + p.price,
                0
            );
            const deliveryFee = newData.deliveryFee;
            data.totalPrice = totalPrice + deliveryFee;

            const updatedOrder = await prisma.order.update({
                where: { id: data.id },
                data: {
                    products: {
                        deleteMany: { orderId: data.id },
                        create: resolvedProducts,
                    },
                    totalPrice: totalPrice + deliveryFee,
                    customerName: normalizedOrder.customerName,
                },
                include: {
                    products: {
                        include: {
                            product: {
                                include: {
                                    variants: true,
                                    modifierGroups: true,
                                    comboItems: true,
                                },
                            },
                        },
                    },
                },
            });
            //console.log(updatedOrder);
            return updatedOrder;
        }
    }
    static async getCustomerDraft(ctx: GraphQLContext, orderId: string) {
        await authorize(ctx, Role.CUSTOMER);
        const userId = ctx.userId;
        const locationId = ctx.locationId;
        if (!userId || !locationId) {
            throw new Error('Customer and location context are required');
        }

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                customerUserId: userId,
                locationId,
                status: OrderStatus.DRAFT,
            },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        if (!order) {
            throw new Error('Draft order not found or cannot be submitted');
        }
        return order;
    }

    static async confirmCustomerDraft(
        ctx: GraphQLContext,
        orderId: string,
        delivery: {
            customerName: string;
            customerEmail: string;
            customerPhone: string;
            customerDeliveryAddress: string;
            deliveryLat: number;
            deliveryLon: number;
            deliveryFee: number;
            note?: string;
        }
    ) {
        await authorize(ctx, Role.CUSTOMER);
        const userId = ctx.userId;
        const locationId = ctx.locationId;
        if (!userId || !locationId) {
            throw new Error('Customer and location context are required');
        }
        if (
            !Number.isFinite(delivery.deliveryFee) ||
            delivery.deliveryFee < 0
        ) {
            throw new Error('Delivery fee must be a non-negative number');
        }
        const customerPhone = delivery.customerPhone.trim();
        if (!customerPhone) {
            throw new Error('Customer phone is required');
        }

        await prisma.$transaction(async (transaction) => {
            const updated = await transaction.order.updateMany({
                where: {
                    id: orderId,
                    customerUserId: userId,
                    locationId,
                    status: OrderStatus.DRAFT,
                },
                data: {
                    status: OrderStatus.CONFIRMED,
                    customerName: delivery.customerName,
                    customerEmail: delivery.customerEmail,
                    customerPhone,
                    deliveryAddress: delivery.customerDeliveryAddress,
                    deliveryLocation: {
                        lat: delivery.deliveryLat,
                        lon: delivery.deliveryLon,
                    },
                    deliveryFee: delivery.deliveryFee,
                    totalPrice: { increment: delivery.deliveryFee },
                    notes: delivery.note ?? null,
                },
            });
            if (updated.count !== 1) {
                throw new Error('Draft order not found or cannot be submitted');
            }

            await transaction.user.update({
                where: { id: userId },
                data: { phone: customerPhone },
            });
        });

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, number: true },
        });
        if (!order) {
            throw new Error('Confirmed order not found');
        }

        await PushService.sendLocationManagers(
            ctx,
            getNewOrderPushMessage(order.number, delivery.customerName),
            getOrderPushUrl(order.id)
        );
        return order;
    }

    static async getLocationOrders(ctx: GraphQLContext) {
        await authorize(ctx, [Role.MANAGER, Role.SUPERVISOR, Role.EMPLOYEE]);
        const locationId = ctx.locationId;
        if (!locationId) {
            throw new Error('Location context is required to view orders');
        }

        const orders = await prisma.order.findMany({
            where: { locationId },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: [{ createdAt: 'desc' }],
        });
        const customerIds = [
            ...new Set(
                orders
                    .map((order) => order.customerUserId)
                    .filter((userId): userId is string => Boolean(userId))
            ),
        ];
        const customers = customerIds.length
            ? await prisma.user.findMany({
                  where: { id: { in: customerIds } },
                  select: { id: true, email: true, phone: true },
              })
            : [];
        const customerById = new Map(
            customers.map((customer) => [customer.id, customer])
        );

        return orders.map((order) => {
            const customer = order.customerUserId
                ? customerById.get(order.customerUserId)
                : undefined;
            return {
                ...order,
                customerEmail: order.customerEmail ?? customer?.email ?? null,
                customerPhone: order.customerPhone ?? customer?.phone ?? null,
            };
        });
    }

    static async startProduction(ctx: GraphQLContext, orderId: string) {
        await authorize(ctx, [
            Role.MANAGER,
            Role.SUPERVISOR,
            Role.EMPLOYEE,
        ]);
        const locationId = ctx.locationId;
        if (!locationId) {
            throw new Error('Location context is required to update orders');
        }

        const updated = await prisma.order.updateMany({
            where: {
                id: orderId,
                locationId,
                status: OrderStatus.CONFIRMED,
            },
            data: {
                status: OrderStatus.IN_PRODUCTION,
            },
        });
        if (updated.count !== 1) {
            throw new Error(
                'Order not found in this location or is not awaiting acceptance'
            );
        }

        const order = await prisma.order.findFirst({
            where: { id: orderId, locationId },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        if (!order) {
            throw new Error('Updated order could not be loaded');
        }
        return order;
    }

    static async cancelOrder(ctx: GraphQLContext, orderId: string) {
        await authorize(ctx, [Role.MANAGER, Role.SUPERVISOR]);
        const locationId = ctx.locationId;
        if (!locationId) {
            throw new Error('Location context is required to cancel orders');
        }

        const updated = await prisma.order.updateMany({
            where: {
                id: orderId,
                locationId,
                status: { not: OrderStatus.CANCELLED },
            },
            data: { status: OrderStatus.CANCELLED },
        });
        if (updated.count !== 1) {
            throw new Error(
                'Order not found in this location or is already cancelled'
            );
        }

        const order = await prisma.order.findFirst({
            where: { id: orderId, locationId },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        if (!order) {
            throw new Error('Cancelled order could not be loaded');
        }
        return order;
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
                    include: {
                        product: {
                            include: {
                                variants: true,
                                modifierGroups: true,
                                comboItems: true,
                            },
                        },
                    },
                },
            },
        });
        //console.log(data);
        return data;
    }

    static async order(ctx: GraphQLContext, orderId: string): Promise<Order | null> {
        await authorize(ctx, Role.CUSTOMER);
        const order = await prisma.order.findFirst({
            where: {
                id: orderId
            },
            include: {
                products: {
                    include: {
                        product: {
                            include: {
                                variants: true,
                                modifierGroups: true,
                                comboItems: true,
                            },
                        },
                    },
                },
            }
        });
        if (order?.customerUserId === ctx.userId || await authorize(ctx, Role.MANAGER)) {
            return order
        }
        return null
    }
}
