import { IMLString, MLString } from '../lib/mlstring';
import { prisma } from '../lib/prisma';
import nodemailer, { Transporter } from 'nodemailer';
import webpush from 'web-push';
import { Prisma } from '@prisma/client';
import { vapidKeys } from '../utils/common';
import { GraphQLContext } from '../types/types';
import { IPushMessage } from '../types/pushes';
import { CompanyService } from './company.service';
// Инициализируем web-push. Обязательно укажите mailto: (требование протокола)
function normalizeVapidSubject(subject?: string): string {
    const normalized = subject?.trim();
    if (!normalized) return 'mailto:admin@dolceforte.rs';
    if (/^mailto:/i.test(normalized)) return normalized;
    if (/^https?:\/\//i.test(normalized)) return normalized;
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
        return `mailto:${normalized}`;
    }
    return 'mailto:admin@dolceforte.rs';
}

const vapidSubject = normalizeVapidSubject(
    process.env.PUSH_VAPID_SUBJECT ||
        process.env.SMTP_USER ||
        'mailto:admin@dolceforte.rs'
);

if (vapidKeys.publicKey && vapidKeys.privateKey) {
    webpush.setVapidDetails(
        vapidSubject,
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );
}

function configureVapidDetails(): void {
    const publicVapidKey = process.env.PUBLIC_VAPID_KEY || vapidKeys.publicKey;
    const privateVapidKey =
        process.env.PRIVATE_VAPID_KEY || vapidKeys.privateKey;
    if (!publicVapidKey || !privateVapidKey) {
        throw new Error(
            'VAPID keys are not configured. Set PUBLIC_VAPID_KEY and PRIVATE_VAPID_KEY.'
        );
    }
    webpush.setVapidDetails(
        normalizeVapidSubject(
            process.env.PUSH_VAPID_SUBJECT ||
                process.env.SMTP_USER ||
                'mailto:admin@dolceforte.rs'
        ),
        publicVapidKey,
        privateVapidKey
    );
}

export class PushService {
    private static smtpTransporter: Transporter | null = null;

    private static getSmtpTransporter(): Transporter {
        if (this.smtpTransporter) {
            return this.smtpTransporter;
        }

        const host = process.env.SMTP_HOST;
        const port = Number.parseInt(process.env.SMTP_PORT ?? '587', 10);
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const secure = ['1', 'true', 'yes'].includes(
            process.env.SMTP_SECURE?.trim().toLowerCase() ?? ''
        );
        if (!host || !Number.isFinite(port) || !user || !pass) {
            throw new Error(
                'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.'
            );
        }

        this.smtpTransporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
        });
        return this.smtpTransporter;
    }

    static async sendEmail(
        to: string,
        subject: string,
        text: string,
        replyTo?: string
    ) {
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;
        if (!from) {
            throw new Error(
                'SMTP sender is not configured. Set SMTP_FROM or SMTP_USER.'
            );
        }
        await this.getSmtpTransporter().sendMail({
            from,
            to,
            subject,
            text,
            replyTo,
        });
    }

    static async sendContactEmail(input: {
        type: 'FEEDBACK' | 'FREE_TEST_BATCH';
        name: string;
        email?: string;
        phone?: string;
        subject: string;
        message: string;
    }) {
        const recipient =
            input.type === 'FREE_TEST_BATCH'
                ? process.env.SMTP_TO_FREE_ORDER || process.env.CONTACT_EMAIL_TO
                : process.env.SMTP_TO_FEEDBACK || process.env.CONTACT_EMAIL_TO;
        if (!recipient) {
            throw new Error(
                'Email routing is not configured. Set CONTACT_EMAIL_TO or SMTP_TO_*.'
            );
        }
        const prefix = process.env.EMAIL_SUBJECT_PREFIX?.trim();
        await this.sendEmail(
            recipient,
            `${prefix ? `${prefix} ` : ''}[${input.type}] ${input.subject}`,
            [
                `Type: ${input.type}`,
                `Name: ${input.name}`,
                `Email: ${input.email || '-'}`,
                `Phone: ${input.phone || '-'}`,
                '',
                input.message,
            ].join('\n'),
            input.email
        );
    }

    static async sendNewOrderEmail(input: {
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        deliveryAddress: string;
        paymentMethod: string;
        shippingMethod: string;
        distanceMeters: number | null;
        deliveryCost: number;
        currencySymbol: string;
        sessionUserId?: string;
        sessionUserEntityType?: string;
        orderLines: string[];
        productsSubtotal: number;
        note?: string;
    }) {
        const recipient = process.env.SMTP_TO_ORDER || 'sales@dolceforte.rs';
        const prefix = process.env.EMAIL_SUBJECT_PREFIX?.trim();
        await this.sendEmail(
            recipient,
            `${prefix ? `${prefix} ` : ''}[ORDER] ${input.customerName}`,
            [
                'New DolceForte order',
                '',
                `Customer name: ${input.customerName}`,
                `Customer email: ${input.customerEmail}`,
                `Customer phone: ${input.customerPhone}`,
                `Delivery address: ${input.deliveryAddress}`,
                `Shipping method: ${input.shippingMethod}`,
                `Payment method: ${input.paymentMethod}`,
                `Delivery distance: ${
                    input.distanceMeters == null
                        ? '-'
                        : `${(input.distanceMeters / 1000).toFixed(2)} km`
                }`,
                `Estimated delivery cost: ${input.deliveryCost.toFixed(2)} ${input.currencySymbol}`,
                `Session user id: ${input.sessionUserId ?? '-'}`,
                `Session user entity type: ${input.sessionUserEntityType ?? '-'}`,
                '',
                'Order items:',
                ...input.orderLines,
                '',
                `Products subtotal: ${input.productsSubtotal.toFixed(2)} din`,
                `Delivery fee: ${input.deliveryCost.toFixed(2)} ${input.currencySymbol}`,
                `Total: ${(input.productsSubtotal + input.deliveryCost).toFixed(2)} din`,
                `Note: ${input.note || '-'}`,
            ].join('\n'),
            input.customerEmail
        );
    }

    static async notifyCustomerOrderStatus(
        order: {
            id: string;
            number: string;
            customerUserId: string | null;
            customerEmail: string | null;
        },
        status: 'accepted' | 'cancelled' | 'ready'
    ) {
        const message = this.getOrderStatusPushMessage(order.number, status);
        const customer = order.customerUserId
            ? await prisma.user
                  .findUnique({
                      where: { id: order.customerUserId },
                      select: {
                          email: true,
                          lang: true,
                          pushSubscription: true,
                      },
                  })
                  .catch((error: unknown) => {
                      console.error(
                          `Failed to load customer details for ${status} order ${order.id}:`,
                          error
                      );
                      return null;
                  })
            : null;
        const customerEmail =
            order.customerEmail?.trim() || customer?.email?.trim();
        const email = this.getOrderStatusEmail(order, status);
        const orderUrl = `${process.env.ORIGIN_CLIENT_URL}/customer/Orders/${encodeURIComponent(order.id)}`;

        const emailNotification = Promise.resolve().then(async () => {
            if (!customerEmail) {
                throw new Error('Customer email is not available');
            }
            await this.sendEmail(
                customerEmail,
                new MLString(email.subject).toString(
                    customer?.lang ?? undefined
                ),
                new MLString(email.text).toString(customer?.lang ?? undefined)
            );
        });
        const pushNotification = Promise.resolve().then(async () => {
            if (!order.customerUserId || !customer?.pushSubscription) {
                throw new Error('Customer has no push subscription');
            }
            await this.send(order.customerUserId, message, orderUrl);
        });
        const [emailResult, pushResult] = await Promise.allSettled([
            emailNotification,
            pushNotification,
        ]);
        if (emailResult.status === 'rejected') {
            console.error(
                `Failed to email customer about ${status} order ${order.id}:`,
                emailResult.reason
            );
        }
        if (pushResult.status === 'rejected') {
            console.error(
                `Failed to push ${status} order notification ${order.id}:`,
                pushResult.reason
            );
        }
        return {
            emailSent: emailResult.status === 'fulfilled',
            pushSent: pushResult.status === 'fulfilled',
        };
    }

    private static getOrderStatusPushMessage(
        orderNumber: string,
        status: 'accepted' | 'cancelled' | 'ready'
    ): IPushMessage {
        if (status === 'accepted') {
            return {
                title: {
                    default: 'Order accepted',
                    ts: {
                        de: 'Bestellung angenommen',
                        fr: 'Commande acceptée',
                        es: 'Pedido aceptado',
                        ru: 'Заказ принят',
                        it: 'Ordine accettato',
                        sr: 'Porudžbina je prihvaćena',
                    },
                },
                body: {
                    default: `Your order #${orderNumber} is being prepared.`,
                    ts: {
                        de: `Ihre Bestellung Nr. ${orderNumber} wird vorbereitet.`,
                        fr: `Votre commande n° ${orderNumber} est en préparation.`,
                        es: `Tu pedido n.º ${orderNumber} está en preparación.`,
                        ru: `Заказ №${orderNumber} принят и готовится.`,
                        it: `Il tuo ordine n. ${orderNumber} è in preparazione.`,
                        sr: `Vaša porudžbina br. ${orderNumber} je u pripremi.`,
                    },
                },
            };
        }
        if (status === 'cancelled') {
            return {
                title: {
                    default: 'Order cancelled',
                    ts: {
                        de: 'Bestellung storniert',
                        fr: 'Commande annulée',
                        es: 'Pedido cancelado',
                        ru: 'Заказ отменён',
                        it: 'Ordine annullato',
                        sr: 'Porudžbina je otkazana',
                    },
                },
                body: {
                    default: `Your order #${orderNumber} has been cancelled.`,
                    ts: {
                        de: `Ihre Bestellung Nr. ${orderNumber} wurde storniert.`,
                        fr: `Votre commande n° ${orderNumber} a été annulée.`,
                        es: `Tu pedido n.º ${orderNumber} ha sido cancelado.`,
                        ru: `Заказ №${orderNumber} отменён.`,
                        it: `Il tuo ordine n. ${orderNumber} è stato annullato.`,
                        sr: `Vaša porudžbina br. ${orderNumber} je otkazana.`,
                    },
                },
            };
        }
        return {
            title: {
                default: 'Order ready',
                ts: {
                    de: 'Bestellung ist fertig',
                    fr: 'Commande prête',
                    es: 'Pedido listo',
                    ru: 'Заказ готов',
                    it: 'Ordine pronto',
                    sr: 'Porudžbina je spremna',
                },
            },
            body: {
                default: `Your order #${orderNumber} is ready.`,
                ts: {
                    de: `Ihre Bestellung Nr. ${orderNumber} ist fertig.`,
                    fr: `Votre commande n° ${orderNumber} est prête.`,
                    es: `Tu pedido n.º ${orderNumber} está listo.`,
                    ru: `Заказ №${orderNumber} готов.`,
                    it: `Il tuo ordine n. ${orderNumber} è pronto.`,
                    sr: `Vaša porudžbina br. ${orderNumber} je spremna.`,
                },
            },
        };
    }

    private static getOrderStatusEmail(
        order: {
            id: string;
            number: string;
            customerUserId: string | null;
            customerEmail: string | null;
        },
        status: 'accepted' | 'cancelled' | 'ready'
    ): { subject: IMLString; text: IMLString } {
        const orderLink = `${process.env.ORIGIN_CLIENT_URL}/customer/Orders/${encodeURIComponent(order.id)}`;
        if (status === 'accepted') {
            return {
                subject: {
                    default: `Order #${order.number} accepted\n ${orderLink}`,
                    ts: {
                        de: `Bestellung Nr. ${order.number} angenommen\n ${orderLink}`,
                        fr: `Commande n° ${order.number} acceptée\n ${orderLink}`,
                        es: `Pedido n.º ${order.number} aceptado\n ${orderLink}`,
                        ru: `Заказ №${order.number} принят\n ${orderLink}`,
                        it: `Ordine n. ${order.number} accettato\n ${orderLink}`,
                        sr: `Porudžbina br. ${order.number} je prihvaćena\n ${orderLink}`,
                    },
                },
                text: {
                    default: `Your order #${order.number} has been accepted and is being prepared.\n ${orderLink}`,
                    ts: {
                        de: `Ihre Bestellung Nr. ${order.number} wurde angenommen und wird vorbereitet.\n ${orderLink}`,
                        fr: `Votre commande n° ${order.number} a été acceptée et est en préparation.\n ${orderLink}`,
                        es: `Tu pedido n.º ${order.number} ha sido aceptado y está en preparación.\n ${orderLink}`,
                        ru: `Ваш заказ №${order.number} принят и передан в приготовление.\n ${orderLink}`,
                        it: `Il tuo ordine n. ${order.number} è stato accettato ed è in preparazione.\n ${orderLink}`,
                        sr: `Vaša porudžbina br. ${order.number} je prihvaćena i u pripremi.\n ${orderLink}`,
                    },
                },
            };
        }
        if (status === 'ready') {
            return {
                subject: {
                    default: `Order #${order.number} is ready\n ${orderLink}`,
                    ts: {
                        de: `Bestellung Nr. ${order.number} ist fertig\n ${orderLink}`,
                        fr: `Commande n° ${order.number} prête\n ${orderLink}`,
                        es: `Pedido n.º ${order.number} listo\n ${orderLink}`,
                        ru: `Заказ №${order.number} готов\n ${orderLink}`,
                        it: `Ordine n. ${order.number} pronto\n ${orderLink}`,
                        sr: `Porudžbina br. ${order.number} je spremna\n ${orderLink}`,
                    },
                },
                text: {
                    default: `Your order #${order.number} is ready.\n ${orderLink}`,
                    ts: {
                        de: `Ihre Bestellung Nr. ${order.number} ist fertig.\n ${orderLink}`,
                        fr: `Votre commande n° ${order.number} est prête.\n ${orderLink}`,
                        es: `Tu pedido n.º ${order.number} está listo.\n ${orderLink}`,
                        ru: `Ваш заказ №${order.number} готов.\n ${orderLink}`,
                        it: `Il tuo ordine n. ${order.number} è pronto.\n ${orderLink}`,
                        sr: `Vaša porudžbina br. ${order.number} je spremna.\n ${orderLink}`,
                    },
                },
            };
        }
        return {
            subject: {
                default: `Order #${order.number} cancelled\n ${orderLink}`,
                ts: {
                    de: `Bestellung Nr. ${order.number} storniert\n ${orderLink}`,
                    fr: `Commande n° ${order.number} annulée\n ${orderLink}`,
                    es: `Pedido n.º ${order.number} cancelado\n ${orderLink}`,
                    ru: `Заказ №${order.number} отменён\n ${orderLink}`,
                    it: `Ordine n. ${order.number} annullato\n ${orderLink}`,
                    sr: `Porudžbina br. ${order.number} je otkazana\n ${orderLink}`,
                },
            },
            text: {
                default: `Your order #${order.number} has been cancelled.\n ${orderLink}`,
                ts: {
                    de: `Ihre Bestellung Nr. ${order.number} wurde storniert.\n ${orderLink}`,
                    fr: `Votre commande n° ${order.number} a été annulée.\n ${orderLink}`,
                    es: `Tu pedido n.º ${order.number} ha sido cancelado.\n ${orderLink}`,
                    ru: `Ваш заказ №${order.number} отменён.\n ${orderLink}`,
                    it: `Il tuo ordine n. ${order.number} è stato annullato.\n ${orderLink}`,
                    sr: `Vaša porudžbina br. ${order.number} je otkazana.\n ${orderLink}`,
                },
            },
        };
    }

    static async send(
        toUserId: string,
        message: IPushMessage,
        url: string,
        lang?: string
    ) {
        configureVapidDetails();
        const user = await prisma.user.findFirst({
            where: { id: toUserId, blocked: false },
            select: {
                id: true,
                pushSubscription: true,
                lang: true,
            },
        });
        if (!user) throw Error(`User id = "${toUserId} not found`);
        if (!user.pushSubscription)
            throw Error(`User id = "${toUserId}" has no subscription`);

        if (lang === undefined) lang = user.lang ?? undefined;

        const notificationPayload = JSON.stringify({
            title: new MLString(message.title).toString(lang),
            body: new MLString(message.body).toString(lang),
            url: url, // Кастомное поле для роутинга
        });

        try {
            await webpush.sendNotification(
                user.pushSubscription as unknown as webpush.PushSubscription,
                notificationPayload,
                {
                    TTL: 24 * 60 * 60,
                    urgency: 'normal',
                }
            );
        } catch (error: unknown) {
            const statusCode =
                typeof error === 'object' &&
                error !== null &&
                'statusCode' in error
                    ? Number((error as { statusCode?: unknown }).statusCode)
                    : undefined;

            if (statusCode === 404 || statusCode === 410) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { pushSubscription: Prisma.JsonNull },
                });
            }
            throw error;
        }
    }
    static async sendLocationManagers(
        ctx: GraphQLContext,
        message: IPushMessage,
        url: string
    ) {
        try {
            const users = await CompanyService.locationManagers(ctx);
            const recipients = users.filter((user) =>
                Boolean(user.user.pushSubscription)
            );
            const results = await Promise.allSettled(
                recipients.map((user) => this.send(user.userId, message, url))
            );
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(
                        `Push delivery failed for location user ${recipients[index].userId}:`,
                        result.reason
                    );
                }
            });
        } catch (error: unknown) {
            console.error(
                'Failed to send push notifications to location managers:',
                error
            );
        }
    }
}
