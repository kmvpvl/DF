import { IMLString } from '@df/types/mlstring';
import { ITag } from '@df/types/tag';
export interface IPhoto {
    url: string;
    caption?: IMLString;
    tags?: ITag[];
}
