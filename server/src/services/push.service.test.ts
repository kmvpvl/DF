/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
    createTransport: vi.fn(),
    sendMail: vi.fn(),
    sendNotification: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
}));

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
        },
    },
}));

import { PushService } from './push.service';

describe('PushService notifications', () => {
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
            expect.stringContaining('/customer/Orders/order-1')
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
            expect.stringContaining('Заказ №1002 готов.')
        );
    });
});
