// server/src/services/product.service.ts
import { ProductType, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { GraphQLContext } from '../types/types';
import { authorize } from '../utils/auth';
import { parseCsv, parseCsvNumber, escapeCsvValue } from '../utils/common';
import { MLString } from '../lib/mlstring';
import {
    CreateProductInput,
    UpdateLocationProductConfigArgs,
    UpdateProductInput,
} from '../types/product';

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
    'standardDose',
] as const;

type ProductCsvHeader = (typeof PRODUCT_CSV_HEADERS)[number];

export class ProductService {
    static async getAll(ctx: GraphQLContext) {
        await authorize(ctx, Role.EMPLOYEE);
        return await prisma.product.findMany({
            where: { companyId: ctx.companyId },
            orderBy: { name: 'asc' },
            include: {
                variants: {
                    include: {
                        locationPrices: true,
                    },
                },
            },
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
        await authorize(ctx, Role.MANAGER);
        if (input.variants.length < 1)
            throw Error('Product must have atleast 1 variant with price');
        return await prisma.product.create({
            data: {
                name: input.name!,
                type: input.type,
                batchPrefix: input.batchPrefix!.trim(),
                description: input.description,
                caloriesKcal: input.caloriesKcal,
                fatGrams: input.fatGrams,
                proteinGrams: input.proteinGrams,
                carbohydratesGrams: input.carbohydratesGrams,
                sugarsGrams: input.sugarsGrams,
                fiberGrams: input.fiberGrams,
                saltGrams: input.saltGrams,
                standardDose: input.standardDose,
                tags: input.tags,
                photos: input.photos as any,
                chapters: input.chapters,
                isPublic: input.isPublic,
                priority: input.priority,
                companyId: ctx.companyId!,
                // 🔥 ИСПРАВЛЕНИЕ: Оборачиваем массив вариантов в объект { create: [...] }
                variants: {
                    create: input.variants.map((variant) => ({
                        sku: variant.sku,
                        label: variant.label as any,
                        isWeightBased: variant.isWeightBased,
                        weight: variant.weight,
                        weightUnit: variant.weightUnit,
                        locationPrices: {
                            create: variant.locationPrices.map((p) => ({
                                locationId: p.locationId,
                                individualPrice: p.individualPrice,
                                individualDiscounts:
                                    p.individualDiscounts as any,
                                legalEntityPrice: p.legalEntityPrice,
                                legalDiscounts: p.legalDiscounts as any,
                            })),
                        },
                    })),
                },

                // То же самое касается и групп модификаторов, если они переданы
                ...(input.modifierGroups && {
                    modifierGroups: {
                        create: input.modifierGroups.map((group) => ({
                            title: group.title as any,
                            isRequired: group.isRequired,
                            minSelect: group.minSelect,
                            maxSelect: group.maxSelect,
                            modifiers: {
                                create: group.modifiers.map((mod) => ({
                                    name: mod.name as any,
                                    weight: mod.weight,
                                    weightUnit: mod.weightUnit,
                                })),
                            },
                        })),
                    },
                }),

                // То же самое касается и состава комбо-набора
                ...(input.type === ProductType.COMBO &&
                    input.comboItems && {
                        comboItems: {
                            create: input.comboItems.map((item) => ({
                                productId: item.productId,
                                variantId: item.variantId,
                                quantity: item.quantity,
                            })),
                        },
                    }),
            },
        });
    }

    static async update(
        id: string,
        input: UpdateProductInput,
        ctx: GraphQLContext
    ) {
        await authorize(ctx, Role.MANAGER);

        const data: any = {};
        if (input.name !== undefined) data.name = new MLString(input.name).Json;
        if (input.batchPrefix !== undefined)
            data.batchPrefix = input.batchPrefix.trim();
        if (input.description !== undefined)
            data.description = new MLString(input.description).Json;
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
        if (input.standardDose !== undefined)
            data.standardDose = input.standardDose;
        if (input.tags !== undefined) data.tags = input.tags;
        if (input.photos !== undefined) data.photos = input.photos as any;
        if (input.isPublic !== undefined) data.isPublic = input.isPublic;
        if (input.chapters !== undefined) data.chapters = input.chapters;
        if (input.priority !== undefined) data.priority = input.priority;

        const deb = await prisma.$transaction(
            async (tx) => {
                // Update base product fields
                const product = await tx.product.update({
                    where: { id },
                    data,
                });

                // Update nested relations if they are provided in input
                if (input.variants) {
                    await tx.productVariant.deleteMany({
                        where: { productId: id },
                    });
                    // Используем обычный create для создания вариантов по одному,
                    // так как это может быть надежнее и не требует отдельного вызова createMany,
                    // а также для того, чтобы избежать потенциальных проблем с таймаутом
                    // при выполнении больших операций внутри транзакции.
                    await Promise.all(
                        input.variants.map((v) =>
                            tx.productVariant.create({
                                data: {
                                    productId: id,
                                    sku: v.sku,
                                    label: v.label as any,
                                    isWeightBased: v.isWeightBased,
                                    weight: v.weight,
                                    weightUnit: v.weightUnit,
                                    locationPrices: {
                                        create: v.locationPrices.map((p) => ({
                                            locationId: p.locationId,
                                            individualPrice: p.individualPrice,
                                            individualDiscounts:
                                                p.individualDiscounts as any,
                                            legalEntityPrice:
                                                p.legalEntityPrice,
                                            legalDiscounts:
                                                p.legalDiscounts as any,
                                        })),
                                    },
                                },
                            })
                        )
                    );
                }

                if (input.modifierGroups) {
                    await tx.productModifierGroup.deleteMany({
                        where: { productId: id },
                    });
                    for (const group of input.modifierGroups) {
                        await tx.productModifierGroup.create({
                            data: {
                                productId: id,
                                title: group.title as any,
                                isRequired: group.isRequired,
                                minSelect: group.minSelect,
                                maxSelect: group.maxSelect,
                                modifiers: {
                                    create: group.modifiers.map((mod) => ({
                                        name: mod.name as any,
                                        weight: mod.weight,
                                        weightUnit: mod.weightUnit,
                                    })),
                                },
                            },
                        });
                    }
                }

                if (input.type === ProductType.COMBO && input.comboItems) {
                    await tx.comboItem.deleteMany({ where: { comboId: id } });
                    await Promise.all(
                        input.comboItems.map((item) =>
                            tx.comboItem.create({
                                data: {
                                    comboId: id,
                                    productId: item.productId,
                                    variantId: item.variantId,
                                    quantity: item.quantity,
                                },
                            })
                        )
                    );
                }

                return product;
            },
            { timeout: 15000 }
        ); // Увеличиваем таймаут транзакции до 15 секунд
        return await prisma.product.findFirst({
            where: { id: deb.id },
            include: {
                variants: {
                    include: {
                        locationPrices: true,
                    },
                },
            },
        });
    }

    static async importCsv(
        csv: string,
        overwriteExisting: boolean,
        ctx: GraphQLContext
    ) {
        await authorize(ctx, Role.MANAGER);
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
                    name: row.name,
                    batchPrefix: row.batchPrefix.trim(),
                    description: row.description,
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
        await authorize(ctx, Role.EMPLOYEE);

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
    static async getPublicProductsWithStock(
        ctx: GraphQLContext,
        locationId?: string
    ) {
        if (ctx.locationId === undefined && locationId === undefined)
            throw Error('LocationId not defined!');
        // Выбираем только то, что нужно для магазина
        let companyId = ctx.companyId;
        if (companyId === undefined) {
            const location = await prisma.location.findUnique({
                where: { id: locationId ? locationId : ctx.locationId },
                select: {
                    companyId: true,
                },
            });
            companyId = location?.companyId;
        }

        return await prisma.product.findMany({
            where: {
                isPublic: true,
                companyId: companyId,
            },
            select: {
                id: true,
                name: true,
                description: true,
                photos: true,
                tags: true,
                chapters: true,
                priority: true,
                standardDose: true,
                units: true,
                variants: {
                    include: {
                        locationPrices: true,
                    },
                },
                modifierGroups: true,
                comboItems: true,
                // Делаем join только для конкретной локации
                stockBalances: {
                    where: {
                        locationId: locationId ? locationId : ctx.locationId,
                    },
                    select: { physical_balance: true, reserved_balance: true },
                },
            },
        });
    }

    static async updateLocationProductConfig(
        args: UpdateLocationProductConfigArgs,
        ctx: GraphQLContext
    ) {
        const { productId, isPublicInLocation, variants, modifiers } =
            args.input;
        const locationId = ctx.locationId;
        if (!locationId) throw Error('LocationId not defined!');

        // Выполняем все операции внутри одной транзакции, чтобы база оставалась консистентной
        return await prisma.$transaction(async (tx) => {
            // 1. Создаем или обновляем корневой конфиг видимости товара на локации
            const productConfig = await tx.locationProductConfig.upsert({
                where: {
                    locationId_productId: {
                        locationId,
                        productId,
                    },
                },
                update: {
                    ...(isPublicInLocation !== undefined && {
                        isPublicInLocation,
                    }),
                },
                create: {
                    locationId,
                    productId,
                    isPublicInLocation: isPublicInLocation ?? true,
                },
            });

            // 2. Обрабатываем цены и остатки для ВАРИАНТОВ товара
            for (const variantInput of variants) {
                await tx.locationVariantConfig.upsert({
                    where: {
                        locationId_variantId: {
                            locationId,
                            variantId: variantInput.variantId,
                        },
                    },
                    update: {
                        individualPrice: variantInput.individualPrice,
                        legalEntityPrice: variantInput.legalEntityPrice,
                        // Сериализуем массивы скидок в JSON для хранения в БД
                        individualDiscounts: variantInput.individualDiscounts
                            ? JSON.stringify(variantInput.individualDiscounts)
                            : '[]',
                        legalDiscounts: variantInput.legalDiscounts
                            ? JSON.stringify(variantInput.legalDiscounts)
                            : '[]',
                        stock: variantInput.stock,
                        isAvailable: variantInput.isAvailable,
                    },
                    create: {
                        locationId,
                        variantId: variantInput.variantId,
                        individualPrice: variantInput.individualPrice,
                        legalEntityPrice: variantInput.legalEntityPrice,
                        individualDiscounts: variantInput.individualDiscounts
                            ? JSON.stringify(variantInput.individualDiscounts)
                            : '[]',
                        legalDiscounts: variantInput.legalDiscounts
                            ? JSON.stringify(variantInput.legalDiscounts)
                            : '[]',
                        stock: variantInput.stock,
                        isAvailable: variantInput.isAvailable,
                    },
                });
            }

            // 3. Обрабатываем цены для МОДИФИКАТОРОВ (если они переданы в инпуте)
            if (modifiers && modifiers.length > 0) {
                for (const modifierInput of modifiers) {
                    await tx.locationModifierConfig.upsert({
                        where: {
                            locationId_modifierId: {
                                locationId,
                                modifierId: modifierInput.modifierId,
                            },
                        },
                        update: {
                            individualPrice: modifierInput.individualPrice,
                            legalEntityPrice: modifierInput.legalEntityPrice,
                            isAvailable: modifierInput.isAvailable,
                        },
                        create: {
                            locationId,
                            modifierId: modifierInput.modifierId,
                            individualPrice: modifierInput.individualPrice,
                            legalEntityPrice: modifierInput.legalEntityPrice,
                            isAvailable: modifierInput.isAvailable,
                        },
                    });
                }
            }

            // Возвращаем обновленный конфиг (в соответствии с типом возвращаемого значения в GraphQL)
            return productConfig;
        });
    }
}
