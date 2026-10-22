// server/src/services/clean-action.service.ts
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CreateCleanActionInput, GraphQLContext } from '../types';
import { authorize } from '../utils/auth';

export class CleanActionService {
    static async getAll(
        ctx: GraphQLContext,
        cleaningType?: string,
        fromDate?: string,
        toDate?: string
    ) {
        await authorize(ctx, Role.EMPLOYEE);

        const where: Record<string, any> = {
            // Изоляция по локации (оборудование привязано к локации)
            equipmend: {
                locationId: ctx.locationId,
            },
        };

        if (cleaningType) where.cleaningType = cleaningType;

        if (fromDate || toDate) {
            const dateFilter: any = {};
            if (fromDate) dateFilter.gte = new Date(fromDate);
            if (toDate) {
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.lte = end;
            }
            where.createdAt = dateFilter;
        }

        return await prisma.cleanAction.findMany({
            where,
            include: { equipmend: true, performer: true, supervisor: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async create(input: CreateCleanActionInput, ctx: GraphQLContext) {
        await authorize(ctx, Role.EMPLOYEE); // Предположим, что это действие требует надзора

        return await prisma.cleanAction.create({
            data: {
                equipmentId: input.equipmentId,
                performerId: input.performerId,
                supervisorId: input.supervisorId,
                cleaningType: input.cleaningType,
            },
            include: { equipmend: true, performer: true, supervisor: true },
        });
    }
}
