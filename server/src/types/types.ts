// server/src/types.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { MovementType, OrderStatus } from '@prisma/client';
import { IMLString } from '../lib/mlstring';
import { IPhoto, ITag } from '../lib/photo';

export interface GraphQLContext {
    req: Request;
    res: Response;
    prisma: typeof prisma;
    userId?: string; // Удобно добавить, чтобы не проверять каждый раз req.session
    companyId?: string;
    locationId?: string;
}

export interface CreateBatchInput {
    productId: string;
    nettoWeight: number;
    storageDurationDays: number;
    storageConditionId?: string;
    storageConditionName?: string;
    processDeviations?: string;
    processMapId?: string;
    sampleCount?: number;
    locationId: string;
}

export interface UpdateBatchInput {
    nettoWeight?: number;
    storageDurationDays?: number;
    storageConditionId?: string;
    storageConditionName?: string;
    processDeviations?: string;
    processMapId?: string | null;
    locationId: string;
}

export interface BatchNumberPreview {
    number: number;
    numberStr: string;
}

export interface CreateEquipmentInput {
    numId: number;
    fullName: string;
    locationId: string;
}

export interface UpdateEquipmentInput {
    numId?: number;
    fullName?: string;
    locationId: string;
}

export interface CreateCleanActionInput {
    equipmentId: string;
    performerId: string;
    supervisorId: string;
    cleaningType: 'GENERAL' | 'CURRENT' | 'DISINFECTION';
}

export interface CreateMovementInput {
    type: MovementType;
    productId: string;
    batchId?: string;
    quantity: number;
    locationId: string;
}

export interface CreateMaterialInput {
    name: string;
    description?: string;
    selfProduced: boolean;
    isPublicComposition?: boolean;
    caloriesKcal: number;
    fatGrams: number;
    proteinGrams: number;
    carbohydratesGrams: number;
    sugarsGrams: number;
    fiberGrams: number;
    saltGrams: number;
    VAT: number;
    Price: number;
    purchaseUnit: string;
    purchaseUnitAmount: number;
    consumptionUnit: string;
    rateOfLoss: number;
    ratio: number;
    companyId: string;
}

export interface UpdateMaterialInput {
    name?: string;
    description?: string;
    selfProduced?: boolean;
    isPublicComposition?: boolean;
    caloriesKcal?: number;
    fatGrams?: number;
    proteinGrams?: number;
    carbohydratesGrams?: number;
    sugarsGrams?: number;
    fiberGrams?: number;
    saltGrams?: number;
    VAT?: number;
    Price?: number;
    purchaseUnit?: string;
    purchaseUnitAmount?: number;
    consumptionUnit?: string;
    rateOfLoss?: number;
    ratio?: number;
    companyId: string;
}

export interface CreateProductInput {
    name: IMLString;
    batchPrefix: string;
    description: IMLString;
    caloriesKcal: number;
    fatGrams: number;
    proteinGrams: number;
    carbohydratesGrams: number;
    sugarsGrams: number;
    fiberGrams: number;
    saltGrams: number;
    standardDose: number;
    tags: ITag[];
    photos: IPhoto[];
    companyId: string;
    chapters: IMLString[];
    isPublic: boolean;
    priority: number;
    priceOptions: ProductPriceOptions;
}

export interface UpdateProductInput {
    name?: IMLString;
    batchPrefix?: string;
    description?: IMLString;
    caloriesKcal?: number;
    fatGrams?: number;
    proteinGrams?: number;
    carbohydratesGrams?: number;
    sugarsGrams?: number;
    fiberGrams?: number;
    saltGrams?: number;
    standardDose: number;
    tags: ITag[];
    photos: IPhoto[];
    chapters: IMLString[];
    isPublic: boolean;
    priority: number;
    priceOptions: ProductPriceOptions;
    companyId: string;
}

export interface CreateCertificateInput {
    batchId: string;
    extraCertificateData?: string;
}

export interface UpdateCertificateInput {
    extraCertificateData?: string;
}

export interface SearchCertificatesInput {
    fromDate?: string;
    toDate?: string;
    number?: number;
    productId?: string;
    batchNumber?: string;
}

export interface CreateProcessParameterInput {
    name: string;
    value: string;
    unit: string;
}

export interface IngredientInput {
    productId?: string;
    materialId?: string;
    amount: number;
}

export interface CreateProcessMapInput {
    productId: string;
    name: string;
    outcome: number;
    rateOfLoss?: number;
    VAT?: number;
    containerCost?: number;
    dose?: number;
    marginalCoefficient?: number;
    parameters?: CreateProcessParameterInput[];
    ingredients?: IngredientInput[];
    outcomeUnit?: string;
}

export interface UpdateProcessMapInput {
    name?: string;
    outcome?: number;
    rateOfLoss?: number;
    VAT?: number;
    containerCost?: number;
    dose?: number;
    marginalCoefficient?: number;
    parameters?: CreateProcessParameterInput[];
    ingredients?: IngredientInput[];
    outcomeUnit?: string;
}

export interface MovementGroupInput {
    label: string;
}

export interface MovementGroupResult {
    id: string;
    label: string | null;
    movementIds: string[];
    createdAt: Date;
}

export interface ImportMaterialsCsvResult {
    importedCount: number;
    skippedCount: number;
    errors: string[];
}

export interface ImportProductsCsvResult {
    importedCount: number;
    skippedCount: number;
    errors: string[];
}

export interface ProductPriceOptions {
    individualPrice?: number;
    legalPrice?: number;
    individualPriceCalc?: boolean;
    legalPriceCalc?: boolean;
    individualMarginK?: number;
    legalMarginK?: number;
    individualDiscountFromDoses?: number;
    legalDiscountFromDoses?: number;
}

export interface IOrder {
    id: string;
    number: string;
    numberInt: number;
    customerName: string;
    customerUserId: string | null;
    orderDate: Date;
    orderDateReady: Date | null;
    status: OrderStatus;
    totalPrice: number;
    isPaid: boolean;
    paymentMethod: string | null;
    deliveryAddress: string | null;
    shippingMethod: string | null;
    trackingNumber: string | null;
    managerId: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    locationId: string;

    // Опциональные связи (Relations), если они загружаются через include
    products: IOrderProduct[];
    location?: any; // Замените на ваш интерфейс LocationServer
}

export interface IOrderProduct {
    id: string;
    orderId: string;
    productId: string;
    quantity: number; // В Prisma Float — в JS это number
    dateReady: Date | null;
    createdAt: Date;
    updatedAt: Date;
    sortOrder: number;
    variationLabel?: string;
    price: number;

    // Опциональные связи
    order?: IOrder;
    product?: any; // Замените на ваш интерфейс ProductServer
}

// Данные для создания нового заказа (фронтенд отправляет на бэкенд)
export interface CreateOrderProductInput {
    id?: string;
    orderId?: string;
    productId: string;
    quantity: number; // В Prisma Float — в JS это number
    dateReady?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    sortOrder?: number;
    variationLabel?: string | null;
    price?: number;

    // Опциональные связи
    order?: IOrder;
    product?: any; // Замените на ваш интерфейс ProductServer
}
export interface CreateOrderInput {
    id?: string;
    number?: string;
    numberInt?: number;
    customerName?: string;
    customerUserId: string | null;
    orderDate?: Date | null;
    orderDateReady?: Date | null;
    status: OrderStatus;
    totalPrice?: number;
    isPaid?: boolean;
    paymentMethod?: string | null;
    deliveryAddress?: string | null;
    shippingMethod?: string | null;
    trackingNumber?: string | null;
    managerId?: string | null;
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    locationId?: string;

    // Опциональные связи (Relations), если они загружаются через include
    location?: any; // Замените на ваш интерфейс LocationServer
    // Массив продуктов для создания связи nested write в Prisma
    products: CreateOrderProductInput[];
}

// Данные для обновления существующего заказа
export type UpdateOrderInput = Partial<Omit<CreateOrderInput, 'products'>> & {
    status?: OrderStatus;
    isPaid?: boolean;
    trackingNumber?: string | null;
    managerId?: string | null;
    orderDateReady?: string | null;
};
