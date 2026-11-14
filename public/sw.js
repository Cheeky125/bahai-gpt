// Phoenix service worker — what lets Phoenix work like an app, even without internet.
//
// - Pages and data: always try the internet first (so nothing is ever out of date), and keep a copy.
//   Without internet, the saved copy is shown; a page never opened before shows offline.html.
// - Every prayer theme is saved when Phoenix is first installed or opened, so all prayers can be
//   read offline. The main pages are saved too.
// - The site's own code files (/_next/static/…) never change once published, so they are served
//   from the saved copy straight away.
// Search, AI answers and anything that sends data (POST) always need the internet.
//
// When you change this file, bump VERSION so phones pick up the new version.
const VERSION = "v3";
const STATIC = `phoenix-static-${VERSION}`;
const PAGES = `phoenix-pages-${VERSION}`;
const OFFLINE = "/offline.html";
const CORE = ["/", "/prayers", "/obligatory", "/today", "/saved", "/institute", "/read", "/about", OFFLINE, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const pages = await caches.open(PAGES);
    await Promise.allSettled(CORE.map((u) => pages.add(u)));
    // every prayer theme, for reading offline (about 50 small files)
    try {
      const { themes } = await (await fetch("/api/prayers/themes")).json();
      await Promise.allSettled(themes.map((t) => pages.add(`/api/prayers?theme=${encodeURIComponent(t)}`)));
    } catch (err) { /* offline during install: themes are saved as they are opened instead */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keep = [STATIC, PAGES];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const NEVER = /^\/(api\/(search|event|feedback|geocode|keepalive|listen|transfer)|stats)/;

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || NEVER.test(url.pathname)) return;

  // code files and icons: saved copy first
  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|ico|woff2?)$/.test(url.pathname)) {
    e.respondWith(caches.open(STATIC).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }

  // pages and data: internet first, saved copy when offline
  e.respondWith((async () => {
    const c = await caches.open(PAGES);
    try {
      const res = await fetch(req);
      if (res.ok && res.type === "basic") c.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(req, { ignoreVary: true }) || (req.mode === "navigate" ? await c.match(url.pathname, { ignoreSearch: true }) : null);
      if (hit) return hit;
      if (req.mode === "navigate") return c.match(OFFLINE);
      return new Response(JSON.stringify({ error: "You’re offline." }), { status: 503, headers: { "Content-Type": "application/json" } });
    }
  })());
});
