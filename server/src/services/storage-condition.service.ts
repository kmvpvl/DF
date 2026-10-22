// server/src/services/storage-condition.service.ts
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { GraphQLContext } from '../types';
import { authorize } from '../utils/auth';

export class StorageConditionService {
    static async getAll(ctx: GraphQLContext) {
        await authorize(ctx, Role.EMPLOYEE);
        return await prisma.storageCondition.findMany({
            where: { companyId: ctx.companyId },
            orderBy: { name: 'asc' },
        });
    }

    static async create(name: string, ctx: GraphQLContext) {
        await authorize(ctx, Role.MANAGER);
        return await prisma.storageCondition.create({
            data: {
                name: name.trim(),
                companyId: ctx.companyId!,
            },
        });
    }
}
