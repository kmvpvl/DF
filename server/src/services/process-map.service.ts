// server/src/services/process-map.service.ts
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
    CreateProcessMapInput,
    UpdateProcessMapInput,
    GraphQLContext,
} from '../types';
import { authorize } from '../utils/auth';

export class ProcessMapService {
    static async getAll(productId: string, ctx: GraphQLContext) {
        await authorize(ctx, Role.EMPLOYEE);
        return await prisma.processMap.findMany({
            where: { productId },
            include: {
                parameters: true,
                ingredients: { include: { product: true, material: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    static async create(input: CreateProcessMapInput, ctx: GraphQLContext) {
        await authorize(ctx, Role.MANAGER);

        // Валидация
        if (!input.name.trim()) throw new Error('Process map name is required');
        if (
            input.VAT !== undefined &&
            (!Number.isFinite(input.VAT) || input.VAT < 0)
        )
            throw new Error('Invalid VAT');
        if (
            input.rateOfLoss !== undefined &&
            (input.rateOfLoss < 0 || input.rateOfLoss >= 100)
        )
            throw new Error('Invalid rate of loss');
        if (
            input.marginalCoefficient !== undefined &&
            input.marginalCoefficient <= 0
        )
            throw new Error('Invalid marginal coefficient');

        return await prisma.processMap.create({
            data: {
                name: input.name.trim(),
                outcome: input.outcome,
                rateOfLoss: input.rateOfLoss ?? 0.0,
                VAT: input.VAT ?? 20.0,
                containerCost: input.containerCost ?? 35.0,
                dose: input.dose ?? 100.0,
                marginalCoefficient: input.marginalCoefficient ?? 2.01,
                outcomeUnit: input.outcomeUnit ?? 'g',
                product: { connect: { id: input.productId } },
                parameters: input.parameters?.length
                    ? {
                          create: input.parameters.map((p) => ({
                              name: p.name.trim(),
                              value: p.value.trim(),
                              unit: p.unit.trim(),
                          })),
                      }
                    : undefined,
                ingredients: input.ingredients?.length
                    ? {
                          create: input.ingredients.map((ing) => ({
                              amount: ing.amount,
                              ...(ing.productId
                                  ? {
                                        product: {
                                            connect: { id: ing.productId },
                                        },
                                    }
                                  : {}),
                              ...(ing.materialId
                                  ? {
                                        material: {
                                            connect: { id: ing.materialId },
                                        },
                                    }
                                  : {}),
                          })),
                      }
                    : undefined,
            },
            include: {
                parameters: true,
                ingredients: { include: { product: true, material: true } },
            },
        });
    }

    static async update(
        id: string,
        input: UpdateProcessMapInput,
        ctx: GraphQLContext
    ) {
        await authorize(ctx, Role.MANAGER);

        // Удаляем старые связанные данные перед обновлением
        await prisma.$transaction([
            prisma.processParameter.deleteMany({ where: { processMapId: id } }),
            prisma.ingredient.deleteMany({ where: { processMapId: id } }),
        ]);

        return await prisma.processMap.update({
            where: { id },
            data: {
                ...(input.name !== undefined
                    ? { name: input.name.trim() }
                    : {}),
                ...(input.outcome !== undefined
                    ? { outcome: input.outcome }
                    : {}),
                ...(input.rateOfLoss !== undefined
                    ? { rateOfLoss: input.rateOfLoss }
                    : {}),
                ...(input.VAT !== undefined ? { VAT: input.VAT } : {}),
                ...(input.containerCost !== undefined
                    ? { containerCost: input.containerCost }
                    : {}),
                ...(input.dose !== undefined ? { dose: input.dose } : {}),
                ...(input.marginalCoefficient !== undefined
                    ? { marginalCoefficient: input.marginalCoefficient }
                    : {}),
                ...(input.outcomeUnit !== undefined
                    ? { outcomeUnit: input.outcomeUnit }
                    : {}),
                parameters: input.parameters
                    ? {
                          create: input.parameters.map((p) => ({
                              name: p.name.trim(),
                              value: p.value.trim(),
                              unit: p.unit.trim(),
                          })),
                      }
                    : undefined,
                ingredients: input.ingredients
                    ? {
                          create: input.ingredients.map((ing) => ({
                              amount: ing.amount,
                              ...(ing.productId
                                  ? {
                                        product: {
                                            connect: { id: ing.productId },
                                        },
                                    }
                                  : {}),
                              ...(ing.materialId
                                  ? {
                                        material: {
                                            connect: { id: ing.materialId },
                                        },
                                    }
                                  : {}),
                          })),
                      }
                    : undefined,
            },
            include: {
                parameters: true,
                ingredients: { include: { product: true, material: true } },
            },
        });
    }
}
