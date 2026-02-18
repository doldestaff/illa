self.addEventListener('push', function (event) {
    if (!event.data) return;

    const data = event.data.json();
    const title = data.title || 'Novidade ILLA';
    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: data.data || {}
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // If notification has a URL in data
            const urlToOpen = event.notification.data.url || '/members/notifications';

            // Check if already open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
