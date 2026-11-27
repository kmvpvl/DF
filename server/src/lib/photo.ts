import { IMLString } from "@df/types/mlstring";

export interface ITimeSlot {
    start: Date;
    duration: number;
    repeat?: string;
    until?: Date;
    includes?: ITimeSlot[];
    excludes?: ITimeSlot[];
}
export interface IRating {
    ratingValue: number;
    ratingCount: number;
}
export interface IAward {
    awardName: IMLString;
    logo?: {
        url: string;
        caption: IMLString;
    };
    url: string;
}
