import webpush from 'web-push';
import { vapidKeys } from './common.js';
// Инициализируем web-push. Обязательно укажите mailto: (требование протокола)
if (vapidKeys.publicKey && vapidKeys.privateKey) {
    const configuredSubject =
        process.env.PUSH_VAPID_SUBJECT ||
        process.env.SMTP_USER ||
        'mailto:admin@dolceforte.rs';
    const vapidSubject = /^mailto:/i.test(configuredSubject)
        ? configuredSubject
        : /^https?:\/\//i.test(configuredSubject)
          ? configuredSubject
          : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(configuredSubject)
            ? `mailto:${configuredSubject}`
            : 'mailto:admin@dolceforte.rs';

    webpush.setVapidDetails(
        vapidSubject,
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );
}
/*
// Эндпоинт сохранения подписки с фронтенда
app.post('/api/subscribe', (req, res) => {
  const subscription: webpush.PushSubscription = req.body;
  
  // Сохраняем (в проде нужно привязывать к ID конкретного пользователя в БД)
  subscriptions.push(subscription);
  console.log(subscriptions);
  
  res.status(201).json({ success: true });
});

// Триггер отправки (например, событие в системе)
app.get('/api/send-notification', async (req, res) => {

  const notificationPayload = JSON.stringify({
    title: 'Привет с бэкенда!',
    body: 'Это пуш-уведомление для iOS PWA',
    url: '/tool/Orders/<uid>' // Кастомное поле для роутинга
  });

  const promises = subscriptions.map(sub => 
    webpush.sendNotification(sub, notificationPayload)
      .catch(err => {
        // Если статус 410 (Gone) или 404 — подписка больше не валидна (удалили PWA)
        if (err.statusCode === 410 || err.statusCode === 404) {
          subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
        }
        console.error('Ошибка отправки пуша:', err);
      })
  );

  await Promise.all(promises);
  res.json({ message: 'Рассылка запущена' });
});

// очистка мертвых полписок
try {
  await webpush.sendNotification(subscription, payload);
} catch (err: any) {
  // Статусы 410 (Gone) и 404 (Not Found) означают, что подписка умерла навсегда
  if (err.statusCode === 410 || err.statusCode === 404) {
    console.log('Подписка недействительна. Удаляем из БД...');
    // Здесь ваш код удаления sub из вашей базы данных (PostgreSQL, MongoDB и т.д.)
    subscriptions = subscriptions.filter(s => s.endpoint !== subscription.endpoint);
  } else {
    console.error('Другая ошибка отправки:', err);
  }
}

// push---------------
*/
