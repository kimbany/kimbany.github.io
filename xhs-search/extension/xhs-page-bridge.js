/**
 * ISOLATED world 브리지 스크립트
 * xhs-page-main.js (MAIN world)에서 오는 postMessage를 받아 background로 전달.
 */
window.addEventListener("message", (e) => {
  if (e.source !== window || !e.data || !e.data.__xhs_helper) return;
  if (e.data.__xhs_helper === "state") {
    try {
      chrome.runtime.sendMessage({
        type: "XHS_PAGE_STATE",
        json: e.data.json,
        url: e.data.url || location.href,
      });
    } catch {}
  } else if (e.data.__xhs_helper === "error") {
    try {
      chrome.runtime.sendMessage({ type: "XHS_PAGE_STATE", error: e.data.error });
    } catch {}
  } else if (e.data.__xhs_helper === "timeout") {
    try {
      chrome.runtime.sendMessage({ type: "XHS_PAGE_STATE", error: "타임아웃: __INITIAL_STATE__ 못 찾음" });
    } catch {}
  }
});
