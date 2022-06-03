/* eslint-disable no-restricted-globals */
// Custom Service worker

self.addEventListener('push', event => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.description,
    icon: data.icon
  }) 
})