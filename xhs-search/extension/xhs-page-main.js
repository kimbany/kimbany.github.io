/**
 * MAIN world 스크립트 (document_start)
 * 1) fetch / XMLHttpRequest 인터셉터를 설치해서 XHS 검색 API 응답을 가로챔
 * 2) 보조로 window.__INITIAL_STATE__ 도 시도
 */
(function () {
  const TAG = "[XHS-Helper-MAIN]";
  const SEARCH_API_RE = /\/api\/sns\/web\/v\d+\/search\/notes/i;

  // ── fetch 인터셉터 ──
  if (typeof window.fetch === "function") {
    const origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      const url = typeof input === "string" ? input : (input && input.url) || "";
      const promise = origFetch(input, init);
      if (SEARCH_API_RE.test(url)) {
        promise
          .then((r) => r.clone().text())
          .then((text) => {
            console.log(TAG, "fetch 인터셉트:", url, text.length, "bytes");
            window.postMessage({ __xhs_helper: "xhr_capture", url, text, source: "fetch" }, "*");
          })
          .catch((e) => console.warn(TAG, "fetch capture 실패:", e));
      }
      return promise;
    };
  }

  // ── XMLHttpRequest 인터셉터 ──
  try {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__xhs_url = url;
      this.__xhs_method = method;
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      const xhr = this;
      if (SEARCH_API_RE.test(xhr.__xhs_url || "")) {
        xhr.addEventListener("load", function () {
          try {
            console.log(TAG, "XHR 인터셉트:", xhr.__xhs_url, (xhr.responseText || "").length, "bytes");
            window.postMessage(
              { __xhs_helper: "xhr_capture", url: xhr.__xhs_url, text: xhr.responseText, source: "xhr" },
              "*"
            );
          } catch (e) {
            console.warn(TAG, "XHR capture 실패:", e);
          }
        });
      }
      return origSend.apply(this, arguments);
    };
  } catch (e) {
    console.warn(TAG, "XHR 인터셉터 설치 실패:", e);
  }

  console.log(TAG, "인터셉터 설치 완료 @", Math.round(performance.now()), "ms");

  // ── 보조: __INITIAL_STATE__ 폴백 ──
  let attempts = 0;
  function trySendState() {
    attempts++;
    try {
      const state = window.__INITIAL_STATE__;
      if (state && typeof state === "object") {
        const json = JSON.stringify(state, (k, v) => (v === undefined ? null : v));
        window.postMessage({ __xhs_helper: "state", json, url: location.href }, "*");
        return;
      }
    } catch (e) {
      window.postMessage({ __xhs_helper: "error", error: e.message }, "*");
      return;
    }
    if (attempts < 50) setTimeout(trySendState, 200); // 최대 10초
  }
  setTimeout(trySendState, 500); // DOMContentLoaded 후 시도
})();
