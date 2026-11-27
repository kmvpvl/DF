import { PublicProductData } from '@df/types/product';

export const OrderStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  READY: 'READY',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export interface IOrder {
    id?: string;
    number?: string;
    numberInt?: number;
    customerName?: string;
    customerUserId?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    orderDate?: Date | null;
    orderDateReady?: Date | null;
    status: OrderStatus;
    totalPrice?: number;
    deliveryFee?: number;
    deliveryLocation?: { lat?: number; lon?: number } | null;
    isPaid?: boolean;
    paymentMethod?: string | null;
    deliveryAddress?: string | null;
    shippingMethod?: string | null;
    trackingNumber?: string | null;
    managerId?: string | null;
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    locationId?: string;

    // Опциональные связи (Relations), если они загружаются через include
    products: IOrderProduct[];
}

export interface IOrderProduct {
    id?: string;
    orderId?: string;
    productId: string;
    quantity: number; // В Prisma Float — в JS это number
    dateReady?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    sortOrder?: number;
    product?: PublicProductData;
    variantLabel?: string;
    price?: number;
}

// Данные для создания нового заказа (фронтенд отправляет на бэкенд)
export interface CreateOrderProductInput {
    id?: string;
    orderId?: string;
    productId: string;
    quantity: number; // В Prisma Float — в JS это number
    dateReady?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    sortOrder?: number;
    variantLabel?: string | null;
    price?: number;

    // Опциональные связи
    order?: IOrder;
    product?: any; // Замените на ваш интерфейс ProductServer
}
export interface CreateOrderInput {
    id?: string;
    number?: string;
    numberInt?: number;
    customerName?: string;
    customerUserId: string | null;
    orderDate?: Date | null;
    orderDateReady?: Date | null;
    status: OrderStatus;
    totalPrice?: number;
    isPaid?: boolean;
    paymentMethod?: string | null;
    deliveryAddress?: string | null;
    shippingMethod?: string | null;
    trackingNumber?: string | null;
    managerId?: string | null;
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    locationId?: string;

    // Опциональные связи (Relations), если они загружаются через include
    location?: any; // Замените на ваш интерфейс LocationServer
    // Массив продуктов для создания связи nested write в Prisma
    products: CreateOrderProductInput[];
}

// Данные для обновления существующего заказа
export type UpdateOrderInput = Partial<Omit<CreateOrderInput, 'products'>> & {
    status?: OrderStatus;
    isPaid?: boolean;
    trackingNumber?: string | null;
    managerId?: string | null;
    orderDateReady?: string | null;
};
