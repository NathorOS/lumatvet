// Service worker de Lumatvet: guarda la "cáscara" de la app (esta página, el manifest y los íconos)
// para que abra rápido y muestre el aviso de "sin conexión" aunque no haya señal.
// La app en sí (Google Apps Script) siempre se pide a la red: los datos nunca se guardan acá.
const VERSION = 'lumatvet-v1';
const CASCARA = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CASCARA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;   // Apps Script y Google: directo a la red
  // la página: primero la red (para tomar cambios) y, sin señal, la guardada
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
