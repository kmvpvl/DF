// server/src/services/batch.service.ts
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
    BatchNumberPreview,
    CreateBatchInput,
    GraphQLContext,
    UpdateBatchInput,
} from '../types';
import { authorize } from '../utils/auth';
import { getYearRange } from '../utils/common';
import { SampleService } from './sample.service';

export class BatchService {
    static formatBatchNumberString(
        date: Date,
        batchPrefix: string,
        batchNumber: number
    ): string {
        const shortYear = String(date.getFullYear()).slice(-2);
        return `${shortYear}/${batchPrefix}/${batchNumber}`;
    }

    static async getNextBatchPreview(
        ctx: GraphQLContext,
        productId: string,
        date = new Date()
    ): Promise<BatchNumberPreview> {
        authorize(ctx, Role.EMPLOYEE);
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new Error('Product not found');
        }

        const { start, end } = getYearRange(date);
        const aggregate = await prisma.batch.aggregate({
            where: {
                productId,
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            _max: {
                number: true,
            },
        });

        const nextNumber = (aggregate._max.number ?? 0) + 1;
        return {
            number: nextNumber,
            numberStr: BatchService.formatBatchNumberString(
                date,
                product.batchPrefix,
                nextNumber
            ),
        };
    }

    static async resolveStorageConditionId(
        companyId: string,
        storageConditionId?: string,
        storageConditionName?: string
    ): Promise<string> {
        const trimmedName = storageConditionName?.trim();

        if (storageConditionId?.trim()) {
            const existing = await prisma.storageCondition.findUnique({
                where: { id: storageConditionId.trim() },
            });
            if (!existing) {
                throw new Error('Storage condition not found');
            }
            return existing.id;
        }

        if (!trimmedName) {
            throw new Error(
                'Choose an existing storage condition or enter a new one'
            );
        }

        const existingByName = await prisma.storageCondition.findFirst({
            where: { name: trimmedName },
        });
        if (existingByName) {
            return existingByName.id;
        }

        const created = await prisma.storageCondition.create({
            data: { name: trimmedName, companyId: companyId },
        });
        return created.id;
    }

    static async create(data: CreateBatchInput, ctx: GraphQLContext) {
        authorize(ctx, Role.EMPLOYEE);

        if (!Number.isFinite(data.nettoWeight) || data.nettoWeight <= 0) {
            throw new Error('Netto weight must be greater than 0');
        }
        if (
            !Number.isInteger(data.storageDurationDays) ||
            data.storageDurationDays < 0
        ) {
            throw new Error('Storage duration must be a non-negative integer');
        }
        if (
            data.sampleCount !== undefined &&
            (!Number.isInteger(data.sampleCount) || data.sampleCount < 0)
        ) {
            throw new Error('Sample count must be a non-negative integer');
        }

        const storageConditionId = await BatchService.resolveStorageConditionId(
            ctx.companyId!,
            data.storageConditionId,
            data.storageConditionName
        );
        const now = new Date();
        const preview = await BatchService.getNextBatchPreview(
            ctx,
            data.productId,
            now
        );
        const sampleCount = data.sampleCount ?? 0;
        const sampleStartNumber =
            sampleCount > 0 ? await SampleService.getNextSampleNumber(now) : 0;

        return await prisma.batch.create({
            data: {
                product: { connect: { id: data.productId } },
                location: { connect: { id: ctx.locationId! } },
                nettoWeight: data.nettoWeight,
                number: preview.number,
                numberStr: preview.numberStr,
                storageDurationDays: data.storageDurationDays,
                storageCondition: { connect: { id: storageConditionId } },
                processDeviations: data.processDeviations?.trim() || null,
                ...(data.processMapId
                    ? { processMap: { connect: { id: data.processMapId } } }
                    : {}),
                ...(sampleCount > 0
                    ? {
                          samples: {
                              create: Array.from(
                                  { length: sampleCount },
                                  (_, index) => {
                                      const number = sampleStartNumber + index;
                                      return {
                                          number,
                                          numberStr:
                                              SampleService.formatSampleNumberString(
                                                  now,
                                                  number
                                              ),
                                          studyAt: null,
                                          result: null,
                                      };
                                  }
                              ),
                          },
                      }
                    : {}),
            },
            include: {
                product: true,
                storageCondition: true,
                processMap: { include: { parameters: true } },
                samples: true,
            },
        });
    }

    static async update(
        id: string,
        input: UpdateBatchInput,
        ctx: GraphQLContext
    ) {
        authorize(ctx, Role.MANAGER);
        const data: {
            nettoWeight?: number;
            storageDurationDays?: number;
            storageConditionId?: string;
            processDeviations?: string | null;
            processMapId?: string | null;
        } = {};

        if (input.nettoWeight !== undefined) {
            if (!Number.isFinite(input.nettoWeight) || input.nettoWeight <= 0) {
                throw new Error('Netto weight must be greater than 0');
            }
            data.nettoWeight = input.nettoWeight;
        }

        if (input.storageDurationDays !== undefined) {
            if (
                !Number.isInteger(input.storageDurationDays) ||
                input.storageDurationDays < 0
            ) {
                throw new Error(
                    'Storage duration must be a non-negative integer'
                );
            }
            data.storageDurationDays = input.storageDurationDays;
        }

        if (
            input.storageConditionId !== undefined ||
            input.storageConditionName !== undefined
        ) {
            data.storageConditionId =
                await BatchService.resolveStorageConditionId(
                    ctx.companyId!,
                    input.storageConditionId,
                    input.storageConditionName
                );
        }

        if (input.processDeviations !== undefined) {
            data.processDeviations = input.processDeviations.trim() || null;
        }

        if ('processMapId' in input) {
            data.processMapId = input.processMapId ?? null;
        }

        if (Object.keys(data).length === 0) {
            throw new Error('No fields provided for update');
        }

        return await prisma.batch.update({
            where: { id },
            data,
            include: {
                product: true,
                storageCondition: true,
                processMap: { include: { parameters: true } },
            },
        });
    }

    static async getAll(ctx: GraphQLContext) {
        authorize(ctx, Role.EMPLOYEE);
        return await prisma.batch.findMany({
            include: {
                product: true,
                storageCondition: true,
                certificate: true,
                processMap: {
                    include: {
                        parameters: true,
                        ingredients: {
                            include: { product: true, material: true },
                        },
                    },
                },
            },
            orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
        });
    }
}
