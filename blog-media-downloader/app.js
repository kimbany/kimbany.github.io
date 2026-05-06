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

// 여러 CORS 프록시를 순차 시도 (어떤 곳은 네이버 같은 도메인을 차단함)
const PROXIES = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
];

const BLOCKED_HOSTS = [
  /(?:^|\.)blog\.naver\.com/i,
  /(?:^|\.)m\.blog\.naver\.com/i,
  /(?:^|\.)instagram\.com/i,
];

function isLikelyBlocked(url) {
  try {
    const h = new URL(url).hostname;
    return BLOCKED_HOSTS.some((re) => re.test(h));
  } catch { return false; }
}

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

// 확장자 없이도 영상으로 취급해야 하는 호스트(네이버 비디오 CDN 등)
const VIDEO_HOST_RE = /(?:^|\/\/|\.)(?:blogvideo\.pstatic\.net|pic-video\.pstatic\.net|videos?\.naver\.(?:com|net)|rmcnmv\.naver\.com|tv\.naver\.com|serviceapi\.rmcnmv\.naver\.com)/i;

function classify(url) {
  const e = extOf(url);
  if (IMAGE_EXT.includes(e)) return e === "gif" ? "gif" : "image";
  if (VIDEO_EXT.includes(e)) return "video";
  if (VIDEO_HOST_RE.test(url)) return "video";
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
    add(v.getAttribute("data-src"));
    add(v.getAttribute("data-source"));
    add(v.getAttribute("poster"));
    // 자식 <source> 의 src/data-src
    v.querySelectorAll("source").forEach((s) => {
      add(s.getAttribute("src"));
      add(s.getAttribute("data-src"));
    });
  });

  // 모든 element 속성 스캔: data-module-data 같은 JSON 속성 안의 URL도 잡기
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of el.attributes) {
      const v = attr.value;
      if (!v || v.length < 12) continue;
      const matches = v.match(/https?:\/\/[^\s"'<>]+/gi);
      if (!matches) continue;
      matches.forEach((u) => {
        const cleaned = u.replace(/[)\];,]+$/, "");
        if (classify(cleaned) !== "other") add(cleaned);
      });
    }
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

  // 네이버/인스타: 공용 CORS 프록시가 모두 차단함 → 시도하지 말고 즉시 북마클릿 안내
  if (isLikelyBlocked(url)) {
    const wb = document.getElementById("warnBox");
    wb.style.display = "block";
    wb.scrollIntoView({ behavior: "smooth", block: "center" });
    setStatus("이 사이트는 자동 스캔이 차단됩니다. 위 노란 박스의 북마클릿을 사용하세요 ↑", "err");
    try {
      wb.animate(
        [{ boxShadow: "0 0 0 0 #f3a847" }, { boxShadow: "0 0 0 6px #f3a847" }, { boxShadow: "0 0 0 0 #f3a847" }],
        { duration: 900, iterations: 2 }
      );
    } catch {}
    return;
  }

  scanBtn.disabled = true;
  downloadBtn.disabled = true;
  downloadAllBtn.disabled = true;
  grid.innerHTML = "";
  foundItems = [];
  setStatus("페이지 가져오는 중…");

  try {
    let html = await fetchViaProxy(url);
    let baseUrl = url;
    setStatus(`HTML 수신 (${html.length.toLocaleString()} bytes). 분석 중…`);

    // 네이버 블로그: mainFrame iframe URL 자동 따라가기 (모바일 m.blog는 제외)
    if (/blog\.naver\.com/.test(url) && !/m\.blog\.naver\.com/.test(url)) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const frame = doc.querySelector('iframe#mainFrame, iframe[name="mainFrame"]');
      let innerSrc = frame && frame.getAttribute("src");
      if (!innerSrc) {
        // 정규식 폴백: 속성 순서 무관하게 잡기
        const m1 = html.match(/<iframe[^>]*\bid=["']mainFrame["'][^>]*\bsrc=["']([^"']+)/i)
                || html.match(/<iframe[^>]*\bsrc=["']([^"']+)["'][^>]*\bid=["']mainFrame["']/i)
                || html.match(/<iframe[^>]*\bname=["']mainFrame["'][^>]*\bsrc=["']([^"']+)/i);
        if (m1) innerSrc = m1[1];
      }
      if (innerSrc) {
        const inner = absUrl(innerSrc, "https://blog.naver.com");
        setStatus("네이버 본문 iframe 따라가는 중…");
        html = await fetchViaProxy(inner);
        baseUrl = inner;
        setStatus(`본문 HTML 수신 (${html.length.toLocaleString()} bytes). 분석 중…`);
      } else {
        // 모바일 버전 폴백: 보통 m.blog.naver.com 은 iframe 없이 본문 직접 노출
        const mm = url.match(/blog\.naver\.com\/([^/?#]+)\/(\d+)/);
        if (mm) {
          const mobileUrl = `https://m.blog.naver.com/${mm[1]}/${mm[2]}`;
          setStatus(`모바일 버전으로 재시도: ${mobileUrl}`);
          html = await fetchViaProxy(mobileUrl);
          baseUrl = mobileUrl;
        }
      }
    }

    const urls = collectFromHtml(html, baseUrl);
    if (urls.length === 0) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const title = ((doc.querySelector("title") || {}).textContent || "(제목 없음)").trim();
      setStatus(
        `미디어 0개. [HTML ${html.length.toLocaleString()} bytes / 제목: "${title.slice(0, 60)}"] ` +
        `JS로 그려지는 사이트이거나 로그인 필요할 수 있어요. 아래 북마클릿/링크 모드를 써보세요.`,
        "err"
      );
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
      a.download = safeName(it.url, i + 1, it.type); // 같은 출처면 자동 다운로드, 다른 출처면 우클릭→링크 저장
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

function defaultExt(type) {
  if (type === "video") return ".mp4";
  if (type === "gif") return ".gif";
  return ".jpg";
}

function safeName(url, idx, type) {
  try {
    let n = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
    n = n.replace(/[^\w\-.]+/g, "_").slice(0, 80);
    if (!n) n = `file_${idx}`;
    if (!/\.[a-z0-9]+$/i.test(n)) n += defaultExt(type);
    return String(idx).padStart(3, "0") + "_" + n;
  } catch {
    return String(idx).padStart(3, "0") + "_file" + defaultExt(type);
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
      const handle = await dir.getFileHandle(safeName(it.url, i + 1, it.type), { create: true });
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
      a.download = safeName(it.url, i + 1, it.type);
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

const warnBox = document.getElementById("warnBox");
function updateWarn() {
  warnBox.style.display = isLikelyBlocked(urlInput.value.trim()) ? "block" : "none";
}
urlInput.addEventListener("input", updateWarn);

scanBtn.addEventListener("click", scan);
urlInput.addEventListener("keydown", (e) => { if (e.key === "Enter") scan(); });

document.getElementById("copyBml").addEventListener("click", async () => {
  const code = "javascript:" + encodeURIComponent(bookmarkletCode.replace(/\s+/g, " "));
  try {
    await navigator.clipboard.writeText(code);
    setStatus("북마클릿 코드를 복사했습니다. 새 북마크 만들 때 URL 자리에 붙여넣으세요.", "ok");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = code; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
    setStatus("북마클릿 코드를 복사했습니다.", "ok");
  }
});
downloadBtn.addEventListener("click", downloadToFolder);
downloadAllBtn.addEventListener("click", downloadAllSimple);
openTabsBtn.addEventListener("click", openAllInTabs);
copyUrlsBtn.addEventListener("click", copyUrls);

// ---------- 북마클릿 ----------
// 현재 페이지의 미디어 URL을 type 정보와 함께 모아 새 창에 보여주는 스크립트
const bookmarkletCode = `(function(){
  var imgExt=['jpg','jpeg','png','gif','webp','bmp','svg','avif'];
  var vidExt=['mp4','webm','mov','m4v','m3u8','ts'];
  var vidHostRe=/(?:^|\\/\\/|\\.)(?:blogvideo\\.pstatic\\.net|pic-video\\.pstatic\\.net|videos?\\.naver\\.(?:com|net)|rmcnmv\\.naver\\.com|tv\\.naver\\.com)/i;
  var items=new Map(); // url -> 'image'|'gif'|'video'
  function abs(u){ try{return new URL(u, location.href).toString();}catch(e){return null;} }
  function clean(u){ return u.replace(/\\?type=.*$/,''); }
  function classify(u){
    var p=''; try{p=new URL(u).pathname.toLowerCase();}catch(e){return null;}
    var m=p.match(/\\.([a-z0-9]+)$/);
    if(m){
      if(imgExt.indexOf(m[1])>=0) return m[1]==='gif'?'gif':'image';
      if(vidExt.indexOf(m[1])>=0) return 'video';
    }
    if(vidHostRe.test(u)) return 'video';
    return null;
  }
  function add(u, hint){
    if(!u||typeof u!=='string') return;
    u=u.trim(); if(!u||u.indexOf('data:')===0||u.indexOf('javascript:')===0) return;
    var a=abs(u); if(!a) return;
    a=clean(a);
    var t=hint||classify(a);
    if(!t) return;
    // hint(예: video element 자식이면 video)이 더 신뢰도 높음 → 덮어쓰기
    if(!items.has(a) || (hint && items.get(a)==='image' && hint==='video')) items.set(a,t);
  }
  document.querySelectorAll('img').forEach(function(i){
    add(i.src,'image');
    ['data-src','data-lazy-src','data-original'].forEach(function(a){add(i.getAttribute(a),'image');});
    var ss=i.getAttribute('srcset')||i.getAttribute('data-srcset');
    if(ss){var p=ss.split(',').map(function(x){return x.trim().split(' ')[0];}).pop();add(p,'image');}
  });
  document.querySelectorAll('video,audio').forEach(function(v){
    add(v.src,'video');
    add(v.currentSrc,'video');  // 실제 로드된 소스
    add(v.getAttribute('data-src'),'video');
    add(v.getAttribute('data-source'),'video');
    add(v.poster,'image');
    v.querySelectorAll('source').forEach(function(s){
      add(s.src,'video');
      add(s.getAttribute('data-src'),'video');
    });
  });
  document.querySelectorAll('a[href]').forEach(function(a){ if(classify(a.href)) add(a.href); });
  // 모든 element 속성 스캔 (data-module-data JSON 등)
  var media=/https?:\\/\\/[^\\s"'<>]+?\\.(?:mp4|webm|m3u8|gif|png|jpe?g|webp|mov|avif|ts)(?:\\?[^\\s"'<>]*)?/gi;
  var any=/https?:\\/\\/[^\\s"'<>]+/gi;
  document.querySelectorAll('*').forEach(function(el){
    for(var i=0;i<el.attributes.length;i++){
      var val=el.attributes[i].value;
      if(!val||val.length<12) continue;
      (val.match(media)||[]).forEach(function(u){add(u);});
      // 비디오 호스트만 따로 검사
      (val.match(any)||[]).forEach(function(u){if(vidHostRe.test(u)) add(u,'video');});
    }
  });
  // og:* meta
  document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach(function(m){
    var c=m.getAttribute('content');
    if(c){
      var p=(m.getAttribute('property')||m.getAttribute('name')||'').toLowerCase();
      add(c, p.indexOf('video')>=0?'video':null);
    }
  });
  // outerHTML 전체에서 raw 미디어 URL
  (document.documentElement.outerHTML.match(media)||[]).forEach(function(u){add(u);});
  // iframe 내부 (same-origin만)
  document.querySelectorAll('iframe').forEach(function(f){try{
    var d=f.contentDocument; if(!d) return;
    d.querySelectorAll('img').forEach(function(el){add(el.src,'image');});
    d.querySelectorAll('video,audio').forEach(function(el){add(el.src,'video');add(el.currentSrc,'video');add(el.poster,'image');
      el.querySelectorAll('source').forEach(function(s){add(s.src,'video');});});
  }catch(e){}});

  var arr=Array.from(items.entries()).map(function(e){return {url:e[0],type:e[1]};});
  // 영상 먼저, 그 다음 GIF, 마지막 이미지
  var order={video:0,gif:1,image:2};
  arr.sort(function(a,b){return (order[a.type]||9)-(order[b.type]||9);});

  function fname(u,t){
    var n=''; try{n=decodeURIComponent(new URL(u).pathname.split('/').pop()||'');}catch(e){}
    n=n.replace(/[^\\w\\-.]+/g,'_').slice(0,80);
    if(!n) n='file';
    if(!/\\.[a-z0-9]+$/i.test(n)) n+=(t==='video'?'.mp4':(t==='gif'?'.gif':'.jpg'));
    return n;
  }

  var w=window.open('','_blank');
  var counts={video:0,gif:0,image:0};
  arr.forEach(function(it){counts[it.type]++;});
  var html='<!doctype html><html><head><meta charset="utf-8"><title>추출됨 '+arr.length+'개</title>'+
    '<style>body{font-family:sans-serif;background:#111;color:#eee;padding:20px;margin:0}'+
    '.bar{position:sticky;top:0;background:#111;padding:10px 0;border-bottom:1px solid #333;margin-bottom:14px}'+
    '.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}'+
    '.c{background:#222;border-radius:8px;overflow:hidden;border:1px solid #333}'+
    '.c .m{aspect-ratio:1;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden}'+
    '.c img,.c video{width:100%;height:100%;object-fit:cover;display:block}'+
    '.c .meta{padding:6px 10px;font-size:11px;display:flex;justify-content:space-between;gap:6px}'+
    '.c .meta .b{padding:2px 6px;border-radius:4px;font-weight:600}'+
    '.c .meta .video{background:#5b8cff;color:#fff}'+
    '.c .meta .gif{background:#f3a847;color:#000}'+
    '.c .meta .image{background:#444;color:#ddd}'+
    '.c a{display:block;padding:8px 10px;color:#9bf;font-size:11px;text-decoration:none;word-break:break-all;border-top:1px solid #333}'+
    '.c a:hover{background:#1a1f2a}'+
    'h1{font-size:18px;margin:0 0 6px}.s{color:#9aa3b2;font-size:13px}</style></head><body>'+
    '<div class="bar"><h1>'+arr.length+'개 발견 — 우클릭 → "다른 이름으로 링크 저장"</h1>'+
    '<div class="s">🎬 영상 '+counts.video+' · 🖼 GIF '+counts.gif+' · 📷 이미지 '+counts.image+'</div></div>'+
    '<div class="g">'+
    arr.map(function(it){
      var u=it.url, t=it.type;
      var preview=(t==='video')?'<video src="'+u+'" controls muted preload="metadata"></video>':'<img src="'+u+'" loading="lazy">';
      return '<div class="c"><div class="m">'+preview+'</div>'+
        '<div class="meta"><span>'+(u.split('/').pop().split('?')[0].slice(0,30))+'</span><span class="b '+t+'">'+t.toUpperCase()+'</span></div>'+
        '<a href="'+u+'" download="'+fname(u,t)+'" target="_blank" rel="noopener">⬇ '+fname(u,t)+'</a></div>';
    }).join('')+'</div></body></html>';
  w.document.write(html); w.document.close();
})();`;

const bmlHref = "javascript:" + encodeURIComponent(bookmarkletCode.replace(/\s+/g, " "));
["bml", "bmlTop"].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.href = bmlHref;
  el.addEventListener("click", (e) => {
    e.preventDefault();
    alert("이 버튼을 '클릭'하지 말고 브라우저의 북마크 바로 '드래그' 해주세요. (드래그가 안 되면 '북마클릿 코드 복사' 버튼을 사용하세요)");
  });
});
