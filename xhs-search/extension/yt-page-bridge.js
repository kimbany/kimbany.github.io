/**
 * ISOLATED world 브리지 — yt-page-main.js의 postMessage를 background로 전달
 */
window.addEventListener("message", (e) => {
  if (e.source !== window || !e.data || !e.data.__yt_helper) return;
  const t = e.data.__yt_helper;
  try {
    if (t === "player") {
      chrome.runtime.sendMessage({ type: "YT_PAGE_DATA", json: e.data.json, url: e.data.url || location.href });
    } else if (t === "error") {
      chrome.runtime.sendMessage({ type: "YT_PAGE_DATA", error: e.data.error });
    } else if (t === "timeout") {
      chrome.runtime.sendMessage({ type: "YT_PAGE_DATA", error: "ytInitialPlayerResponse 타임아웃 (10초)" });
    }
  } catch {}
});
