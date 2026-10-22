// server/src/services/cost-settings.service.ts
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { GraphQLContext } from '../types';
import { authorize } from '../utils/auth';

export class CostSettingsService {
    static async get(ctx: GraphQLContext) {
        await authorize(ctx, Role.EMPLOYEE);

        let settings = await prisma.costSettings.findUnique({
            where: { id: 'singleton' },
        });
        if (!settings) {
            settings = await prisma.costSettings.create({
                data: { id: 'singleton' },
            });
        }

        return {
            ...settings,
            createdAt: settings.createdAt.toISOString(),
            updatedAt: settings.updatedAt.toISOString(),
            productContainerCosts: JSON.stringify(
                settings.productContainerCosts
            ),
            productMarginalCoefficients: JSON.stringify(
                settings.productMarginalCoefficients
            ),
            productWeights: JSON.stringify(settings.productWeights),
            productVats: JSON.stringify(settings.productVats),
            productMainProcessMaps: JSON.stringify(
                (settings as Record<string, unknown>).productMainProcessMaps ??
                    {}
            ),
        };
    }

    static async update(input: Record<string, unknown>, ctx: GraphQLContext) {
        await authorize(ctx, Role.MANAGER);

        const updateData: Record<string, unknown> = {};

        if (input.marginalCoefficient !== undefined)
            updateData.marginalCoefficient = Number(input.marginalCoefficient);
        if (input.containerCost !== undefined)
            updateData.containerCost = Number(input.containerCost);
        if (input.productVat !== undefined)
            updateData.productVat = Number(input.productVat);
        if (input.productWeight !== undefined)
            updateData.productWeight = Number(input.productWeight);
        if (input.productContainerCosts !== undefined)
            updateData.productContainerCosts = JSON.parse(
                String(input.productContainerCosts) || '{}'
            );
        if (input.productMarginalCoefficients !== undefined)
            updateData.productMarginalCoefficients = JSON.parse(
                String(input.productMarginalCoefficients) || '{}'
            );
        if (input.productWeights !== undefined)
            updateData.productWeights = JSON.parse(
                String(input.productWeights) || '{}'
            );
        if (input.productVats !== undefined)
            updateData.productVats = JSON.parse(
                String(input.productVats) || '{}'
            );
        if (input.productMainProcessMaps !== undefined)
            updateData.productMainProcessMaps = JSON.parse(
                String(input.productMainProcessMaps) || '{}'
            );

        const settings = await prisma.costSettings.upsert({
            where: { id: 'singleton' },
            update: updateData,
            create: { id: 'singleton', ...updateData },
        });

        return {
            ...settings,
            createdAt: settings.createdAt.toISOString(),
            updatedAt: settings.updatedAt.toISOString(),
            productContainerCosts: JSON.stringify(
                settings.productContainerCosts
            ),
            productMarginalCoefficients: JSON.stringify(
                settings.productMarginalCoefficients
            ),
            productWeights: JSON.stringify(settings.productWeights),
            productVats: JSON.stringify(settings.productVats),
            productMainProcessMaps: JSON.stringify(
                (settings as Record<string, unknown>).productMainProcessMaps ??
                    {}
            ),
        };
    }
}
