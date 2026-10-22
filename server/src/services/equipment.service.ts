// server/src/services/equipment.service.ts
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
    CreateEquipmentInput,
    UpdateEquipmentInput,
    GraphQLContext,
} from '../types';
import { authorize } from '../utils/auth';

export class EquipmentService {
    static async getAll(ctx: GraphQLContext) {
        await authorize(ctx, Role.EMPLOYEE);
        return await prisma.equipment.findMany({
            orderBy: { numId: 'asc' },
            where: { locationId: ctx.locationId }, // SaaS изоляция по локации
        });
    }

    static async create(input: CreateEquipmentInput, ctx: GraphQLContext) {
        await authorize(ctx, Role.MANAGER); // Или роль, которая может создавать оборудование

        return await prisma.equipment.create({
            data: {
                numId: input.numId,
                fullName: input.fullName,
                location: { connect: { id: ctx.locationId } },
            },
        });
    }

    static async update(
        id: string,
        input: UpdateEquipmentInput,
        ctx: GraphQLContext
    ) {
        await authorize(ctx, Role.MANAGER);

        const data: { numId?: number; fullName?: string } = {};
        if (input.numId !== undefined) data.numId = input.numId;
        if (input.fullName !== undefined) data.fullName = input.fullName;

        return await prisma.equipment.update({
            where: { id },
            data,
        });
    }

    static async delete(id: string, ctx: GraphQLContext) {
        await authorize(ctx, Role.ADMIN); // Удаление — критическое действие

        await prisma.equipment.delete({ where: { id } });
        return true;
    }
}
