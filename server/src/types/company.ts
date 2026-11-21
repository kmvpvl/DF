export interface ILocation {
    id: string;
    name: string;
    timezone: string;
    currencyCode: string;
    currencySymbol: string;
    availablePaymentMethods?: string[];
    availableShippingMethods?: string[];
    location?: ICoords;
    city?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICompany {
    id: string;
    name: string;
    locations: ILocation[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICoords {
    lat: number;
    lon: number;
}

export interface IRouteEstimate {
    distanceMeters: number;
    durationSeconds: number;
    isValidAddress: boolean;
    deliveryCost: number | null;
    currencySymbol: string;
}

export interface IAddressSuggestion {
    formatted: string;
    lat: number;
    lon: number;
    isExactHouse: boolean; // true, если найден конкретный номер дома
}
