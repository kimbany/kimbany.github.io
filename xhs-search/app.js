/* 샤오홍슈 한국어 검색기 — 프론트엔드
 * 1단계: 검색 UI, 한→중 번역, 추천 키워드, 백엔드 호출 준비
 * 2단계: 크롬 확장프로그램 헬퍼를 통한 직접 검색
 */

// ===== 크롬 확장프로그램 헬퍼 감지 / 호출 =====
let extensionDetected = false;

function detectExtension(timeoutMs = 600) {
  return new Promise((resolve) => {
    // (1) meta 태그로 감지 (확장 content.js가 페이지 로드 직후 삽입)
    const meta = document.querySelector('meta[name="xhs-helper-installed"]');
    if (meta) { extensionDetected = true; return resolve(meta.content || "1"); }
    // (2) postMessage ping
    const id = "ping-" + Math.random().toString(36).slice(2);
    const handler = (e) => {
      if (e.source !== window) return;
      if (e.data && e.data.type === "XHS_HELPER_PONG" && e.data.requestId === id) {
        window.removeEventListener("message", handler);
        extensionDetected = true;
        resolve(e.data.version || "1");
      }
    };
    window.addEventListener("message", handler);
    window.postMessage({ type: "XHS_HELPER_PING", requestId: id }, "*");
    setTimeout(() => { window.removeEventListener("message", handler); resolve(null); }, timeoutMs);
  });
}

function extensionFetch(url, init) {
  return new Promise((resolve, reject) => {
    const id = "req-" + Math.random().toString(36).slice(2);
    const handler = (e) => {
      if (e.source !== window) return;
      const m = e.data;
      if (!m || m.type !== "XHS_HELPER_FETCH_RESULT" || m.requestId !== id) return;
      window.removeEventListener("message", handler);
      if (m.error) return reject(new Error(m.error));
      const r = m.response || {};
      if (!r.ok) {
        const msg = r.error || r.statusText || (r.status ? "HTTP " + r.status : "응답 없음");
        return reject(new Error(msg));
      }
      resolve(r);
    };
    window.addEventListener("message", handler);
    window.postMessage({ type: "XHS_HELPER_FETCH", requestId: id, url, init: init || {} }, "*");
    setTimeout(() => { window.removeEventListener("message", handler); reject(new Error("확장프로그램 응답 없음 (30초)")); }, 30000);
  });
}

// 탭 기반 검색: XHS가 직접 fetch를 차단할 때, 실제 백그라운드 탭으로 페이지를 열어서 데이터 추출
function extensionTabSearch(keyword) {
  return new Promise((resolve, reject) => {
    const id = "tab-" + Math.random().toString(36).slice(2);
    const handler = (e) => {
      if (e.source !== window) return;
      const m = e.data;
      if (!m || m.type !== "XHS_HELPER_TAB_SEARCH_RESULT" || m.requestId !== id) return;
      window.removeEventListener("message", handler);
      if (m.error) return reject(new Error(m.error));
      const r = m.response || {};
      if (!r.ok) return reject(new Error(r.error || "탭 검색 실패"));
      resolve(r);
    };
    window.addEventListener("message", handler);
    window.postMessage({ type: "XHS_HELPER_TAB_SEARCH", requestId: id, keyword }, "*");
    setTimeout(() => { window.removeEventListener("message", handler); reject(new Error("탭 검색 타임아웃 (30초)")); }, 30000);
  });
}

const $ = (id) => document.getElementById(id);
const q = $("q");
const searchBtn = $("searchBtn");
const translationBox = $("translation");
const koText = $("ko-text");
const zhText = $("zh-text");
const openXhs = $("openXhs");
const copyZh = $("copyZh");
const statusEl = $("status");
const recommended = $("recommended");
const recoLabel = $("recoLabel");
const results = $("results");
const resultLabel = $("resultLabel");
const workerUrlInput = $("workerUrl");
const saveWorker = $("saveWorker");
const workerStatus = $("workerStatus");
const setupWarn = $("setupWarn");

const LS_KEY_WORKER = "xhs-search.workerUrl";

let lastTranslation = ""; // 마지막 번역 결과 캐시

function setStatus(msg, kind = "") {
  statusEl.className = "status " + kind;
  statusEl.textContent = msg;
}

function getWorkerUrl() {
  return (localStorage.getItem(LS_KEY_WORKER) || "").trim();
}

function updateWorkerUi() {
  const u = getWorkerUrl();
  workerUrlInput.value = u;
  if (u) {
    setupWarn.style.display = "none";
    workerStatus.textContent = "✅ 백엔드 연결됨: " + u;
    workerStatus.style.color = "#38d39f";
  } else {
    setupWarn.style.display = "block";
    workerStatus.textContent = "⚠️ 미연결 — Worker URL을 저장해야 검색 결과가 뜹니다.";
    workerStatus.style.color = "";
  }
}

saveWorker.addEventListener("click", () => {
  const u = workerUrlInput.value.trim().replace(/\/+$/, "");
  if (!u) {
    localStorage.removeItem(LS_KEY_WORKER);
  } else if (!/^https:\/\//.test(u)) {
    workerStatus.textContent = "❌ https:// 로 시작해야 합니다.";
    workerStatus.style.color = "#ff6b6b";
    return;
  } else {
    localStorage.setItem(LS_KEY_WORKER, u);
  }
  updateWorkerUi();
});

// ===== 번역 (Google Translate 비공식 엔드포인트, 브라우저에서 CORS OK) =====
async function translateKoToZh(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("번역 실패: HTTP " + r.status);
  const data = await r.json();
  // 응답: [[["译文", "원문", null, null, ...], ...], ...]
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error("번역 응답 형식 오류");
  return data[0].map((seg) => (Array.isArray(seg) ? seg[0] : "")).join("").trim();
}

// 폴백: MyMemory (5000자/일 무료, CORS OK)
async function translateMyMemory(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|zh-CN`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("MyMemory HTTP " + r.status);
  const data = await r.json();
  return (data.responseData && data.responseData.translatedText) || "";
}

async function translate(text) {
  try { return await translateKoToZh(text); }
  catch (e1) {
    try { return await translateMyMemory(text); }
    catch (e2) { throw new Error("번역 실패 (Google·MyMemory 모두 실패)"); }
  }
}

// ===== 검색 흐름 =====
async function search() {
  const text = q.value.trim();
  if (!text) { setStatus("검색어를 입력하세요.", "err"); return; }
  searchBtn.disabled = true;
  setStatus("한국어 → 중국어 번역 중…");
  translationBox.classList.remove("shown");
  results.innerHTML = '<div class="empty">번역 후 검색 중…</div>';
  resultLabel.textContent = "검색 중";

  try {
    const zh = await translate(text);
    if (!zh) throw new Error("빈 번역 결과");
    lastTranslation = zh;
    koText.textContent = text;
    zhText.textContent = zh;
    translationBox.classList.add("shown");
    setStatus(`✅ 번역 완료: "${zh}"`, "ok");

    // 백엔드 호출
    await fetchProducts(zh, text);

    // AI 추천 키워드 호출 (백엔드)
    refreshRecommended(text);
  } catch (e) {
    setStatus("❌ " + e.message, "err");
    results.innerHTML = `<div class="empty">검색 실패: ${e.message}</div>`;
    resultLabel.textContent = "오류";
  } finally {
    searchBtn.disabled = false;
  }
}

// ===== 제품 검색 — 확장 > 백엔드 > Jina 순서로 시도 =====
async function fetchProducts(zhKeyword, koKeyword) {
  // (1) 크롬 확장이 있으면 그걸 통해 직접 호출 (가장 신뢰도 높음, 본인 세션 사용)
  if (extensionDetected) {
    resultLabel.textContent = "검색 중… (확장)";
    try {
      const items = await searchViaExtension(zhKeyword);
      if (items.length) {
        renderProducts(items);
        resultLabel.textContent = `${items.length}개 (확장)`;
        return;
      }
      setStatus("확장 응답 0건 — Jina로 폴백", "err");
    } catch (e) {
      setStatus("확장 실패: " + e.message + " — Jina로 폴백", "err");
    }
  }

  const w = getWorkerUrl();
  if (w) {
    resultLabel.textContent = "검색 중… (백엔드)";
    try {
      const url = `${w}/search?q=${encodeURIComponent(zhKeyword)}&ko=${encodeURIComponent(koKeyword)}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      if (!data || !Array.isArray(data.items)) throw new Error("응답 형식 오류");
      renderProducts(data.items);
      resultLabel.textContent = `${data.items.length}개`;
      return;
    } catch (e) {
      setStatus("백엔드 실패 — Jina로 폴백: " + e.message, "err");
    }
  }

  // Jina Reader 직접 호출 — 백엔드 없이 동작 (무료, rate limit 있음)
  resultLabel.textContent = "Jina 검색 중…";
  let lastDebug = null;
  try {
    // 데스크탑 URL 먼저, 실패 시 모바일 URL 폴백
    const variants = [
      `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(zhKeyword)}&source=web_search_result_notes`,
      `https://www.xiaohongshu.com/search?keyword=${encodeURIComponent(zhKeyword)}`,
    ];
    let items = [];
    for (const v of variants) {
      const result = await searchViaJina(v, zhKeyword);
      lastDebug = result.debug;
      if (result.items.length) { items = result.items; break; }
    }
    if (!items.length) {
      const dbg = lastDebug || {};
      const isBlocked = !!dbg.blocked;
      results.innerHTML = `
        <div class="empty">
          <div style="margin-bottom:12px; font-size:15px; color:#ff6b6b">
            ${isBlocked
              ? "🚫 샤오홍슈가 봇으로 탐지해서 검색 결과 대신 일반 홈페이지를 줬어요."
              : "결과를 못 가져왔어요."}
          </div>
          <div style="text-align:left;background:#0c0e13;padding:12px;border-radius:8px;font-family:monospace;font-size:11px;color:#9aa3b2;margin-bottom:12px">
            <div><b>Jina 응답 진단:</b></div>
            <div>· 제목: ${(dbg.title || "(없음)").slice(0, 80)}</div>
            <div>· 콘텐츠 길이: ${dbg.contentLength || 0} 자</div>
            <div>· 키워드 포함 여부: ${dbg.keywordInContent ? "✅" : "❌"}</div>
            <div>· 차단 감지: ${isBlocked ? "✅ (홈페이지 응답)" : "❌"}</div>
            <div>· 이미지 ${dbg.totalImages || 0}개 (XHS: ${dbg.xhsImages || 0})</div>
            <div>· 링크 ${dbg.totalLinks || 0}개 (XHS 노트: ${dbg.xhsLinks || 0})</div>
          </div>
          <div style="text-align:left">
            <b>해결 방법:</b><br>
            1. 위쪽 노란 박스에 "✅ 크롬 확장" 메시지 떴는지 확인. 안 떴으면 확장 설치/새로고침 필요<br>
            2. <b>🔗 샤오홍슈에서 직접 보기</b> 버튼으로 본인 브라우저에서 확인<br>
            3. 또는 Cloudflare Worker 배포
          </div>
        </div>`;
      resultLabel.textContent = "0개";
      return;
    }
    renderProducts(items);
    resultLabel.textContent = `${items.length}개 (Jina)`;
  } catch (e) {
    results.innerHTML = `<div class="empty">Jina 검색 실패: ${e.message}<br>⚙️ 백엔드 설정으로 Cloudflare Worker를 배포하면 더 안정적입니다.</div>`;
    resultLabel.textContent = "오류";
  }
}

// Jina AI Reader: 어떤 URL이든 실제 브라우저로 렌더링해서 콘텐츠 추출.
// 무료, CORS OK, 약 20 req/min 한도.
async function searchViaJina(xhsUrl, zhKeyword) {
  const jinaUrl = `https://r.jina.ai/${xhsUrl}`;
  const r = await fetch(jinaUrl, {
    headers: {
      "Accept": "application/json",
      "X-With-Images-Summary": "all",
      "X-With-Links-Summary": "true",
    },
  });
  if (!r.ok) throw new Error("Jina HTTP " + r.status);
  const data = await r.json();
  const payload = data.data || data;
  return parseJinaResponse(payload, zhKeyword);
}

function parseJinaResponse(payload, zhKeyword) {
  const images = payload.images || {};
  const links = payload.links || {};
  const content = payload.content || "";
  const title = (payload.title || "").trim();

  // 샤오홍슈가 봇 탐지해서 검색 결과 대신 홈페이지를 반환하는 경우 감지
  // 핵심 신호: 응답에 검색 키워드가 전혀 없음. 검색 결과 페이지라면 제목·콘텐츠 어디든 키워드 등장.
  const titleHasKeyword = zhKeyword && title.indexOf(zhKeyword) >= 0;
  const contentHasKeyword = zhKeyword && content.indexOf(zhKeyword) >= 0;
  // 키워드 일부 글자도 체크 (예: "炊具架" → "炊具" 만 매칭되어도 검색 페이지로 인정)
  const partialMatch = zhKeyword && zhKeyword.length >= 2 &&
    (content.indexOf(zhKeyword.slice(0, -1)) >= 0 || title.indexOf(zhKeyword.slice(0, -1)) >= 0);
  const blocked = !titleHasKeyword && !contentHasKeyword && !partialMatch;

  // 샤오홍슈 이미지 호스트 패턴 (느슨하게)
  const xhsImageRe = /xhscdn|xiaohongshu|sns-(?:img|webpic|avatar|video)|picasso-static/i;
  const imageEntries = Object.entries(images).filter(([, u]) => xhsImageRe.test(u));

  // 샤오홍슈 노트 URL 패턴
  const noteLinkRe = /xiaohongshu\.com\/(?:explore|discovery\/item|user\/profile)\/([0-9a-f]+)/i;
  const noteLinks = Object.entries(links).filter(([, u]) => noteLinkRe.test(u));

  // markdown 내 ![alt](url) 추가 수집 (호스트 필터 풀어서 모든 이미지)
  const mdImages = [...content.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/gi)]
    .map((m) => ({ alt: m[1] || "", url: m[2] }));
  const mdXhsImages = mdImages.filter((x) => xhsImageRe.test(x.url));

  const debug = {
    title: payload.title || "",
    contentLength: content.length,
    contentFirstLine: (content.split("\n").find((l) => l.trim()) || "").slice(0, 200),
    totalImages: Object.keys(images).length,
    xhsImages: imageEntries.length,
    totalLinks: Object.keys(links).length,
    xhsLinks: noteLinks.length,
    mdImages: mdImages.length,
    mdXhsImages: mdXhsImages.length,
    blocked,
    keywordInContent,
  };
  console.log("[XHS] Jina 응답 진단:", debug);
  console.log("[XHS] 응답 첫 1000자:", content.slice(0, 1000));

  // 차단 감지 시 잘못된 결과(홈페이지의 인기글) 안 보여주고 비어있는 채로 반환
  if (blocked) {
    console.warn("[XHS] 봇 차단 감지 — 홈페이지 인기글이 결과로 잡힐 위험. 빈 결과 반환.");
    return { items: [], debug };
  }

  const items = [];
  const seen = new Set();
  for (const [text, url] of noteLinks) {
    const m = url.match(noteLinkRe);
    const id = m && m[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const matchedImg = imageEntries[items.length];
    const md = mdXhsImages[items.length] || mdImages[items.length];
    items.push({
      id,
      title: text || "",
      image: (matchedImg && matchedImg[1]) || (md && md.url) || "",
      url,
      keyword: zhKeyword,
    });
    if (items.length >= 12) break;
  }

  // 노트 링크가 안 잡혔으면 XHS 이미지만으로 카드 생성
  if (items.length === 0 && imageEntries.length) {
    imageEntries.slice(0, 10).forEach(([alt, url], i) => {
      items.push({
        id: "jina-" + i,
        title: (alt || "").slice(0, 60),
        image: url,
        url: "",
        keyword: zhKeyword,
      });
    });
  }

  // 그래도 0개면 md 이미지만이라도 (XHS 호스트 검증 없이)
  if (items.length === 0 && mdImages.length) {
    mdImages.slice(0, 10).forEach((x, i) => {
      items.push({
        id: "md-" + i,
        title: x.alt.slice(0, 60),
        image: x.url,
        url: "",
        keyword: zhKeyword,
      });
    });
  }
  return { items, debug };
}

function renderProducts(items) {
  if (!items.length) {
    results.innerHTML = `<div class="empty">검색 결과 없음</div>`;
    return;
  }
  const grid = document.createElement("div");
  grid.className = "grid";
  items.slice(0, 10).forEach((it, i) => {
    const card = document.createElement("div");
    card.className = "item";
    card.dataset.idx = i;
    card.innerHTML = `
      <div class="thumb">${it.image ? `<img src="${it.image}" referrerpolicy="no-referrer" loading="lazy">` : ""}</div>
      <div class="num">${i + 1}</div>
      <div class="meta">
        <div class="title">${(it.title || "").replace(/[<>]/g, "")}</div>
        <div class="price">${it.price || ""}</div>
      </div>`;
    card.addEventListener("click", () => onProductPick(i, it));
    grid.appendChild(card);
  });
  results.innerHTML = "";
  results.appendChild(grid);
}

function onProductPick(idx, item) {
  // 다음 단계(같은 제품 찾기)에서 구현
  setStatus(`#${idx + 1} 선택됨: "${item.title || ""}". 같은 제품 찾기는 다음 단계에서 활성화됩니다.`, "ok");
}

// ===== YouTube 프레임 캡쳐 =====
// 우선순위: (1) 스토리보드(정확한 시점, 저화질) → (2) 직접 영상 URL canvas(정확한 시점, 고화질, CORS 이슈) → (3) 공개 썸네일(부정확)

// YouTube 페이지를 공용 프록시 통해 직접 받아 ytInitialPlayerResponse 안의 스토리보드 spec 추출
async function fetchViaProxies(url, mustContain) {
  const proxies = [
    { make: (u) => `https://r.jina.ai/${u}`, headers: { "X-Return-Format": "html" } },
    { make: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
    { make: (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}` },
    { make: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}` },
    { make: (u) => `https://thingproxy.freeboard.io/fetch/${u}` },
  ];
  let lastErr;
  for (const p of proxies) {
    try {
      const r = await fetch(p.make(url), { headers: p.headers || {} });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const text = await r.text();
      if (text.length > 20000 && (!mustContain || text.includes(mustContain))) return text;
      throw new Error("응답 부적합 (" + text.length + "b)");
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("모든 프록시 실패");
}

async function fetchYouTubePageHtml(videoId) {
  return fetchViaProxies(`https://www.youtube.com/watch?v=${videoId}`, "ytInitialPlayerResponse");
}

// 중괄호 균형 맞춰 완전한 JSON 객체 문자열 추출
function extractBalancedJson(str) {
  let depth = 0, inStr = false, esc = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return str.slice(0, i + 1); }
  }
  return str;
}

// YouTube 검색 결과 페이지 HTML에서 영상 목록 파싱 (duration 포함!)
function parseYouTubeSearchHtml(html) {
  const m = html.match(/ytInitialData\s*=\s*(\{[\s\S]+)/);
  if (!m) throw new Error("ytInitialData 못 찾음");
  let data;
  try { data = JSON.parse(extractBalancedJson(m[1])); }
  catch (e) { throw new Error("ytInitialData JSON 파싱 실패: " + e.message); }

  const items = [];
  const seen = new Set();
  const parseDur = (t) => {
    if (!t) return 0;
    const p = String(t).trim().split(":").map((x) => parseInt(x) || 0);
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    if (p.length === 2) return p[0] * 60 + p[1];
    return 0;
  };
  const parseV = (t) => { const d = String(t || "").replace(/[^\d]/g, ""); return d ? parseInt(d) : 0; };
  const txt = (o) => !o ? "" : (o.simpleText || (o.runs ? o.runs.map((r) => r.text).join("") : ""));

  function walk(obj) {
    if (!obj || typeof obj !== "object") return;
    if (obj.videoRenderer) {
      const v = obj.videoRenderer;
      const id = v.videoId;
      if (id && !seen.has(id)) {
        seen.add(id);
        const th = (v.thumbnail && v.thumbnail.thumbnails) || [];
        items.push({
          title: txt(v.title),
          url: `https://www.youtube.com/watch?v=${id}`,
          thumbnail: th.length ? th[th.length - 1].url : `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
          videoId: id,
          uploaderName: txt(v.ownerText) || txt(v.longBylineText),
          views: parseV(txt(v.viewCountText)),
          duration: parseDur(txt(v.lengthText)),
        });
      }
    }
    if (obj.reelItemRenderer) {
      const v = obj.reelItemRenderer;
      const id = v.videoId;
      if (id && !seen.has(id)) {
        seen.add(id);
        const th = (v.thumbnail && v.thumbnail.thumbnails) || [];
        items.push({
          title: txt(v.headline),
          url: `https://www.youtube.com/watch?v=${id}`,
          thumbnail: th.length ? th[th.length - 1].url : `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
          videoId: id,
          uploaderName: "",
          views: parseV(txt(v.viewCountText)),
          duration: 30,
        });
      }
    }
    // 새 숏폼 형식 (shortsLockupViewModel)
    if (obj.shortsLockupViewModel) {
      const v = obj.shortsLockupViewModel;
      let id =
        (v.onTap && v.onTap.innertubeCommand && v.onTap.innertubeCommand.reelWatchEndpoint && v.onTap.innertubeCommand.reelWatchEndpoint.videoId) ||
        (v.navigationEndpoint && v.navigationEndpoint.reelWatchEndpoint && v.navigationEndpoint.reelWatchEndpoint.videoId) ||
        (v.entityId && String(v.entityId).replace(/^shorts-?/, "")) || "";
      if (id && !seen.has(id)) {
        seen.add(id);
        const title =
          (v.overlayMetadata && v.overlayMetadata.primaryText && v.overlayMetadata.primaryText.content) ||
          v.accessibilityText || "";
        const viewText =
          (v.overlayMetadata && v.overlayMetadata.secondaryText && v.overlayMetadata.secondaryText.content) || "";
        const srcs = (v.thumbnail && v.thumbnail.sources) || [];
        items.push({
          title,
          url: `https://www.youtube.com/watch?v=${id}`,
          thumbnail: srcs.length ? srcs[srcs.length - 1].url : `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
          videoId: id,
          uploaderName: "",
          views: parseV(viewText),
          duration: 30,
        });
      }
    }
    for (const k in obj) {
      if (obj[k] && typeof obj[k] === "object") walk(obj[k]);
    }
  }
  walk(data);
  return items;
}

// YouTube 페이지 HTML에서 스토리보드 spec 파싱 → 내부 형식으로 변환
function parseStoryboardFromYouTubeHtml(html) {
  // ytInitialPlayerResponse = {...};
  let m = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\})\s*;[\s\S]*?<\/script>/);
  if (!m) m = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\})\s*;/);
  if (!m) throw new Error("ytInitialPlayerResponse 못 찾음");
  let json;
  try { json = JSON.parse(m[1]); }
  catch (e) {
    // 일부 응답은 끝부분 잘려있을 수 있음 — 첫 닫는 중괄호까지 자르기 시도
    try {
      let raw = m[1];
      let depth = 0, end = -1;
      for (let i = 0; i < raw.length; i++) {
        if (raw[i] === "{") depth++;
        else if (raw[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
      }
      if (end > 0) json = JSON.parse(raw.slice(0, end));
      else throw e;
    } catch (e2) { throw new Error("JSON 파싱 실패: " + e2.message); }
  }
  const spec = json && json.storyboards && json.storyboards.playerStoryboardSpecRenderer && json.storyboards.playerStoryboardSpecRenderer.spec;
  const duration = (json && json.videoDetails && parseInt(json.videoDetails.lengthSeconds)) || null;
  if (!spec) throw new Error("playerStoryboardSpecRenderer.spec 없음");
  // spec format: URL_BASE|L0params|L1params|L2params...
  const parts = spec.split("|");
  const urlBase = parts[0];
  const levels = parts.slice(1);
  if (!levels.length) throw new Error("L 파라미터 없음");
  // 가장 큰 화질(보통 마지막)
  const lastIdx = levels.length - 1;
  // params: width#height#count#cols#rows#duration#name#signature
  const p = levels[lastIdx].split("#");
  if (p.length < 8) throw new Error("L 파라미터 형식 오류 (" + p.length + "개)");
  const width = parseInt(p[0]);
  const height = parseInt(p[1]);
  const count = parseInt(p[2]);
  const cols = parseInt(p[3]);
  const rows = parseInt(p[4]);
  const durMs = parseInt(p[5]);
  const name = p[6];
  const sigh = p[7];
  const framesPerSheet = cols * rows;
  const sheets = Math.max(1, Math.ceil(count / framesPerSheet));
  const urls = [];
  for (let mi = 0; mi < sheets; mi++) {
    let u = urlBase
      .replace(/\$L/g, String(lastIdx))
      .replace(/\$M/g, String(mi))
      .replace(/\$N/g, name);
    if (!/[?&]sigh=/.test(u)) u += (u.includes("?") ? "&" : "?") + "sigh=" + sigh;
    urls.push(u);
  }
  return {
    storyboard: {
      urls,
      frameWidth: width,
      frameHeight: height,
      totalCount: count,
      framesPerPageX: cols,
      framesPerPageY: rows,
      durationPerFrame: durMs,
    },
    duration,
  };
}

// Invidious 공개 인스턴스 (Piped와 비슷한 YouTube 미러)
const INVIDIOUS_INSTANCES = [
  "https://invidious.snopyta.org",
  "https://yewtu.be",
  "https://vid.puffyan.us",
  "https://invidious.fdn.fr",
  "https://invidious.osi.kr",
  "https://invidious.privacydev.net",
  "https://iv.melmac.space",
  "https://invidious.protokolla.fi",
];

async function invidiousFetch(path) {
  let lastErr;
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const r = await fetch(base + path);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      return { data, base };
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("모든 Invidious 인스턴스 실패");
}

// Invidious 응답을 우리 내부 형식(Piped와 동일)으로 변환
function normalizeInvidiousVideo(invidiousData) {
  const out = {
    duration: invidiousData.lengthSeconds || 0,
    previewFrames: [],
    videoStreams: [],
  };
  // 스토리보드 변환
  const sbs = invidiousData.storyboards || [];
  for (const sb of sbs) {
    if (!sb.count) continue;
    const urls = [];
    if (sb.templateUrl) {
      const sheets = sb.storyboardCount || 1;
      for (let i = 0; i < sheets; i++) {
        urls.push(sb.templateUrl.replace(/\$M/g, String(i)));
      }
    } else if (sb.url) {
      urls.push(sb.url);
    }
    if (!urls.length) continue;
    out.previewFrames.push({
      urls,
      frameWidth: sb.width,
      frameHeight: sb.height,
      totalCount: sb.count,
      framesPerPageX: sb.storyboardWidth,
      framesPerPageY: sb.storyboardHeight,
      durationPerFrame: sb.interval, // ms 단위
    });
  }
  // formatStreams + adaptiveFormats 중 video 스트림
  const fmts = (invidiousData.formatStreams || []).concat(invidiousData.adaptiveFormats || []);
  for (const f of fmts) {
    if (!f.type || !/video/i.test(f.type)) continue;
    out.videoStreams.push({
      url: f.url,
      quality: f.qualityLabel || f.quality || "",
      mimeType: f.type,
    });
  }
  return out;
}
async function extractStoryboardFrame(sb, timeSeconds) {
  const { urls, frameWidth, frameHeight, totalCount, framesPerPageX, framesPerPageY, durationPerFrame } = sb;
  const framesPerPage = framesPerPageX * framesPerPageY;
  let frameIdx = Math.floor((timeSeconds * 1000) / durationPerFrame);
  if (frameIdx >= totalCount) frameIdx = totalCount - 1;
  if (frameIdx < 0) frameIdx = 0;
  const pageIdx = Math.floor(frameIdx / framesPerPage);
  const inPage = frameIdx % framesPerPage;
  const col = inPage % framesPerPageX;
  const row = Math.floor(inPage / framesPerPageX);
  const spriteUrl = urls[pageIdx];
  if (!spriteUrl) throw new Error("스토리보드 페이지 URL 없음");

  const img = new Image();
  img.crossOrigin = "anonymous";
  const loaded = new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => rej(new Error("스토리보드 이미지 로드 실패"));
    setTimeout(() => rej(new Error("스토리보드 로드 타임아웃 (8초)")), 8000);
  });
  img.src = spriteUrl;
  await loaded;

  const canvas = document.createElement("canvas");
  canvas.width = frameWidth;
  canvas.height = frameHeight;
  canvas.getContext("2d").drawImage(
    img, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight
  );
  try {
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch (e) {
    throw new Error("CORS: 스토리보드 canvas tainted");
  }
}

async function captureVideoFrames(videoId, modalEl) {
  const statusEl = modalEl.querySelector("#ytFrameStatus");
  const progressEl = modalEl.querySelector("#ytFrameProgress");
  const progressBar = modalEl.querySelector("#ytFrameProgressBar");
  const progressLabel = modalEl.querySelector("#ytFrameProgressLabel");
  const framesContainer = modalEl.querySelector("#ytFrames");
  const framesGrid = modalEl.querySelector("#ytFramesGrid");
  const btn = modalEl.querySelector("#ytCaptureFrames");

  const setProgress = (pct, label) => {
    progressEl.classList.add("shown");
    progressBar.style.width = Math.min(100, pct) + "%";
    progressLabel.textContent = label + " (" + Math.floor(pct) + "%)";
  };
  const setStatusFrame = (msg, kind) => {
    statusEl.textContent = msg;
    statusEl.style.color = kind === "err" ? "#ff6b6b" : kind === "ok" ? "#38d39f" : "var(--muted)";
  };
  const renderFrames = (frames, modeLabel) => {
    framesContainer.style.display = "block";
    framesGrid.innerHTML = "";
    frames.forEach((f, i) => {
      const card = document.createElement("div");
      card.style.cssText = "background: var(--panel2); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; cursor: pointer;";
      card.innerHTML = `
        <img src="${f.dataUrl}" style="width:100%; aspect-ratio:16/9; object-fit:cover; display:block; background:#000;" referrerpolicy="no-referrer" />
        <div style="padding: 6px 10px; font-size: 11px; color: var(--muted); display:flex; justify-content: space-between;">
          <span>${f.label || (f.time != null ? f.time.toFixed(1) + "초" : "")}</span>
          <a href="${f.dataUrl}" download="frame_${i + 1}.jpg" target="_blank" rel="noopener" style="color:var(--accent); text-decoration:none;">⬇ 저장</a>
        </div>`;
      card.addEventListener("click", (e) => {
        if (e.target.tagName === "A") return;
        window.open(f.dataUrl, "_blank");
      });
      framesGrid.appendChild(card);
    });
  };

  btn.disabled = true;
  btn.textContent = "⏳ 캡쳐 중…";
  framesContainer.style.display = "none";
  framesGrid.innerHTML = "";
  setProgress(5, "Piped에서 영상 메타데이터 가져오는 중");

  let streamData = null;
  let pipedError = null;
  let invidiousError = null;
  let usedSource = null;

  // (a) Piped 먼저
  try {
    setProgress(7, "Piped에서 영상 메타데이터 가져오는 중");
    const r = await pipedFetch(`/streams/${videoId}`);
    streamData = r.data;
    usedSource = "Piped";
    console.log("[Capture] Piped OK. keys:", Object.keys(streamData || {}), "duration:", streamData.duration, "previewFrames:", (streamData.previewFrames || []).length);
  } catch (e) {
    pipedError = e.message;
    console.warn("[Capture] Piped 실패:", e.message);
  }

  // (b) Piped 실패 시 Invidious 시도
  if (!streamData) {
    try {
      setProgress(12, "Invidious 인스턴스 시도 중");
      const r = await invidiousFetch(`/api/v1/videos/${videoId}`);
      streamData = normalizeInvidiousVideo(r.data);
      usedSource = "Invidious (" + new URL(r.base).host + ")";
      console.log("[Capture] Invidious OK. duration:", streamData.duration, "previewFrames:", streamData.previewFrames.length);
    } catch (e) {
      invidiousError = e.message;
      console.warn("[Capture] Invidious 실패:", e.message);
    }
  }

  // (c) Piped/Invidious 다 실패 시 — 공용 CORS 프록시로 YouTube 페이지 직접 파싱
  let ytScrapeError = null;
  if (!streamData) {
    try {
      setProgress(17, "공용 프록시로 YouTube 페이지 직접 가져오는 중");
      const html = await fetchYouTubePageHtml(videoId);
      console.log("[Capture] YouTube 페이지 받음:", html.length, "bytes");
      const parsed = parseStoryboardFromYouTubeHtml(html);
      streamData = {
        duration: parsed.duration,
        previewFrames: [parsed.storyboard],
        videoStreams: [],
      };
      usedSource = "공용 프록시 + YouTube 직접 파싱";
      console.log("[Capture] 파싱 성공. duration:", parsed.duration, "스토리보드:", parsed.storyboard);
    } catch (e) {
      ytScrapeError = e.message;
      console.warn("[Capture] YouTube 직접 파싱 실패:", e.message);
    }
  }
  if (usedSource) setStatusFrame("📡 데이터 출처: " + usedSource, "");

  // (1) 스토리보드 시도 — 정확한 시점, 저화질 (확실)
  const previewFrames = (streamData && streamData.previewFrames) || [];
  const duration = streamData && streamData.duration;
  let storyboardReason = null;
  if (!streamData) storyboardReason = `Piped(${pipedError || "?"}) + Invidious(${invidiousError || "?"}) + YouTube직접(${ytScrapeError || "?"}) 모두 실패`;
  else if (!duration) storyboardReason = `${usedSource} 응답에 duration 없음`;
  else if (!previewFrames.length) storyboardReason = `${usedSource} 응답에 storyboards 없음 (이 영상은 스토리보드 미제공)`;

  if (!storyboardReason) {
    setProgress(20, `스토리보드 사용 (영상 ${Math.round(duration)}초)`);
    // 가장 큰 해상도(보통 마지막)
    const sb = previewFrames[previewFrames.length - 1];
    console.log("[Capture] 선택된 스토리보드:", { frameWidth: sb.frameWidth, frameHeight: sb.frameHeight, totalCount: sb.totalCount, urls: (sb.urls || []).length });
    const ratios = [0.1, 0.25, 0.5, 0.75, 0.9];
    const frames = [];
    let lastErr = null;
    for (let i = 0; i < ratios.length; i++) {
      const t = duration * ratios[i];
      setProgress(20 + ((i + 1) / ratios.length) * 70, `프레임 ${i + 1}/${ratios.length} (${Math.round(ratios[i] * 100)}%, ${t.toFixed(1)}초)`);
      try {
        const dataUrl = await extractStoryboardFrame(sb, t);
        frames.push({ time: t, ratio: ratios[i], dataUrl, label: `${Math.round(ratios[i] * 100)}% — ${t.toFixed(1)}초` });
      } catch (e) {
        lastErr = e.message;
        console.warn(`[Capture] sb frame ${i} failed:`, e.message);
      }
    }
    if (frames.length) {
      setProgress(100, `완료 — ${frames.length}장`);
      setTimeout(() => progressEl.classList.remove("shown"), 1500);
      renderFrames(frames, "storyboard");
      setStatusFrame(`✅ 스토리보드에서 ${frames.length}장 추출 (정확한 시점, ${sb.frameWidth}×${sb.frameHeight}px). 우클릭 또는 ⬇ 저장.`, "ok");
      btn.disabled = false;
      btn.textContent = "🎬 프레임 캡쳐 (영상에서 제품 잡기)";
      return;
    }
    storyboardReason = `스토리보드 이미지 추출 실패: ${lastErr || "원인 미상"}`;
    setStatusFrame(`스토리보드 단계 실패 (${storyboardReason}) — 다른 방법 시도`, "");
    console.warn("[Capture] 스토리보드 실패:", storyboardReason);
  } else {
    console.warn("[Capture] 스토리보드 건너뜀:", storyboardReason);
    setStatusFrame(`스토리보드 건너뜀: ${storyboardReason} — 다른 방법 시도`, "");
  }

  // (2) 직접 영상 URL → canvas (CORS 통과해야 됨)
  if (streamData && streamData.videoStreams && streamData.videoStreams.length) {
    setProgress(40, "스토리보드 없음 — 영상 직접 캡쳐 시도");
    const sorted = [...streamData.videoStreams].sort((a, b) => {
      const score = (s) => {
        const q = parseInt((s.quality || "").match(/\d+/) || ["0"])[0];
        const isMp4 = /mp4/i.test(s.mimeType || "") ? 0 : 1;
        return isMp4 * 1000 + Math.abs(q - 360);
      };
      return score(a) - score(b);
    });
    const stream = sorted[0];
    try {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.preload = "auto";
      video.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:240px;height:auto;";
      document.body.appendChild(video);
      await new Promise((resolve, reject) => {
        video.addEventListener("loadedmetadata", resolve, { once: true });
        video.addEventListener("error", () => reject(new Error("영상 로드 실패")), { once: true });
        video.src = stream.url;
        setTimeout(() => reject(new Error("메타데이터 로드 타임아웃")), 20000);
      });
      const dur = video.duration;
      if (!isFinite(dur) || dur < 1) throw new Error("영상 길이 못 읽음");
      const ratios = [0.1, 0.25, 0.5, 0.75, 0.9];
      const frames = [];
      for (let i = 0; i < ratios.length; i++) {
        const t = dur * ratios[i];
        setProgress(40 + ((i + 1) / ratios.length) * 55, `프레임 ${i + 1}/${ratios.length} (${Math.round(ratios[i] * 100)}%)`);
        try {
          await new Promise((res, rej) => {
            video.addEventListener("seeked", res, { once: true });
            video.currentTime = t;
            setTimeout(() => rej(new Error("seek 타임아웃")), 7000);
          });
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          canvas.getContext("2d").drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          frames.push({ time: t, ratio: ratios[i], dataUrl, label: `${Math.round(ratios[i] * 100)}% — ${t.toFixed(1)}초` });
        } catch (e) { console.warn(`frame ${i}:`, e.message); }
      }
      video.pause(); video.removeAttribute("src"); video.load(); video.remove();
      if (frames.length) {
        setProgress(100, "완료");
        setTimeout(() => progressEl.classList.remove("shown"), 1500);
        renderFrames(frames, "direct");
        setStatusFrame(`✅ 영상에서 직접 ${frames.length}장 캡쳐 (정확한 시점, ${video.videoWidth || "원본"}px 화질).`, "ok");
        btn.disabled = false;
        btn.textContent = "🎬 프레임 캡쳐 (영상에서 제품 잡기)";
        return;
      }
    } catch (e) {
      console.warn("[Capture] 직접 캡쳐 실패:", e.message);
    }
  }

  // (3) 최후 폴백: YouTube 공개 썸네일 4장 — NOT 정확한 시점
  setProgress(100, "폴백 모드");
  setTimeout(() => progressEl.classList.remove("shown"), 1500);
  const base = `https://img.youtube.com/vi/${videoId}`;
  const ytThumbs = [
    { dataUrl: `${base}/maxresdefault.jpg`, label: "기본 썸네일 (최고화질)" },
    { dataUrl: `${base}/1.jpg`, label: "자동선택 #1" },
    { dataUrl: `${base}/2.jpg`, label: "자동선택 #2" },
    { dataUrl: `${base}/3.jpg`, label: "자동선택 #3" },
  ];
  renderFrames(ytThumbs, "thumbs");
  setStatusFrame(
    `⚠️ 정확한 시점 캡쳐 실패 (${storyboardReason || "원인 미상"}). 대신 YouTube 자동 선택 4장 표시 — 25/50/75% 시점 아님. F12 콘솔의 [Capture] 로그에서 자세한 이유 확인 가능.`,
    "err"
  );
  btn.disabled = false;
  btn.textContent = "🎬 프레임 캡쳐 (영상에서 제품 잡기)";
}

// ===== 확장 진단 =====
async function runDiagnostic() {
  const out = $("diagResult");
  out.style.color = "var(--muted)";
  out.innerHTML = "";

  const log = (msg, kind) => {
    const line = document.createElement("div");
    line.style.cssText = "padding:2px 0;color:" + (kind === "ok" ? "#38d39f" : kind === "err" ? "#ff6b6b" : "#9aa3b2");
    line.textContent = msg;
    out.appendChild(line);
  };

  // 1. 확장 감지
  const v = await detectExtension();
  if (!v) { log("❌ 1단계: 확장 미감지. chrome://extensions 확인 필요.", "err"); return; }
  log("✅ 1단계: 확장 감지됨 (v" + v + ")", "ok");

  // 2. 간단한 URL 호출 (XHS 홈)
  log("⏳ 2단계: XHS 홈페이지 호출 시도…");
  try {
    const r1 = await extensionFetch("https://www.xiaohongshu.com/");
    log(`✅ 2단계: HTTP ${r1.status}, ${r1.length}bytes 받음`, "ok");
  } catch (e) {
    log(`❌ 2단계 실패: ${e.message}`, "err");
    log("→ 확장이 XHS에 도달 못함. 확장 권한 또는 네트워크 문제.", "err");
    return;
  }

  // 3. 검색 URL 변형들 테스트
  const tests = [
    { name: "검색 URL (영어 keyword=bag)", url: "https://www.xiaohongshu.com/search_result?keyword=bag" },
    { name: "검색 URL (중국어 炊具架)", url: "https://www.xiaohongshu.com/search_result?keyword=" + encodeURIComponent("炊具架") },
    { name: "검색 URL + source 파라미터", url: "https://www.xiaohongshu.com/search_result?keyword=bag&source=web_search_result_notes" },
    { name: "Explore 페이지", url: "https://www.xiaohongshu.com/explore" },
  ];
  let foundWorking = null;
  for (const t of tests) {
    log(`⏳ ${t.name}`);
    try {
      const r = await extensionFetch(t.url);
      log(`   ✅ HTTP ${r.status}, ${r.length}bytes`, "ok");
      if (!foundWorking && r.ok) foundWorking = { test: t, response: r };
    } catch (e) {
      log(`   ❌ ${e.message}`, "err");
    }
  }

  if (foundWorking) {
    const r = foundWorking.response;
    log(`\n→ 작동 가능 URL 발견: ${foundWorking.test.name}`, "ok");
    const hasState = /window\.__INITIAL_STATE__/.test(r.text);
    const hasNotes = /\/explore\/[0-9a-f]{20,}/.test(r.text);
    const hasLogin = /登录|登陆|please log in/i.test(r.text.slice(0, 5000));
    log(`   · __INITIAL_STATE__: ${hasState ? "✅" : "❌"}`, hasState ? "ok" : "err");
    log(`   · 로그인 페이지인가: ${hasLogin ? "⚠️ YES" : "✅ NO"}`, hasLogin ? "err" : "ok");
    log(`   · 노트 링크 있음: ${hasNotes ? "✅" : "❌"}`, hasNotes ? "ok" : "err");
  } else {
    log(`\n❌ 모든 검색 URL이 직접 fetch로는 실패.`, "err");
  }

  // 4. 탭 기반 검색 테스트 (직접 fetch가 안 될 때의 폴백)
  log(`\n⏳ 4단계: 탭 기반 검색 테스트 (잠깐 백그라운드 탭이 열렸다 닫힘)…`);
  try {
    const tabR = await extensionTabSearch("炊具架");
    if (!tabR) { log(`❌ 탭에서 데이터 못 받음`, "err"); return; }
    log(`   결과 종류: ${tabR.kind || "?"}`, "");

    if (tabR.kind === "xhr" && tabR.apiJson) {
      log(`✅ XHR 인터셉트 성공! 검색 API 응답 ${tabR.apiJson.length}자 수신`, "ok");
      log(`   API URL: ${tabR.apiUrl}`, "");
      try {
        const items = parseXhsApi(tabR.apiJson, "炊具架");
        log(`   → ${items.length}개 결과 추출`, items.length ? "ok" : "err");
        if (items[0]) log(`   첫 결과: "${(items[0].title || "").slice(0, 30)}"`, "ok");
        if (!items.length) console.log("[XHS-Diag] API JSON 첫 3000자:", tabR.apiJson.slice(0, 3000));
      } catch (e) { log(`❌ API 파싱 실패: ${e.message}`, "err"); }
    } else if (tabR.kind === "state" && tabR.json) {
      log(`⚠️ XHR 인터셉트 실패 → state fallback. ${tabR.json.length}자`, "err");
      try {
        const items = parseXhsState(tabR.json, "炊具架");
        log(`   → ${items.length}개 결과`, items.length ? "ok" : "err");
        if (!items.length) {
          const state = JSON.parse(tabR.json);
          log(`   · state 키: [${Object.keys(state).slice(0, 8).join(", ")}…]`, "");
          console.log("[XHS-Diag] state JSON 첫 3000자:", tabR.json.slice(0, 3000));
        }
      } catch (e) { log(`❌ state 파싱 실패: ${e.message}`, "err"); }
    }
  } catch (e) {
    log(`❌ 탭 검색 실패: ${e.message}`, "err");
  }
}

document.getElementById("diagBtn").addEventListener("click", runDiagnostic);

// ===== 확장프로그램 경유 샤오홍슈 검색 =====
// 1차: 직접 fetch (빠르지만 XHS가 search_result URL을 차단할 수 있음)
// 2차: 백그라운드 탭으로 페이지 열어서 __INITIAL_STATE__ 추출 (느리지만 본인 브라우저로 진짜 로드)
async function searchViaExtension(zhKeyword) {
  const url = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(zhKeyword)}&source=web_search_result_notes`;
  try {
    const r = await extensionFetch(url);
    const items = parseXhsHtml(r.text, zhKeyword);
    if (items.length) return items;
    console.log("[XHS] 직접 fetch는 성공했지만 items 0개 → 탭 모드로 재시도");
  } catch (e) {
    console.log("[XHS] 직접 fetch 실패:", e.message, "→ 탭 모드로 시도");
  }

  // 탭 모드: 본인 브라우저로 실제 페이지 로드 + XHR 인터셉터로 검색 API 응답 캐치
  setStatus("새 탭으로 샤오홍슈 페이지 열고 검색 API 응답 대기 중… (잠깐 보였다 닫혀요)", "ok");
  const tabResult = await extensionTabSearch(zhKeyword);
  if (!tabResult) throw new Error("탭에서 데이터 없음");
  if (tabResult.kind === "xhr" && tabResult.apiJson) {
    console.log("[XHS] XHR 인터셉트로 API 응답 받음:", tabResult.apiUrl, tabResult.apiJson.length, "bytes");
    return parseXhsApi(tabResult.apiJson, zhKeyword);
  }
  if (tabResult.kind === "state" && tabResult.json) {
    console.log("[XHS] state fallback 사용:", tabResult.json.length, "bytes");
    return parseXhsState(tabResult.json, zhKeyword);
  }
  throw new Error("알 수 없는 탭 결과 형식: " + (tabResult.kind || "?"));
}

// 샤오홍슈 검색 API JSON 응답 파싱
// API 응답 구조: { success/code, data: { items: [{ id, model_type, note_card: {...} }, ...] } }
function parseXhsApi(json, zhKeyword) {
  let data;
  try { data = JSON.parse(json); } catch (e) { throw new Error("API JSON 파싱 실패: " + e.message); }
  const items = [];
  const list = (data.data && (data.data.items || data.data.list || data.data.notes)) ||
               data.items || data.list || data.notes || [];
  console.log("[XHS] API 응답 아이템 수:", Array.isArray(list) ? list.length : 0, "data keys:", Object.keys(data || {}));
  if (!Array.isArray(list)) return items;

  for (const it of list) {
    const note = it.note_card || it.noteCard || it.note || it;
    if (!note) continue;
    const id = it.id || note.id || note.noteId || note.note_id;
    if (!id) continue;
    const cover =
      (note.cover && (note.cover.url_default || note.cover.url || note.cover.urlDefault || note.cover.url_pre)) ||
      (note.image_list && note.image_list[0] && (note.image_list[0].url_default || note.image_list[0].url)) ||
      (note.imageList && note.imageList[0] && (note.imageList[0].urlDefault || note.imageList[0].url)) ||
      "";
    items.push({
      id,
      title: note.display_title || note.displayTitle || note.title || note.desc || "",
      image: cover,
      author: (note.user && (note.user.nickname || note.user.nick_name || note.user.nickName)) || "",
      likes: (note.interact_info && (note.interact_info.liked_count || note.interact_info.likedCount)) ||
             (note.interactInfo && (note.interactInfo.likedCount || note.interactInfo.liked_count)) || "",
      url: `https://www.xiaohongshu.com/explore/${id}`,
      keyword: zhKeyword,
    });
    if (items.length >= 12) break;
  }
  return items;
}

// __INITIAL_STATE__ JSON 문자열에서 검색 결과 노트 추출
// state 구조가 자주 바뀌므로 깊이 우선 탐색으로 노트 형태 객체를 어디서든 찾기.
function parseXhsState(json, zhKeyword) {
  let state;
  try { state = JSON.parse(json); } catch (e) { throw new Error("__INITIAL_STATE__ JSON 파싱 실패: " + e.message); }

  const found = [];
  const SEEN_PATHS = new Set();

  function isNoteLike(node) {
    if (!node || typeof node !== "object" || Array.isArray(node)) return false;
    const id = node.id || node.noteId || node.note_id;
    if (!id || String(id).length < 16) return false; // XHS 노트 ID는 24자 hex
    const hasMedia =
      node.cover ||
      node.imageList || node.image_list ||
      node.images || node.video ||
      (node.noteCard && (node.noteCard.cover || node.noteCard.imageList));
    const hasText = node.displayTitle || node.title || node.desc || (node.noteCard && (node.noteCard.displayTitle || node.noteCard.title));
    return !!(hasMedia && hasText);
  }

  function walk(node, path, depth) {
    if (depth > 8 || node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (let i = 0; i < Math.min(node.length, 100); i++) walk(node[i], path + "[" + i + "]", depth + 1);
      return;
    }
    if (isNoteLike(node) && !SEEN_PATHS.has(path)) {
      SEEN_PATHS.add(path);
      found.push({ path, node });
    }
    for (const k of Object.keys(node)) {
      walk(node[k], path ? path + "." + k : k, depth + 1);
    }
  }
  walk(state, "", 0);

  console.log("[XHS] deep scan: 노트 형태 객체", found.length, "개 발견");
  if (found.length) {
    console.log("[XHS] 첫 3개 경로:", found.slice(0, 3).map((f) => f.path));
    console.log("[XHS] 첫 노트 샘플:", found[0].node);
  } else {
    console.warn("[XHS] state에서 노트를 못 찾음. state keys:", Object.keys(state || {}));
    if (state.search) console.warn("[XHS] state.search keys:", Object.keys(state.search));
  }

  const items = [];
  const seen = new Set();
  for (const { node } of found) {
    // noteCard 안에 있을 수도 있으니 한 번 더 풀어서 보기
    const inner = node.noteCard || node.note_card || node;
    const id = inner.id || inner.noteId || inner.note_id || node.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const cover =
      (inner.cover && (inner.cover.url || inner.cover.urlDefault || inner.cover.url_default || inner.cover.urlPre)) ||
      (inner.imageList && inner.imageList[0] && (inner.imageList[0].url || inner.imageList[0].urlDefault)) ||
      (inner.image_list && inner.image_list[0] && (inner.image_list[0].url || inner.image_list[0].url_default)) ||
      "";
    items.push({
      id,
      title: inner.displayTitle || inner.title || inner.desc || "",
      image: cover,
      author: (inner.user && (inner.user.nickname || inner.user.nickName)) || "",
      likes: (inner.interactInfo && (inner.interactInfo.likedCount || inner.interactInfo.liked_count)) || "",
      url: `https://www.xiaohongshu.com/explore/${id}`,
      keyword: zhKeyword,
    });
    if (items.length >= 12) break;
  }
  return items;
}

function parseXhsHtml(html, zhKeyword) {
  const items = [];

  // (1) window.__INITIAL_STATE__ = {...} 에 검색 결과 JSON이 박혀있음
  const m = html.match(/window\.__INITIAL_STATE__\s*=\s*([\s\S]+?)\s*<\/script>/);
  if (m) {
    let json = m[1].trim();
    // 끝의 ; 제거
    json = json.replace(/;\s*$/, "");
    // XHS는 undefined를 그대로 넣는 일이 있어 정리
    json = json.replace(/:\s*undefined(?=[\s,}])/g, ": null");
    try {
      const state = JSON.parse(json);
      const searchObj = state.search || {};
      let feeds = searchObj.feeds;
      if (feeds && feeds._rawValue) feeds = feeds._rawValue;
      const list = Array.isArray(feeds) ? feeds : (feeds && (feeds.items || feeds.list)) || [];
      for (const n of list.slice(0, 20)) {
        const note = n.noteCard || n.note_card || n;
        if (!note) continue;
        const id = note.id || note.noteId || n.id || "";
        if (!id) continue;
        const cover =
          (note.cover && (note.cover.url || note.cover.urlDefault || note.cover.url_default)) ||
          (note.imageList && note.imageList[0] && note.imageList[0].url) || "";
        items.push({
          id,
          title: note.displayTitle || note.title || note.desc || "",
          image: cover,
          author: (note.user && (note.user.nickname || note.user.nickName)) || "",
          likes: (note.interactInfo && (note.interactInfo.likedCount || note.interactInfo.liked_count)) || "",
          url: `https://www.xiaohongshu.com/explore/${id}`,
          keyword: zhKeyword,
        });
        if (items.length >= 12) break;
      }
    } catch (e) {
      console.warn("[XHS] __INITIAL_STATE__ 파싱 실패:", e.message);
    }
  }

  // (2) 폴백: HTML 내 sns-webpic / xhscdn 이미지 + explore/{id} 링크 정규식
  if (items.length === 0) {
    const linkIds = [...html.matchAll(/\/explore\/([0-9a-f]{20,})/gi)]
      .map((mm) => mm[1]);
    const imgs = [...html.matchAll(/"(?:url|urlDefault|url_default)":"(https?:\\?\/\\?\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi)]
      .map((mm) => mm[1].replace(/\\u002F/g, "/").replace(/\\\//g, "/"))
      .filter((u) => /xhscdn|sns-webpic|sns-img|picasso/i.test(u));
    const uniqueIds = [...new Set(linkIds)].slice(0, 12);
    uniqueIds.forEach((id, i) => {
      items.push({
        id,
        title: "(상세 추출 실패)",
        image: imgs[i] || "",
        url: `https://www.xiaohongshu.com/explore/${id}`,
        keyword: zhKeyword,
      });
    });
  }

  console.log("[XHS] 확장 경유 결과:", items.length, "개");
  return items;
}

// ===== 추천 키워드 =====
// 백엔드가 있으면 AI(OpenAI) 호출, 없으면 키워드 변형(색상·스타일·계절 조합) 사용
async function refreshRecommended(koKeyword) {
  const w = getWorkerUrl();
  if (w) {
    try {
      const r = await fetch(`${w}/suggest?ko=${encodeURIComponent(koKeyword)}`);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      if (data && Array.isArray(data.suggestions) && data.suggestions.length) {
        renderChips(data.suggestions);
        recoLabel.textContent = "AI 추천 (" + koKeyword + " 관련)";
        return;
      }
    } catch { /* fallthrough */ }
  }
  // 폴백: 키워드 변형
  const list = generateLocalSuggestions(koKeyword);
  renderChips(list);
  recoLabel.textContent = `"${koKeyword}" 관련 (자동 변형)`;
}

function renderChips(list) {
  recommended.innerHTML = "";
  list.slice(0, 12).forEach((kw) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.dataset.q = kw;
    chip.textContent = kw;
    recommended.appendChild(chip);
  });
}

function generateLocalSuggestions(ko) {
  const parts = ko.trim().split(/\s+/).filter(Boolean);
  const head = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const last = parts[parts.length - 1] || ko;
  const colors = ["블랙", "화이트", "베이지", "핑크", "그린"];
  const styles = ["미니멀", "빈티지", "캐주얼", "오버사이즈"];
  const seasons = ["가을", "겨울", "봄", "여름"];
  const out = new Set();
  colors.forEach((c) => out.add((head ? head + " " : "") + c + " " + last));
  styles.forEach((s) => out.add((head ? head + " " : "") + s + " " + last));
  seasons.forEach((s) => out.add(s + " " + last));
  return [...out];
}

// 칩 클릭 → 검색창에 채우고 자동 검색
recommended.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  q.value = chip.dataset.q || chip.textContent;
  search();
});

searchBtn.addEventListener("click", search);
q.addEventListener("keydown", (e) => { if (e.key === "Enter") search(); });

// 샤오홍슈에서 직접 검색 열기 (백엔드 없어도 동작)
openXhs.addEventListener("click", () => {
  const zh = lastTranslation || zhText.textContent;
  if (!zh) return;
  const url = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(zh)}&source=web_search_result_notes`;
  window.open(url, "_blank", "noopener");
});

copyZh.addEventListener("click", async () => {
  const zh = lastTranslation || zhText.textContent;
  if (!zh) return;
  try {
    await navigator.clipboard.writeText(zh);
    setStatus("📋 중국어 키워드 복사됨: " + zh, "ok");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = zh; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
    setStatus("📋 복사됨", "ok");
  }
});

// ===== YouTube 검색 (Piped 공개 API 사용) =====
const ytQ = $("ytQ");
const ytSearchBtn = $("ytSearchBtn");
const ytQuickChips = $("ytQuickChips");
const ytStatus = $("ytStatus");
const ytResults = $("ytResults");

// 공개 Piped 인스턴스들 (하나 죽으면 다음거 시도)
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://api-piped.mha.fi",
  "https://pipedapi.adminforge.de",
  "https://piped-api.lunar.icu",
  "https://pipedapi.in.projectsegfau.lt",
  "https://pipedapi.r4fo.com",
  "https://pipedapi.darkness.services",
];

function setYtStatus(msg, kind = "") {
  ytStatus.className = "status " + kind;
  ytStatus.textContent = msg;
}

// 진행률 바: pct=null이면 숨김, 0~100 사이면 보임 + 라벨 갱신
let _ytProgressTimer = null;
function setYtProgress(pct, label) {
  const wrap = $("ytProgress");
  const bar = $("ytProgressBar");
  const lbl = $("ytProgressLabel");
  if (pct === null || pct === undefined) {
    wrap.classList.remove("shown");
    bar.style.width = "0%";
    if (_ytProgressTimer) { clearInterval(_ytProgressTimer); _ytProgressTimer = null; }
    return;
  }
  wrap.classList.add("shown");
  const target = Math.max(0, Math.min(100, pct));
  bar.style.width = target + "%";
  lbl.textContent = label ? `${label} (${Math.floor(target)}%)` : `${Math.floor(target)}%`;
  if (target >= 100) {
    setTimeout(() => setYtProgress(null), 600);
  }
}

// 단계 사이를 부드럽게 메우는 가짜 증가 (사용자가 멈춘 듯 안 보이게)
function startYtProgressDrift(from, to, durationMs, label) {
  if (_ytProgressTimer) clearInterval(_ytProgressTimer);
  const startTime = Date.now();
  setYtProgress(from, label);
  _ytProgressTimer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const ratio = Math.min(1, elapsed / durationMs);
    const cur = from + (to - from) * ratio;
    if (cur >= to) {
      clearInterval(_ytProgressTimer);
      _ytProgressTimer = null;
    }
    setYtProgress(cur, label);
  }, 100);
}

async function pipedFetch(path) {
  let lastErr;
  for (const base of PIPED_INSTANCES) {
    try {
      const r = await fetch(base + path);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      return { data, base };
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("모든 Piped 인스턴스 실패");
}

// Jina Reader로 YouTube 검색 페이지 가져오기 (Piped 다 죽었을 때 폴백)
async function youtubeViaJina(keyword) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}&sp=CAMSAhAB`; // sp = 조회수순
  const r = await fetch(`https://r.jina.ai/${url}`, {
    headers: { "Accept": "application/json", "X-With-Links-Summary": "true" },
  });
  if (!r.ok) throw new Error("Jina HTTP " + r.status);
  const data = await r.json();
  const payload = data.data || data;
  return parseYouTubeJina(payload);
}

function parseYouTubeJina(payload) {
  const links = payload.links || {};
  const content = payload.content || "";
  const items = [];
  const seen = new Set();

  // links: { "텍스트": "url" } — YouTube watch URL 매칭
  for (const [text, url] of Object.entries(links)) {
    const m = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (!m) continue;
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    // 텍스트가 너무 짧거나 일반적인 경우 스킵
    if (!text || text.length < 5 || /^(home|shorts|trending|subscribe)$/i.test(text)) continue;
    items.push({
      title: text,
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      videoId: id,
      uploaderName: "",
      views: 0,
      duration: 0,
    });
    if (items.length >= 12) break;
  }

  return items;
}

async function searchYouTube(keyword) {
  if (!keyword) return;
  setYtStatus(`YouTube 검색 중… "${keyword}"`);
  ytResults.innerHTML = "";

  // (1) Piped 시도 — 숏폼/롱폼 둘 다 충분히 받기 위해 nextpage도 1회 추가 시도
  let items = [];
  try {
    startYtProgressDrift(5, 30, 3000, "Piped 인스턴스 호출 중");
    const { data, base } = await pipedFetch(`/search?q=${encodeURIComponent(keyword)}&filter=videos`);
    let allItems = (data.items || []).filter((it) => it.type === "stream" || it.type === "video" || it.url);
    setYtProgress(45, `${allItems.length}개 수신, 다음 페이지 시도 중`);

    // 숏폼/롱폼 분류해서 한 쪽이 10개 미만이면 nextpage 추가 fetch
    const countByCategory = (list) => {
      const s = list.filter((it) => it.duration && it.duration <= 60).length;
      const l = list.filter((it) => it.duration && it.duration > 60).length;
      return { s, l };
    };
    let { s: shortsCount, l: longCount } = countByCategory(allItems);

    if ((shortsCount < 10 || longCount < 10) && data.nextpage) {
      try {
        const np = encodeURIComponent(data.nextpage);
        const { data: data2 } = await pipedFetch(`/nextpage/search?nextpage=${np}&q=${encodeURIComponent(keyword)}&filter=videos`);
        const moreItems = (data2.items || []).filter((it) => it.type === "stream" || it.type === "video" || it.url);
        allItems = allItems.concat(moreItems);
        ({ s: shortsCount, l: longCount } = countByCategory(allItems));
      } catch (e) {
        console.warn("[YT] nextpage 실패 (무시 가능):", e.message);
      }
    }

    setYtProgress(75, `숏폼 ${shortsCount}개 / 롱폼 ${longCount}개 분류 중`);
    items = allItems;
    if (items.length) {
      setYtProgress(95, "결과 렌더링");
      renderYtResults(items);
      setYtProgress(100, "완료");
      setYtStatus(`✅ 총 ${items.length}개 받음 (숏폼 ${shortsCount} · 롱폼 ${longCount}) — ${new URL(base).host}`, "ok");
      return;
    }
  } catch (e) {
    setYtStatus(`Piped 실패 — 공용 프록시로 YouTube 직접 파싱 시도: ${e.message}`);
  }

  // (2) 공용 프록시로 YouTube 검색 페이지 직접 파싱 (duration 포함!)
  try {
    startYtProgressDrift(40, 65, 5000, "공용 프록시로 YouTube 검색 페이지 가져오는 중");
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`;
    const html = await fetchViaProxies(url, "ytInitialData");
    setYtProgress(70, "검색 결과 파싱 중");
    items = parseYouTubeSearchHtml(html);
    if (!items.length) throw new Error("파싱 결과 0개");

    let sc = items.filter((it) => it.duration && it.duration <= 60).length;
    console.log(`[YT] 메인 검색: 총 ${items.length}개, 숏폼 ${sc}개`);

    // 숏폼이 적으면 "키워드 shorts" 보조 검색으로 숏폼 더 끌어오기
    if (sc < 10) {
      const existingIds = new Set(items.map((it) => it.videoId));
      const shortsQueries = [`${keyword} shorts`, `${keyword} 숏츠`];
      for (const sq of shortsQueries) {
        if (sc >= 10) break;
        try {
          setYtProgress(78, `숏폼 ${sc}개 — "${sq}" 추가 검색 중`);
          const sUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(sq)}`;
          const sHtml = await fetchViaProxies(sUrl, "ytInitialData");
          const sItems = parseYouTubeSearchHtml(sHtml);
          let added = 0;
          for (const it of sItems) {
            if (existingIds.has(it.videoId)) continue;
            // 실제 길이 유지 — shortsLockupViewModel이면 duration=30, videoRenderer면 실제값
            items.push(it);
            existingIds.add(it.videoId);
            added++;
          }
          sc = items.filter((x) => x.duration && x.duration <= 60).length;
          console.log(`[YT] "${sq}" 검색: ${sItems.length}개 받음, ${added}개 추가, 누적 숏폼 ${sc}개`);
        } catch (e) {
          console.warn(`[YT] "${sq}" 검색 실패 (무시 가능):`, e.message);
        }
      }
    }

    const lc = items.filter((it) => it.duration && it.duration > 60).length;
    setYtProgress(95, "결과 렌더링");
    renderYtResults(items);
    setYtProgress(100, "완료");
    setYtStatus(`✅ 총 ${items.length}개 (숏폼 ${sc} · 롱폼 ${lc}) — 공용 프록시 직접 파싱`, "ok");
    return;
  } catch (e1) {
    console.warn("[YT] 프록시 직접 파싱 실패:", e1.message);
    setYtStatus(`프록시 파싱 실패 — Jina 폴백: ${e1.message}`);
  }

  // (3) Jina 폴백 (길이 정보 없음)
  try {
    startYtProgressDrift(60, 90, 5000, "Jina로 YouTube 렌더링 중");
    items = await youtubeViaJina(keyword);
    setYtProgress(95, "결과 파싱");
    if (!items.length) throw new Error("Jina도 결과 0개");
    renderYtResults(items);
    setYtProgress(100, "완료");
    setYtStatus(`⚠️ ${items.length}개 (Jina — 길이 정보 없어서 숏폼/롱폼 분류 불가)`, "err");
  } catch (e2) {
    setYtProgress(null);
    ytResults.innerHTML = `<div class="empty">YouTube 검색 실패: ${e2.message}<br>잠시 후 다시 시도하거나, 다른 키워드로 시도하세요.</div>`;
    setYtStatus("실패: " + e2.message, "err");
  }
}

function fmtViews(n) {
  if (!n) return "";
  if (n >= 10000) return Math.floor(n / 10000) + "만 회";
  if (n >= 1000) return Math.floor(n / 1000) + "천 회";
  return n + " 회";
}

function fmtDuration(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ":" + String(s).padStart(2, "0");
}

function makeYtCard(it, i) {
  const videoId = (it.url || "").split("v=").pop().split("&")[0];
  const isShort = it.duration && it.duration <= 60;
  const card = document.createElement("div");
  card.className = "item";
  card.innerHTML = `
    <div class="thumb" style="aspect-ratio: ${isShort ? "9/16" : "16/9"};">
      ${it.thumbnail ? `<img src="${it.thumbnail}" referrerpolicy="no-referrer" loading="lazy">` : ""}
    </div>
    <div class="num">${i + 1}</div>
    <div class="meta" style="padding: 10px;">
      <div class="title" style="height: auto; max-height: 60px; -webkit-line-clamp: 3;">${(it.title || "").replace(/[<>]/g, "")}</div>
      <div style="font-size:11px; color:var(--muted); margin-top:6px;">
        ${(it.uploaderName || "").slice(0, 20)}<br>
        👁 ${fmtViews(it.views)} · ⏱ ${fmtDuration(it.duration)}
      </div>
    </div>`;
  card.style.cursor = "pointer";
  card.addEventListener("click", () => onYtVideoPick(it, videoId));
  return card;
}

function makeYtGrid(items, isShort) {
  const grid = document.createElement("div");
  grid.className = "grid";
  // 숏폼은 세로 비율이라 카드 폭을 좁게
  grid.style.gridTemplateColumns = isShort
    ? "repeat(auto-fill, minmax(160px, 1fr))"
    : "repeat(auto-fill, minmax(220px, 1fr))";
  items.forEach((it, i) => grid.appendChild(makeYtCard(it, i)));
  return grid;
}

function renderYtResults(items) {
  ytResults.innerHTML = "";
  if (!items.length) {
    ytResults.innerHTML = `<div class="empty">검색 결과 없음</div>`;
    return;
  }

  // 길이로 분류 + 조회수순 정렬 + 상위 10개
  const byViews = (a, b) => (b.views || 0) - (a.views || 0);
  const shorts = items.filter((it) => it.duration && it.duration > 0 && it.duration <= 60).sort(byViews).slice(0, 10);
  const longForm = items.filter((it) => it.duration && it.duration > 60).sort(byViews).slice(0, 10);
  const noLength = items.filter((it) => !it.duration);

  const addSection = (icon, title, list, color, isShort) => {
    if (!list.length) return;
    const head = document.createElement("div");
    head.style.cssText = `font-weight:700; font-size:15px; margin: 14px 0 8px; color:${color}; display:flex; align-items:center; gap:8px;`;
    head.innerHTML = `${icon} <span>${title}</span> <span style="font-size:11px; background:var(--panel2); padding:2px 8px; border-radius:6px; color:var(--muted); font-weight:400;">${list.length}개</span>`;
    ytResults.appendChild(head);
    ytResults.appendChild(makeYtGrid(list, isShort));
  };

  addSection("📱", "숏폼 (≤60초)", shorts, "#ff6b6b", true);
  addSection("🎬", "롱폼 (>60초)", longForm, "#5b8cff", false);
  // 폴백(Jina 등)으로 길이 정보가 없는 경우
  if (!shorts.length && !longForm.length && noLength.length) {
    addSection("🎥", "영상 (길이 정보 없음)", noLength.slice(0, 20), "var(--muted)", false);
  }

  // 안내: 둘 중 한 쪽이 너무 적으면 표시
  if (shorts.length < 3 || longForm.length < 3) {
    const note = document.createElement("div");
    note.className = "small";
    note.style.cssText = "margin-top: 10px; color: var(--muted);";
    note.textContent = `💡 ${shorts.length < 3 ? "숏폼" : "롱폼"}이 부족하면 더 구체적인 키워드(예: "쿠팡 추천템 숏폼", "다이소 신상 리뷰")로 검색해보세요.`;
    ytResults.appendChild(note);
  }
}

async function onYtVideoPick(item, videoId) {
  // 영상 설명 가져와서 모달처럼 표시
  setYtStatus(`영상 정보 가져오는 중…`);
  let desc = "(설명 로드 실패)";
  try {
    startYtProgressDrift(10, 50, 3000, "Piped에서 영상 설명 가져오는 중");
    const { data } = await pipedFetch(`/streams/${videoId}`);
    setYtProgress(75, "설명 정리 중");
    desc = data.description || data.descriptionHtml || "";
    desc = desc.replace(/<[^>]+>/g, "").trim() || "(설명 없음)";
  } catch (e) {
    // Piped 실패 → Jina로 영상 페이지 가져오기
    try {
      startYtProgressDrift(40, 85, 6000, "Jina로 YouTube 페이지 렌더링 중");
      const r = await fetch(`https://r.jina.ai/https://www.youtube.com/watch?v=${videoId}`, {
        headers: { "Accept": "application/json" },
      });
      setYtProgress(90, "설명 추출 중");
      const data = await r.json();
      const content = (data.data && data.data.content) || data.content || "";
      desc = content.slice(0, 4000) || "(설명 없음)";
    } catch (e2) {
      setYtProgress(null);
      desc = "설명 로드 실패: " + e2.message;
    }
  }
  setYtProgress(95, "키워드 추출 중");

  // 후보 제품 키워드 자동 추출 (간단 휴리스틱)
  const candidates = extractProductCandidates(item.title + "\n" + desc);

  showVideoDetail(item, videoId, desc, candidates);
  setYtProgress(100, "완료");
  setYtStatus("✅ 영상 선택됨 — 제품 키워드를 골라 샤오홍슈 검색하세요", "ok");
}

function extractProductCandidates(text) {
  // 간단 휴리스틱:
  // 1. 명사 + 추천/인기/템 패턴
  // 2. "* 제품명" 또는 줄 시작의 짧은 텍스트
  // 3. 브랜드명으로 보이는 영문/한글 단어
  const set = new Set();
  // 줄별로
  text.split(/\r?\n/).forEach((line) => {
    line = line.trim();
    if (!line || line.length > 60) return;
    // 숫자+점/괄호로 시작하는 항목 (예: "1. 아이폰 케이스")
    const m = line.match(/^(?:[\d①-⑳]+[.\s)】]\s*|[-•★▶]\s*)(.+)$/);
    if (m && m[1].length <= 30) set.add(m[1].trim());
    // 줄 안 [브랜드명] 또는 「제품명」
    [...line.matchAll(/[【\[「][^】\]」]{1,20}[】\]」]/g)].forEach((mm) => {
      set.add(mm[0].replace(/[【\[「】\]」]/g, "").trim());
    });
  });
  // 제목에서 키워드 분리
  return [...set].filter(Boolean).slice(0, 20);
}

function showVideoDetail(item, videoId, desc, candidates) {
  // 기존 모달 제거
  document.querySelectorAll(".yt-modal").forEach((el) => el.remove());

  const modal = document.createElement("div");
  modal.className = "yt-modal";
  modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;overflow:auto;padding:20px;";
  modal.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 24px;">
      <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px;">
        <div>
          <div style="font-size: 17px; font-weight: 700; line-height: 1.3; margin-bottom: 6px;">${(item.title || "").replace(/[<>]/g, "")}</div>
          <div class="small">${(item.uploaderName || "")} · 👁 ${fmtViews(item.views)} · ⏱ ${fmtDuration(item.duration)}</div>
        </div>
        <button class="ghost" id="ytClose">✕ 닫기</button>
      </div>
      <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
        <button class="ghost" id="ytOpen">🔗 YouTube에서 보기</button>
        <button class="ghost" id="ytCopyDesc">📋 설명 복사</button>
        <button class="ghost" id="ytCaptureFrames" style="border-color:#ff2e51;color:#ff6b6b">🎬 프레임 캡쳐 (영상에서 제품 잡기)</button>
      </div>
      <div id="ytFrameStatus" class="small" style="margin-bottom:8px"></div>
      <div id="ytFrameProgress" class="progress" style="margin-bottom: 12px;">
        <div class="progress-bar" id="ytFrameProgressBar"></div>
        <div class="progress-label" id="ytFrameProgressLabel">대기 중</div>
      </div>
      <div id="ytFrames" style="display:none; margin-bottom: 16px;">
        <div style="font-weight:600; margin-bottom: 8px;">📸 캡쳐된 프레임 (클릭하면 큰 크기로 보기 / 우클릭으로 저장)</div>
        <div id="ytFramesGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px;"></div>
      </div>
      <div style="font-weight:600; margin-bottom: 8px;">🔎 추출된 제품 키워드 (클릭하면 샤오홍슈로 검색)</div>
      <div class="chip-row" id="ytCandidates" style="margin-bottom: 16px;">
        ${candidates.length ? candidates.map((c) => `<span class="chip" data-kw="${c.replace(/"/g, "&quot;")}">${c}</span>`).join("") :
          '<div class="small" style="color:var(--muted)">자동 추출된 키워드가 없습니다. 아래 설명에서 직접 골라 검색창에 입력하세요.</div>'}
      </div>
      <div style="font-weight:600; margin-bottom: 8px;">📝 영상 설명</div>
      <div style="background: var(--panel2); border: 1px solid var(--line); border-radius: 8px; padding: 14px; max-height: 360px; overflow: auto; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">${desc.replace(/[<>]/g, "")}</div>
      <div class="small" style="margin-top: 12px;">→ 위 칩 클릭하거나, 설명에서 단어를 골라 메인 검색창에 붙여넣고 🔍 검색하세요.</div>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelector("#ytClose").addEventListener("click", () => modal.remove());
  modal.querySelector("#ytOpen").addEventListener("click", () => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank", "noopener");
  });
  modal.querySelector("#ytCopyDesc").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(desc); setYtStatus("📋 설명 복사됨", "ok"); }
    catch {}
  });
  modal.querySelector("#ytCandidates").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const kw = chip.dataset.kw;
    q.value = kw;
    modal.remove();
    // 자동으로 메인 검색 트리거
    document.querySelector(".card").scrollIntoView({ behavior: "smooth", block: "start" });
    search();
  });
  modal.querySelector("#ytCaptureFrames").addEventListener("click", () => captureVideoFrames(videoId, modal));
  // ESC 닫기
  const onEsc = (ev) => { if (ev.key === "Escape") { modal.remove(); document.removeEventListener("keydown", onEsc); } };
  document.addEventListener("keydown", onEsc);
}

// 칩 클릭 → 자동 검색
ytQuickChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  ytQ.value = chip.dataset.yt || chip.textContent;
  searchYouTube(ytQ.value);
});
ytSearchBtn.addEventListener("click", () => searchYouTube(ytQ.value.trim()));
ytQ.addEventListener("keydown", (e) => { if (e.key === "Enter") searchYouTube(ytQ.value.trim()); });

// 초기화
updateWorkerUi();

(async () => {
  const v = await detectExtension();
  if (v) {
    setupWarn.style.display = "none";
    setStatus(`✅ 크롬 확장 v${v} 감지됨 — 본인 세션으로 직접 검색합니다.`, "ok");
  } else {
    console.log("[XHS] 확장 미감지 — Jina 폴백 모드");
  }
})();
