/* 샤오홍슈 한국어 검색기 — 프론트엔드
 * 1단계: 검색 UI, 한→중 번역, 추천 키워드, 백엔드 호출 준비
 */

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

// ===== 백엔드 호출: 제품 검색 =====
async function fetchProducts(zhKeyword, koKeyword) {
  const w = getWorkerUrl();
  if (!w) {
    resultLabel.textContent = "백엔드 미연결";
    results.innerHTML = `
      <div class="empty">
        ⚙️ 백엔드 Worker URL이 아직 설정 안 됐어요.<br>
        하단의 <b>"⚙️ 백엔드 설정"</b> 펼쳐서 1번~5번 진행 후, 다시 검색하세요.<br><br>
        그동안 <b>샤오홍슈에서 직접 보기</b> 버튼으로 결과 확인 가능합니다 ↑
      </div>`;
    return;
  }
  resultLabel.textContent = "검색 중…";
  try {
    const url = `${w}/search?q=${encodeURIComponent(zhKeyword)}&ko=${encodeURIComponent(koKeyword)}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    if (!data || !Array.isArray(data.items)) throw new Error("응답 형식 오류");
    renderProducts(data.items);
    resultLabel.textContent = `${data.items.length}개`;
  } catch (e) {
    results.innerHTML = `<div class="empty">백엔드 호출 실패: ${e.message}</div>`;
    resultLabel.textContent = "오류";
  }
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

// ===== 추천 키워드 (AI) — 백엔드가 있을 때만 진짜 동작 =====
async function refreshRecommended(koKeyword) {
  const w = getWorkerUrl();
  if (!w) { recoLabel.textContent = "기본 카테고리"; return; }
  try {
    const r = await fetch(`${w}/suggest?ko=${encodeURIComponent(koKeyword)}`);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    if (!data || !Array.isArray(data.suggestions)) return;
    recommended.innerHTML = "";
    data.suggestions.slice(0, 12).forEach((kw) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.dataset.q = kw;
      chip.textContent = kw;
      recommended.appendChild(chip);
    });
    recoLabel.textContent = "AI 추천 (" + koKeyword + " 관련)";
  } catch {
    recoLabel.textContent = "기본 카테고리 (AI 추천 실패)";
  }
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
