/* Offline cache (same pattern as the picture book's sw.js): bump VERSION whenever any file changes. */
var VERSION = "garage-v2-1";
var FILES = ["./", "index.html", "css/k1.css", "js/store.js", "js/speech.js", "js/art.js", "js/activities.js", "js/maths.js", "js/app.js",
  "audio/manifest.js", "audio/silence.mp3", "icon.svg", "icon.png", "manifest.webmanifest"];
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
