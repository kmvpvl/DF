// server/src/types.ts
import { Request, Response } from 'express';
import { prisma } from './lib/prisma';
import { MovementType } from '@prisma/client';
import { IMLString } from './lib/mlstring';

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
    companyId: string;
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
