import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import express, { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import cors, { type CorsOptions } from 'cors';
import session from 'express-session';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { prisma } from './lib/prisma';
import { ICoords, ILocation } from './types/company';
import multer from 'multer';
import {
    CreateBatchInput,
    CreateCertificateInput,
    CreateCleanActionInput,
    CreateEquipmentInput,
    CreateMaterialInput,
    CreateProcessMapInput,
    GraphQLContext,
    SearchCertificatesInput,
    UpdateBatchInput,
    UpdateCertificateInput,
    UpdateEquipmentInput,
    UpdateMaterialInput,
    UpdateProcessMapInput,
} from './types/types';
import { BatchService } from './services/batch.service';
import { gql } from 'graphql-tag';
import { EquipmentService } from './services/equipment.service';
import { CleanActionService } from './services/cleanaction.service';
import { MaterialService } from './services/material.service';
import { CertificateService } from './services/certificate.service';
import { ProductService } from './services/product.service';
import { ProcessMapService } from './services/process-map.service';
import { CostSettingsService } from './services/cost-settings.service';
import { StorageConditionService } from './services/storage-condition.service';
import { MovementService } from './services/movement.service';
import { MovementType } from '@prisma/client';
import { OrderService } from './services/order.service';
import { PushService } from './services/push.service';
import {
    CreateProductInput,
    IProductVariant,
    UpdateProductInput,
} from './types/product';
import { CreateOrderInput } from './types/order';
import { CompanyService } from './services/company.service';
import { IMLString, MLString } from './lib/mlstring';
import { AddressService } from './services/address.service';

const DEFAULT_SESSION_DURATION_MINUTES = 2880; // 48 hours

function getSessionDurationMinutes(): number {
    const raw = process.env.SESSION_DURATION_MINUTES;
    if (!raw) {
        return DEFAULT_SESSION_DURATION_MINUTES;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_SESSION_DURATION_MINUTES;
    }

    return parsed;
}

const SESSION_TTL_MS = getSessionDurationMinutes() * 60 * 1000;

interface CreateUserInput {
    name: string;
    fullName: string;
    entityType?: 'INDIVIDUAL' | 'LEGAL_ENTITY';
    phone?: string;
    email: string;
    bio?: string;
    tgId?: string;
    pib?: string;
    mbr?: string;
    account?: string;
    bank?: string;
    password: string;
    lang?: string;
}

interface UpdateSessionUserInput {
    name: string;
    fullName: string;
    entityType?: 'INDIVIDUAL' | 'LEGAL_ENTITY';
    phone?: string | null;
    email: string;
    pib?: string | null;
    mbr?: string | null;
    account?: string | null;
    bank?: string | null;
    pushSubscription?: object | null;
    lang?: string;
}

interface SendContactMessageInput {
    type: 'FEEDBACK' | 'FREE_TEST_BATCH';
    name: string;
    email?: string;
    phone?: string;
    subject: string;
    message: string;
}

interface SendOrderInput {
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerDeliveryAddress: string;
    deliveryLat: number;
    deliveryLon: number;
    note?: string;
}

type IngredientWithRefs = {
    productId?: string | null;
    materialId?: string | null;
    amount: number;
    product?: { consumptionUnit?: string } | null;
    material?: { consumptionUnit: string } | null;
};

const resolvers = {
    Ingredient: {
        unit: (parent: IngredientWithRefs): string => {
            if (parent.material) return parent.material.consumptionUnit;
            return 'gram';
        },
    },
    Query: {
        hello: () => 'DolceForte API',
        userById: async (_: unknown, { id }: { id: string }) => {
            return await prisma.user.findFirst({ where: { id } });
        },
        userInfo: async (
            _: unknown,
            { id, email }: { id?: string; email?: string }
        ) => {
            if (!id && !email) {
                throw new Error('Provide id or email');
            }

            if (id && email) {
                throw new Error(
                    'Provide only one unique identifier: id or email'
                );
            }

            if (id) {
                return await prisma.user.findUnique({ where: { id } });
            }

            return await prisma.user.findUnique({ where: { email: email! } });
        },
        companyInfo: async (_: unknown, __: unknown, ctx: GraphQLContext) =>
            CompanyService.info(ctx),
        equipments: async (_: unknown, __: unknown, ctx: GraphQLContext) =>
            EquipmentService.getAll(ctx),
        users: async (_: unknown, __: unknown, { req }: GraphQLContext) => {
            if (!req.session.userId) throw new Error('Not authenticated');
            return await prisma.user.findMany({ orderBy: { name: 'asc' } });
        },
        cleanActions: async (
            _: unknown,
            args: { cleaningType?: string; fromDate?: string; toDate?: string },
            ctx: GraphQLContext
        ) => {
            return await CleanActionService.getAll(
                ctx,
                args.cleaningType,
                args.fromDate,
                args.toDate
            );
        },
        materials: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            return await MaterialService.getAll(ctx);
        },
        materialsCsv: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            return await MaterialService.getMaterialsCsv(ctx);
        },
        products: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            return await ProductService.getAll(ctx);
        },
        productsCsv: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            return await ProductService.getProductsCsv(ctx);
        },
        storageConditions: async (
            _: unknown,
            __: unknown,
            ctx: GraphQLContext
        ) => {
            return await StorageConditionService.getAll(ctx);
        },
        processMaps: async (
            _: unknown,
            { productId }: { productId: string },
            ctx: GraphQLContext
        ) => {
            return await ProcessMapService.getAll(productId, ctx);
        },

        orders: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            return await OrderService.getLocationOrders(ctx);
        },

        getDraft: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            return await OrderService.getDraft(ctx);
        },

        order: async (
            _: unknown,
            { orderId }: { orderId: string },
            ctx: GraphQLContext
        ) => {
            return await OrderService.order(ctx, orderId);
        },
        myVerifiedDeliveryAddress: async (
            _: unknown,
            __: unknown,
            ctx: GraphQLContext
        ) => AddressService.getVerifiedDeliveryAddress(ctx),

        batches: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            return BatchService.getAll(ctx);
        },
        certificateBatchOptions: async (
            _: unknown,
            __: unknown,
            { req }: GraphQLContext
        ) => {
            if (!req.session.userId) throw new Error('Not authenticated');
            return await prisma.batch.findMany({
                where: {
                    certificate: null,
                },
                include: {
                    product: true,
                    storageCondition: true,
                    samples: true,
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
        },
        certificates: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            return await CertificateService.getAll(ctx);
        },
        searchCertificates: async (
            _: unknown,
            { input }: { input: SearchCertificatesInput },
            { req }: GraphQLContext
        ) => {
            if (!req.session.userId) throw new Error('Not authenticated');

            const where: Record<string, unknown> = {};

            if (input.number !== undefined) {
                where.number = input.number;
            }

            if (input.fromDate || input.toDate) {
                const dateFilter: Record<string, Date> = {};
                if (input.fromDate) {
                    dateFilter.gte = new Date(input.fromDate);
                }
                if (input.toDate) {
                    const end = new Date(input.toDate);
                    end.setHours(23, 59, 59, 999);
                    dateFilter.lte = end;
                }
                where.createdAt = dateFilter;
            }

            const batchWhere: Record<string, unknown> = {};
            if (input.productId?.trim()) {
                batchWhere.productId = input.productId.trim();
            }
            if (input.batchNumber?.trim()) {
                const normalizedBatchNumber = input.batchNumber.trim();
                const parsedNumber = Number.parseInt(normalizedBatchNumber, 10);
                if (
                    Number.isInteger(parsedNumber) &&
                    String(parsedNumber) === normalizedBatchNumber
                ) {
                    batchWhere.number = parsedNumber;
                } else {
                    batchWhere.numberStr = {
                        contains: normalizedBatchNumber,
                    };
                }
            }

            if (Object.keys(batchWhere).length > 0) {
                where.batch = { is: batchWhere };
            }

            return await prisma.certificate.findMany({
                where,
                include: {
                    batch: {
                        include: {
                            product: true,
                            storageCondition: true,
                            samples: true,
                            processMap: {
                                include: {
                                    parameters: true,
                                    ingredients: {
                                        include: {
                                            product: true,
                                            material: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
            });
        },
        nextBatchPreview: async (
            _: unknown,
            { productId }: { productId: string },
            ctx: GraphQLContext
        ) => {
            return await BatchService.getNextBatchPreview(ctx, productId);
        },
        searchSamples: async (
            _: unknown,
            {
                input,
            }: {
                input: {
                    fromDate?: string;
                    toDate?: string;
                    sampleNumber?: number;
                };
            },
            { req }: GraphQLContext
        ) => {
            if (!req.session.userId) throw new Error('Not authenticated');

            const where: Record<string, unknown> = {};

            if (input.sampleNumber) {
                where.number = input.sampleNumber;
            }

            if (input.fromDate || input.toDate) {
                const dateFilter: Record<string, Date> = {};
                if (input.fromDate) {
                    const start = new Date(input.fromDate);
                    dateFilter.gte = start;
                }
                if (input.toDate) {
                    const end = new Date(input.toDate);
                    end.setHours(23, 59, 59, 999);
                    dateFilter.lte = end;
                }
                where.createdAt = dateFilter;
            }

            return await prisma.sample.findMany({
                where,
                include: { batch: { include: { product: true } } },
                orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
            });
        },
        sessionUser: async (
            _: unknown,
            __: unknown,
            { req }: GraphQLContext
        ) => {
            const userId = req.session.userId;
            if (!userId) {
                return null;
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                req.session.userId = undefined;
                await new Promise<void>((resolve, reject) => {
                    req.session.save((error) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve();
                    });
                });
                return null;
            }

            return user;
        },
        costSettings: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            return await CostSettingsService.get(ctx);
        },
        getPublicProductsWithStock: async (
            _: unknown,
            { locationId }: { locationId: string },
            ctx: GraphQLContext
        ) => {
            const products = await ProductService.getPublicProductsWithStock(
                ctx,
                locationId
            );

            // Мапим результат, чтобы "stock" был простым числом, а не вложенным объектом
            return products;
        },
        searchAddress: async (
            _: any,
            { query }: { query: string },
            ctx: GraphQLContext
        ) => await AddressService.searchAddress(ctx, query),
        estimateDelivery: async (_: any, dest: ICoords, ctx: GraphQLContext) =>
            await AddressService.estimateDelivery(ctx, dest),
    },
    Mutation: {
        login: async (
            _: unknown,
            { email, password }: { email: string; password: string },
            ctx: GraphQLContext
        ) => {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) throw new Error('Invalid email or password');
            const valid = await bcrypt.compare(password, user.passwordHash);
            if (!valid) throw new Error('Invalid email or password');
            ctx.req.session.userId = user.id;
            ctx.userId = user.id;
            await new Promise<void>((resolve, reject) => {
                ctx.req.session.save((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });

            return user;
        },
        createUser: async (
            _: unknown,
            { input }: { input: CreateUserInput },
            { req }: GraphQLContext
        ) => {
            const entityType = input.entityType ?? 'INDIVIDUAL';
            const needsLegalEntityData = entityType === 'LEGAL_ENTITY';
            const requiredLegalEntityFields: Array<
                keyof Pick<CreateUserInput, 'pib' | 'mbr' | 'account' | 'bank'>
            > = ['pib', 'mbr', 'account', 'bank'];

            if (needsLegalEntityData) {
                const missing = requiredLegalEntityFields.filter((field) => {
                    const value = input[field];
                    return !value || value.trim().length === 0;
                });

                if (missing.length > 0) {
                    throw new Error(
                        `Missing required legal entity fields: ${missing.join(', ')}`
                    );
                }
            }

            const { password, ...userData } = input;
            const passwordHash = await bcrypt.hash(password, 10);
            const data = {
                ...userData,
                entityType,
                passwordHash,
            };

            const user = await prisma.user.create({
                data,
            });

            req.session.userId = user.id;
            await new Promise<void>((resolve, reject) => {
                req.session.save((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });

            return user;
        },
        updateSessionUser: async (
            _: unknown,
            { input }: { input: UpdateSessionUserInput },
            { req }: GraphQLContext
        ) => {
            const userId = req.session.userId;
            if (!userId) {
                throw new Error('Not authenticated');
            }

            const entityType = input.entityType ?? 'INDIVIDUAL';
            const requiredLegalEntityFields: Array<
                keyof Pick<
                    UpdateSessionUserInput,
                    'pib' | 'mbr' | 'account' | 'bank'
                >
            > = ['pib', 'mbr', 'account', 'bank'];

            if (entityType === 'LEGAL_ENTITY') {
                const missing = requiredLegalEntityFields.filter((field) => {
                    const value = input[field];
                    return !value || value.trim().length === 0;
                });

                if (missing.length > 0) {
                    throw new Error(
                        `Missing required legal entity fields: ${missing.join(', ')}`
                    );
                }
            }

            const updateData = {
                name: input.name,
                fullName: input.fullName,
                entityType,
                email: input.email,
                phone: input.phone || null,
                pib: entityType === 'LEGAL_ENTITY' ? input.pib || null : null,
                mbr: entityType === 'LEGAL_ENTITY' ? input.mbr || null : null,
                account:
                    entityType === 'LEGAL_ENTITY'
                        ? input.account || null
                        : null,
                bank: entityType === 'LEGAL_ENTITY' ? input.bank || null : null,
                pushSubscription: input.pushSubscription,
            } as any;

            return await prisma.user.update({
                where: { id: userId },
                data: updateData,
            });
        },
        verifyDeliveryAddress: async (
            _: unknown,
            {
                address,
                lat,
                lon,
            }: { address: string; lat: number; lon: number },
            ctx: GraphQLContext
        ) => AddressService.verifyDeliveryAddress(ctx, address, { lat, lon }),
        sendContactMessage: async (
            _: unknown,
            { input }: { input: SendContactMessageInput }
        ) => {
            const name = input.name.trim();
            const subject = input.subject.trim();
            const message = input.message.trim();
            const email = input.email?.trim();
            const phone = input.phone?.trim();

            if (!name) {
                throw new Error('Name is required');
            }

            if (!subject) {
                throw new Error('Subject is required');
            }

            if (!message) {
                throw new Error('Message is required');
            }

            if (!email && !phone) {
                throw new Error('Provide at least email or phone');
            }

            await PushService.sendContactEmail({
                type: input.type,
                name,
                email,
                phone,
                subject,
                message,
            });

            return true;
        },
        createEquipment: async (
            _: unknown,
            { input }: { input: CreateEquipmentInput },
            ctx: GraphQLContext
        ) => {
            return await EquipmentService.create(input, ctx);
        },
        updateEquipment: async (
            _: unknown,
            { id, input }: { id: string; input: UpdateEquipmentInput },
            ctx: GraphQLContext
        ) => {
            return await EquipmentService.update(id, input, ctx);
        },
        deleteEquipment: async (
            _: unknown,
            { id }: { id: string },
            ctx: GraphQLContext
        ) => {
            return await EquipmentService.delete(id, ctx);
        },
        createCleanAction: async (
            _: unknown,
            { input }: { input: CreateCleanActionInput },
            ctx: GraphQLContext
        ) => {
            return await CleanActionService.create(input, ctx);
        },
        createMaterial: async (
            _: unknown,
            { input }: { input: CreateMaterialInput },
            ctx: GraphQLContext
        ) => {
            return await MaterialService.create(input, ctx);
        },
        updateMaterial: async (
            _: unknown,
            { id, input }: { id: string; input: UpdateMaterialInput },
            ctx: GraphQLContext
        ) => {
            return await MaterialService.update(id, input, ctx);
        },
        deleteMaterial: async (
            _: unknown,
            { id }: { id: string },
            ctx: GraphQLContext
        ) => {
            return await MaterialService.delete(id, ctx);
        },
        importMaterialsCsv: async (
            _: unknown,
            args: { csv: string; overwriteExisting?: boolean },
            ctx: GraphQLContext
        ) => {
            return await MaterialService.importCsv(
                args.csv,
                !!args.overwriteExisting,
                ctx
            );
        },
        createProduct: async (
            _: unknown,
            { input }: { input: CreateProductInput },
            ctx: GraphQLContext
        ) => {
            return await ProductService.create(input, ctx);
        },
        updateProduct: async (
            _: unknown,
            { id, input }: { id: string; input: UpdateProductInput },
            ctx: GraphQLContext
        ) => {
            return await ProductService.update(id, input, ctx);
        },
        importProductsCsv: async (
            _: unknown,
            args: { csv: string; overwriteExisting?: boolean },
            ctx: GraphQLContext
        ) => {
            return await ProductService.importCsv(
                args.csv,
                !!args.overwriteExisting,
                ctx
            );
        },
        createProcessMap: async (
            _: unknown,
            { input }: { input: CreateProcessMapInput },
            ctx: GraphQLContext
        ) => {
            return await ProcessMapService.create(input, ctx);
        },
        updateProcessMap: async (
            _: unknown,
            { id, input }: { id: string; input: UpdateProcessMapInput },
            ctx: GraphQLContext
        ) => {
            return await ProcessMapService.update(id, input, ctx);
        },
        createBatch: async (
            _: unknown,
            { input }: { input: CreateBatchInput },
            cnt: GraphQLContext
        ) => {
            const product = await prisma.product.findUnique({
                where: {
                    id: input.productId,
                },
                include: {
                    variants: true,
                },
            });
            if (!product)
                throw Error(
                    `Create batch product id = "${input.productId}" not found`
                );
            const variant = product.variants.find(
                (v) =>
                    (v.label === 'string'
                        ? v.label
                        : (v.label as any)?.default) === input.variantLabel
            );
            if (!variant && input.variantLabel)
                throw Error(
                    `Create Create batch product id = "${input.productId}" with wrong variantLabel`
                );
            return await prisma.$transaction(async (tx) => {
                // Передаем tx в каждую функцию
                const batch = await BatchService.create(input, cnt, tx);
                await MovementService.create(
                    {
                        type: MovementType.PRODUCTION,
                        productId: input.productId,
                        batchId: batch.id,
                        quantity: Math.trunc(
                            input.nettoWeight /
                                (variant?.weight
                                    ? variant?.weight
                                    : product.standardDose)
                        ),
                        locationId: cnt.locationId!,
                        variantLabel: input.variantLabel,
                    },
                    cnt,
                    tx
                );

                return batch;
            });
        },
        updateBatch: async (
            _: unknown,
            { id, input }: { id: string; input: UpdateBatchInput },
            cnt: GraphQLContext
        ) => {
            return await BatchService.update(id, input, cnt);
        },
        updateSample: async (
            _: unknown,
            {
                id,
                input,
            }: {
                id: string;
                input: { result?: string; note?: string; studyAt?: string };
            },
            { req }: GraphQLContext
        ) => {
            if (!req.session.userId) throw new Error('Not authenticated');

            const data: Record<string, unknown> = {};

            if (input.result !== undefined) {
                data.result = input.result.trim() || null;
            }

            if (input.note !== undefined) {
                data.note = input.note.trim() || null;
            }

            if (input.studyAt !== undefined) {
                data.studyAt = input.studyAt ? new Date(input.studyAt) : null;
            }

            if (Object.keys(data).length === 0) {
                throw new Error('No fields provided for update');
            }

            return await prisma.sample.update({
                where: { id },
                data,
                include: {
                    batch: { include: { product: true } },
                },
            });
        },
        createCertificate: async (
            _: unknown,
            { input }: { input: CreateCertificateInput },
            ctx: GraphQLContext
        ) => {
            return await CertificateService.create(input, ctx);
        },
        updateCertificate: async (
            _: unknown,
            { id, input }: { id: string; input: UpdateCertificateInput },
            ctx: GraphQLContext
        ) => {
            return await CertificateService.update(id, input, ctx);
        },
        generateCertificateDocument: async (
            _: unknown,
            { id }: { id: string },
            ctx: GraphQLContext
        ) => {
            return await CertificateService.generateDocument(id, ctx);
        },
        updateCostSettings: async (
            _: unknown,
            { input }: { input: Record<string, unknown> },
            ctx: GraphQLContext
        ) => {
            return await CostSettingsService.update(input, ctx);
        },
        createOrder: async (
            _: unknown,
            { input }: { input: CreateOrderInput },
            ctx: GraphQLContext
        ) => {
            return OrderService.Draft(input, ctx);
        },

        draft: async (
            _: unknown,
            { input }: { input: CreateOrderInput },
            ctx: GraphQLContext
        ) => {
            return OrderService.Draft(input, ctx);
        },

        sendOrderByEmail: async (
            _: unknown,
            { input }: { input: SendOrderInput },
            ctx: GraphQLContext
        ) => {
            const { req } = ctx;
            const customerName = input.customerName.trim();
            const customerEmail = input.customerEmail.trim();
            const customerPhone = input.customerPhone.trim();
            const customerDeliveryAddress =
                input.customerDeliveryAddress.trim();
            const note = input.note?.trim();

            if (
                !customerName ||
                !customerEmail ||
                !customerPhone ||
                !customerDeliveryAddress
            ) {
                throw new Error(
                    'Customer name, email, phone and delivery address are required'
                );
            }
            if (
                !Number.isFinite(input.deliveryLat) ||
                input.deliveryLat < -90 ||
                input.deliveryLat > 90 ||
                !Number.isFinite(input.deliveryLon) ||
                input.deliveryLon < -180 ||
                input.deliveryLon > 180
            ) {
                throw new Error('Delivery coordinates are invalid');
            }

            const draftOrder = await OrderService.getCustomerDraft(
                ctx,
                input.orderId
            );
            if (
                !draftOrder.products.length ||
                !Number.isFinite(draftOrder.totalPrice) ||
                draftOrder.totalPrice <= 0
            ) {
                throw new Error('Order total must be greater than 0');
            }

            const deliveryEstimate = await AddressService.estimateForOrder(
                ctx,
                customerDeliveryAddress,
                { lat: input.deliveryLat, lon: input.deliveryLon }
            );
            const deliveryFee = deliveryEstimate.deliveryCost;
            if (
                deliveryFee === null ||
                !Number.isFinite(deliveryFee) ||
                deliveryFee < 0
            ) {
                throw new Error(
                    'Delivery tariff is not configured for this location'
                );
            }

            const sessionUserId = req.session.userId;
            const sessionUser = sessionUserId
                ? await prisma.user.findUnique({ where: { id: sessionUserId } })
                : null;

            const orderLines = draftOrder.products.map((item, index) => {
                const lineTotal = item.price ?? 0;
                const unitPrice =
                    item.quantity > 0 ? lineTotal / item.quantity : 0;
                const productName = new MLString(
                    item.product.name as IMLString
                ).toString();
                return [
                    `${index + 1}. ${productName}`,
                    item.variantLabel
                        ? `   variation: ${item.variantLabel}`
                        : null,
                    `   qty: ${item.quantity}`,
                    `   unit price: ${unitPrice.toFixed(2)} din`,
                    `   line total: ${lineTotal.toFixed(2)} din`,
                ]
                    .filter(Boolean)
                    .join('\n');
            });

            await PushService.sendNewOrderEmail({
                customerName,
                customerEmail,
                customerPhone,
                deliveryAddress: customerDeliveryAddress,
                distanceMeters: deliveryEstimate.distanceMeters,
                deliveryCost: deliveryFee,
                currencySymbol: deliveryEstimate.currencySymbol,
                sessionUserId: sessionUser?.id,
                sessionUserEntityType: sessionUser?.entityType,
                orderLines,
                productsSubtotal: draftOrder.totalPrice,
                note,
            });

            await OrderService.confirmCustomerDraft(ctx, input.orderId, {
                customerName,
                customerEmail,
                customerPhone,
                customerDeliveryAddress,
                deliveryLat: input.deliveryLat,
                deliveryLon: input.deliveryLon,
                deliveryFee,
                note,
            });

            return true;
        },
        startOrderProduction: async (
            _: unknown,
            { orderId }: { orderId: string },
            ctx: GraphQLContext
        ) => {
            const order = await OrderService.startProduction(ctx, orderId);
            return {
                order,
                ...(await PushService.notifyCustomerOrderStatus(
                    order,
                    'accepted'
                )),
            };
        },
        markOrderReady: async (
            _: unknown,
            { orderId }: { orderId: string },
            ctx: GraphQLContext
        ) => {
            const order = await OrderService.markReady(ctx, orderId);
            return {
                order,
                ...(await PushService.notifyCustomerOrderStatus(
                    order,
                    'ready'
                )),
            };
        },
        cancelOrder: async (
            _: unknown,
            { orderId }: { orderId: string },
            ctx: GraphQLContext
        ) => {
            const order = await OrderService.cancelOrder(ctx, orderId);
            return {
                order,
                ...(await PushService.notifyCustomerOrderStatus(
                    order,
                    'cancelled'
                )),
            };
        },
    },
    User: {
        createdAt: (user: { createdAt: Date | string }) => {
            return new Date(user.createdAt).toISOString();
        },
        updatedAt: (user: { updatedAt: Date | string }) => {
            return new Date(user.updatedAt).toISOString();
        },
    },
    Company: {
        createdAt: (c: { createdAt: Date }) => {
            return new Date(c.createdAt).toISOString();
        },
        updatedAt: (c: { updatedAt: Date }) => {
            return new Date(c.updatedAt).toISOString();
        },
        locations: (c: { locations: ILocation[] }) => {
            return c.locations.map((l) => ({
                ...l,
                createdAt: l.createdAt
                    ? new Date(l.createdAt).toISOString()
                    : null,
                updatedAt: l.updatedAt
                    ? new Date(l.updatedAt).toISOString()
                    : null,
            }));
        },
    },
    Equipment: {
        createdAt: (e: { createdAt: Date | string }) =>
            new Date(e.createdAt).toISOString(),
        updatedAt: (e: { updatedAt: Date | string }) =>
            new Date(e.updatedAt).toISOString(),
    },
    CleanAction: {
        equipment: (parent: { equipmend: unknown }) => parent.equipmend,
        performer: (parent: { performer: unknown }) => parent.performer,
        supervisor: (parent: { supervisor: unknown }) => parent.supervisor,
        createdAt: (parent: { createdAt: Date | string }) =>
            new Date(parent.createdAt).toISOString(),
        updatedAt: (parent: { updatedAt: Date | string }) =>
            new Date(parent.updatedAt).toISOString(),
    },
    Material: {
        createdAt: (material: { createdAt: Date | string }) =>
            new Date(material.createdAt).toISOString(),
        updatedAt: (material: { updatedAt: Date | string }) =>
            new Date(material.updatedAt).toISOString(),
    },
    Product: {
        createdAt: (product: { createdAt: Date | string }) =>
            new Date(product.createdAt).toISOString(),
        updatedAt: (product: { updatedAt: Date | string }) =>
            new Date(product.updatedAt).toISOString(),
    },
    StorageCondition: {
        createdAt: (storageCondition: { createdAt: Date | string }) =>
            new Date(storageCondition.createdAt).toISOString(),
        updatedAt: (storageCondition: { updatedAt: Date | string }) =>
            new Date(storageCondition.updatedAt).toISOString(),
    },
    ProcessMap: {
        createdAt: (pm: { createdAt: Date | string }) =>
            new Date(pm.createdAt).toISOString(),
        updatedAt: (pm: { updatedAt: Date | string }) =>
            new Date(pm.updatedAt).toISOString(),
    },
    Batch: {
        product: (batch: { product: unknown }) => batch.product,
        storageCondition: (batch: { storageCondition: unknown }) =>
            batch.storageCondition,
        processMap: (batch: { processMap?: unknown }) =>
            batch.processMap ?? null,
        samples: (batch: { samples?: unknown[] }) => batch.samples ?? [],
        certificate: (batch: { certificate?: unknown }) =>
            batch.certificate ?? null,
        createdAt: (batch: { createdAt: Date | string }) =>
            new Date(batch.createdAt).toISOString(),
        updatedAt: (batch: { updatedAt: Date | string }) =>
            new Date(batch.updatedAt).toISOString(),
    },
    Certificate: {
        batch: (certificate: { batch: unknown }) => certificate.batch,
        createdAt: (certificate: { createdAt: Date | string }) =>
            new Date(certificate.createdAt).toISOString(),
        updatedAt: (certificate: { updatedAt: Date | string }) =>
            new Date(certificate.updatedAt).toISOString(),
    },
    CertificateBatchOption: {
        product: (batch: { product: unknown }) => batch.product,
        storageCondition: (batch: { storageCondition: unknown }) =>
            batch.storageCondition,
        processMap: (batch: { processMap?: unknown }) =>
            batch.processMap ?? null,
        samples: (batch: { samples?: unknown[] }) => batch.samples ?? [],
        createdAt: (batch: { createdAt: Date | string }) =>
            new Date(batch.createdAt).toISOString(),
    },
    Sample: {
        createdAt: (sample: { createdAt: Date | string }) =>
            new Date(sample.createdAt).toISOString(),
        updatedAt: (sample: { updatedAt: Date | string }) =>
            new Date(sample.updatedAt).toISOString(),
        studyAt: (sample: { studyAt?: Date | string | null }) =>
            sample.studyAt ? new Date(sample.studyAt).toISOString() : null,
    },
};

const app = express();
const port = process.env.PORT || 5000;

const configuredOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins =
    configuredOrigins.length > 0
        ? configuredOrigins
        : [
              'http://localhost:3000',
              'http://127.0.0.1:3000',
              'http://localhost:5173',
              'http://127.0.0.1:5173',
              'http://www.dolceforte.rs',
              'https://dolceforte.rs',
              'http://dolceforte.local',
              'http://www.dolceforte.local',
          ];

const corsOptions: CorsOptions = {
    origin(origin, callback) {
        // Allow same-origin or non-browser requests (e.g. curl/Postman without Origin).
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'df-company-id',
        'df-location-id',
    ],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
//
//app.use(cors({ origin: '*' }));
app.use(express.json());

//app.enable('trust proxy');

app.use(
    session({
        name: 'dolceforte.sid',
        secret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            //sameSite: 'none',
            secure: process.env.NODE_ENV === 'production',
            //secure: false,
            maxAge: SESSION_TTL_MS,
        },
    })
);
app.get('/', (req, res) => {
    res.json({ message: 'DolceForte API' });
});

app.get('/certificates/:id/document', async (req, res) => {
    if (!req.session.userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }

    try {
        const { fileName, mimeType, fileBuffer } =
            await CertificateService.buildCertificateDocumentPayload(
                req.params.id
            );

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', String(fileBuffer.length));
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
        );
        res.status(200).send(fileBuffer);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message === 'Certificate not found') {
            res.status(404).json({ error: message });
            return;
        }

        console.error('Failed to generate certificate document', error);
        res.status(500).json({
            error: 'Failed to generate certificate document',
        });
    }
});

const upload = multer({ dest: 'public/uploads/' });

app.post('/api/upload-image', upload.single('image'), (req, res) => {
    // req.file содержит информацию о загруженном файле
    if (req) {
        const fileUrl = `/uploads/${req.file?.filename}`;
        res.json({ url: fileUrl });
    }
});

app.use('/uploads', express.static('public/uploads'));

export default app;
const schemaString = fs.readFileSync(
    path.join(import.meta.dirname, 'schema.graphql'),
    'utf8'
);
const typeDefs = gql`
    ${schemaString}
`;
const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (formattedError, error) => {
        console.log('ERROR raised', JSON.stringify(error));
        return formattedError;
    },
});

(async () => {
    try {
        await prisma.$connect();
        console.log('Prisma connected');
    } catch (error) {
        console.error(
            'Prisma failed to start. Check DATABASE_URL and DB availability.'
        );
        console.error(error);
        process.exit(1);
    }

    await server.start();

    app.use(
        '/graphql',
        expressMiddleware(server, {
            context: async ({ req, res }): Promise<GraphQLContext> => {
                const getHeader = (
                    header: string | string[] | undefined
                ): string | undefined => {
                    return Array.isArray(header) ? header[0] : header;
                };
                return {
                    req,
                    res,
                    prisma,
                    companyId: getHeader(req.headers['df-company-id']),
                    locationId: getHeader(req.headers['df-location-id']),
                    userId: req.session.userId,
                };
            },
        })
    );

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log(`GraphQL playground at http://localhost:${port}/graphql`);
    });
})();
