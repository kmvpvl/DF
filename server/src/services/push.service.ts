import { IMLString, MLString } from '../lib/mlstring';
import { prisma } from '../lib/prisma';
import webpush from 'web-push';
import { vapidKeys } from '../utils/common';
import { GraphQLContext } from '../types/types';
import { IPushMessage } from '../types/pushes';
import { CompanyService } from './company.service';
// Инициализируем web-push. Обязательно укажите mailto: (требование протокола)
webpush.setVapidDetails(
    'mailto:admin@dolceforte.rs',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

export class PushService {
    static async send(
        toUserId: string,
        message: IPushMessage,
        url: string,
        lang?: string
    ) {
        const user = await prisma.user.findFirst({
            where: { id: toUserId },
            select: {
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

        await webpush.sendNotification(
            user.pushSubscription as unknown as webpush.PushSubscription,
            notificationPayload
        );
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
