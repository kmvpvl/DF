export const MovementType = {
  PURCHASE: 'PURCHASE',
  PRODUCTION: 'PRODUCTION',
  SALE: 'SALE',
  WRITE_OFF: 'WRITE_OFF',
  RETURN: 'RETURN',
  MOVE_IN: 'MOVE_IN',
  MOVE_OUT: 'MOVE_OUT'
};

export type MovementType = (typeof MovementType)[keyof typeof MovementType]

export interface CreateMovementInput {
    type: MovementType;
    productId: string;
    variantLabel?: string;
    batchId?: string;
    quantity: number;
    locationId?: string;
    targetLocationId?: string;
    label?: string;
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
