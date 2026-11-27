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


export interface ImportMaterialsCsvResult {
    importedCount: number;
    skippedCount: number;
    errors: string[];
}
