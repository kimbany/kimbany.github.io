/* 엑셀 행사 처리기
 *  - 메뉴1: 1+1 / 사은품 증정 행사 설정 (localStorage)
 *  - 메뉴2: 엑셀 업로드 -> 행사 적용 -> 다운로드
 *  의존: SheetJS (xlsx)
 */

const LS_KEY = "excelPromoConfig.v1";

const state = {
  cfg: { bogo: [], gifts: [] },          // 메뉴1 설정
  workbook: null,                        // 업로드된 워크북
  sheetName: null,
  headerRow: 1,                          // 1-indexed
  aoa: null,                             // 시트 전체 (2차원 배열)
  headers: [],                           // 헤더 셀 텍스트
  mapping: { code: -1, qty: -1, buyer: -1, phone: -1, addr: -1 },
};

// ---------- 유틸 ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const norm = (v) => (v === undefined || v === null ? "" : String(v).trim());

function saveCfg() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.cfg));
}
function loadCfg() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) state.cfg = JSON.parse(raw);
  } catch (_) {}
  if (!Array.isArray(state.cfg.bogo)) state.cfg.bogo = [];
  if (!Array.isArray(state.cfg.gifts)) state.cfg.gifts = [];
}

// ---------- 탭 ----------
$$(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".tab").forEach((b) => b.classList.remove("active"));
    $$(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    $("#" + btn.dataset.tab).classList.add("active");
  });
});

// ---------- 메뉴1: 1+1 ----------
function renderBogo() {
  const ul = $("#bogoList");
  ul.innerHTML = "";
  state.cfg.bogo.forEach((code, i) => {
    const li = document.createElement("li");
    li.textContent = code;
    const x = document.createElement("button");
    x.textContent = "×";
    x.title = "삭제";
    x.addEventListener("click", () => {
      state.cfg.bogo.splice(i, 1);
      saveCfg();
      renderBogo();
    });
    li.appendChild(x);
    ul.appendChild(li);
  });
}

$("#bogoAdd").addEventListener("click", () => {
  const v = norm($("#bogoCode").value);
  if (!v) return;
  if (!state.cfg.bogo.includes(v)) state.cfg.bogo.push(v);
  $("#bogoCode").value = "";
  saveCfg();
  renderBogo();
});
$("#bogoCode").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#bogoAdd").click();
});

// ---------- 메뉴1: 사은품 증정 ----------
function renderGifts() {
  const tbody = $("#giftTable tbody");
  tbody.innerHTML = "";
  state.cfg.gifts.forEach((g, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(g.trigger)}</td>
                    <td>${g.pool.map(escapeHtml).join(", ")}</td>
                    <td><button data-i="${i}" class="danger">삭제</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll("button.danger").forEach((b) => {
    b.addEventListener("click", () => {
      const idx = Number(b.dataset.i);
      state.cfg.gifts.splice(idx, 1);
      saveCfg();
      renderGifts();
    });
  });
}

$("#giftAdd").addEventListener("click", () => {
  const trigger = norm($("#giftTrigger").value);
  const poolRaw = norm($("#giftPool").value);
  if (!trigger || !poolRaw) return;
  const pool = poolRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!pool.length) return;
  const existing = state.cfg.gifts.find((g) => g.trigger === trigger);
  if (existing) existing.pool = pool;
  else state.cfg.gifts.push({ trigger, pool });
  $("#giftTrigger").value = "";
  $("#giftPool").value = "";
  saveCfg();
  renderGifts();
});

// ---------- 설정 내보내기/불러오기/초기화 ----------
$("#exportCfg").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.cfg, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "promo-config.json";
  a.click();
  URL.revokeObjectURL(a.href);
});
$("#importCfg").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  try {
    const txt = await f.text();
    const obj = JSON.parse(txt);
    state.cfg = {
      bogo: Array.isArray(obj.bogo) ? obj.bogo : [],
      gifts: Array.isArray(obj.gifts) ? obj.gifts : [],
    };
    saveCfg();
    renderBogo();
    renderGifts();
    alert("설정을 불러왔습니다.");
  } catch (err) {
    alert("JSON 파일을 읽지 못했습니다: " + err.message);
  } finally {
    e.target.value = "";
  }
});
$("#resetCfg").addEventListener("click", () => {
  if (!confirm("모든 행사 설정을 삭제할까요?")) return;
  state.cfg = { bogo: [], gifts: [] };
  saveCfg();
  renderBogo();
  renderGifts();
});

// ---------- 메뉴2: 엑셀 업로드 ----------
$("#xlsxFile").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  $("#fileName").textContent = f.name;
  const buf = await f.arrayBuffer();
  state.workbook = XLSX.read(buf, { type: "array" });
  const sel = $("#sheetPick");
  sel.innerHTML = "";
  state.workbook.SheetNames.forEach((n) => {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    sel.appendChild(opt);
  });
  state.sheetName = state.workbook.SheetNames[0];
  $("#sheetPickWrap").classList.remove("hidden");
  $("#mappingWrap").classList.add("hidden");
  $("#report").classList.add("hidden");
});

$("#sheetPick").addEventListener("change", (e) => {
  state.sheetName = e.target.value;
});
$("#headerRow").addEventListener("change", (e) => {
  state.headerRow = Math.max(1, Number(e.target.value) || 1);
});

$("#loadPreview").addEventListener("click", () => {
  if (!state.workbook || !state.sheetName) return;
  const ws = state.workbook.Sheets[state.sheetName];
  // 시트를 2차원 배열로 (빈 셀은 빈 문자열로)
  state.aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
  state.headerRow = Math.max(1, Number($("#headerRow").value) || 1);
  const headerIdx = state.headerRow - 1;
  if (headerIdx >= state.aoa.length) {
    alert("헤더 행 번호가 시트 범위를 벗어납니다.");
    return;
  }
  state.headers = state.aoa[headerIdx].map((v, i) => norm(v) || `열 ${i + 1}`);
  buildMappingSelectors();
  autoMap();
  renderPreview();
  $("#mappingWrap").classList.remove("hidden");
});

function buildMappingSelectors() {
  const ids = ["#colCode", "#colQty", "#colBuyer", "#colPhone", "#colAddr"];
  ids.forEach((id) => {
    const sel = $(id);
    sel.innerHTML = "";
    const noneOpt = document.createElement("option");
    noneOpt.value = "-1";
    noneOpt.textContent = "(선택 안 함)";
    sel.appendChild(noneOpt);
    state.headers.forEach((h, i) => {
      const o = document.createElement("option");
      o.value = String(i);
      o.textContent = `${columnLetter(i)} · ${h}`;
      sel.appendChild(o);
    });
  });
  $("#colCode").addEventListener("change", () => (state.mapping.code = Number($("#colCode").value)));
  $("#colQty").addEventListener("change", () => (state.mapping.qty = Number($("#colQty").value)));
  $("#colBuyer").addEventListener("change", () => (state.mapping.buyer = Number($("#colBuyer").value)));
  $("#colPhone").addEventListener("change", () => (state.mapping.phone = Number($("#colPhone").value)));
  $("#colAddr").addEventListener("change", () => (state.mapping.addr = Number($("#colAddr").value)));
}

function autoMap() {
  const norms = state.headers.map((h) => h.toLowerCase().replace(/\s+/g, ""));
  // 패턴 우선순위로 첫 매칭을 잡는다 (구체적인 키워드를 앞에 둘 것)
  const guess = (patterns) => {
    for (const p of patterns) {
      const np = p.toLowerCase().replace(/\s+/g, "");
      for (let i = 0; i < norms.length; i++) {
        if (norms[i].includes(np)) return i;
      }
    }
    return -1;
  };
  state.mapping.code = guess(["상품코드", "productcode", "sku", "품목코드", "제품코드", "코드"]);
  state.mapping.qty = guess(["수량", "주문수량", "구매수량", "qty", "quantity"]);
  state.mapping.buyer = guess(["수령인", "받는분", "받는사람", "구매자", "주문자명", "주문자", "이름", "성명", "buyer", "name"]);
  state.mapping.phone = guess(["휴대전화", "휴대폰", "핸드폰", "mobile", "전화번호", "전화", "연락처", "phone", "tel"]);
  state.mapping.addr = guess(["주소", "배송지", "address", "addr"]);
  $("#colCode").value = String(state.mapping.code);
  $("#colQty").value = String(state.mapping.qty);
  $("#colBuyer").value = String(state.mapping.buyer);
  $("#colPhone").value = String(state.mapping.phone);
  $("#colAddr").value = String(state.mapping.addr);
}

function columnLetter(i) {
  let s = "";
  i = i + 1;
  while (i > 0) {
    const r = (i - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

function renderPreview() {
  const tbl = $("#preview");
  tbl.innerHTML = "";
  const headerIdx = state.headerRow - 1;
  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  state.headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  tbl.appendChild(thead);
  const tbody = document.createElement("tbody");
  const rows = state.aoa.slice(headerIdx + 1, headerIdx + 1 + 10);
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    for (let i = 0; i < state.headers.length; i++) {
      const td = document.createElement("td");
      td.textContent = r[i] === undefined ? "" : String(r[i]);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}

// ---------- 처리 & 다운로드 ----------
$("#runProcess").addEventListener("click", () => {
  if (!state.aoa) return;
  if (state.mapping.code < 0) {
    alert("제품코드 컬럼을 선택해 주세요.");
    return;
  }

  const headerIdx = state.headerRow - 1;
  const out = state.aoa.slice(0, headerIdx + 1).map((r) => r.slice());

  const giftMap = new Map(state.cfg.gifts.map((g) => [g.trigger, g.pool]));
  const bogoSet = new Set(state.cfg.bogo);

  let bogoApplied = 0;
  let giftAdded = 0;

  for (let r = headerIdx + 1; r < state.aoa.length; r++) {
    const row = state.aoa[r].slice();
    const code = norm(row[state.mapping.code]);
    if (!code) {
      out.push(row);
      continue;
    }

    if (bogoSet.has(code) && state.mapping.qty >= 0) {
      const q = Number(row[state.mapping.qty]);
      if (Number.isFinite(q)) {
        row[state.mapping.qty] = q * 2;
        bogoApplied++;
      }
    }
    out.push(row);

    if (giftMap.has(code)) {
      const pool = giftMap.get(code);
      const giftCode = pool[Math.floor(Math.random() * pool.length)];
      const giftRow = new Array(row.length).fill("");
      giftRow[state.mapping.code] = giftCode;
      if (state.mapping.qty >= 0) giftRow[state.mapping.qty] = 1;
      if (state.mapping.buyer >= 0) giftRow[state.mapping.buyer] = row[state.mapping.buyer] ?? "";
      if (state.mapping.phone >= 0) giftRow[state.mapping.phone] = row[state.mapping.phone] ?? "";
      if (state.mapping.addr >= 0) giftRow[state.mapping.addr] = row[state.mapping.addr] ?? "";
      out.push(giftRow);
      giftAdded++;
    }
  }

  // 새 워크북 생성 (원본 다른 시트는 그대로 복사)
  const wbOut = XLSX.utils.book_new();
  const wsOut = XLSX.utils.aoa_to_sheet(out);
  state.workbook.SheetNames.forEach((sn) => {
    if (sn === state.sheetName) {
      XLSX.utils.book_append_sheet(wbOut, wsOut, sn);
    } else {
      XLSX.utils.book_append_sheet(wbOut, state.workbook.Sheets[sn], sn);
    }
  });

  const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
  const fname = `processed-${stamp}.xlsx`;
  XLSX.writeFile(wbOut, fname);

  const rep = $("#report");
  rep.classList.remove("hidden");
  rep.innerHTML = `처리 완료 → <b>${escapeHtml(fname)}</b> 다운로드됨<br>
    1+1 적용된 행: <b>${bogoApplied}</b>건<br>
    사은품 행 추가: <b>${giftAdded}</b>건<br>
    원본 데이터 행: <b>${state.aoa.length - (headerIdx + 1)}</b>건 → 출력 데이터 행: <b>${out.length - (headerIdx + 1)}</b>건`;
  $("#runStatus").textContent = "완료";
});

// ---------- helpers ----------
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

// ---------- 초기화 ----------
loadCfg();
renderBogo();
renderGifts();
