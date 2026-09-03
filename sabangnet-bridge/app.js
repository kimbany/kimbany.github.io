/* ===========================================================
 *  출고 · 송장 양식 변환기
 *  사방넷 출고 엑셀 → A업체 발주 양식 / A업체 송장 엑셀 → 사방넷 운송장 양식
 *  의존: SheetJS (xlsx-js-style)  ·  모든 처리는 브라우저 안에서만 수행
 * =========================================================== */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const LS_KEY = "sbnBridge.v1";
const MAX_TPL = 5 * 1024 * 1024; // 서식 유지 저장 가능한 양식 파일 최대 크기

/* ------------------------- 설정 ------------------------- */
const defaultProfile = () => ({
  tplName: "", tplB64: "", tplHdr: 1, tplSheet: "", useTpl: false, fmt: "xlsx",
  tplSamples: {}, cols: [], skipEmpty: true, skipNoTrack: true,
  filterCol: "", filterVals: [], joinA: "", joinB: ""
});

let CFG = { out: defaultProfile(), inv: defaultProfile(), courier: [], product: [] };

function loadCfg() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const o = JSON.parse(raw);
    CFG = {
      out: Object.assign(defaultProfile(), o.out || {}),
      inv: Object.assign(defaultProfile(), o.inv || {}),
      courier: Array.isArray(o.courier) ? o.courier : [],
      product: Array.isArray(o.product) ? o.product : []
    };
  } catch (e) { console.warn("설정 로드 실패", e); }
}
function saveCfg() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(CFG)); }
  catch (e) { info("설정 저장 실패(용량 초과일 수 있습니다): " + e.message); }
}
function info(msg) { const el = $("#cfgInfo"); if (el) el.textContent = msg; }

/* ------------------------- 상태 ------------------------- */
const S = {
  out: { src: null, result: null },
  inv: { src: null, ref: null, result: null }
};

/* ------------------------- 유틸 ------------------------- */
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function normKey(s) {
  return String(s == null ? "" : s)
    .replace(/[\s()[\]{}.,·・_/\\|-]/g, "")
    .replace(/[（）]/g, "")
    .toLowerCase();
}

function stamp() {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64ToBuf(b64) {
  const bin = atob(b64), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* CSV는 UTF-8 → 실패 시 EUC-KR 로 재해석 */
function readWorkbook(buf, fileName) {
  if (/\.csv$/i.test(fileName || "")) {
    let text = new TextDecoder("utf-8").decode(new Uint8Array(buf));
    if (text.indexOf("�") >= 0) {
      try { text = new TextDecoder("euc-kr").decode(new Uint8Array(buf)); } catch (e) { /* 그대로 진행 */ }
    }
    return XLSX.read(text, { type: "string", raw: false });
  }
  return XLSX.read(buf, { type: "array", cellDates: true, cellStyles: true });
}

function sheetAoa(wb, sheetName) {
  const ws = wb.Sheets[sheetName || wb.SheetNames[0]];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, blankrows: true });
}

/* 데이터가 가장 많은 앞쪽 행을 머리글로 추정 */
function detectHeaderRow(aoa) {
  let best = 1, bestCnt = 0;
  const lim = Math.min(aoa.length, 15);
  for (let i = 0; i < lim; i++) {
    const cnt = (aoa[i] || []).filter(v => String(v).trim() !== "").length;
    if (cnt > bestCnt) { bestCnt = cnt; best = i + 1; }
  }
  return best;
}

const COL_LETTER = i => {
  let s = "";
  for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
};

/* 머리글 배열 → 중복/빈칸 없는 이름 배열 */
function uniqueHeaders(row) {
  const seen = {}, out = [];
  (row || []).forEach((v, i) => {
    let name = String(v == null ? "" : v).trim();
    if (!name) name = `${COL_LETTER(i)}열`;
    if (seen[name]) { seen[name]++; name = `${name} (${seen[name]})`; }
    else seen[name] = 1;
    out.push(name);
  });
  return out;
}

/* 업로드 파일 → { name, wb, sheetNames, sheet, hdr, headers, rows } */
function buildTable(src) {
  const aoa = sheetAoa(src.wb, src.sheet);
  const hdr = Math.max(1, Math.min(src.hdr || 1, Math.max(aoa.length, 1)));
  src.hdr = hdr;
  src.headers = uniqueHeaders(aoa[hdr - 1] || []);
  src.rows = [];
  for (let r = hdr; r < aoa.length; r++) {
    const arr = aoa[r] || [];
    if (arr.every(v => String(v == null ? "" : v).trim() === "")) continue;
    const o = {};
    src.headers.forEach((h, i) => { o[h] = arr[i] == null ? "" : arr[i]; });
    src.rows.push(o);
  }
  return src;
}

/* ------------------------- 자동 매핑 사전 ------------------------- */
const GROUPS = [
  { id: "orderNo",   tf: "text",   words: ["주문번호", "주문번호(사방넷)", "사방넷주문번호", "주문no", "오더번호", "orderno", "ordernumber", "주문아이디"] },
  { id: "mallOrder", tf: "text",   words: ["주문번호(쇼핑몰)", "쇼핑몰주문번호", "고객주문번호", "원주문번호", "외부주문번호", "마켓주문번호"] },
  { id: "itemNo",    tf: "text",   words: ["상품주문번호", "주문상세번호", "상세주문번호", "품목주문번호"] },
  { id: "receiver",  tf: "text",   words: ["수취인명", "수취인", "수령인", "수령인명", "수령자", "받는분", "받는사람", "수하인", "수하인명", "받는분성명", "수취인이름", "받는사람이름"] },
  { id: "orderer",   tf: "text",   words: ["주문자", "주문자명", "구매자명", "구매자"] },
  { id: "sender",    tf: "text",   words: ["보내는분", "보내는분성명", "보내는분주소", "보내는분전화번호", "보내는분우편번호", "발송인", "발송인명", "송하인", "송하인명", "보내는사람"] },
  { id: "tel1",      tf: "phone",  words: ["수취인전화번호1", "수취인전화번호", "수취인연락처", "수취인휴대폰", "전화번호", "전화번호1", "연락처", "연락처1", "휴대폰번호", "휴대전화", "핸드폰", "받는분전화번호", "tel", "hp"] },
  { id: "tel2",      tf: "phone",  words: ["수취인전화번호2", "전화번호2", "연락처2", "추가연락처", "보조연락처", "수취인연락처2"] },
  { id: "zip",       tf: "text",   words: ["우편번호", "우편번호신", "받는분우편번호", "zipcode", "zip", "post"] },
  { id: "addr",      tf: "text",   words: ["수취인주소", "수취인주소(1)", "수취인주소1", "주소", "배송지주소", "배송주소", "수하인주소", "전체주소", "주소1", "배송지", "받는분주소"] },
  { id: "addr2",     tf: "text",   words: ["상세주소", "주소2", "나머지주소", "수취인주소(2)", "수취인주소2"] },
  { id: "memo",      tf: "text",   words: ["배송메세지", "배송메시지", "배송메모", "배송요청사항", "요청사항", "배송시요청사항", "고객요청사항", "전달사항", "메모", "비고"] },
  { id: "product",   tf: "text",   words: ["상품명", "상품명(확정)", "품목명", "제품명", "품명", "상품", "모델명", "출고상품명"] },
  { id: "option",    tf: "text",   words: ["옵션별칭", "옵션", "옵션명", "옵션정보", "상품옵션", "선택옵션", "옵션내용"] },
  { id: "qty",       tf: "num",    words: ["수량", "주문수량", "구매수량", "출고수량", "개수", "qty", "총수량", "판매수량"] },
  { id: "sku",       tf: "text",   words: ["상품코드", "제품코드", "품목코드", "자체상품코드", "sku", "바코드", "관리코드", "출고코드"] },
  { id: "payType",   tf: "text",   words: ["배송결제", "배송결제(신용,착불)", "결제방법", "운임구분", "선불착불", "배송비결제"] },
  { id: "courier",   tf: "courier",words: ["택배사", "택배사명", "배송업체", "배송사", "배송사명", "운송사", "courier", "배송방법"] },
  { id: "tracking",  tf: "digits", words: ["송장번호", "운송장번호", "운송장", "송장", "운송장no", "invoiceno", "trackingno", "trackingnumber", "등기번호"] },
  { id: "mall",      tf: "text",   words: ["쇼핑몰", "판매처", "마켓", "채널", "쇼핑몰명", "사이트"] },
  { id: "price",     tf: "num",    words: ["판매가", "결제금액", "상품금액", "단가", "금액", "총금액", "공급가"] },
  { id: "shipDate",  tf: "text",   words: ["출고일", "발송일", "출고일자", "발송일자", "주문일", "주문일자", "결제일"] }
];
const GROUP_OF = {};
GROUPS.forEach(g => g.words.forEach(w => { GROUP_OF[normKey(w)] = g; }));

function groupOf(name) {
  const k = normKey(name);
  if (!k) return null;
  if (GROUP_OF[k]) return GROUP_OF[k];
  let best = null, bestLen = 0;
  for (const g of GROUPS) for (const w of g.words) {
    const wk = normKey(w);
    if (wk.length < 3 || k.length < 2) continue;
    if ((k.includes(wk) || wk.includes(k)) && wk.length > bestLen) { bestLen = wk.length; best = g; }
  }
  return best;
}

function scoreMatch(target, cand) {
  const a = normKey(target), b = normKey(cand);
  if (!a || !b) return 0;
  if (a === b) return 100;
  const ga = groupOf(target), gb = groupOf(cand);
  if (ga && gb && ga.id === gb.id) return 80;
  if (a.includes(b) || b.includes(a)) return 50 + Math.min(a.length, b.length);
  return 0;
}

/* ------------------------- 값 가공 ------------------------- */
const TFS = [
  ["text", "그대로"], ["num", "숫자"], ["digits", "숫자만"], ["phone", "전화(하이픈)"],
  ["zip", "우편번호만"], ["zipBr", "우편번호([] 포함)"], ["noZip", "주소만(우편번호 빼기)"],
  ["trim", "공백제거"], ["product", "상품명 변환"], ["courier", "택배사 변환"]
];

const ZIP_RE = /\[\s*([0-9]{3}\s*-?\s*[0-9]{2,3})\s*\]/;

function applyTf(raw, tf) {
  let v = raw == null ? "" : raw;
  if (v instanceof Date) {
    const p = n => String(n).padStart(2, "0");
    v = `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
  }
  v = String(v);
  switch (tf) {
    case "num": {
      const n = Number(v.replace(/[^0-9.\-]/g, ""));
      return { v: isFinite(n) && v.trim() !== "" ? n : "", t: "n" };
    }
    case "digits": return { v: v.replace(/[^0-9]/g, ""), t: "s" };
    case "phone": {
      const d = v.replace(/[^0-9]/g, "");
      let out = d;
      if (d.length === 11) out = d.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
      else if (d.length === 10) out = d.startsWith("02")
        ? d.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3") : d.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
      else if (d.length === 9 && d.startsWith("02")) out = d.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
      return { v: out, t: "s" };
    }
    case "zip": {
      const m = v.match(ZIP_RE);
      if (m) return { v: m[1].replace(/[^0-9]/g, ""), t: "s" };
      const p = v.trim().match(/^([0-9]{3}\s*-?\s*[0-9]{2,3})(\s|$)/);
      if (p) return { v: p[1].replace(/[^0-9]/g, ""), t: "s" };
      const only = v.replace(/[^0-9]/g, "");
      return { v: /^[0-9]{5,6}$/.test(only) ? only : "", t: "s" };
    }
    case "zipBr": {
      const m = v.match(ZIP_RE);
      if (m) return { v: "[" + m[1].replace(/\s/g, "") + "]", t: "s" };
      const only = v.replace(/[^0-9]/g, "");
      return { v: only ? "[" + only + "]" : "", t: "s" };
    }
    case "product": {
      const key = v.trim();
      const hit = CFG.product.find(x => x.from.trim() === key)
        || CFG.product.find(x => normKey(x.from) === normKey(key));
      return { v: hit ? (hit.to || hit.from) : key, t: "s" };
    }
    case "noZip": {
      let out = v.replace(ZIP_RE, " ");
      out = out.replace(/^\s*[0-9]{3}\s*-?\s*[0-9]{2,3}\s+/, "");
      return { v: out.replace(/\s{2,}/g, " ").trim(), t: "s" };
    }
    case "trim":   return { v: v.trim(), t: "s" };
    case "courier": {
      const key = v.trim();
      const hit = CFG.courier.find(c => c.from.trim() === key)
        || CFG.courier.find(c => normKey(c.from) === normKey(key));
      return { v: hit ? hit.to : key, t: "s" };
    }
    default: return { v: v.trim(), t: "s" };
  }
}

/* ------------------------- 소스 컬럼 목록 ------------------------- */
function sourceOptions(ns) {
  const list = [];
  const src = S[ns].src;
  if (src) src.headers.forEach(h => list.push({ value: h, label: h, group: "업로드 파일" }));
  if (ns === "inv" && S.inv.ref) S.inv.ref.headers.forEach(h => list.push({ value: "REF:" + h, label: h, group: "원본 출고 파일" }));
  return list;
}

/* ------------------------- 매핑 표 렌더 ------------------------- */
function renderMap(ns) {
  const tb = $(`#${ns}Map tbody`);
  const cols = CFG[ns].cols;
  const opts = sourceOptions(ns);
  if (!cols.length) {
    tb.innerHTML = `<tr><td colspan="5" class="empty">양식 파일을 올리거나 <b>+ 컬럼 추가</b>로 출력 컬럼을 만들어 주세요.</td></tr>`;
    return;
  }
  tb.innerHTML = cols.map((c, i) => {
    const modeSel = `<select data-i="${i}" data-f="mode">
        <option value="map"${c.mode === "map" ? " selected" : ""}>파일에서 가져오기</option>
        <option value="combine"${c.mode === "combine" ? " selected" : ""}>여러 컬럼 합치기</option>
        <option value="const"${c.mode === "const" ? " selected" : ""}>고정값</option>
        <option value="blank"${c.mode === "blank" ? " selected" : ""}>비움</option>
      </select>`;
    let valCell = "";
    if (c.mode === "const") {
      valCell = `<input type="text" data-i="${i}" data-f="val" value="${esc(c.val)}" placeholder="모든 행에 넣을 값">`;
    } else if (c.mode === "blank") {
      valCell = `<span class="muted">—</span>`;
    } else if (c.mode === "combine") {
      const picked = c.srcs || [];
      valCell = `<div class="combine">
        <select data-i="${i}" data-f="srcs" multiple size="4">` +
        opts.map(o => `<option value="${esc(o.value)}"${picked.includes(o.value) ? " selected" : ""}>${esc(o.label)}${o.group === "원본 출고 파일" ? " (원본)" : ""}</option>`).join("") +
        `</select>
        <input type="text" data-i="${i}" data-f="sep" value="${esc(c.sep == null ? " " : c.sep)}" placeholder="구분자" title="이어붙일 때 사이에 넣을 문자">
        <span class="hint2">Ctrl(⌘)+클릭으로 여러 개 선택 · 위에서부터 순서대로 이어붙입니다</span>
      </div>`;
    } else {
      const groups = {};
      opts.forEach(o => { (groups[o.group] = groups[o.group] || []).push(o); });
      const body = Object.keys(groups).map(g =>
        `<optgroup label="${esc(g)}">` + groups[g].map(o =>
          `<option value="${esc(o.value)}"${c.src === o.value ? " selected" : ""}>${esc(o.label)}</option>`).join("") + `</optgroup>`).join("");
      const missing = c.src && !opts.some(o => o.value === c.src)
        ? `<option value="${esc(c.src)}" selected>${esc(c.src.replace(/^REF:/, ""))} (없음)</option>` : "";
      valCell = `<select data-i="${i}" data-f="src" class="${c.src ? "" : "warn"}">
          <option value="">— 선택 —</option>${missing}${body}</select>`;
    }
    const tfSel = `<select data-i="${i}" data-f="tf"${c.mode === "blank" ? " disabled" : ""}>` +
      TFS.map(([v, l]) => `<option value="${v}"${c.tf === v ? " selected" : ""}>${l}</option>`).join("") + `</select>`;
    return `<tr>
      <td><input type="text" data-i="${i}" data-f="name" value="${esc(c.name)}"></td>
      <td>${modeSel}</td>
      <td>${valCell}</td>
      <td>${tfSel}</td>
      <td class="act">
        <button class="mini" data-i="${i}" data-f="up" title="위로">↑</button>
        <button class="mini" data-i="${i}" data-f="down" title="아래로">↓</button>
        <button class="mini danger" data-i="${i}" data-f="del" title="삭제">✕</button>
      </td>
    </tr>`;
  }).join("");
}

function bindMap(ns) {
  const table = $(`#${ns}Map`);
  const handler = e => {
    const el = e.target;
    const i = el.dataset.i, f = el.dataset.f;
    if (i == null || !f) return;
    const cols = CFG[ns].cols, idx = Number(i);
    let restructure = true;
    if (f === "del") { cols.splice(idx, 1); }
    else if (f === "up") { if (idx > 0) cols.splice(idx - 1, 0, cols.splice(idx, 1)[0]); }
    else if (f === "down") { if (idx < cols.length - 1) cols.splice(idx + 1, 0, cols.splice(idx, 1)[0]); }
    else if (f === "srcs") { cols[idx].srcs = Array.from(el.selectedOptions).map(o => o.value); restructure = false; }
    else { cols[idx][f] = el.value; restructure = (f === "mode"); }
    saveCfg();
    if (restructure) renderMap(ns);
  };
  table.addEventListener("change", handler);
  table.addEventListener("click", e => { if (e.target.matches("button.mini")) handler(e); });
}

/* ------------------------- 자동 매핑 ------------------------- */
/* 값 안에 [우편번호]가 들어있는 소스 컬럼 찾기 (사방넷 주소 형식) */
function zipEmbeddedSources(ns) {
  const set = new Set();
  const scan = (tbl, prefix) => {
    if (!tbl) return;
    tbl.headers.forEach(h => {
      if (tbl.rows.slice(0, 30).some(r => ZIP_RE.test(String(r[h] == null ? "" : r[h])))) set.add(prefix + h);
    });
  };
  scan(S[ns].src, "");
  if (ns === "inv") scan(S.inv.ref, "REF:");
  return set;
}

/* 상품 변환표에 등록된 품목명이 실제로 들어 있는 소스 컬럼 찾기 */
function productSourceGuess(ns) {
  if (!CFG.product.length) return "";
  const keys = new Set(CFG.product.map(x => normKey(x.from)));
  let best = "", bestHit = 0;
  const tbl = S[ns].src;
  if (!tbl) return "";
  tbl.headers.forEach(h => {
    let hit = 0;
    tbl.rows.slice(0, 300).forEach(r => { if (keys.has(normKey(r[h]))) hit++; });
    if (hit > bestHit) { bestHit = hit; best = h; }
  });
  return bestHit > 0 ? best : "";
}

function autoMap(ns) {
  const opts = sourceOptions(ns);
  if (!opts.length) { alert("먼저 파일을 업로드해 주세요."); return; }
  const cols = CFG[ns].cols;
  const used = new Set();

  const samples = CFG[ns].tplSamples || {};
  const sample1 = name => (samples[name] && samples[name][0]) || "";
  const allSame = name => {
    const v = samples[name] || [];
    return v.length >= 2 && new Set(v).size === 1 ? v[0] : "";
  };

  const tplHasData = Object.keys(samples).some(k => (samples[k] || []).length);
  const prodSrc = productSourceGuess(ns);

  cols.forEach(c => {
    if (c.mode !== "map") return;
    const gc = groupOf(c.name);
    /* 양식 견본에서 이 칸이 늘 비어 있었다면 그대로 비운다 */
    if (tplHasData && !(samples[c.name] || []).length) { c.mode = "blank"; c.src = ""; return; }
    /* 상품 변환표에 등록해 둔 품목명이 들어 있는 컬럼을 우선 연결 */
    if (gc && gc.id === "product" && prodSrc) {
      c.src = prodSrc; used.add(prodSrc); c.tf = "product"; return;
    }
    /* 보내는분(발송인) 칸은 매번 같은 값 → 양식에 들어 있던 값을 고정값으로 */
    if (gc && gc.id === "sender") {
      const fixed = allSame(c.name) || sample1(c.name);
      if (fixed) { c.mode = "const"; c.val = fixed; c.tf = "text"; }
      return;
    }
    let best = null, bestScore = 0;
    opts.forEach(o => {
      let sc = scoreMatch(c.name, o.label);
      if (!sc) return;
      if (used.has(o.value)) sc -= 30;
      if (o.value.startsWith("REF:")) sc -= 20; // 같은 값이면 업로드 파일 쪽을 우선(조인 실패 대비)
      if (sc > bestScore) { bestScore = sc; best = o; }
    });
    if (best && bestScore >= 45) {
      c.src = best.value; used.add(best.value);
      const g = gc || groupOf(best.label);
      if (g) c.tf = g.tf;
      /* 양식에 남아 있는 견본값으로 형식을 맞춘다 */
      const ex = sample1(c.name);
      if (g && g.id === "zip" && ex) c.tf = /^\s*\[/.test(ex) ? "zipBr" : "zip";
      if (g && (g.id === "tel1" || g.id === "tel2") && ex) c.tf = /-/.test(ex) ? "phone" : "digits";
      if (g && g.id === "product" && CFG.product.length) c.tf = "product";
    } else {
      /* 소스에 대응이 없고 양식 견본이 늘 같은 값이면 고정값으로 */
      const fixed = allSame(c.name);
      if (fixed) { c.mode = "const"; c.val = fixed; c.tf = "text"; }
    }
  });

  /* 사방넷 주소는 "[352-51] 대전 서구 …" 처럼 우편번호가 주소에 붙어 있다.
     우편번호 컬럼이 따로 있으면 주소에서 뽑아 쓰고, 주소 컬럼은 우편번호를 뺀다. */
  const zipCols = zipEmbeddedSources(ns);
  if (zipCols.size) {
    const firstZipCol = Array.from(zipCols)[0];
    let extracted = false;
    cols.forEach(c => {
      const g = groupOf(c.name);
      if (c.mode !== "map" || !g || g.id !== "zip") return;
      if (!c.src || zipCols.has(c.src)) {
        c.src = c.src || firstZipCol;
        const ex = sample1(c.name);
        c.tf = ex && /^\s*\[/.test(ex) ? "zipBr" : "zip";
        extracted = true;
      }
    });
    if (extracted) cols.forEach(c => {
      const g = groupOf(c.name);
      if (c.mode === "map" && g && g.id === "addr" && zipCols.has(c.src) && c.tf === "text") c.tf = "noZip";
    });
  }

  saveCfg();
  renderMap(ns);
}

/* ------------------------- 양식(템플릿) ------------------------- */
async function registerTemplate(ns, file) {
  const buf = await file.arrayBuffer();
  const wb = readWorkbook(buf, file.name);
  const sheet = wb.SheetNames[0];
  const aoa = sheetAoa(wb, sheet);
  const cfg = CFG[ns];
  const hdrInput = $(`#${ns}TplHdr`);
  const hdr = Number(hdrInput.value) || detectHeaderRow(aoa);
  hdrInput.value = hdr;
  const headers = uniqueHeaders(aoa[hdr - 1] || []);
  if (!headers.length) { alert("양식에서 머리글을 찾지 못했습니다. 머리글 행 번호를 확인해 주세요."); return; }

  cfg.tplName = file.name;
  cfg.tplHdr = hdr;
  cfg.tplSheet = sheet;
  cfg.fmt = /\.xls$/i.test(file.name) ? cfg.fmt : "xlsx";
  cfg.tplSamples = {};
  headers.forEach((h, i) => {
    const vals = [];
    for (let r = hdr; r < aoa.length && vals.length < 20; r++) {
      const v = String((aoa[r] || [])[i] == null ? "" : (aoa[r] || [])[i]).trim();
      if (v !== "") vals.push(v);
    }
    cfg.tplSamples[h] = vals;
  });
  cfg.tplB64 = (!/\.csv$/i.test(file.name) && buf.byteLength <= MAX_TPL) ? bufToB64(buf) : "";
  cfg.useTpl = !!cfg.tplB64;
  cfg.cols = headers.map(h => {
    const g = groupOf(h);
    return { name: h, mode: "map", src: "", val: "", srcs: [], sep: " ", tf: g ? g.tf : "text" };
  });
  saveCfg();
  syncTplUI(ns);
  if (sourceOptions(ns).length) autoMap(ns); else renderMap(ns);
}

function syncTplUI(ns) {
  const cfg = CFG[ns];
  const has = !!cfg.tplName;
  $(`#${ns}TplBadge`).textContent = has ? "등록됨" : "미등록";
  $(`#${ns}TplBadge`).classList.toggle("ok", has);
  $(`#${ns}TplHdr`).value = cfg.tplHdr || 1;
  $(`#${ns}UseTpl`).checked = !!cfg.useTpl;
  $(`#${ns}UseTpl`).disabled = !cfg.tplB64;
  $(`#${ns}Fmt`).value = cfg.fmt || "xlsx";
  $(`#${ns}TplInfo`).textContent = has
    ? `양식: ${cfg.tplName} · 시트 ${cfg.tplSheet || "첫 번째"} · 컬럼 ${cfg.cols.length}개`
      + (cfg.tplB64 ? "" : " · (파일이 커서 또는 CSV라 서식 유지 저장은 사용할 수 없습니다)")
    : "등록된 양식이 없습니다. 컬럼만 직접 추가해서 써도 됩니다.";
}

/* ------------------------- 변환 ------------------------- */
function convert(ns) {
  const cfg = CFG[ns], src = S[ns].src;
  if (!src) { alert("변환할 파일을 먼저 올려주세요."); return null; }
  if (!cfg.cols.length) { alert("출력 컬럼이 없습니다. 양식을 등록하거나 컬럼을 추가해 주세요."); return null; }

  /* 원본 출고 파일 조인 인덱스 */
  let refIndex = null;
  if (ns === "inv" && S.inv.ref && cfg.joinA && cfg.joinB) {
    refIndex = new Map();
    S.inv.ref.rows.forEach(r => {
      const k = String(r[cfg.joinB] == null ? "" : r[cfg.joinB]).trim();
      if (!k) return;
      if (!refIndex.has(k)) refIndex.set(k, []);
      refIndex.get(k).push(r);
    });
  }
  const needsRef = cfg.cols.some(c =>
    (c.mode === "map" && String(c.src).startsWith("REF:")) ||
    (c.mode === "combine" && (c.srcs || []).some(k => String(k).startsWith("REF:"))));
  if (needsRef && !refIndex) {
    alert("원본 출고 파일에서 값을 가져오도록 설정된 컬럼이 있습니다.\n원본 파일을 올리고 연결키(주문번호 등)를 선택해 주세요.");
    return null;
  }

  const headers = cfg.cols.map(c => c.name);
  const trackIdx = cfg.cols.findIndex(c => { const g = groupOf(c.name); return g && g.id === "tracking"; });
  const keyIdx = cfg.cols.findIndex(c => { const g = groupOf(c.name); return g && (g.id === "orderNo" || g.id === "mallOrder"); });
  const rows = [];
  const seen = new Set();
  let skipped = 0, unmatched = 0, filtered = 0, expanded = 0;

  const wanted = cfg.filterCol && (cfg.filterVals || []).length
    ? new Set(cfg.filterVals.map(v => String(v).trim())) : null;

  src.rows.forEach(row => {
    if (wanted && !wanted.has(String(row[cfg.filterCol] == null ? "" : row[cfg.filterCol]).trim())) { filtered++; return; }

    /* 원본 출고 파일과 연결: 같은 주문번호가 여러 건이면 건마다 한 줄씩 만든다 */
    let refRows = [null];
    if (refIndex) {
      const k = String(row[cfg.joinA] == null ? "" : row[cfg.joinA]).trim();
      const hit = refIndex.get(k);
      if (hit && hit.length) { refRows = hit; if (hit.length > 1) expanded += hit.length - 1; }
      else if (needsRef) unmatched++;
    }
    refRows.forEach(refRow => emit(row, refRow));
  });

  function emit(row, refRow) {
    const cells = cfg.cols.map(c => {
      if (c.mode === "blank") return { v: "", t: "s" };
      if (c.mode === "const") return applyTf(c.val, c.tf);
      const pick = key => {
        const raw = String(key).startsWith("REF:") ? (refRow ? refRow[key.slice(4)] : "") : row[key];
        return raw == null ? "" : raw;
      };
      if (c.mode === "combine") {
        const parts = (c.srcs || []).map(k => String(pick(k)).trim()).filter(x => x !== "");
        return applyTf(parts.join(c.sep == null ? " " : c.sep), c.tf);
      }
      return applyTf(pick(c.src), c.tf);
    });

    if (cfg.skipEmpty && cells.every(c => String(c.v).trim() === "")) { skipped++; return; }
    if (ns === "inv" && cfg.skipNoTrack && trackIdx >= 0
        && String(cells[trackIdx].v).trim() === "") { skipped++; return; }
    if (refIndex && keyIdx >= 0) {
      const k = String(cells[keyIdx].v).trim();
      if (k) { if (seen.has(k)) return; seen.add(k); }
    }
    rows.push(cells);
  }

  return { headers, rows, skipped, unmatched, filtered, expanded };
}

function renderPreview(ns, res) {
  const el = $(`#${ns}Prev`);
  if (!res || !res.rows.length) { el.innerHTML = ""; return; }
  const lim = res.rows.slice(0, 15);
  el.innerHTML =
    `<thead><tr>${res.headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>` +
    `<tbody>${lim.map(r => `<tr>${r.map(c => `<td>${esc(c.v)}</td>`).join("")}</tr>`).join("")}</tbody>`;
}

/* .xls 등에서 읽은 서식을 저장 가능한 형태로 맞춘다(헤더 배경색 유지) */
function normStyle(st) {
  if (!st) return undefined;
  const o = {};
  ["font", "alignment", "border", "numFmt", "fill"].forEach(k => { if (st[k]) o[k] = st[k]; });
  if (!o.fill && st.patternType && st.patternType !== "none" && st.fgColor)
    o.fill = { patternType: st.patternType, fgColor: st.fgColor, bgColor: st.bgColor };
  return Object.keys(o).length ? o : undefined;
}

/* 결과 → 워크북 */
function buildWorkbook(ns, res) {
  const cfg = CFG[ns];
  if (cfg.useTpl && cfg.tplB64) {
    const wb = XLSX.read(b64ToBuf(cfg.tplB64), { type: "array", cellStyles: true });
    const sheetName = wb.SheetNames.includes(cfg.tplSheet) ? cfg.tplSheet : wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    Object.keys(ws).forEach(a => { if (a[0] !== "!" && ws[a] && ws[a].s) ws[a].s = normStyle(ws[a].s); });
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    const hdrIdx = (cfg.tplHdr || 1) - 1;

    /* 머리글 바로 아래 행의 서식을 견본으로 확보 */
    const sample = [];
    for (let c = 0; c <= Math.max(range.e.c, res.headers.length - 1); c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: hdrIdx + 1, c })];
      sample[c] = cell && cell.s ? cell.s : null;
    }
    /* 기존 데이터 행 제거 */
    for (let r = hdrIdx + 1; r <= range.e.r; r++)
      for (let c = range.s.c; c <= range.e.c; c++) delete ws[XLSX.utils.encode_cell({ r, c })];

    res.rows.forEach((cells, ri) => {
      const r = hdrIdx + 1 + ri;
      cells.forEach((cell, c) => {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (cell.t === "n" && cell.v === "") { return; }
        const o = cell.t === "n" ? { t: "n", v: cell.v } : { t: "s", v: String(cell.v) };
        if (sample[c]) o.s = sample[c];
        ws[addr] = o;
      });
    });
    const lastCol = Math.max(range.e.c, res.headers.length - 1);
    const lastRow = Math.max(hdrIdx, hdrIdx + res.rows.length);
    ws["!ref"] = XLSX.utils.encode_range({ s: { r: range.s.r, c: range.s.c }, e: { r: lastRow, c: lastCol } });
    return wb;
  }

  const aoa = [res.headers.slice()];
  res.rows.forEach(cells => aoa.push(cells.map(c => (c.t === "n" && c.v !== "" ? c.v : String(c.v)))));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = res.headers.map((h, i) => {
    let w = String(h).length + 2;
    for (let r = 1; r < Math.min(aoa.length, 200); r++) w = Math.max(w, String(aoa[r][i] == null ? "" : aoa[r][i]).length + 2);
    return { wch: Math.min(Math.max(w, 8), 40) };
  });
  for (let c = 0; c < res.headers.length; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: "F1F3F6" } }, alignment: { horizontal: "center" } };
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, ns === "out" ? "발주" : "운송장");
  return wb;
}

function download(ns) {
  const res = S[ns].result;
  if (!res) return;
  const wb = buildWorkbook(ns, res);
  const base = ns === "out" ? "업체발주" : "사방넷운송장";
  const xls = CFG[ns].fmt === "xls";
  XLSX.writeFile(wb, `${base}_${stamp()}.${xls ? "xls" : "xlsx"}`,
    xls ? { bookType: "biff8" } : { bookType: "xlsx", cellStyles: true });
}

/* ------------------------- 파일 업로드 처리 ------------------------- */
async function loadSource(ns, file) {
  const buf = await file.arrayBuffer();
  const wb = readWorkbook(buf, file.name);
  const sheet = wb.SheetNames[0];
  const src = { name: file.name, wb, sheet, hdr: 0 };
  src.hdr = detectHeaderRow(sheetAoa(wb, sheet));
  buildTable(src);
  S[ns].src = src;
  S[ns].result = null;
  $(`#${ns}Dl`).disabled = true;
  $(`#${ns}Result`).textContent = "";
  $(`#${ns}Prev`).innerHTML = "";

  $(`#${ns}SrcInfo`).hidden = false;
  $(`#${ns}SrcName`).textContent = file.name;
  $(`#${ns}SrcSheet`).innerHTML = wb.SheetNames.map(n => `<option${n === sheet ? " selected" : ""}>${esc(n)}</option>`).join("");
  $(`#${ns}SrcHdr`).value = src.hdr;
  updateSrcCount(ns);

  if (!CFG[ns].cols.length) {
    /* 양식이 없으면 업로드 파일 컬럼을 그대로 출력 컬럼으로 제안 */
    CFG[ns].cols = src.headers.map(h => {
      const g = groupOf(h);
      return { name: h, mode: "map", src: h, val: "", srcs: [], sep: " ", tf: g ? g.tf : "text" };
    });
    saveCfg();
    renderMap(ns);
  } else if (CFG[ns].cols.every(c => !c.src)) {
    autoMap(ns);
  } else {
    renderMap(ns);
  }
  if (ns === "inv") refreshJoinUI();
  renderFilter(ns); renderProduct();
}

function updateSrcCount(ns) {
  const src = S[ns].src;
  $(`#${ns}SrcCnt`).textContent = src ? `${src.rows.length.toLocaleString()}행 · ${src.headers.length}컬럼` : "";
}

function clearSource(ns) {
  S[ns].src = null; S[ns].result = null;
  $(`#${ns}SrcInfo`).hidden = true;
  $(`#${ns}SrcFile`).value = "";
  $(`#${ns}Prev`).innerHTML = "";
  $(`#${ns}Result`).textContent = "";
  $(`#${ns}Dl`).disabled = true;
  renderMap(ns); renderFilter(ns);
}

/* ------------------------- ② 원본 출고 파일(조인) ------------------------- */
async function loadRef(file) {
  const buf = await file.arrayBuffer();
  const wb = readWorkbook(buf, file.name);
  const sheet = wb.SheetNames[0];
  const ref = { name: file.name, wb, sheet, hdr: 0 };
  ref.hdr = detectHeaderRow(sheetAoa(wb, sheet));
  buildTable(ref);
  S.inv.ref = ref;
  refreshJoinUI();
  renderMap("inv");
}

function refreshJoinUI() {
  const ref = S.inv.ref, src = S.inv.src;
  const row = $("#invJoinRow");
  if (!ref) { row.hidden = true; return; }
  row.hidden = false;
  const cfg = CFG.inv;
  const byName = (headers, prev) => {
    if (prev && headers.includes(prev)) return prev;
    let best = "", sc = 0;
    headers.forEach(h => { const s2 = scoreMatch("주문번호", h); if (s2 > sc) { sc = s2; best = h; } });
    return sc >= 45 ? best : (headers[0] || "");
  };
  const aH = src ? src.headers : [];
  cfg.joinA = byName(aH, cfg.joinA);

  /* 이름보다 값이 정확하다: 송장 파일의 연결키 값이 실제로 들어 있는 원본 컬럼을 고른다 */
  let matched = "";
  if (src && cfg.joinA) {
    const keys = new Set(src.rows.slice(0, 100)
      .map(r => String(r[cfg.joinA] == null ? "" : r[cfg.joinA]).trim()).filter(v => v !== ""));
    let bestHit = 0;
    if (keys.size) ref.headers.forEach(h => {
      let hit = 0;
      ref.rows.forEach(r => { if (keys.has(String(r[h] == null ? "" : r[h]).trim())) hit++; });
      if (hit > bestHit) { bestHit = hit; matched = h; }
    });
  }
  cfg.joinB = matched || byName(ref.headers, cfg.joinB);

  $("#invJoinA").innerHTML = aH.map(h => `<option${h === cfg.joinA ? " selected" : ""}>${esc(h)}</option>`).join("")
    || `<option value="">송장 파일을 먼저 올려주세요</option>`;
  $("#invJoinB").innerHTML = ref.headers.map(h => `<option${h === cfg.joinB ? " selected" : ""}>${esc(h)}</option>`).join("");
  $("#invRefInfo").textContent = `원본: ${ref.name} · ${ref.rows.length.toLocaleString()}행`
    + (matched ? " · 값이 일치하는 컬럼을 자동으로 찾았습니다" : "");
  saveCfg();
}

/* ------------------------- 보낼 대상 고르기(필터) ------------------------- */
function filterColumnGuess(src) {
  let best = "", sc = 0;
  src.headers.forEach(h => {
    const g = groupOf(h);
    const s2 = g && g.id === "option" ? 3 : (g && g.id === "product" ? 2 : 0);
    if (s2 > sc) { sc = s2; best = h; }
  });
  return best || src.headers[0] || "";
}

function renderFilter(ns) {
  const wrap = $(`#${ns}FilterList`), sel = $(`#${ns}FilterCol`);
  if (!wrap || !sel) return;
  const src = S[ns].src, cfg = CFG[ns];
  if (!src) {
    sel.innerHTML = `<option value="">파일을 먼저 올려주세요</option>`;
    wrap.innerHTML = `<p class="empty">파일을 올리면 품목 목록이 나옵니다.</p>`;
    $(`#${ns}FilterCnt`).textContent = "";
    return;
  }
  if (!cfg.filterCol || !src.headers.includes(cfg.filterCol)) cfg.filterCol = filterColumnGuess(src);
  sel.innerHTML = src.headers.map(h => `<option${h === cfg.filterCol ? " selected" : ""}>${esc(h)}</option>`).join("");

  const counts = new Map();
  src.rows.forEach(r => {
    const v = String(r[cfg.filterCol] == null ? "" : r[cfg.filterCol]).trim();
    counts.set(v, (counts.get(v) || 0) + 1);
  });
  const picked = new Set((cfg.filterVals || []).map(v => String(v).trim()));
  wrap.innerHTML = Array.from(counts.entries()).map(([v, n]) =>
    `<label class="chk item"><input type="checkbox" data-fv="${esc(v)}"${picked.has(v) ? " checked" : ""}>
      <span>${esc(v === "" ? "(빈 값)" : v)}</span><span class="cnt">${n}건</span></label>`).join("");
  const on = (cfg.filterVals || []).filter(v => counts.has(String(v).trim()));
  const total = on.reduce((a, v) => a + (counts.get(String(v).trim()) || 0), 0);
  $(`#${ns}FilterCnt`).textContent = on.length ? `${on.length}개 품목 · ${total}건 선택` : "전체 출력";
}

function bindFilter(ns) {
  const wrap = $(`#${ns}FilterList`);
  if (!wrap) return;
  $(`#${ns}FilterCol`).addEventListener("change", e => {
    CFG[ns].filterCol = e.target.value; CFG[ns].filterVals = []; saveCfg(); renderFilter(ns);
  });
  wrap.addEventListener("change", e => {
    if (!e.target.matches("input[data-fv]")) return;
    const v = e.target.dataset.fv;
    const set = new Set(CFG[ns].filterVals || []);
    if (e.target.checked) set.add(v); else set.delete(v);
    CFG[ns].filterVals = Array.from(set); saveCfg(); renderFilter(ns);
  });
  $(`#${ns}FilterAll`).addEventListener("click", () => {
    const src = S[ns].src; if (!src) return;
    CFG[ns].filterVals = Array.from(new Set(src.rows.map(r => String(r[CFG[ns].filterCol] == null ? "" : r[CFG[ns].filterCol]).trim())));
    saveCfg(); renderFilter(ns);
  });
  $(`#${ns}FilterNone`).addEventListener("click", () => { CFG[ns].filterVals = []; saveCfg(); renderFilter(ns); });
  $(`#${ns}FilterMapped`).addEventListener("click", () => {
    const src = S[ns].src; if (!src) return;
    if (!CFG.product.length) { alert("설정 탭의 상품 변환표가 비어 있습니다.\n먼저 품목을 등록해 주세요."); return; }
    const keys = new Set(CFG.product.map(x => normKey(x.from)));
    const vals = Array.from(new Set(src.rows.map(r => String(r[CFG[ns].filterCol] == null ? "" : r[CFG[ns].filterCol]).trim())));
    CFG[ns].filterVals = vals.filter(v => keys.has(normKey(v)));
    saveCfg(); renderFilter(ns);
    if (!CFG[ns].filterVals.length) alert("변환표에 있는 품목이 이 파일에 없습니다. 기준 컬럼이 맞는지 확인해 주세요.");
  });
}

/* ------------------------- 상품 변환표 ------------------------- */
function renderProduct() {
  const tb = $("#pvTable tbody");
  const sel = $("#pvCol");
  const src = S.out.src;
  sel.innerHTML = src
    ? src.headers.map(h => `<option${h === (CFG.out.filterCol || "") ? " selected" : ""}>${esc(h)}</option>`).join("")
    : `<option value="">① 탭에 파일을 올려주세요</option>`;
  if (!CFG.product.length) { tb.innerHTML = `<tr><td colspan="3" class="empty">등록된 품목이 없습니다.</td></tr>`; return; }
  tb.innerHTML = CFG.product.map((x, i) =>
    `<tr><td class="wrap">${esc(x.from)}</td>
      <td><input type="text" data-pv="${i}" value="${esc(x.to)}" placeholder="A업체 품목명"></td>
      <td class="act"><button class="mini danger" data-pvdel="${i}">✕</button></td></tr>`).join("");
}

/* ------------------------- 택배사 규칙 ------------------------- */
function renderCourier() {
  const tb = $("#cvTable tbody");
  if (!CFG.courier.length) { tb.innerHTML = `<tr><td colspan="3" class="empty">등록된 규칙이 없습니다.</td></tr>`; return; }
  tb.innerHTML = CFG.courier.map((c, i) =>
    `<tr><td>${esc(c.from)}</td><td>${esc(c.to)}</td><td class="act"><button class="mini danger" data-cv="${i}">✕</button></td></tr>`).join("");
}

/* ------------------------- 초기화 / 바인딩 ------------------------- */
function bindDropzone(ns) {
  const drop = $(`#${ns}SrcDrop`), input = $(`#${ns}SrcFile`);
  drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", async e => {
    e.preventDefault(); drop.classList.remove("over");
    const f = e.dataTransfer.files[0];
    if (f) await loadSource(ns, f).catch(err => alert("파일을 읽지 못했습니다: " + err.message));
  });
  input.addEventListener("change", async e => {
    const f = e.target.files[0];
    if (f) await loadSource(ns, f).catch(err => alert("파일을 읽지 못했습니다: " + err.message));
  });
  $(`#${ns}SrcSheet`).addEventListener("change", e => {
    const src = S[ns].src; if (!src) return;
    src.sheet = e.target.value;
    src.hdr = detectHeaderRow(sheetAoa(src.wb, src.sheet));
    $(`#${ns}SrcHdr`).value = src.hdr;
    buildTable(src); updateSrcCount(ns); renderMap(ns); renderFilter(ns);
    if (ns === "inv") refreshJoinUI();
  });
  $(`#${ns}SrcHdr`).addEventListener("change", e => {
    const src = S[ns].src; if (!src) return;
    src.hdr = Math.max(1, Number(e.target.value) || 1);
    buildTable(src); updateSrcCount(ns); renderMap(ns); renderFilter(ns);
    if (ns === "inv") refreshJoinUI();
  });
  $(`#${ns}SrcClear`).addEventListener("click", () => clearSource(ns));
}

function bindProfile(ns) {
  bindDropzone(ns);
  bindMap(ns);

  $(`#${ns}TplFile`).addEventListener("change", async e => {
    const f = e.target.files[0];
    if (!f) return;
    try { await registerTemplate(ns, f); } catch (err) { alert("양식을 읽지 못했습니다: " + err.message); }
    e.target.value = "";
  });
  $(`#${ns}TplHdr`).addEventListener("change", e => { CFG[ns].tplHdr = Math.max(1, Number(e.target.value) || 1); saveCfg(); });
  $(`#${ns}UseTpl`).addEventListener("change", e => { CFG[ns].useTpl = e.target.checked; saveCfg(); });
  $(`#${ns}Fmt`).addEventListener("change", e => { CFG[ns].fmt = e.target.value; saveCfg(); });
  $(`#${ns}TplClear`).addEventListener("click", () => {
    if (!confirm("등록된 양식을 삭제할까요? 매핑 설정은 유지됩니다.")) return;
    Object.assign(CFG[ns], { tplName: "", tplB64: "", tplSheet: "", useTpl: false });
    saveCfg(); syncTplUI(ns);
  });
  $(`#${ns}Auto`).addEventListener("click", () => autoMap(ns));
  $(`#${ns}AddCol`).addEventListener("click", () => {
    CFG[ns].cols.push({ name: "새 컬럼", mode: "map", src: "", val: "", srcs: [], sep: " ", tf: "text" });
    saveCfg(); renderMap(ns);
  });
  $(`#${ns}SkipEmpty`).addEventListener("change", e => { CFG[ns].skipEmpty = e.target.checked; saveCfg(); });
  $(`#${ns}Run`).addEventListener("click", () => {
    const res = convert(ns);
    S[ns].result = res;
    $(`#${ns}Dl`).disabled = !res || !res.rows.length;
    renderPreview(ns, res);
    if (!res) { $(`#${ns}Result`).textContent = ""; return; }
    let msg = `변환 ${res.rows.length.toLocaleString()}행`;
    if (res.filtered) msg += ` · 대상 아님 ${res.filtered}행`;
    if (res.skipped) msg += ` · 제외 ${res.skipped}행`;
    if (res.expanded) msg += ` · 원본 다건 매칭 ${res.expanded}행`;
    if (res.unmatched) msg += ` · 원본 미매칭 ${res.unmatched}행`;
    if (!res.rows.length) msg += " (조건에 맞는 행이 없습니다)";
    $(`#${ns}Result`).textContent = msg;
  });
  $(`#${ns}Dl`).addEventListener("click", () => download(ns));

  syncTplUI(ns);
  $(`#${ns}SkipEmpty`).checked = CFG[ns].skipEmpty;
  renderMap(ns);
}

function init() {
  loadCfg();

  /* 탭 */
  $$(".tab").forEach(t => t.addEventListener("click", () => {
    $$(".tab").forEach(x => x.classList.remove("active"));
    $$(".panel").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    $("#" + t.dataset.tab).classList.add("active");
  }));

  bindProfile("out");
  bindProfile("inv");

  $("#invSkipNoTrack").checked = CFG.inv.skipNoTrack;
  $("#invSkipNoTrack").addEventListener("change", e => { CFG.inv.skipNoTrack = e.target.checked; saveCfg(); });

  /* 원본 출고 파일(조인) */
  $("#invRefFile").addEventListener("change", async e => {
    const f = e.target.files[0];
    if (f) await loadRef(f).catch(err => alert("파일을 읽지 못했습니다: " + err.message));
    e.target.value = "";
  });
  $("#invRefUseOut").addEventListener("click", () => {
    if (!S.out.src) { alert("① 탭에 사방넷 출고 파일을 먼저 올려주세요."); return; }
    S.inv.ref = S.out.src;
    refreshJoinUI(); renderMap("inv");
  });
  $("#invRefClear").addEventListener("click", () => {
    S.inv.ref = null; $("#invJoinRow").hidden = true; renderMap("inv");
  });
  $("#invJoinA").addEventListener("change", e => { CFG.inv.joinA = e.target.value; CFG.inv.joinB = ""; saveCfg(); refreshJoinUI(); });
  $("#invJoinB").addEventListener("change", e => { CFG.inv.joinB = e.target.value; saveCfg(); });

  /* 보낼 대상 고르기 */
  bindFilter("out");

  /* 상품 변환표 */
  $("#pvAdd").addEventListener("click", () => {
    const from = $("#pvFrom").value.trim(), to = $("#pvTo").value.trim();
    if (!from) { alert("사방넷 품목명을 입력해 주세요."); return; }
    if (CFG.product.some(x => x.from === from)) { alert("이미 등록된 품목입니다."); return; }
    CFG.product.push({ from, to: to || from });
    $("#pvFrom").value = ""; $("#pvTo").value = "";
    saveCfg(); renderProduct();
  });
  $("#pvLoad").addEventListener("click", () => {
    const src = S.out.src;
    if (!src) { alert("① 탭에 사방넷 출고 파일을 먼저 올려주세요."); return; }
    const col = $("#pvCol").value;
    const vals = Array.from(new Set(src.rows.map(r => String(r[col] == null ? "" : r[col]).trim()))).filter(v => v !== "");
    let added = 0;
    vals.forEach(v => { if (!CFG.product.some(x => x.from === v)) { CFG.product.push({ from: v, to: v }); added++; } });
    saveCfg(); renderProduct();
    info(`품목 ${added}개를 불러왔습니다. A업체 품목명 칸을 고쳐 주세요.`);
    if (!added) alert("새로 추가할 품목이 없습니다.");
  });
  $("#pvTable").addEventListener("change", e => {
    const i = e.target.dataset.pv;
    if (i == null) return;
    CFG.product[Number(i)].to = e.target.value;
    saveCfg();
  });
  $("#pvTable").addEventListener("click", e => {
    const i = e.target.dataset.pvdel;
    if (i == null) return;
    CFG.product.splice(Number(i), 1); saveCfg(); renderProduct();
  });
  renderProduct();

  /* 택배사 규칙 */
  $("#cvAdd").addEventListener("click", () => {
    const from = $("#cvFrom").value.trim(), to = $("#cvTo").value.trim();
    if (!from) { alert("바꿀 값을 입력해 주세요."); return; }
    CFG.courier.push({ from, to });
    $("#cvFrom").value = ""; $("#cvTo").value = "";
    saveCfg(); renderCourier();
  });
  $("#cvTable").addEventListener("click", e => {
    const i = e.target.dataset.cv;
    if (i == null) return;
    CFG.courier.splice(Number(i), 1); saveCfg(); renderCourier();
  });
  renderCourier();

  /* 설정 백업 */
  $("#cfgExport").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(CFG, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `양식변환기_설정_${stamp()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    info("설정을 내보냈습니다.");
  });
  $("#cfgImport").addEventListener("change", async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const o = JSON.parse(await f.text());
      CFG = {
        out: Object.assign(defaultProfile(), o.out || {}),
        inv: Object.assign(defaultProfile(), o.inv || {}),
        courier: Array.isArray(o.courier) ? o.courier : [],
        product: Array.isArray(o.product) ? o.product : []
      };
      saveCfg();
      syncTplUI("out"); syncTplUI("inv");
      renderMap("out"); renderMap("inv"); renderCourier(); renderProduct(); renderFilter("out");
      info("설정을 가져왔습니다.");
    } catch (err) { alert("설정 파일을 읽지 못했습니다: " + err.message); }
    e.target.value = "";
  });
  $("#cfgReset").addEventListener("click", () => {
    if (!confirm("양식·매핑·택배사 규칙을 모두 삭제할까요?")) return;
    CFG = { out: defaultProfile(), inv: defaultProfile(), courier: [], product: [] };
    localStorage.removeItem(LS_KEY);
    syncTplUI("out"); syncTplUI("inv");
    renderMap("out"); renderMap("inv"); renderCourier(); renderProduct(); renderFilter("out");
    info("초기화했습니다.");
  });
}

document.addEventListener("DOMContentLoaded", init);
