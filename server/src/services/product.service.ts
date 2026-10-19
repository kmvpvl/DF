// server/src/services/product.service.ts
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
    CreateProductInput,
    UpdateProductInput,
    GraphQLContext,
} from '../types';
import { authorize } from '../utils/auth';
import { parseCsv, parseCsvNumber, escapeCsvValue } from '../utils/common';

const PRODUCT_CSV_HEADERS = [
    'name',
    'batchPrefix',
    'description',
    'caloriesKcal',
    'fatGrams',
    'proteinGrams',
    'carbohydratesGrams',
    'sugarsGrams',
    'fiberGrams',
    'saltGrams',
] as const;

type ProductCsvHeader = (typeof PRODUCT_CSV_HEADERS)[number];

export class ProductService {
    static async getAll(ctx: GraphQLContext) {
        authorize(ctx, Role.EMPLOYEE);
        return await prisma.product.findMany({
            where: { companyId: ctx.companyId },
            orderBy: { name: 'asc' },
        });
    }

    static buildProductCsvRows(
        rows: string[][]
    ): Array<Record<ProductCsvHeader, string>> {
        if (rows.length === 0) {
            throw new Error('CSV is empty');
        }

        const headerRow = rows[0].map((header) => header.trim());
        const headerIndexes = new Map<string, number>();
        headerRow.forEach((header, index) => {
            headerIndexes.set(header.toLowerCase(), index);
        });

        const missingHeaders = PRODUCT_CSV_HEADERS.filter(
            (header) => !headerIndexes.has(header.toLowerCase())
        );
        if (missingHeaders.length > 0) {
            throw new Error(
                `Missing CSV headers: ${missingHeaders.join(', ')}`
            );
        }

        return rows.slice(1).map((row) => {
            const normalized = {} as Record<ProductCsvHeader, string>;
            PRODUCT_CSV_HEADERS.forEach((header) => {
                const index = headerIndexes.get(header.toLowerCase());
                normalized[header] =
                    index === undefined ? '' : (row[index] ?? '').trim();
            });
            return normalized;
        });
    }

    static async create(input: CreateProductInput, ctx: GraphQLContext) {
        authorize(ctx, Role.MANAGER);
        return await prisma.product.create({
            data: {
                name: input.name.trim(),
                batchPrefix: input.batchPrefix.trim(),
                description: input.description?.trim() || null,
                caloriesKcal: input.caloriesKcal,
                fatGrams: input.fatGrams,
                proteinGrams: input.proteinGrams,
                carbohydratesGrams: input.carbohydratesGrams,
                sugarsGrams: input.sugarsGrams,
                fiberGrams: input.fiberGrams,
                saltGrams: input.saltGrams,
                companyId: ctx.companyId!,
            },
        });
    }

    static async update(
        id: string,
        input: UpdateProductInput,
        ctx: GraphQLContext
    ) {
        authorize(ctx, Role.MANAGER);

        const data: any = {};
        if (input.name !== undefined) data.name = input.name.trim();
        if (input.batchPrefix !== undefined)
            data.batchPrefix = input.batchPrefix.trim();
        if (input.description !== undefined)
            data.description = input.description.trim() || null;
        if (input.caloriesKcal !== undefined)
            data.caloriesKcal = input.caloriesKcal;
        if (input.fatGrams !== undefined) data.fatGrams = input.fatGrams;
        if (input.proteinGrams !== undefined)
            data.proteinGrams = input.proteinGrams;
        if (input.carbohydratesGrams !== undefined)
            data.carbohydratesGrams = input.carbohydratesGrams;
        if (input.sugarsGrams !== undefined)
            data.sugarsGrams = input.sugarsGrams;
        if (input.fiberGrams !== undefined) data.fiberGrams = input.fiberGrams;
        if (input.saltGrams !== undefined) data.saltGrams = input.saltGrams;

        return await prisma.product.update({ where: { id }, data });
    }

    static async importCsv(
        csv: string,
        overwriteExisting: boolean,
        ctx: GraphQLContext
    ) {
        authorize(ctx, Role.MANAGER);
        const companyId = ctx.companyId!;

        const rows = ProductService.buildProductCsvRows(parseCsv(csv));
        const result = {
            importedCount: 0,
            skippedCount: 0,
            errors: [] as string[],
        };

        const existingByBatchPrefix = new Map<string, { id: string }>();
        if (overwriteExisting) {
            const existing = await prisma.product.findMany({
                where: { companyId },
                select: { id: true, batchPrefix: true },
            });
            existing.forEach((p) =>
                existingByBatchPrefix.set(p.batchPrefix.toLowerCase(), {
                    id: p.id,
                })
            );
        }

        for (const [index, row] of rows.entries()) {
            const csvLine = index + 2;
            try {
                if (!row.name.trim()) throw new Error('name is required');
                if (!row.batchPrefix.trim())
                    throw new Error('batchPrefix is required');

                const data = {
                    name: row.name.trim(),
                    batchPrefix: row.batchPrefix.trim(),
                    description: row.description.trim() || null,
                    caloriesKcal: parseCsvNumber(row.caloriesKcal),
                    fatGrams: parseCsvNumber(row.fatGrams),
                    proteinGrams: parseCsvNumber(row.proteinGrams),
                    carbohydratesGrams: parseCsvNumber(row.carbohydratesGrams),
                    sugarsGrams: parseCsvNumber(row.sugarsGrams),
                    fiberGrams: parseCsvNumber(row.fiberGrams),
                    saltGrams: parseCsvNumber(row.saltGrams),
                    companyId,
                };

                const existing = overwriteExisting
                    ? existingByBatchPrefix.get(data.batchPrefix.toLowerCase())
                    : undefined;

                if (existing) {
                    await prisma.product.update({
                        where: { id: existing.id },
                        data,
                    });
                } else {
                    const created = await prisma.product.create({ data });
                    if (overwriteExisting)
                        existingByBatchPrefix.set(
                            created.batchPrefix.toLowerCase(),
                            { id: created.id }
                        );
                }
                result.importedCount += 1;
            } catch (err) {
                result.skippedCount += 1;
                result.errors.push(
                    `Line ${csvLine}: ${err instanceof Error ? err.message : String(err)}`
                );
            }
        }
        return result;
    }

    static async getProductsCsv(ctx: GraphQLContext) {
        authorize(ctx, Role.EMPLOYEE);

        const products = await prisma.product.findMany({
            where: { companyId: ctx.companyId },
            orderBy: { name: 'asc' },
        });

        const rows = products.map((product) =>
            [
                product.name,
                product.batchPrefix,
                product.description ?? '',
                product.caloriesKcal.toString(),
                product.fatGrams.toString(),
                product.proteinGrams.toString(),
                product.carbohydratesGrams.toString(),
                product.sugarsGrams.toString(),
                product.fiberGrams.toString(),
                product.saltGrams.toString(),
            ]
                .map((value) => escapeCsvValue(String(value)))
                .join(',')
        );

        return [PRODUCT_CSV_HEADERS.join(','), ...rows].join('\n');
    }
}
