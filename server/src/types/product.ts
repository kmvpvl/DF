import { IMLString } from '../lib/mlstring';
import { IPhoto, ITag } from '../lib/photo';

export interface IDiscountTier {
    threshold: number;
    discount: number;
}

export interface ILocationModifierConfig {
    modifierId: string;
    locationPrices: IPriceDetail; // Кастомная цена топпинга/компонента в этой локации
    isAvailable: boolean;
}

export interface IPriceDetail {
    locationId: string;
    individualPrice: number;
    legalEntityPrice?: number;
    individualDiscounts?: IDiscountTier[];
    legalDiscounts?: IDiscountTier[];
    isAvailable?: boolean;
}

export interface IProductModifier {
    id: string;
    name: IMLString;
    locationPrices: IPriceDetail[]; // Сколько стоит добавить этот компонент
    weight?: number;
    weightUnit?: string;
}

export interface IProductModifierGroup {
    id: string;
    title: IMLString; // Например: "Выберите соус", "Дополнительные компоненты"
    isRequired: boolean;
    minSelect: number;
    maxSelect: number;
    modifiers: IProductModifier[];
}

export interface IProductVariant {
    id?: string;
    sku?: string;
    label: IMLString; // Например: "100г", "500г", "Со вкусом клубники"

    // Цены для этой конкретной вариации
    locationPrices: IPriceDetail[];
    isAvailable?: true;

    // Для весовых продуктов и упаковок
    isWeightBased: boolean; // true - если продается на вес (цена за кг/грамм)
    weight: number; // Вес упаковки ИЛИ шаг веса (например, 0.1 для 100г)
    weightUnit: string; // "g", "kg"
}

// 1. Объявляем Enum для типов продукта
export enum ProductType {
    SIMPLE = 'SIMPLE',
    COMBO = 'COMBO',
}

// 2. Интерфейс для элемента комбо-набора
export interface IComboItem {
    id: string;
    comboId: string; // ID родительского комбо-продукта
    productId: string; // ID дочернего продукта, входящего в набор
    variantId?: string; // Опционально: если привязан конкретный размер/объем
    quantity: number; // Количество штук в наборе

    // При полной сборке объекта бэкендом здесь может быть сам продукт
    //sourceProduct?: IProduct;
}

export interface ProductBaseData {
    id?: string;
    name?: IMLString;
    type?: ProductType;
    isPublic: boolean;

    description?: IMLString;
    batchPrefix?: string;
    chapters?: IMLString[];
    priority?: number;
    standardDose?: number;
    units?: IMLString;

    photos?: IPhoto[];
    tags?: ITag[];

    caloriesKcal?: number;
    fatGrams?: number;
    proteinGrams?: number;
    carbohydratesGrams?: number;
    sugarsGrams?: number;
    fiberGrams?: number;
    saltGrams?: number;

    variants: IProductVariant[];
    modifierGroups?: CreateProductModifierGroupInput[];
    // СВЯЗИ ДЛЯ КОМБО-НАБОРОВ
    comboItems?: IComboItem[]; // <-- Если type === COMBO, тут будет массив компонентов
    includedInCombos?: IComboItem[]; // Список комбо, в которые входит этот товар (опционально для аналитики)
}

export interface PublicProductData extends ProductBaseData {
    stock: number;
    reserved: number;
}

export interface CreateProductInput extends ProductBaseData {}

export interface UpdateProductInput extends ProductBaseData {
    id: string;
}
// Интерфейсы входных данных из GraphQL-схемы
export interface UpdateLocationVariantInput {
    locationId: string;
    variantId: string;
    individualPrice: number;
    legalEntityPrice?: number | null;
    individualDiscounts?: { threshold: number; discount: number }[];
    legalDiscounts?: { threshold: number; discount: number }[];
    stock: number;
    isAvailable: boolean;
}

export interface UpdateLocationModifierInput {
    modifierId: string;
    individualPrice: number;
    legalEntityPrice?: number | null;
    isAvailable: boolean;
}

export interface UpdateLocationProductConfigArgs {
    input: {
        locationId: string;
        productId: string;
        isPublicInLocation?: boolean;
        variants: UpdateLocationVariantInput[];
        modifiers?: UpdateLocationModifierInput[];
    };
}

// 1. Интерфейс для создания конкретного модификатора (топпинга)
export interface CreateProductModifierInput {
    name: IMLString; // Например: "Двойной сыр", "Острый халапеньо"
    weight?: number; // Опциональный вес модификатора
    weightUnit?: string; // Опциональная единица веса ("g", "kg")
}

// 2. Интерфейс для создания группы модификаторов
export interface CreateProductModifierGroupInput {
    title: IMLString; // Например: "Выберите соус", "Дополнительные топпинги"
    isRequired: boolean; // Обязателен ли выбор в этой группе
    minSelect: number; // Минимальное количество для выбора (обычно 0 или 1)
    maxSelect: number; // Максимальное количество для выбора (например, 1 для радио-кнопок или 5 для чекбоксов)
    modifiers: CreateProductModifierInput[]; // Массив модификаторов, входящих в группу
}

// 3. Интерфейс для создания варианта продукта (до кучи, если его тоже не было в TS)
export interface CreateProductVariantInput {
    sku?: string;
    label: IMLString; // Например: "30 см", "500 г"
    isWeightBased: boolean;
    weight: number;
    weightUnit: string;
}
