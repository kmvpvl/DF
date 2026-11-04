// server/src/services/movement.service.ts
import { MovementGroup, MovementType, Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
    BasketMovementGroupResult,
    CreateMovementInput,
    GraphQLContext,
    ReservesInput,
} from '../types';
import { authorize } from '../utils/auth';

export class MovementService {
    /**
     * Универсальный метод для создания проводки.
     * Может использоваться внутри транзакций через передачу контекста (tx).
     */
    static async create(
        data: CreateMovementInput,
        ctx: GraphQLContext,
        tx?: any // Принимает Prisma.TransactionClient для атомарности
    ) {
        const client = tx || prisma;
        await authorize(ctx, Role.EMPLOYEE);
        console.log({ ...data, userId: ctx.userId });

        return await client.movement.create({
            data: { ...data, userId: ctx.userId },
        });
    }

    /**
     * Метод для расчета текущего остатка продукта
     */
    static async getStockBalance(productId: string): Promise<number> {
        const movements = await prisma.movement.findMany({
            where: { productId },
        });

        return movements.reduce((acc, m) => {
            // Логика: что прибавляем, что отнимаем
            if (
                m.type === 'PURCHASE' ||
                m.type === 'PRODUCTION' ||
                m.type === 'RETURN'
            ) {
                return acc + m.quantity;
            } else {
                return acc - m.quantity;
            }
        }, 0);
    }

    static async Reserve(
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
    }
}
