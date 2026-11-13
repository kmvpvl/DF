export interface ILocation {
    id: string;
    name: string;
    timezone: string;
    currencyCode: string;
    currencySymbol: string;
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
