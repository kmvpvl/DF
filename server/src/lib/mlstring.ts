import { IMLString } from "@df/types/mlstring";

export class MLString extends String {
    private _translations: Record<string, string> = {};

    constructor(input?: IMLString | null) {
        super(!input ? '' : typeof input === 'string' ? input : input.default);
        if (input && typeof input !== 'string') {
            this._translations = input.ts || {};
        }
    }

    toString(lang?: string): string {
        if (lang && this._translations[lang]) {
            return this._translations[lang];
        }
        return super.toString();
    }

    // Для сохранения в БД
    get Json(): IMLString {
        return {
            default: super.toString(),
            ts: this._translations,
        };
    }
}
