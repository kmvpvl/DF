// server/src/services/movement.service.ts
import { MovementType, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CreateMovementInput, GraphQLContext } from '../types';
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

        return await client.movement.create({data: data});
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
}
