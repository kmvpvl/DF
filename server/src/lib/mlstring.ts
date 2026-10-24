// server/src/lib/mlstring.ts

export type IMLString = string | {
    default: string;
    // Используем простой объект вместо массива кортежей
    ts: Record<string, string>; // translations
};

export class MLString extends String {
    private _translations: Record<string, string> = {};

    constructor(input?: IMLString) {
        if (!input) {
            super('');
        } else if (typeof input === 'string') {
            super(input);
        } else {
            super(input.default);
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
            ts: this._translations
        };
    }
}
