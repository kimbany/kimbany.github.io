/**
 * 백그라운드 서비스 워커 — 실제 fetch 수행
 * 본인 브라우저 세션의 쿠키가 자동으로 따라가므로 로그인된 상태로 호출됨.
 */

const XHS_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,ko;q=0.7",
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
});

async function handleFetch({ url, init }) {
  const headers = { ...XHS_HEADERS, ...((init && init.headers) || {}) };
  try {
    const r = await fetch(url, {
      method: (init && init.method) || "GET",
      headers,
      body: (init && init.body) || undefined,
      credentials: "include", // 본인 세션 쿠키 사용
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
    return { ok: false, error: e.message };
  }
}
