/**
 * sw.js — 서비스 워커 (앱 셸 캐싱)
 *
 * 전략: network-first (온라인이면 항상 최신 파일 사용).
 *  - 예전 cache-first 방식은 index.html이 캐시에 박혀 코드 업데이트가 안 먹는 문제가 있었음.
 *  - 이제 온라인이면 네트워크에서 최신본을 받아 쓰고, 그 사본을 캐시에 넣어둔다.
 *  - 오프라인일 때만 캐시 사본으로 폴백 → PWA(오프라인) 기능은 유지하면서 항상 최신.
 *  - API 응답(프록시 호출)은 캐시하지 않는다.
 */
const CACHE = "shopping-insight-v3"; // 버전 올리면 기존 캐시 자동 폐기

self.addEventListener("install", (e) => {
  self.skipWaiting(); // 새 워커 즉시 대기열 통과
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // POST(데이터랩) 등은 통과

  const url = new URL(req.url);
  // 프록시(workers.dev) API 호출은 캐시 없이 네트워크로만
  if (url.hostname.endsWith(".workers.dev")) return;
  // 동일 출처(앱 셸)만 처리, 외부(CDN 등)는 브라우저 기본 동작에 맡김
  if (url.origin !== self.location.origin) return;

  // network-first: 최신 우선, 실패(오프라인) 시 캐시 폴백
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
