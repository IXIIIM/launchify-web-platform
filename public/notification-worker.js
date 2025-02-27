// public/notification-worker.js

self.addEventListener('push', function(event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
      return;
    }
  
    const data = event.data?.json() ?? {};
    const title = data.title || 'New Notification';
    const options = {
      body: data.body || '',
      icon: '/icons/notification-icon.png',
      badge: '/icons/notification-badge.png',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      renotify: data.renotify || false,
      timestamp: data.timestamp || Date.now()
    };
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
  
    const urlToOpen = new URL(
      event.notification.data.url || '/',
      self.location.origin
    ).href;
  
    // Handle notification click actions
    if (event.action) {
      switch (event.action) {
        case 'view':
          event.waitUntil(
            clients.openWindow(urlToOpen)
          );
          break;
        case 'dismiss':
          // Just close the notification
          break;
        default:
          // Custom action handling
          event.waitUntil(
            handleCustomAction(event.action, event.notification.data)
          );
      }
    } else {
      // Default click behavior
      event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function(clientList) {
          // If a window tab is already open, focus it
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
      );
    }
  });
  
  self.addEventListener('notificationclose', function(event) {
    // Track notification dismissals if needed
    const dismissedNotification = event.notification;
    const notificationData = dismissedNotification.data;
  
    if (notificationData.trackDismissal) {
      fetch('/api/notifications/track-dismissal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId: notificationData.id,
          timestamp: Date.now()
        })
      }).catch(console.error);
    }
  });
  
  async function handleCustomAction(action, data) {
    try {
      const response = await fetch('/api/notifications/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      });
  
      if (!response.ok) throw new Error('Failed to handle notification action');
  
      const result = await response.json();
      
      // Handle any follow-up actions
      if (result.openWindow) {
        return clients.openWindow(result.openWindow);
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  }
  
  // Handle subscription updates
  self.addEventListener('pushsubscriptionchange', function(event) {
    event.waitUntil(
      self.registration.pushManager.subscribe({ userVisibleOnly: true })
        .then(function(subscription) {
          // Send the new subscription to your server
          return fetch('/api/notifications/update-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
          });
        })
    );
  });
  
  // Periodic sync for background updates
  self.addEventListener('periodicsync', function(event) {
    if (event.tag === 'update-notifications') {
      event.waitUntil(
        fetch('/api/notifications/sync')
          .then(response => response.json())
          .then(data => {
            if (data.notifications?.length > 0) {
              return Promise.all(
                data.notifications.map(notification =>
                  self.registration.showNotification(
                    notification.title,
                    notification.options
                  )
                )
              );
            }
          })
      );
    }
  });