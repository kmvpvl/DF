/// <reference types="vitest/globals" />
import type { GraphQLContext } from '../types/types';

const mocks = vi.hoisted(() => ({
    authorize: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findCustomers: vi.fn(),
    updateCustomer: vi.fn(),
    transaction: vi.fn(),
    sendLocationManagers: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
    prisma: {
        $transaction: mocks.transaction,
        order: {
            updateMany: mocks.updateMany,
            findUnique: mocks.findUnique,
            findFirst: mocks.findFirst,
            findMany: mocks.findMany,
        },
        user: {
            findMany: mocks.findCustomers,
            update: mocks.updateCustomer,
        },
    },
}));
vi.mock('../utils/auth', () => ({ authorize: mocks.authorize }));
vi.mock('./push.service', () => ({
    PushService: { sendLocationManagers: mocks.sendLocationManagers },
}));

import { OrderService } from './order.service';

describe('OrderService.confirmCustomerDraft', () => {
    const ctx = {
        userId: 'customer-1',
        locationId: 'location-1',
    } as GraphQLContext;
    const delivery = {
        customerName: 'Customer One',
        customerEmail: 'customer@example.com',
        customerPhone: '+381601234567',
        customerDeliveryAddress: 'Knez Mihailova 1, Belgrade',
        deliveryLat: 44.8176,
        deliveryLon: 20.4569,
        deliveryFee: 25,
        note: 'Call on arrival',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.authorize.mockResolvedValue(undefined);
        mocks.updateMany.mockResolvedValue({ count: 1 });
        mocks.updateCustomer.mockResolvedValue({ id: 'customer-1' });
        mocks.transaction.mockImplementation(async (operation) =>
            operation({
                order: { updateMany: mocks.updateMany },
                user: { update: mocks.updateCustomer },
            })
        );
        mocks.findUnique.mockResolvedValue({
            id: 'order-1',
            number: '2026-1',
        });
        mocks.sendLocationManagers.mockResolvedValue(undefined);
    });

    it('confirms only the current customer draft and notifies location managers', async () => {
        await OrderService.confirmCustomerDraft(ctx, 'order-1', delivery);

        expect(mocks.updateMany).toHaveBeenCalledWith({
            where: {
                id: 'order-1',
                customerUserId: 'customer-1',
                locationId: 'location-1',
                status: 'DRAFT',
            },
            data: {
                status: 'CONFIRMED',
                customerName: 'Customer One',
                customerEmail: 'customer@example.com',
                customerPhone: '+381601234567',
                deliveryAddress: 'Knez Mihailova 1, Belgrade',
                deliveryLocation: { lat: 44.8176, lon: 20.4569 },
                deliveryFee: 25,
                totalPrice: { increment: 25 },
                notes: 'Call on arrival',
            },
        });
        expect(mocks.updateCustomer).toHaveBeenCalledWith({
            where: { id: 'customer-1' },
            data: { phone: '+381601234567' },
        });
        expect(mocks.sendLocationManagers).toHaveBeenCalledWith(
            ctx,
            expect.objectContaining({
                title: expect.objectContaining({
                    default: 'New order received',
                }),
                body: expect.objectContaining({
                    default: 'Order #2026-1 from Customer One',
                }),
            }),
            '/tool/Orders/order-1'
        );
    });

    it('does not send a notification if the draft was already changed', async () => {
        mocks.updateMany.mockResolvedValue({ count: 0 });

        await expect(
            OrderService.confirmCustomerDraft(ctx, 'order-1', delivery)
        ).rejects.toThrow('Draft order not found or cannot be submitted');
        expect(mocks.sendLocationManagers).not.toHaveBeenCalled();
    });
});

describe('OrderService staff order access', () => {
    const ctx = {
        userId: 'staff-1',
        locationId: 'location-1',
    } as GraphQLContext;

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.authorize.mockResolvedValue(undefined);
        mocks.findMany.mockResolvedValue([
            {
                id: 'order-1',
                customerUserId: 'customer-1',
                customerEmail: null,
                customerPhone: null,
                products: [],
            },
        ]);
        mocks.findCustomers.mockResolvedValue([
            {
                id: 'customer-1',
                email: 'customer@example.com',
                phone: '+381601234567',
            },
        ]);
        mocks.updateMany.mockResolvedValue({ count: 1 });
        mocks.findFirst.mockResolvedValue({
            id: 'order-1',
            status: 'IN_PRODUCTION',
            products: [],
        });
    });

    it('limits staff order results to their current location and resolves customer contacts', async () => {
        const orders = await OrderService.getLocationOrders(ctx);

        expect(mocks.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { locationId: 'location-1' },
            })
        );
        expect(orders[0]).toMatchObject({
            customerEmail: 'customer@example.com',
            customerPhone: '+381601234567',
        });
    });

    it('moves only a confirmed order in the current location into production', async () => {
        const order = await OrderService.startProduction(ctx, 'order-1');

        expect(mocks.updateMany).toHaveBeenCalledWith({
            where: {
                id: 'order-1',
                locationId: 'location-1',
                status: 'CONFIRMED',
            },
            data: { status: 'IN_PRODUCTION' },
        });
        expect(order.status).toBe('IN_PRODUCTION');
    });
});
