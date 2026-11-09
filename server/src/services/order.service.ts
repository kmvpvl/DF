import { Order, OrderStatus, Product, Role, User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
    CreateOrderInput,
    CreateOrderProductInput,
    GraphQLContext,
    IOrder,
    IOrderProduct,
} from '../types/types';
import { authorize } from '../utils/auth';
import { getYearRange } from '../utils/common';
import { ProductService } from './product.service';
import { PushService } from './push.service';

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
        qty: number
    ): Promise<number> {
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
            },
        });
        if (!product)
            throw Error(`INCONSISTENCY: Product id = "${productId}" not found`);
        const user = await prisma.user.findFirst({
            where: { id: ctx.userId },
        });
        if (user?.entityType === 'LEGAL_ENTITY')
            return (product.priceOptions as any).legalPrice ?? NaN;
        else return (product.priceOptions as any).individualPrice ?? NaN;
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
                        deleteMany: {},
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
