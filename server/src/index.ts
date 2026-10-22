import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import express, { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import cors, { type CorsOptions } from 'cors';
import session from 'express-session';
import nodemailer, { Transporter } from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { prisma } from './lib/prisma';
import {
    CreateBatchInput,
    CreateCertificateInput,
    CreateCleanActionInput,
    CreateEquipmentInput,
    CreateMaterialInput,
    CreateProcessMapInput,
    CreateProductInput,
    GraphQLContext,
    SearchCertificatesInput,
    UpdateBatchInput,
    UpdateCertificateInput,
    UpdateEquipmentInput,
    UpdateMaterialInput,
    UpdateProcessMapInput,
    UpdateProductInput,
} from './types';
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
}

interface SendContactMessageInput {
    type: 'FEEDBACK' | 'FREE_TEST_BATCH';
    name: string;
    email?: string;
    phone?: string;
    subject: string;
    message: string;
}

interface OrderItemInput {
    productId: number;
    name: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    variationLabel?: string;
    weightGrams?: number;
}

interface SendOrderInput {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    note?: string;
    items: OrderItemInput[];
    total: number;
}

let smtpTransporter: Transporter | null = null;

function parseBoolean(value: string | undefined, fallback = false): boolean {
    if (!value) return fallback;
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function formatCertificateNumberString(
    date: Date,
    certificateNumber: number
): string {
    const shortYear = String(date.getFullYear()).slice(-2);
    return `${shortYear}-${String(certificateNumber).padStart(9, '0')}`;
}

async function getNextCertificateNumber(date = new Date()): Promise<number> {
    const numberYear = date.getFullYear();

    const aggregate = await prisma.certificate.aggregate({
        where: { numberYear },
        _max: {
            number: true,
        },
    });

    return (aggregate._max.number ?? 0) + 1;
}

function getSmtpTransporter(): Transporter {
    if (smtpTransporter) {
        return smtpTransporter;
    }

    const host = process.env.SMTP_HOST;
    const port = Number.parseInt(process.env.SMTP_PORT ?? '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = parseBoolean(process.env.SMTP_SECURE, false);

    if (!host || !Number.isFinite(port) || !user || !pass) {
        throw new Error(
            'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.'
        );
    }

    smtpTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
    });

    return smtpTransporter;
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
        equipments: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            return await EquipmentService.getAll(ctx);
        },
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

        orders: async (_: unknown, __: unknown, { req }: GraphQLContext) => {
            if (!req.session.userId) throw new Error('Not authenticated');
            return await prisma.order.findMany({
                include: {
                    products: false,
                },
                orderBy: [{ createdAt: 'desc' }],
            });
        },

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
            } as any;

            return await prisma.user.update({
                where: { id: userId },
                data: updateData,
            });
        },
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

            const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
            const feedbackTo =
                process.env.SMTP_TO_FEEDBACK || process.env.CONTACT_EMAIL_TO;
            const freeOrderTo =
                process.env.SMTP_TO_FREE_ORDER || process.env.CONTACT_EMAIL_TO;
            const recipient =
                input.type === 'FREE_TEST_BATCH' ? freeOrderTo : feedbackTo;

            if (!fromAddress || !recipient) {
                throw new Error(
                    'Email routing is not configured. Set SMTP_FROM and CONTACT_EMAIL_TO or SMTP_TO_*.'
                );
            }

            const prefix = process.env.EMAIL_SUBJECT_PREFIX?.trim();
            const typeLabel =
                input.type === 'FREE_TEST_BATCH'
                    ? 'FREE_TEST_BATCH'
                    : 'FEEDBACK';
            const finalSubject = `${prefix ? `${prefix} ` : ''}[${typeLabel}] ${subject}`;

            const transporter = getSmtpTransporter();

            await transporter.sendMail({
                from: fromAddress,
                to: recipient,
                replyTo: email || undefined,
                subject: finalSubject,
                text: [
                    `Type: ${typeLabel}`,
                    `Name: ${name}`,
                    `Email: ${email || '-'}`,
                    `Phone: ${phone || '-'}`,
                    '',
                    message,
                ].join('\n'),
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
            return await BatchService.create(input, cnt);
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
        sendOrderByEmail: async (
            _: unknown,
            { input }: { input: SendOrderInput },
            { req }: GraphQLContext
        ) => {
            const customerName = input.customerName.trim();
            const customerEmail = input.customerEmail.trim();
            const customerPhone = input.customerPhone.trim();
            const note = input.note?.trim();

            if (!customerName || !customerEmail || !customerPhone) {
                throw new Error('Customer name, email and phone are required');
            }

            if (!input.items.length) {
                throw new Error('Order must contain at least one item');
            }

            const invalidItem = input.items.find(
                (item) =>
                    !item.name.trim() ||
                    !Number.isFinite(item.qty) ||
                    item.qty <= 0 ||
                    !Number.isFinite(item.unitPrice) ||
                    item.unitPrice < 0 ||
                    !Number.isFinite(item.lineTotal) ||
                    item.lineTotal < 0
            );

            if (invalidItem) {
                throw new Error('Order contains invalid item data');
            }

            if (!Number.isFinite(input.total) || input.total <= 0) {
                throw new Error('Order total must be greater than 0');
            }

            const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
            const recipient =
                process.env.SMTP_TO_ORDER || 'sales@dolceforte.rs';

            if (!fromAddress) {
                throw new Error(
                    'SMTP sender is not configured. Set SMTP_FROM or SMTP_USER.'
                );
            }

            const transporter = getSmtpTransporter();
            const subjectPrefix = process.env.EMAIL_SUBJECT_PREFIX?.trim();
            const subject = `${subjectPrefix ? `${subjectPrefix} ` : ''}[ORDER] ${customerName}`;

            const sessionUserId = req.session.userId;
            const sessionUser = sessionUserId
                ? await prisma.user.findUnique({ where: { id: sessionUserId } })
                : null;

            const orderLines = input.items.map((item, index) => {
                const attributes = [
                    item.variationLabel
                        ? `variation: ${item.variationLabel}`
                        : null,
                    typeof item.weightGrams === 'number' &&
                    Number.isFinite(item.weightGrams)
                        ? `weight: ${item.weightGrams}g`
                        : null,
                ]
                    .filter(Boolean)
                    .join(', ');

                return [
                    `${index + 1}. ${item.name}`,
                    `   qty: ${item.qty}`,
                    `   unit price: ${item.unitPrice.toFixed(2)} din`,
                    `   line total: ${item.lineTotal.toFixed(2)} din`,
                    attributes ? `   ${attributes}` : null,
                ]
                    .filter(Boolean)
                    .join('\n');
            });

            await transporter.sendMail({
                from: fromAddress,
                to: recipient,
                replyTo: customerEmail,
                subject,
                text: [
                    'New DolceForte order',
                    '',
                    `Customer name: ${customerName}`,
                    `Customer email: ${customerEmail}`,
                    `Customer phone: ${customerPhone}`,
                    `Session user id: ${sessionUser?.id ?? '-'}`,
                    `Session user entity type: ${sessionUser?.entityType ?? '-'}`,
                    '',
                    'Order items:',
                    ...orderLines,
                    '',
                    `Total: ${input.total.toFixed(2)} din`,
                    `Note: ${note || '-'}`,
                ].join('\n'),
            });

            return true;
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
    allowedHeaders: ['Content-Type', 'Authorization', 'df-company-id', 'df-location-id'],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// 
//app.use(cors({ origin: '*' }));
app.use(express.json());

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
            secure: process.env.NODE_ENV === 'production',
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
        console.log("ERROR raised", JSON.stringify(error));
        return formattedError;
    }
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
            context: async ({ req, res }) => {
                return ({ req, res, prisma, 
                    companyId: String(req.headers['df-company-id']), 
                    locationId: String(req.headers['df-location-id']), 
                    userId: req.session.userId })
            },
        })
    );

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log(`GraphQL playground at http://localhost:${port}/graphql`);
    });
})();
