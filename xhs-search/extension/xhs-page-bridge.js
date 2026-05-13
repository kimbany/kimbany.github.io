/**
 * ISOLATED world 브리지 — MAIN의 postMessage를 background로 전달
 */
window.addEventListener("message", (e) => {
  if (e.source !== window || !e.data) return;
  const t = e.data.__xhs_helper;
  if (!t) return;

  try {
    if (t === "xhr_capture") {
      chrome.runtime.sendMessage({
        type: "XHS_PAGE_DATA",
        kind: "xhr",
        url: e.data.url,
        text: e.data.text,
        source: e.data.source,
      });
    } else if (t === "state") {
      chrome.runtime.sendMessage({
        type: "XHS_PAGE_DATA",
        kind: "state",
        json: e.data.json,
        url: e.data.url || location.href,
      });
    } else if (t === "error") {
      chrome.runtime.sendMessage({ type: "XHS_PAGE_DATA", kind: "error", error: e.data.error });
    }
  } catch {}
});
