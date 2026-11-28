/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
    createTransport: vi.fn(),
    sendMail: vi.fn(),
    sendNotification: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
}));

process.env.PUBLIC_VAPID_KEY =
    'BLQ3s8vSmQmVAPID_TEST_PUBLIC_KEY_abcdefghijklmnop';
process.env.PRIVATE_VAPID_KEY = 'test-private-vapid-key';

vi.mock('nodemailer', () => ({
    default: { createTransport: mocks.createTransport },
}));
vi.mock('web-push', () => ({
    default: {
        setVapidDetails: vi.fn(),
        sendNotification: mocks.sendNotification,
    },
}));
vi.mock('../lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: mocks.findUnique,
            findFirst: mocks.findFirst,
            update: mocks.update,
        },
    },
}));

import { PushService } from './push.service.js';
import type { GraphQLContext } from '../index.js';

describe('PushService notifications', () => {
    const ctx = {
        req: { session: { userId: 'user-1' } },
    } as unknown as GraphQLContext;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('SMTP_HOST', 'smtp.example.com');
        vi.stubEnv('SMTP_PORT', '587');
        vi.stubEnv('SMTP_USER', 'mailer@example.com');
        vi.stubEnv('SMTP_PASS', 'password');
        vi.stubEnv('SMTP_FROM', 'DolceForte <mailer@example.com>');
        mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail });
        mocks.sendMail.mockResolvedValue(undefined);
        mocks.sendNotification.mockResolvedValue(undefined);
        mocks.findUnique.mockResolvedValue({
            email: 'customer@example.com',
            lang: 'ru',
            pushSubscription: { endpoint: 'https://push.example.com' },
        });
        mocks.findFirst.mockResolvedValue({
            lang: 'ru',
            pushSubscription: { endpoint: 'https://push.example.com' },
        });
        mocks.update.mockResolvedValue({ id: 'user-1' });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('sends contact emails through the service', async () => {
        vi.stubEnv('CONTACT_EMAIL_TO', 'contact@example.com');

        await PushService.sendContactEmail({
            type: 'FEEDBACK',
            name: 'Customer',
            email: 'customer@example.com',
            phone: '+381123456',
            subject: 'Question',
            message: 'Please contact me.',
        });

        expect(mocks.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'contact@example.com',
                subject: '[FEEDBACK] Question',
                replyTo: 'customer@example.com',
                text: expect.stringContaining('Please contact me.'),
            })
        );
    });

    it('sends push notifications to every registered device', async () => {
        mocks.findFirst.mockResolvedValue({
            id: 'user-1',
            lang: 'ru',
            pushSubscription: [
                { endpoint: 'https://push.example.com/device-1' },
                { endpoint: 'https://push.example.com/device-2' },
            ],
        });

        await PushService.send(
            'user-1',
            { title: 'Title', body: 'Body' },
            '/customer/Orders/order-1'
        );

        expect(mocks.sendNotification).toHaveBeenCalledTimes(2);
        expect(mocks.sendNotification).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                endpoint: 'https://push.example.com/device-1',
            }),
            expect.any(String),
            expect.any(Object)
        );
        expect(mocks.sendNotification).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                endpoint: 'https://push.example.com/device-2',
            }),
            expect.any(String),
            expect.any(Object)
        );
    });

    it('adds a device subscription without discarding the legacy subscription', async () => {
        mocks.findFirst.mockResolvedValue({
            pushSubscription: { endpoint: 'https://push.example.com/old' },
        });
        const newSubscription = {
            endpoint: 'https://push.example.com/new',
            keys: { p256dh: 'public-key', auth: 'auth-key' },
        };

        await PushService.saveSubscription(ctx, newSubscription);

        expect(mocks.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'user-1', blocked: false },
                data: {
                    pushSubscription: [
                        { endpoint: 'https://push.example.com/old' },
                        newSubscription,
                    ],
                },
            })
        );
    });

    it('removes only the requested device subscription', async () => {
        mocks.findFirst.mockResolvedValue({
            pushSubscription: [
                { endpoint: 'https://push.example.com/keep' },
                { endpoint: 'https://push.example.com/remove' },
            ],
        });

        await PushService.removeSubscription(
            ctx,
            'https://push.example.com/remove'
        );

        expect(mocks.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'user-1', blocked: false },
                data: {
                    pushSubscription: [
                        { endpoint: 'https://push.example.com/keep' },
                    ],
                },
            })
        );
    });

    it('sends new order emails through the service', async () => {
        await PushService.sendNewOrderEmail({
            customerName: 'Customer',
            customerEmail: 'customer@example.com',
            customerPhone: '+381123456',
            deliveryAddress: 'Main Street 1',
            paymentMethod: 'CARD',
            shippingMethod: 'COURIER',
            distanceMeters: 1200,
            deliveryCost: 25,
            currencySymbol: 'din',
            orderLines: ['1. Cake'],
            productsSubtotal: 100,
            note: 'Call on arrival',
        });

        expect(mocks.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'sales@dolceforte.rs',
                subject: '[ORDER] Customer',
                replyTo: 'customer@example.com',
                text: expect.stringContaining('Total: 125.00 din'),
            })
        );
        expect(mocks.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                text: expect.stringContaining('Payment method: CARD'),
            })
        );
        expect(mocks.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                text: expect.stringContaining('Shipping method: COURIER'),
            })
        );
    });

    it('sends localized customer order status email and push notifications', async () => {
        const result = await PushService.notifyCustomerOrderStatus(
            {
                id: 'order-1',
                number: '1001',
                customerUserId: 'customer-1',
                customerEmail: 'customer@example.com',
            },
            'cancelled'
        );

        expect(result).toEqual({ emailSent: true, pushSent: true });
        expect(mocks.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'customer@example.com',
                subject: 'Заказ №1001 отменён',
                text: 'Ваш заказ №1001 отменён.',
            })
        );
        expect(mocks.sendNotification).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining('/customer/Orders/order-1'),
            expect.objectContaining({
                TTL: 24 * 60 * 60,
                urgency: 'normal',
            })
        );
    });

    it('sends a ready notification by email and push', async () => {
        const result = await PushService.notifyCustomerOrderStatus(
            {
                id: 'order-2',
                number: '1002',
                customerUserId: 'customer-1',
                customerEmail: 'customer@example.com',
            },
            'ready'
        );

        expect(result).toEqual({ emailSent: true, pushSent: true });
        expect(mocks.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: 'Заказ №1002 готов',
                text: 'Ваш заказ №1002 готов.',
            })
        );
        expect(mocks.sendNotification).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining('Заказ №1002 готов.'),
            expect.objectContaining({
                TTL: 24 * 60 * 60,
                urgency: 'normal',
            })
        );
    });
});
