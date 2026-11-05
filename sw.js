/* Offline cache (same pattern as the picture book's sw.js): bump VERSION whenever any file changes. */
var VERSION = "garage-v6-3";
var FILES = ["./", "index.html", "css/k1.css", "js/store.js", "js/speech.js", "js/art.js", "js/activities.js", "js/maths.js", "js/english.js", "js/chinese.js", "js/app.js",
  "audio/manifest.js", "audio/silence.mp3", "icon.svg", "icon.png", "manifest.webmanifest",
  "img/stickers/everyday/ambulance.webp", "img/stickers/everyday/bmw-3series.webp", "img/stickers/everyday/bmw-i3.webp", "img/stickers/everyday/chevy-belair.webp", "img/stickers/everyday/double-decker.webp", "img/stickers/everyday/dump-truck.webp", "img/stickers/everyday/fiat-500.webp", "img/stickers/everyday/fire-engine.webp", "img/stickers/everyday/food-truck.webp", "img/stickers/everyday/ford-mustang.webp", "img/stickers/everyday/honda-civic.webp", "img/stickers/everyday/honda-jazz.webp", "img/stickers/everyday/ice-cream-van.webp", "img/stickers/everyday/jeep-wrangler.webp", "img/stickers/everyday/kia-soul.webp", "img/stickers/everyday/land-rover.webp", "img/stickers/everyday/mazda-mx5.webp", "img/stickers/everyday/mini-cooper.webp", "img/stickers/everyday/nissan-leaf.webp", "img/stickers/everyday/police-car.webp", "img/stickers/everyday/porsche-cayenne.webp", "img/stickers/everyday/sbs-bus.webp", "img/stickers/everyday/school-bus.webp", "img/stickers/everyday/subaru-forester.webp", "img/stickers/everyday/tesla-model3.webp", "img/stickers/everyday/tow-truck.webp", "img/stickers/everyday/toyota-alphard.webp", "img/stickers/everyday/toyota-camry.webp", "img/stickers/everyday/toyota-prius-taxi.webp", "img/stickers/everyday/vw-beetle.webp", "img/stickers/super/amg-gt.webp", "img/stickers/super/aston-martin-db11.webp", "img/stickers/super/aston-martin-vantage.webp", "img/stickers/super/audi-r8.webp", "img/stickers/super/bmw-m8.webp", "img/stickers/super/bugatti-chiron.webp", "img/stickers/super/bugatti-veyron.webp", "img/stickers/super/corvette-c8.webp", "img/stickers/super/ferrari-488.webp", "img/stickers/super/ferrari-f8.webp", "img/stickers/super/ferrari-sf90.webp", "img/stickers/super/ford-gt.webp", "img/stickers/super/jaguar-ftype.webp", "img/stickers/super/koenigsegg-jesko.webp", "img/stickers/super/koenigsegg-regera.webp", "img/stickers/super/lamborghini-aventador.webp", "img/stickers/super/lamborghini-huracan.webp", "img/stickers/super/lamborghini-revuelto.webp", "img/stickers/super/lexus-lfa.webp", "img/stickers/super/lotus-emira.webp", "img/stickers/super/lotus-evora.webp", "img/stickers/super/mclaren-720s.webp", "img/stickers/super/mclaren-p1.webp", "img/stickers/super/mclaren-senna.webp", "img/stickers/super/nissan-gtr.webp", "img/stickers/super/pagani-huayra.webp", "img/stickers/super/pagani-zonda.webp", "img/stickers/super/porsche-911.webp", "img/stickers/super/porsche-cayman-gt4.webp", "img/stickers/super/porsche-taycan.webp", "img/stickers/tier10/amg-gt.webp", "img/stickers/tier10/aston-martin-db11.webp", "img/stickers/tier10/aston-martin-vantage.webp", "img/stickers/tier10/audi-r8.webp", "img/stickers/tier10/bmw-m8.webp", "img/stickers/tier10/bugatti-chiron.webp", "img/stickers/tier10/bugatti-veyron.webp", "img/stickers/tier10/corvette-c8.webp", "img/stickers/tier10/ferrari-488.webp", "img/stickers/tier10/ferrari-f8.webp", "img/stickers/tier10/ferrari-sf90.webp", "img/stickers/tier10/ford-gt.webp", "img/stickers/tier10/jaguar-ftype.webp", "img/stickers/tier10/koenigsegg-jesko.webp", "img/stickers/tier10/koenigsegg-regera.webp", "img/stickers/tier10/lamborghini-aventador.webp", "img/stickers/tier10/lamborghini-huracan.webp", "img/stickers/tier10/lamborghini-revuelto.webp", "img/stickers/tier10/lexus-lfa.webp", "img/stickers/tier10/lotus-emira.webp", "img/stickers/tier10/lotus-evora.webp", "img/stickers/tier10/mclaren-720s.webp", "img/stickers/tier10/mclaren-p1.webp", "img/stickers/tier10/mclaren-senna.webp", "img/stickers/tier10/nissan-gtr.webp", "img/stickers/tier10/pagani-huayra.webp", "img/stickers/tier10/pagani-zonda.webp", "img/stickers/tier10/porsche-911.webp", "img/stickers/tier10/porsche-cayman-gt4.webp", "img/stickers/tier10/porsche-taycan.webp"];
/* Precache every recorded clip listed in the manifest, so the whole app works offline from the first visit. */
try {
  importScripts("audio/manifest.js");
  var mf = (self.K1_AUDIO && self.K1_AUDIO.files) || {};
  Object.keys(mf).forEach(function (k) { var f = mf[k]; if (f && FILES.indexOf(f) < 0) FILES.push(f); });
} catch (err) { /* no manifest: clips are cached as they are played */ }
self.addEventListener("install", function (e) { e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf("garage-") === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); })); }));
  self.clients.claim();
});
/* Safari asks for audio with a Range header; answer from the cached file with a 206 slice. */
function rangeResponse(req, resp) {
  var m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
  if (!m) return resp;
  return resp.arrayBuffer().then(function (buf) {
    var size = buf.byteLength, start = m[1] ? +m[1] : size - +m[2], end = m[1] && m[2] ? +m[2] : size - 1;
    if (!m[1]) end = size - 1;
    if (start >= size) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + size } });
    end = Math.min(end, size - 1);
    return new Response(buf.slice(start, end + 1), { status: 206, headers: {
      "Content-Type": resp.headers.get("Content-Type") || "audio/mpeg", "Content-Range": "bytes " + start + "-" + end + "/" + size,
      "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" } });
  });
}
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var isRange = e.request.headers.has("range");
  // ignoreSearch: index.html?test=1 etc. still comes from the cache when offline
  e.respondWith(caches.open(VERSION).then(function (c) { return c.match(e.request.url, { ignoreSearch: true }); }).then(function (r) {
    if (r) return isRange ? rangeResponse(e.request, r) : r;
    return fetch(e.request);
  }));
});
