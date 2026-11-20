/* Makalu - copia locale della pagina contenitore (index.html).
   Serve a una cosa sola: quando si apre il sito (soprattutto dall'icona sulla schermata Home del telefono)
   la pagina contenitore compare subito dalla copia salvata, anche se in quel momento la rete non risponde;
   intanto se ne scarica la versione aggiornata, che vale dall'apertura successiva.
   Non tocca nient'altro: le pagine vere (Google Apps Script) passano sempre dalla rete. */
var COPIA = 'makalu-contenitore-1';
var PAGINA = './';

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(COPIA).then(function (c) { return c.add(new Request(PAGINA, { cache: 'reload' })); }).catch(function () {}));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (nomi) {
    return Promise.all(nomi.filter(function (n) { return n !== COPIA; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate') return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  var radice = new URL(PAGINA, self.registration.scope).pathname;
  if (u.pathname !== radice && u.pathname !== radice + 'index.html') return;
  e.respondWith(caches.open(COPIA).then(function (c) {
    return c.match(PAGINA).then(function (salvata) {
      var rete = fetch(PAGINA, { cache: 'no-cache' }).then(function (risposta) {
        if (risposta && risposta.ok) c.put(PAGINA, risposta.clone());
        return risposta;
      });
      if (!salvata) return rete;
      e.waitUntil(rete.catch(function () {}));
      return salvata;
    });
  }).catch(function () { return fetch(r); }));
});
