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
      if (!r.ok) return reject(new Error("HTTP " + r.status + ": " + (r.statusText || r.error || "")));
      resolve(r);
    };
    window.addEventListener("message", handler);
    window.postMessage({ type: "XHS_HELPER_FETCH", requestId: id, url, init: init || {} }, "*");
    setTimeout(() => { window.removeEventListener("message", handler); reject(new Error("확장프로그램 응답 없음 (30초)")); }, 30000);
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
      results.innerHTML = `
        <div class="empty">
          <div style="margin-bottom:10px">결과를 못 가져왔어요.</div>
          <div style="text-align:left;background:#0c0e13;padding:12px;border-radius:8px;font-family:monospace;font-size:11px;color:#9aa3b2">
            <div><b>Jina 응답 진단:</b></div>
            <div>· 제목: ${(dbg.title || "(없음)").slice(0, 80)}</div>
            <div>· 콘텐츠 길이: ${dbg.contentLength || 0} 자</div>
            <div>· 이미지 ${dbg.totalImages || 0}개 (XHS 호스트: ${dbg.xhsImages || 0}개)</div>
            <div>· 링크 ${dbg.totalLinks || 0}개 (XHS 노트: ${dbg.xhsLinks || 0}개)</div>
            <div>· 콘텐츠 첫줄: ${(dbg.contentFirstLine || "").slice(0, 80)}</div>
          </div>
          <div style="margin-top:10px">
            ${dbg.xhsImages === 0 && dbg.totalImages > 0 ?
              "샤오홍슈는 응답했지만 호스트가 우리 패턴과 안 맞음. 코드 업데이트 필요." :
              dbg.totalImages === 0 ?
              "샤오홍슈가 Jina 봇을 차단했거나 로그인 페이지를 줬어요. Cloudflare Worker 배포 필요." :
              "어떤 이유인지 불명확. 디버그 정보를 보내주세요."}
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
  };
  console.log("[XHS] Jina 응답 진단:", debug);
  console.log("[XHS] 응답 첫 1000자:", content.slice(0, 1000));

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

// ===== 확장프로그램 경유 샤오홍슈 검색 =====
async function searchViaExtension(zhKeyword) {
  const url = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(zhKeyword)}&source=web_search_result_notes`;
  const r = await extensionFetch(url);
  return parseXhsHtml(r.text, zhKeyword);
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
