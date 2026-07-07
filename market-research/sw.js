/**
 * sw.js — 서비스 워커 (앱 셸 캐싱)
 *
 * 전략:
 *  - 앱 셸(index.html, manifest 등)은 캐시 우선(cache-first)으로 오프라인 동작.
 *  - API 응답(프록시 호출)은 절대 캐시하지 않는다 (항상 최신 데이터 필요).
 *  - CDN(tailwind, chart.js)은 network-first로 두어 최신 유지 + 오프라인 폴백.
 */
const CACHE = "shopping-insight-v1";
const SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // POST(데이터랩) 등은 그대로 통과

  const url = new URL(req.url);
  // 프록시(workers.dev) API 호출은 캐시하지 않고 네트워크로만
  if (url.hostname.endsWith(".workers.dev")) return;

  // 앱 셸: 캐시 우선, 없으면 네트워크 후 캐시에 저장
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => hit)
    )
  );
});
