// server/src/services/movement.service.ts
import { MovementType, Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { GraphQLContext } from '..';
import { authorize } from '../utils/auth';
import { CreateMovementInput } from '@df/types/movement';

export class MovementService {
    static async getAll(
        ctx: GraphQLContext,
        fromDate?: string,
        toDate?: string
    ) {
        await authorize(ctx, [Role.EMPLOYEE, Role.MANAGER, Role.SUPERVISOR]);
        if (!ctx.locationId) throw new Error('Location is required');

        const dateFilter: Record<string, Date> = {};
        if (fromDate) {
            const parsedFrom = new Date(`${fromDate}T00:00:00.000`);
            if (Number.isNaN(parsedFrom.getTime())) {
                throw new Error('Invalid fromDate');
            }
            dateFilter.gte = parsedFrom;
        } else {
            const defaultFrom = new Date();
            defaultFrom.setDate(defaultFrom.getDate() - 6);
            defaultFrom.setHours(0, 0, 0, 0);
            dateFilter.gte = defaultFrom;
        }
        if (toDate) {
            const parsedTo = new Date(`${toDate}T23:59:59.999`);
            if (Number.isNaN(parsedTo.getTime())) {
                throw new Error('Invalid toDate');
            }
            dateFilter.lte = parsedTo;
        } else {
            const defaultTo = new Date();
            defaultTo.setHours(23, 59, 59, 999);
            dateFilter.lte = defaultTo;
        }
        if (
            dateFilter.gte &&
            dateFilter.lte &&
            dateFilter.gte > dateFilter.lte
        ) {
            throw new Error('fromDate must be before or equal to toDate');
        }

        return await prisma.movement.findMany({
            where: {
                locationId: ctx.locationId,
                createdAt: dateFilter,
            },
            include: {
                product: true,
                batch: true,
                location: true,
                user: true,
                group: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async createMovement(
        data: CreateMovementInput,
        ctx: GraphQLContext
    ) {
        await authorize(ctx, [Role.EMPLOYEE, Role.MANAGER, Role.SUPERVISOR]);
        if (!ctx.locationId) throw new Error('Location is required');
        if (!Number.isFinite(data.quantity) || data.quantity <= 0) {
            throw new Error('Quantity must be greater than zero');
        }

        const allowedTypes = Object.values<string>(MovementType);
        if (!allowedTypes.includes(data.type)) {
            throw new Error('Unsupported movement type');
        }

        if (
            data.type === MovementType.MOVE_IN ||
            data.type === MovementType.MOVE_OUT
        ) {
            if (!data.targetLocationId) {
                throw new Error('Target location is required for a transfer');
            }
            return await this.transfer(data, ctx);
        }

        return await this.create(
            {
                type: data.type,
                productId: data.productId,
                batchId: data.batchId,
                variantLabel: data.variantLabel,
                quantity: data.quantity,
                locationId: ctx.locationId,
            },
            ctx
        );
    }

    private static async transfer(
        data: CreateMovementInput,
        ctx: GraphQLContext
    ) {
        const sourceLocationId =
            data.type === MovementType.MOVE_OUT
                ? ctx.locationId!
                : data.targetLocationId!;
        const targetLocationId =
            data.type === MovementType.MOVE_OUT
                ? data.targetLocationId!
                : ctx.locationId!;

        if (sourceLocationId === targetLocationId) {
            throw new Error('Source and target locations must be different');
        }

        return await prisma.$transaction(async (tx) => {
            const group = await tx.movementGroup.create({
                data: {
                    label: data.label || null,
                    userId: ctx.userId!,
                },
            });

            const movements = await Promise.all([
                tx.movement.create({
                    data: {
                        type: MovementType.MOVE_OUT,
                        productId: data.productId,
                        batchId: data.batchId || null,
                        quantity: data.quantity,
                        variantLabel: data.variantLabel || null,
                        locationId: sourceLocationId,
                        groupId: group.id,
                        userId: ctx.userId,
                    },
                }),
                tx.movement.create({
                    data: {
                        type: MovementType.MOVE_IN,
                        productId: data.productId,
                        batchId: data.batchId || null,
                        quantity: data.quantity,
                        variantLabel: data.variantLabel || null,
                        locationId: targetLocationId,
                        groupId: group.id,
                        userId: ctx.userId,
                    },
                }),
            ]);

            return movements[0];
        });
    }

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
        const movementData = {
            type: data.type,
            productId: data.productId,
            batchId: data.batchId || null,
            variantLabel: data.variantLabel || null,
            quantity: data.quantity,
            locationId: data.locationId || ctx.locationId!,
        };

        return await client.movement.create({
            data: { ...movementData, userId: ctx.userId },
        });
    }
}
