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
  if (msg && msg.type === "XHS_PAGE_STATE" && sender && sender.tab) {
    onTabState(sender.tab.id, msg);
    return;
  }
});

// ===== 탭 기반 검색: 백그라운드 탭 열어서 XHS 본인 세션으로 페이지 로드 후 데이터 추출 =====
const _pendingTabs = new Map(); // tabId -> { resolve, reject, timer }

function onTabState(tabId, msg) {
  const p = _pendingTabs.get(tabId);
  if (!p) return;
  clearTimeout(p.timer);
  _pendingTabs.delete(tabId);
  try { chrome.tabs.remove(tabId); } catch {}
  if (msg.error) p.reject(new Error(msg.error));
  else p.resolve({ ok: true, json: msg.json, url: msg.url });
}

async function searchViaTab(keyword) {
  if (!keyword) throw new Error("keyword 필수");
  // /search_result 가 막혀있으면 /explore 같은 우회 URL도 시도 가능. 일단 표준 검색 URL.
  const url = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
  return new Promise(async (resolve, reject) => {
    let tab;
    try {
      tab = await chrome.tabs.create({ url, active: false });
    } catch (e) {
      return reject(new Error("탭 생성 실패: " + e.message));
    }
    const timer = setTimeout(() => {
      _pendingTabs.delete(tab.id);
      try { chrome.tabs.remove(tab.id); } catch {}
      reject(new Error("탭 응답 타임아웃 (25초)"));
    }, 25000);
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
