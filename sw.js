/* SUPERVISA·PE · trabajador sin conexión. Cambie VERSION en cada publicación (debe coincidir con la versión de la app). */
const VERSION = "0.3.1";
const CACHE = "supervisa-pe-" + VERSION;
const SHELL = ["./", "./index.html", "./supervisa_pe.html", "./manifest.webmanifest", "./icono.svg", "./icono-192.png", "./icono-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("supervisa-pe-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("message", e => { if (e.data === "ACTUALIZAR") self.skipWaiting(); });
/* Páginas (HTML): primero internet para tener siempre la versión más reciente; sin señal, la copia guardada.
   Íconos y demás archivos propios: primero la copia guardada (rápido) y se refresca en segundo plano.
   Servicios externos (base central, CEPLAN, mapas): van directo a internet, no se guardan. */
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== self.location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(caches.open(CACHE).then(async c => {
      try { const r = await fetch(e.request); if (r && r.ok) c.put(e.request, r.clone()); return r; }
      catch (err) { return (await c.match(e.request, { ignoreSearch: true })) || (await c.match("./supervisa_pe.html")); }
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const guardado = await c.match(e.request, { ignoreSearch: true });
    const red = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => guardado);
    return guardado || red;
  }));
});