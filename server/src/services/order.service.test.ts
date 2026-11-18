/// <reference types="vitest/globals" />
import type { GraphQLContext } from '../types/types';

const mocks = vi.hoisted(() => ({
    authorize: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    sendLocationManagers: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
    prisma: {
        order: {
            updateMany: mocks.updateMany,
            findUnique: mocks.findUnique,
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
                deliveryAddress: 'Knez Mihailova 1, Belgrade',
                deliveryLocation: { lat: 44.8176, lon: 20.4569 },
                deliveryFee: 25,
                totalPrice: { increment: 25 },
                notes: 'Call on arrival',
            },
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
