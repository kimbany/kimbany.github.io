/**
 * MAIN world 스크립트 — youtube.com 페이지에서 실행 (document_idle)
 * 페이지의 window.ytInitialPlayerResponse 를 읽어 postMessage로 bridge에 전달.
 * 본인의 진짜 브라우저 세션이라 YouTube가 봇 차단 안 하고 완전한 데이터를 줌.
 */
(function () {
  let attempts = 0;
  function trySend() {
    attempts++;
    try {
      const pr = window.ytInitialPlayerResponse;
      if (pr && typeof pr === "object" && pr.playabilityStatus) {
        // playabilityStatus만 있어도(에러여도) 일단 보냄 — 진단에 필요
        const json = JSON.stringify(pr, (k, v) => (v === undefined ? null : v));
        window.postMessage({ __yt_helper: "player", json, url: location.href }, "*");
        return;
      }
    } catch (e) {
      window.postMessage({ __yt_helper: "error", error: e.message }, "*");
      return;
    }
    if (attempts < 40) setTimeout(trySend, 250); // 최대 10초 대기
    else window.postMessage({ __yt_helper: "timeout" }, "*");
  }
  trySend();
})();
