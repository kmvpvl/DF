import { IMLString } from '@df/types/mlstring';

export interface IChapter {
    id: string;
    name: IMLString;
    description: IMLString;
    sortOrder: number;
}
