// server/src/services/movement.service.ts
import { MovementType, Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CreateMovementInput, GraphQLContext } from '../types/types';
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
}
