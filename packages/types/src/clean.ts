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

