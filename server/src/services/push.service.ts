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

        if (lang === undefined) {
            if (!user.lang) {
                lang = user.lang ?? undefined;
            }
        }

        const notificationPayload = JSON.stringify({
            title: new MLString(message.title).toString(lang),
            body: new MLString(message.body).toString(lang),
            url: url, // Кастомное поле для роутинга
        });

        const push = await Promise.all([
            webpush
                .sendNotification(
                    user.pushSubscription as unknown as webpush.PushSubscription,
                    notificationPayload
                )
                .catch((err) => {
                    // Если статус 410 (Gone) или 404 — подписка больше не валидна (удалили PWA)
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        //subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
                    }
                    console.error('Ошибка отправки пуша:', err);
                }),
        ]);
    }
    static async sendLocationManagers(
        ctx: GraphQLContext,
        message: IPushMessage,
        url: string
    ) {
        const users = await CompanyService.locationManagers(ctx);
        users.forEach((user) => {
            try {
                this.send(user.userId, message, url);
            } catch (err) {}
        });
    }
}
