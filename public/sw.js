// Service Worker oficial para Notificaciones Push y PWA en Taxflow / Contabilízate
self.addEventListener('push', function (event) {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch (e) {
    data = { title: 'Contabilízate', body: event.data.text() }
  }

  const title = data.title || data.Title || 'Contabilízate'
  const origin = self.location.origin
  let iconPath = data.iconUrl || data.IconUrl || '/Conta.png'
  if (!iconPath || iconPath.includes('icon.svg') || iconPath.includes('placeholder')) {
    iconPath = '/Conta.png'
  }
  if (iconPath.startsWith('/')) {
    iconPath = origin + iconPath
  }

  let badgePath = '/icon-light-32x32.png'
  if (badgePath.startsWith('/')) {
    badgePath = origin + badgePath
  }

  const options = {
    body: data.body || data.Body || '',
    icon: iconPath,
    image: data.imageUrl || data.ImageUrl || undefined,
    data: {
      url: data.actionUrl || data.ActionUrl || '/dashboard',
    },
    badge: badgePath,
    vibrate: [100, 50, 100],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  let targetUrl = event.notification.data?.url || '/dashboard'

  if (targetUrl.startsWith('/') || targetUrl.includes('app.contabilizate.com')) {
    const path = targetUrl.startsWith('/') ? targetUrl : '/dashboard'
    targetUrl = self.location.origin + path
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then(function (focusedClient) {
            if (focusedClient && 'navigate' in focusedClient && targetUrl) {
              return focusedClient.navigate(targetUrl)
            }
          })
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
