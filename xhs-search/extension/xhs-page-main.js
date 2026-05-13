/**
 * MAIN world 콘텐츠 스크립트
 * 페이지의 window.__INITIAL_STATE__ 에 접근하기 위해 페이지와 같은 world에서 실행.
 * (chrome.runtime 사용 불가 — postMessage로 bridge에 전달)
 */
(function () {
  let attempts = 0;
  function trySend() {
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
    if (attempts < 30) setTimeout(trySend, 300); // 최대 9초 대기
    else window.postMessage({ __xhs_helper: "timeout" }, "*");
  }
  trySend();
})();
