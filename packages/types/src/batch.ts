export interface CreateBatchInput {
    productId: string;
    variantLabel?: string;
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
