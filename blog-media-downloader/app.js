/* 블로그/인스타 미디어 다운로더 — 클라이언트 전용 */

const $ = (id) => document.getElementById(id);
const urlInput = $("url");
const scanBtn = $("scan");
const downloadBtn = $("download");
const downloadAllBtn = $("downloadAll");
const openTabsBtn = $("openTabs");
const copyUrlsBtn = $("copyUrls");
const linkMode = $("linkMode");
const selectAll = $("selectAll");
const statusEl = $("status");
const grid = $("grid");

const IMAGE_EXT = ["jpg","jpeg","png","gif","webp","bmp","svg","avif"];
const VIDEO_EXT = ["mp4","webm","mov","m4v","m3u8"];
const ALL_EXT = [...IMAGE_EXT, ...VIDEO_EXT];

let foundItems = []; // { url, type, selected }

// 여러 CORS 프록시를 순차 시도
const PROXIES = [
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
];

function setStatus(msg, kind = "") {
  statusEl.className = "status " + kind;
  statusEl.textContent = msg;
}

async function fetchViaProxy(url) {
  let lastErr;
  for (const make of PROXIES) {
    try {
      const r = await fetch(make(url), { redirect: "follow" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const text = await r.text();
      if (text && text.length > 200) return text;
      throw new Error("빈 응답");
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("모든 프록시 실패");
}

function absUrl(u, base) {
  try { return new URL(u, base).toString(); } catch { return null; }
}

function extOf(url) {
  try {
    const p = new URL(url).pathname.toLowerCase();
    const m = p.match(/\.([a-z0-9]+)$/);
    return m ? m[1] : "";
  } catch { return ""; }
}

function classify(url) {
  const e = extOf(url);
  if (IMAGE_EXT.includes(e)) return e === "gif" ? "gif" : "image";
  if (VIDEO_EXT.includes(e)) return "video";
  return "other";
}

// 네이버 이미지 썸네일 파라미터 제거 → 원본
function normalizeUrl(u) {
  if (/pstatic\.net|naver\.net/.test(u)) {
    return u.replace(/\?type=.*$/, "");
  }
  return u;
}

function collectFromHtml(html, baseUrl) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const set = new Set();

  const add = (u) => {
    if (!u) return;
    u = u.trim();
    if (!u || u.startsWith("data:") || u.startsWith("javascript:")) return;
    const abs = absUrl(u, baseUrl);
    if (!abs) return;
    set.add(normalizeUrl(abs));
  };

  doc.querySelectorAll("img").forEach((img) => {
    add(img.getAttribute("src"));
    add(img.getAttribute("data-src"));
    add(img.getAttribute("data-lazy-src"));
    add(img.getAttribute("data-original"));
    const ss = img.getAttribute("srcset") || img.getAttribute("data-srcset");
    if (ss) {
      const last = ss.split(",").map((s) => s.trim().split(" ")[0]).pop();
      add(last);
    }
  });
  doc.querySelectorAll("source").forEach((s) => {
    add(s.getAttribute("src"));
    const ss = s.getAttribute("srcset");
    if (ss) {
      const last = ss.split(",").map((x) => x.trim().split(" ")[0]).pop();
      add(last);
    }
  });
  doc.querySelectorAll("video, audio").forEach((v) => {
    add(v.getAttribute("src"));
    add(v.getAttribute("poster"));
  });
  doc.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (ALL_EXT.includes(extOf(absUrl(href, baseUrl) || ""))) add(href);
  });
  // og:image, og:video
  doc.querySelectorAll('meta[property^="og:image"], meta[property^="og:video"], meta[name="twitter:image"]').forEach((m) => {
    add(m.getAttribute("content"));
  });

  // raw 정규식: html에 박힌 mp4/m3u8/gif 직링크
  const raw = html.match(/https?:\/\/[^\s"'<>]+?\.(?:mp4|webm|m3u8|gif|png|jpe?g|webp)(?:\?[^\s"'<>]*)?/gi);
  if (raw) raw.forEach((u) => set.add(normalizeUrl(u)));

  // 미디어가 아닌 것은 거른다
  return Array.from(set).filter((u) => {
    const t = classify(u);
    return t === "image" || t === "gif" || t === "video";
  });
}

async function scan() {
  const url = urlInput.value.trim();
  if (!url) { setStatus("URL을 입력하세요.", "err"); return; }
  scanBtn.disabled = true;
  downloadBtn.disabled = true;
  downloadAllBtn.disabled = true;
  grid.innerHTML = "";
  foundItems = [];
  setStatus("페이지 가져오는 중…");

  try {
    let html = await fetchViaProxy(url);
    let baseUrl = url;

    // 네이버 블로그: mainFrame iframe URL 자동 따라가기
    if (/blog\.naver\.com/.test(url)) {
      const m = html.match(/mainFrame["']?\s*src=["']([^"']+)/);
      if (m) {
        const inner = absUrl(m[1], "https://blog.naver.com");
        setStatus("네이버 본문 iframe 따라가는 중…");
        html = await fetchViaProxy(inner);
        baseUrl = inner;
      }
    }

    const urls = collectFromHtml(html, baseUrl);
    if (urls.length === 0) {
      setStatus("미디어를 찾지 못했습니다. 차단된 사이트면 아래 북마클릿을 사용해보세요.", "err");
      return;
    }
    foundItems = urls.map((u) => ({ url: u, type: classify(u), selected: true }));
    render();
    setStatus(`${urls.length}개 발견. 다운로드 버튼을 누르세요.`, "ok");
    downloadBtn.disabled = false;
    downloadAllBtn.disabled = false;
    openTabsBtn.disabled = false;
    copyUrlsBtn.disabled = false;
  } catch (e) {
    setStatus("실패: " + e.message + " — CORS 차단일 수 있어요. 북마클릿을 써보세요.", "err");
  } finally {
    scanBtn.disabled = false;
  }
}

function render() {
  grid.innerHTML = "";
  if (linkMode.checked) {
    grid.className = "linklist";
    foundItems.forEach((it, i) => {
      const row = document.createElement("div");
      row.className = "ll-row";
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.checked = it.selected;
      cb.onchange = () => { foundItems[i].selected = cb.checked; };
      const a = document.createElement("a");
      a.href = it.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.download = safeName(it.url, i + 1); // 같은 출처면 자동 다운로드, 다른 출처면 우클릭→링크 저장
      a.textContent = `[${it.type.toUpperCase()}] ${it.url}`;
      a.title = "우클릭 → '다른 이름으로 링크 저장'";
      row.appendChild(cb);
      row.appendChild(a);
      grid.appendChild(row);
    });
    return;
  }
  grid.className = "grid";
  foundItems.forEach((it, i) => {
    const card = document.createElement("div");
    card.className = "item";
    const thumb = document.createElement("a");
    thumb.className = "thumb";
    thumb.href = it.url;
    thumb.target = "_blank";
    thumb.rel = "noopener";
    thumb.title = "클릭: 새 탭에서 열기 / 우클릭 → 이미지(또는 비디오) 저장";
    if (it.type === "video") {
      const v = document.createElement("video");
      v.src = it.url; v.muted = true; v.preload = "metadata";
      thumb.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = it.url; img.loading = "lazy";
      img.onerror = () => { thumb.innerHTML = '<span style="color:#666;font-size:11px">미리보기 불가 — 클릭해서 새 탭으로 열기</span>'; };
      thumb.appendChild(img);
    }
    const meta = document.createElement("label");
    meta.className = "meta";
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = it.selected;
    cb.onchange = () => { foundItems[i].selected = cb.checked; };
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = it.type.toUpperCase();
    const left = document.createElement("span");
    left.style.display = "flex"; left.style.alignItems = "center"; left.style.gap = "6px";
    left.appendChild(cb);
    left.appendChild(document.createTextNode((extOf(it.url) || "?").toUpperCase()));
    meta.appendChild(left);
    meta.appendChild(badge);
    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent = "↑ 우클릭 → 저장";
    card.appendChild(thumb);
    card.appendChild(meta);
    card.appendChild(hint);
    grid.appendChild(card);
  });
}

linkMode.addEventListener("change", render);

selectAll.addEventListener("change", () => {
  foundItems.forEach((it) => (it.selected = selectAll.checked));
  render();
});

function safeName(url, idx) {
  try {
    let n = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
    n = n.replace(/[^\w\-.]+/g, "_").slice(0, 80);
    if (!n) n = `file_${idx}`;
    if (!/\.[a-z0-9]+$/i.test(n)) n += "." + (extOf(url) || "bin");
    return String(idx).padStart(3, "0") + "_" + n;
  } catch {
    return String(idx).padStart(3, "0") + "_file";
  }
}

async function fetchBlobMaybeProxied(url) {
  // 우선 직접 → 막히면 프록시
  try {
    const r = await fetch(url, { mode: "cors" });
    if (r.ok) return await r.blob();
  } catch {}
  for (const make of PROXIES) {
    try {
      const r = await fetch(make(url));
      if (r.ok) return await r.blob();
    } catch {}
  }
  throw new Error("다운로드 실패");
}

async function downloadToFolder() {
  if (!window.showDirectoryPicker) {
    setStatus("이 브라우저는 폴더 선택을 지원하지 않습니다. 크롬/엣지에서 사용하세요. (대신 '전부 그냥 다운로드' 사용 가능)", "err");
    return;
  }
  let dir;
  try {
    dir = await window.showDirectoryPicker({ mode: "readwrite" });
  } catch { return; } // 사용자 취소

  const targets = foundItems.filter((it) => it.selected);
  let ok = 0, fail = 0;
  for (let i = 0; i < targets.length; i++) {
    const it = targets[i];
    setStatus(`다운로드 중 ${i + 1}/${targets.length} — ${it.url}`);
    try {
      const blob = await fetchBlobMaybeProxied(it.url);
      const handle = await dir.getFileHandle(safeName(it.url, i + 1), { create: true });
      const w = await handle.createWritable();
      await w.write(blob);
      await w.close();
      ok++;
    } catch (e) {
      fail++;
    }
  }
  setStatus(`완료: 성공 ${ok}, 실패 ${fail}`, fail ? "err" : "ok");
}

async function downloadAllSimple() {
  const targets = foundItems.filter((it) => it.selected);
  for (let i = 0; i < targets.length; i++) {
    const it = targets[i];
    setStatus(`다운로드 중 ${i + 1}/${targets.length}`);
    try {
      const blob = await fetchBlobMaybeProxied(it.url);
      const a = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      a.download = safeName(it.url, i + 1);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      // 브라우저가 연속 다운로드를 막지 않게 약간 텀
      await new Promise((r) => setTimeout(r, 250));
    } catch {}
  }
  setStatus("완료. 다운로드 폴더를 확인하세요.", "ok");
}

async function openAllInTabs() {
  const targets = foundItems.filter((it) => it.selected);
  if (!targets.length) return;
  if (targets.length > 8 && !confirm(`${targets.length}개 탭을 엽니다. 팝업 차단을 허용해주세요. 계속할까요?`)) return;
  for (let i = 0; i < targets.length; i++) {
    setStatus(`탭 여는 중 ${i + 1}/${targets.length}…`);
    const w = window.open(targets[i].url, "_blank", "noopener");
    if (!w) {
      setStatus("팝업이 차단됐습니다. 주소창 옆 차단 아이콘을 눌러 허용해주세요.", "err");
      return;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  setStatus(`${targets.length}개 탭을 열었습니다. 각 탭에서 우클릭 → 저장하세요.`, "ok");
}

async function copyUrls() {
  const targets = foundItems.filter((it) => it.selected).map((it) => it.url).join("\n");
  try {
    await navigator.clipboard.writeText(targets);
    setStatus("URL을 클립보드에 복사했습니다. 다운로드 매니저에 붙여넣으세요.", "ok");
  } catch {
    // 폴백: textarea 선택
    const ta = document.createElement("textarea");
    ta.value = targets; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
    setStatus("URL을 복사했습니다.", "ok");
  }
}

scanBtn.addEventListener("click", scan);
urlInput.addEventListener("keydown", (e) => { if (e.key === "Enter") scan(); });
downloadBtn.addEventListener("click", downloadToFolder);
downloadAllBtn.addEventListener("click", downloadAllSimple);
openTabsBtn.addEventListener("click", openAllInTabs);
copyUrlsBtn.addEventListener("click", copyUrls);

// ---------- 북마클릿 ----------
// 현재 페이지의 미디어 URL을 모아 새 창에 보여주는 스크립트
const bookmarkletCode = `(function(){
  var ext=['jpg','jpeg','png','gif','webp','bmp','svg','avif','mp4','webm','mov','m4v','m3u8'];
  var s=new Set();
  function add(u){ if(!u||u.startsWith('data:'))return; try{u=new URL(u,location.href).toString();}catch(e){return;} s.add(u.replace(/\\?type=.*$/,'')); }
  document.querySelectorAll('img').forEach(function(i){
    add(i.src);['data-src','data-lazy-src','data-original'].forEach(function(a){add(i.getAttribute(a));});
    var ss=i.getAttribute('srcset')||i.getAttribute('data-srcset');
    if(ss){var p=ss.split(',').map(function(x){return x.trim().split(' ')[0];}).pop();add(p);}
  });
  document.querySelectorAll('source').forEach(function(s2){add(s2.src);});
  document.querySelectorAll('video,audio').forEach(function(v){add(v.src);add(v.poster);});
  document.querySelectorAll('a[href]').forEach(function(a){
    var h=a.href.toLowerCase();if(ext.some(function(e){return h.includes('.'+e);})) add(a.href);
  });
  var raw=document.documentElement.outerHTML.match(/https?:\\/\\/[^\\s"'<>]+?\\.(?:mp4|webm|m3u8|gif|png|jpe?g|webp)(?:\\?[^\\s"'<>]*)?/gi);
  if(raw) raw.forEach(add);
  var iframes=document.querySelectorAll('iframe');
  iframes.forEach(function(f){try{
    var d=f.contentDocument; if(!d) return;
    d.querySelectorAll('img,video,source').forEach(function(el){add(el.src);add(el.getAttribute&&el.getAttribute('data-src'));});
  }catch(e){}});
  var arr=Array.from(s).filter(function(u){var m=u.toLowerCase().match(/\\.([a-z0-9]+)(\\?|$)/);return m && ext.indexOf(m[1])>=0;});
  var w=window.open('','_blank');
  var html='<html><head><meta charset="utf-8"><title>추출됨 '+arr.length+'개</title>'+
    '<style>body{font-family:sans-serif;background:#111;color:#eee;padding:20px}'+
    '.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}'+
    '.c{background:#222;border-radius:8px;overflow:hidden}'+
    '.c img,.c video{width:100%;display:block;aspect-ratio:1;object-fit:cover;background:#000}'+
    '.c a{display:block;padding:8px;color:#9bf;font-size:11px;text-decoration:none;word-break:break-all}'+
    'h1{font-size:16px}</style></head><body>'+
    '<h1>'+arr.length+'개 발견 — 우클릭해서 저장하세요</h1><div class="g">'+
    arr.map(function(u){var v=/\\.(mp4|webm|mov)/i.test(u);
      return '<div class="c">'+(v?'<video src="'+u+'" controls muted></video>':'<img src="'+u+'">')+
        '<a href="'+u+'" download target="_blank">'+u.split('/').pop().split('?')[0]+'</a></div>';
    }).join('')+'</div></body></html>';
  w.document.write(html); w.document.close();
})();`;

const bml = document.getElementById("bml");
bml.href = "javascript:" + encodeURIComponent(bookmarkletCode.replace(/\s+/g, " "));
bml.addEventListener("click", (e) => {
  e.preventDefault();
  alert("이 버튼을 '클릭'하지 말고 브라우저의 북마크 바로 '드래그' 해주세요.");
});
