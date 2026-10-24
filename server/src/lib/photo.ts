import { IMLString } from "./mlstring";

export interface IPhoto {
    url: string;
    caption?: IMLString;
    tags?: ITag[];
}
export interface ITimeSlot {
    start: Date;
    duration: number;
    repeat?: string;
    until?: Date;
    includes?: ITimeSlot[];
    excludes?: ITimeSlot[];
}
export type ICoords = { lat: number; lng: number } | string;
export type ITag = IMLString;
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