// server/src/services/movement.service.ts
import { PrismaClient, MovementType } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class MovementService {
    /**
     * Универсальный метод для создания проводки.
     * Может использоваться внутри транзакций через передачу контекста (tx).
     */
    static async createMovement(
        data: {
            type: MovementType;
            productId: string;
            batchId?: string;
            quantity: number;
        },
        tx?: any // Принимает Prisma.TransactionClient для атомарности
    ) {
        const client = tx || prisma;

        return await client.movement.create({
            data: {
                type: data.type,
                productId: data.productId,
                batchId: data.batchId,
                quantity: data.quantity,
            },
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
}
