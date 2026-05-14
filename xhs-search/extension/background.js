/**
 * 백그라운드 서비스 워커 — 실제 fetch 수행
 * 본인 브라우저 세션의 쿠키가 자동으로 따라가므로 로그인된 상태로 호출됨.
 */

// 브라우저 기본 헤더만 사용 (Accept-Language를 zh로 강제하면 IP/UA와 mismatch로 봇 탐지될 수 있음)
const XHS_HEADERS = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "XHS_PING") {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
    return;
  }
  if (msg && msg.type === "XHS_FETCH") {
    handleFetch(msg).then(sendResponse).catch((e) => sendResponse({ ok: false, error: e.message }));
    return true; // async
  }
  if (msg && msg.type === "XHS_SEARCH_VIA_TAB") {
    searchViaTab(msg.keyword).then(sendResponse).catch((e) => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (msg && msg.type === "XHS_PAGE_DATA" && sender && sender.tab) {
    onTabData(sender.tab.id, msg);
    return;
  }
  if (msg && msg.type === "YT_CAPTURE_VIA_TAB") {
    captureYtViaTab(msg.videoId).then(sendResponse).catch((e) => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (msg && msg.type === "YT_PAGE_DATA" && sender && sender.tab) {
    onYtTabData(sender.tab.id, msg);
    return;
  }
});

// ===== YouTube 탭 기반 데이터 캡쳐 =====
// 본인 브라우저로 youtube.com/watch 페이지를 백그라운드 탭에서 열면
// YouTube가 봇 차단 없이 완전한 ytInitialPlayerResponse를 줌.
const _pendingYtTabs = new Map(); // tabId -> { resolve, reject, timer }

function onYtTabData(tabId, msg) {
  const p = _pendingYtTabs.get(tabId);
  if (!p) return;
  clearTimeout(p.timer);
  _pendingYtTabs.delete(tabId);
  setTimeout(() => { try { chrome.tabs.remove(tabId); } catch {} }, 200);
  if (msg.error) p.reject(new Error(msg.error));
  else p.resolve({ ok: true, json: msg.json, url: msg.url });
}

async function captureYtViaTab(videoId) {
  if (!videoId) throw new Error("videoId 필수");
  const url = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  return new Promise(async (resolve, reject) => {
    let tab;
    try {
      tab = await chrome.tabs.create({ url, active: false });
    } catch (e) {
      return reject(new Error("YouTube 탭 생성 실패: " + e.message));
    }
    const timer = setTimeout(() => {
      _pendingYtTabs.delete(tab.id);
      try { chrome.tabs.remove(tab.id); } catch {}
      reject(new Error("YouTube 탭 응답 타임아웃 (30초)"));
    }, 30000);
    _pendingYtTabs.set(tab.id, { resolve, reject, timer });
  });
}

// ===== 탭 기반 검색 =====
// 1) MAIN world 인터셉터가 XHS 검색 API 응답을 가로채면 'xhr' 데이터로 즉시 해결
// 2) XHR이 안 와도 __INITIAL_STATE__가 오면 보조로 보관, 타임아웃 시 fallback으로 사용
const _pendingTabs = new Map(); // tabId -> { resolve, reject, timer, savedState }

function onTabData(tabId, msg) {
  const p = _pendingTabs.get(tabId);
  if (!p) return;

  if (msg.kind === "xhr" && msg.text) {
    // 가장 좋은 결과 — 검색 API 응답 JSON
    clearTimeout(p.timer);
    _pendingTabs.delete(tabId);
    setTimeout(() => { try { chrome.tabs.remove(tabId); } catch {} }, 200);
    p.resolve({ ok: true, kind: "xhr", apiJson: msg.text, apiUrl: msg.url });
    return;
  }

  if (msg.kind === "state" && msg.json) {
    // 보조 — XHR이 안 오면 이걸 사용 (대기는 계속)
    p.savedState = msg.json;
    p.savedUrl = msg.url;
    return;
  }

  if (msg.kind === "error") {
    // 오류여도 즉시 reject하지 않고 타임아웃까지 기다림 (다른 메시지가 올 수도 있음)
    p.lastError = msg.error;
    return;
  }
}

async function searchViaTab(keyword) {
  if (!keyword) throw new Error("keyword 필수");
  const url = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
  return new Promise(async (resolve, reject) => {
    let tab;
    try {
      tab = await chrome.tabs.create({ url, active: false });
    } catch (e) {
      return reject(new Error("탭 생성 실패: " + e.message));
    }
    const timer = setTimeout(() => {
      const p = _pendingTabs.get(tab.id);
      _pendingTabs.delete(tab.id);
      try { chrome.tabs.remove(tab.id); } catch {}
      if (!p) return;
      if (p.savedState) {
        resolve({ ok: true, kind: "state", json: p.savedState, url: p.savedUrl });
      } else {
        reject(new Error("탭 응답 타임아웃: XHR도 state도 없음 (30초). " + (p.lastError || "")));
      }
    }, 30000);
    _pendingTabs.set(tab.id, { resolve, reject, timer });
  });
}

async function handleFetch({ url, init }) {
  const headers = { ...XHS_HEADERS, ...((init && init.headers) || {}) };
  // 안전: 금지 헤더 자동 제거
  delete headers["User-Agent"];
  delete headers["user-agent"];
  delete headers["Origin"];
  delete headers["origin"];
  delete headers["Cookie"];
  delete headers["cookie"];
  try {
    const r = await fetch(url, {
      method: (init && init.method) || "GET",
      headers,
      body: (init && init.body) || undefined,
      credentials: "include", // 본인 세션 쿠키 자동 첨부
      redirect: "follow",
    });
    const text = await r.text();
    return {
      ok: r.ok,
      status: r.status,
      statusText: r.statusText,
      url: r.url,
      text,
      length: text.length,
    };
  } catch (e) {
    console.error("[XHS-Helper-BG] fetch 실패:", e);
    return {
      ok: false,
      status: 0,
      error: e.message || String(e),
      name: e.name || "Error",
      url,
    };
  }
}
