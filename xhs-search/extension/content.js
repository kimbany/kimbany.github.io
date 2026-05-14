/**
 * 콘텐츠 스크립트 — kimbany.github.io 페이지와 백그라운드 사이의 다리.
 *
 * 페이지가 window.postMessage 로 요청을 보내면,
 * background.js로 전달해서 fetch 수행 후 결과를 페이지로 다시 postMessage.
 */

const TAG = "[XHS-Helper]";
const VERSION = "1.0.5";

// 페이지가 우리 확장의 존재를 감지할 수 있게 표시
const beacon = document.createElement("meta");
beacon.name = "xhs-helper-installed";
beacon.content = VERSION;
(document.documentElement || document.head).appendChild(beacon);

console.log(TAG, "콘텐츠 스크립트 활성화", { version: VERSION, page: location.href });

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const msg = event.data;
  if (!msg || typeof msg !== "object") return;

  if (msg.type === "XHS_HELPER_PING") {
    window.postMessage(
      { type: "XHS_HELPER_PONG", requestId: msg.requestId, version: VERSION },
      "*"
    );
    return;
  }

  if (msg.type === "XHS_HELPER_FETCH") {
    chrome.runtime.sendMessage(
      { type: "XHS_FETCH", url: msg.url, init: msg.init || {} },
      (response) => {
        const err = chrome.runtime.lastError;
        window.postMessage(
          {
            type: "XHS_HELPER_FETCH_RESULT",
            requestId: msg.requestId,
            error: err ? err.message : null,
            response,
          },
          "*"
        );
      }
    );
    return;
  }

  if (msg.type === "XHS_HELPER_TAB_SEARCH") {
    chrome.runtime.sendMessage(
      { type: "XHS_SEARCH_VIA_TAB", keyword: msg.keyword },
      (response) => {
        const err = chrome.runtime.lastError;
        window.postMessage(
          {
            type: "XHS_HELPER_TAB_SEARCH_RESULT",
            requestId: msg.requestId,
            error: err ? err.message : null,
            response,
          },
          "*"
        );
      }
    );
    return;
  }

  if (msg.type === "XHS_HELPER_YT_CAPTURE") {
    chrome.runtime.sendMessage(
      { type: "YT_CAPTURE_VIA_TAB", videoId: msg.videoId },
      (response) => {
        const err = chrome.runtime.lastError;
        window.postMessage(
          {
            type: "XHS_HELPER_YT_CAPTURE_RESULT",
            requestId: msg.requestId,
            error: err ? err.message : null,
            response,
          },
          "*"
        );
      }
    );
    return;
  }
});
