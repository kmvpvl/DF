self.addEventListener('push', (event) => {
  let data = { title: 'Новое уведомление', body: '', url: '/' };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (_error) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/assets/brand/logos/logo.png',
    badge: '/assets/brand/logos/logo.png',
    tag: 'dolceforte-notification',
    renotify: true,
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  const target = new URL(targetUrl, self.location.origin).href;
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          const matchingClient = clientList.find((client) =>
            new URL(client.url).origin === self.location.origin
          );
          if (matchingClient) {
            return matchingClient.navigate(target).then((client) =>
              client ? client.focus() : undefined
            );
          }
          return clientList[0].focus();
        }
        return clients.openWindow(target);
      })
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
