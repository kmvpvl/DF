import { PublicProductData } from './Products';

export const OrderStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  READY: 'READY',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface IOrder {
  id?: string;
  number?: string;
  numberInt?: number;
  customerName?: string;
  customerUserId?: string | null;
  orderDate?: Date;
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
  variationLabel?: string;
}
