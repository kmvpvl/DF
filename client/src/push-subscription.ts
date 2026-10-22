function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  // Возвращаем чистый ArrayBuffer
  return outputArray.buffer as ArrayBuffer; 
}

export async function subscribeUserToPush() {
  // Проверяем, запущено ли как PWA (standalone)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                       || (window.navigator as any).standalone;

  if (!isStandalone) {
    alert("Для включения уведомлений на iOS сначала добавьте приложение на экран 'Домой' через меню 'Поделиться'!");
    return;
  }

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      // 1. Регистрируем SW
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // 2. Запрашиваем права (строго по клику!)
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.error('Права на уведомления не получены');
        return;
      }

      // 3. Получаем публичный VAPID-ключ от вашего Node.js бэкенда
      const VAPID_PUBLIC_KEY = import.meta.env.VITE_PUBLIC_VAPID_KEY;
      
      // 4. Подписываемся в Apple Push Service (APNs) через браузерный API
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log(subscription);

      // 5. Отправляем объект подписки (JSON) на ваш Node.js сервер
      await fetch('https://zs8gr03s-5000.euw.devtunnels.ms/api/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' }
      });

      alert('Уведомления успешно настроены!');
    } catch (error) {
      console.error('Ошибка подписки:', error);
    }
  }
}
