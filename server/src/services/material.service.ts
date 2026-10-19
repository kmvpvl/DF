// server/src/services/material.service.ts
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
    CreateMaterialInput,
    UpdateMaterialInput,
    GraphQLContext,
} from '../types';
import { authorize } from '../utils/auth';
import {
    escapeCsvValue,
    parseCsv,
    parseCsvBoolean,
    parseCsvNumber,
} from '../utils/common';
const MATERIAL_CSV_HEADERS = [
    'name',
    'description',
    'selfProduced',
    'caloriesKcal',
    'fatGrams',
    'proteinGrams',
    'carbohydratesGrams',
    'sugarsGrams',
    'fiberGrams',
    'saltGrams',
    'VAT',
    'Price',
    'purchaseUnit',
    'purchaseUnitAmount',
    'consumptionUnit',
    'rateOfLoss',
    'ratio',
] as const;

type MaterialCsvHeader = (typeof MATERIAL_CSV_HEADERS)[number];

export class MaterialService {
    static async getAll(ctx: GraphQLContext) {
        authorize(ctx, Role.EMPLOYEE);
        return await prisma.material.findMany({
            where: { companyId: ctx.companyId },
            orderBy: { name: 'asc' },
        });
    }

    static async create(input: CreateMaterialInput, ctx: GraphQLContext) {
        authorize(ctx, Role.MANAGER);
        return await prisma.material.create({
            data: {
                ...input,
                name: input.name.trim(),
                description: input.description?.trim() || null,
                companyId: ctx.companyId!,
            },
        });
    }

    static async update(
        id: string,
        input: UpdateMaterialInput,
        ctx: GraphQLContext
    ) {
        authorize(ctx, Role.MANAGER);
        return await prisma.material.update({
            where: { id },
            data: {
                ...input,
                name: input.name?.trim(),
                description: input.description?.trim() || null,
            },
        });
    }

    static async delete(id: string, ctx: GraphQLContext) {
        authorize(ctx, Role.ADMIN);
        await prisma.material.delete({ where: { id } });
        return true;
    }

    static async importCsv(
        csv: string,
        overwriteExisting: boolean,
        ctx: GraphQLContext
    ) {
        authorize(ctx, Role.MANAGER);
        const companyId = ctx.companyId!;

        const rows = MaterialService.buildMaterialCsvRows(parseCsv(csv));
        const result = {
            importedCount: 0,
            skippedCount: 0,
            errors: [] as string[],
        };

        const existingByName = new Map<string, { id: string }>();
        if (overwriteExisting) {
            const existing = await prisma.material.findMany({
                where: { companyId },
                select: { id: true, name: true },
            });
            existing.forEach((material) => {
                existingByName.set(material.name.toLowerCase(), {
                    id: material.id,
                });
            });
        }

        for (const [index, row] of rows.entries()) {
            const csvLine = index + 2;
            const hasAnyValue = MATERIAL_CSV_HEADERS.some(
                (header) => row[header].trim().length > 0
            );
            if (!hasAnyValue) {
                result.skippedCount += 1;
                continue;
            }

            try {
                if (!row.name.trim()) throw new Error('name is required');
                if (!row.purchaseUnit.trim())
                    throw new Error('purchaseUnit is required');
                if (!row.consumptionUnit.trim())
                    throw new Error('consumptionUnit is required');

                const data = {
                    name: row.name.trim(),
                    description: row.description.trim() || null,
                    selfProduced: parseCsvBoolean(row.selfProduced),
                    caloriesKcal: parseCsvNumber(row.caloriesKcal),
                    fatGrams: parseCsvNumber(row.fatGrams),
                    proteinGrams: parseCsvNumber(row.proteinGrams),
                    carbohydratesGrams: parseCsvNumber(row.carbohydratesGrams),
                    sugarsGrams: parseCsvNumber(row.sugarsGrams),
                    fiberGrams: parseCsvNumber(row.fiberGrams),
                    saltGrams: parseCsvNumber(row.saltGrams),
                    VAT: parseCsvNumber(row.VAT),
                    Price: parseCsvNumber(row.Price),
                    purchaseUnit: row.purchaseUnit.trim(),
                    purchaseUnitAmount: parseCsvNumber(row.purchaseUnitAmount),
                    consumptionUnit: row.consumptionUnit.trim(),
                    rateOfLoss: parseCsvNumber(row.rateOfLoss),
                    ratio: parseCsvNumber(row.ratio),
                    companyId,
                };

                const existingMaterial = overwriteExisting
                    ? existingByName.get(data.name.toLowerCase())
                    : undefined;

                if (existingMaterial) {
                    await prisma.material.update({
                        where: { id: existingMaterial.id },
                        data,
                    });
                } else {
                    const created = await prisma.material.create({ data });
                    if (overwriteExisting) {
                        existingByName.set(created.name.toLowerCase(), {
                            id: created.id,
                        });
                    }
                }

                result.importedCount += 1;
            } catch (error) {
                result.skippedCount += 1;
                result.errors.push(
                    `Line ${csvLine}: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }

        return result;
    }
    static buildMaterialCsvRows(
        rows: string[][]
    ): Array<Record<MaterialCsvHeader, string>> {
        if (rows.length === 0) {
            throw new Error('CSV is empty');
        }

        const headerRow = rows[0].map((header) => header.trim());
        const headerIndexes = new Map<string, number>();
        headerRow.forEach((header, index) => {
            headerIndexes.set(header.toLowerCase(), index);
        });

        const missingHeaders = MATERIAL_CSV_HEADERS.filter(
            (header) => !headerIndexes.has(header.toLowerCase())
        );
        if (missingHeaders.length > 0) {
            throw new Error(
                `Missing CSV headers: ${missingHeaders.join(', ')}`
            );
        }

        return rows.slice(1).map((row) => {
            const normalized = {} as Record<MaterialCsvHeader, string>;
            MATERIAL_CSV_HEADERS.forEach((header) => {
                const index = headerIndexes.get(header.toLowerCase());
                normalized[header] =
                    index === undefined ? '' : (row[index] ?? '').trim();
            });
            return normalized;
        });
    }
    // В server/src/services/material.service.ts

    static async getMaterialsCsv(ctx: GraphQLContext) {
        authorize(ctx, Role.EMPLOYEE);

        const materials = await prisma.material.findMany({
            where: { companyId: ctx.companyId },
            orderBy: { name: 'asc' },
        });

        const rows = materials.map((material) =>
            [
                material.name,
                material.description ?? '',
                String(material.selfProduced),
                material.caloriesKcal.toString(),
                material.fatGrams.toString(),
                material.proteinGrams.toString(),
                material.carbohydratesGrams.toString(),
                material.sugarsGrams.toString(),
                material.fiberGrams.toString(),
                material.saltGrams.toString(),
                String(material.VAT),
                String(material.Price),
                material.purchaseUnit,
                String(material.purchaseUnitAmount),
                material.consumptionUnit,
                String(material.rateOfLoss),
                String(material.ratio),
            ]
                .map((value) => escapeCsvValue(String(value)))
                .join(';')
        );

        return [MATERIAL_CSV_HEADERS.join(';'), ...rows].join('\n');
    }
}
