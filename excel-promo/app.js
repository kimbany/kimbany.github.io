/* 엑셀 행사 처리기
 *  - 메뉴1: 1+1 / 사은품 증정 행사 설정 (localStorage)
 *  - 메뉴2: 엑셀 업로드 -> 행사 적용 -> 다운로드
 *  의존: SheetJS (xlsx)
 */

const LS_KEY = "excelPromoConfig.v1";

const state = {
  cfg: { bogo: [], gifts: [], globalGifts: [] }, // 메뉴1 설정
  workbook: null,                        // 업로드된 워크북
  sheetName: null,
  headerRow: 1,                          // 1-indexed
  aoa: null,                             // 시트 전체 (2차원 배열)
  headers: [],                           // 헤더 셀 텍스트
  mapping: { code: -1, codeAlt: -1, qty: -1, orderNo: -1 },
  copyCols: new Set(),                   // 사은품 행에 복사할 컬럼들
  previewPage: 0,                        // 미리보기 현재 페이지 (0-base)
};
const PREVIEW_PER_PAGE = 10;

// ---------- 유틸 ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const norm = (v) => (v === undefined || v === null ? "" : String(v).trim());

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const isActiveOnDate = (rule, today) => {
  if (rule.start && today < rule.start) return false;
  if (rule.end && today > rule.end) return false;
  return true;
};
const formatRange = (rule) => {
  if (!rule.start && !rule.end) return "(상시)";
  return `${rule.start || "처음"} ~ ${rule.end || "끝"}`;
};

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
  if (!Array.isArray(state.cfg.globalGifts)) state.cfg.globalGifts = [];
  // 마이그레이션: bogo 항목 string -> object, gifts/globalGifts 기본값 보강
  state.cfg.bogo = state.cfg.bogo.map((b) =>
    typeof b === "string" ? { code: b, start: "", end: "" } : { start: "", end: "", ...b }
  );
  state.cfg.gifts = state.cfg.gifts.map((g) => ({ qtyMode: "order", start: "", end: "", ...g }));
  state.cfg.globalGifts = state.cfg.globalGifts.map((g) => ({ qtyMode: "order", start: "", end: "", ...g }));
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
  state.cfg.bogo.forEach((b, i) => {
    const li = document.createElement("li");
    const range = (b.start || b.end) ? ` · ${b.start || "처음"}~${b.end || "끝"}` : "";
    li.appendChild(document.createTextNode(b.code + range + " "));
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
  const code = norm($("#bogoCode").value);
  if (!code) return;
  const start = $("#bogoStart").value || "";
  const end = $("#bogoEnd").value || "";
  const existing = state.cfg.bogo.find((b) => b.code === code);
  if (existing) {
    existing.start = start;
    existing.end = end;
  } else {
    state.cfg.bogo.push({ code, start, end });
  }
  $("#bogoCode").value = "";
  $("#bogoStart").value = "";
  $("#bogoEnd").value = "";
  saveCfg();
  renderBogo();
});
$("#bogoCode").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#bogoAdd").click();
});

// ---------- 메뉴1: 사은품 증정 (특정 코드) ----------
const QTY_MODE_LABEL = { order: "주문 1건당 1개", unit: "수량만큼" };

function renderGifts() {
  const tbody = $("#giftTable tbody");
  tbody.innerHTML = "";
  state.cfg.gifts.forEach((g, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(g.trigger)}</td>
                    <td>${g.pool.map(escapeHtml).join(", ")}</td>
                    <td>${escapeHtml(QTY_MODE_LABEL[g.qtyMode] || g.qtyMode)}</td>
                    <td>${escapeHtml(formatRange(g))}</td>
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
  const start = $("#giftStart").value || "";
  const end = $("#giftEnd").value || "";
  const qtyMode = $("#giftQtyMode").value || "order";
  const existing = state.cfg.gifts.find((g) => g.trigger === trigger);
  if (existing) {
    existing.pool = pool;
    existing.start = start;
    existing.end = end;
    existing.qtyMode = qtyMode;
  } else {
    state.cfg.gifts.push({ trigger, pool, start, end, qtyMode });
  }
  $("#giftTrigger").value = "";
  $("#giftPool").value = "";
  $("#giftStart").value = "";
  $("#giftEnd").value = "";
  $("#giftQtyMode").value = "order";
  saveCfg();
  renderGifts();
});

// ---------- 메뉴1: 모든 주문에 사은품 (글로벌) ----------
function renderGlobalGifts() {
  const tbody = $("#globalGiftTable tbody");
  tbody.innerHTML = "";
  state.cfg.globalGifts.forEach((g, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${g.pool.map(escapeHtml).join(", ")}</td>
                    <td>${escapeHtml(QTY_MODE_LABEL[g.qtyMode] || g.qtyMode)}</td>
                    <td>${escapeHtml(formatRange(g))}</td>
                    <td><button data-i="${i}" class="danger">삭제</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll("button.danger").forEach((b) => {
    b.addEventListener("click", () => {
      const idx = Number(b.dataset.i);
      state.cfg.globalGifts.splice(idx, 1);
      saveCfg();
      renderGlobalGifts();
    });
  });
}

$("#globalGiftAdd").addEventListener("click", () => {
  const poolRaw = norm($("#globalGiftPool").value);
  if (!poolRaw) return;
  const pool = poolRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!pool.length) return;
  const start = $("#globalGiftStart").value || "";
  const end = $("#globalGiftEnd").value || "";
  const qtyMode = $("#globalGiftQtyMode").value || "order";
  state.cfg.globalGifts.push({ pool, start, end, qtyMode });
  $("#globalGiftPool").value = "";
  $("#globalGiftStart").value = "";
  $("#globalGiftEnd").value = "";
  $("#globalGiftQtyMode").value = "order";
  saveCfg();
  renderGlobalGifts();
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
async function loadExcelFile(f) {
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
  state.previewPage = 0;
  $("#sheetPickWrap").classList.remove("hidden");
  $("#mappingWrap").classList.add("hidden");
  $("#report").classList.add("hidden");
}

$("#xlsxFile").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  await loadExcelFile(f);
});

// 드래그&드롭
const dz = $("#dropZone");
if (dz) {
  ["dragenter", "dragover"].forEach((ev) =>
    dz.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.add("over"); })
  );
  ["dragleave", "drop"].forEach((ev) =>
    dz.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.remove("over"); })
  );
  dz.addEventListener("drop", async (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      alert("엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.");
      return;
    }
    await loadExcelFile(f);
  });
}

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
  ["#colCode", "#colCodeAlt", "#colQty", "#colOrderNo"].forEach((id) => {
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
  $("#colCodeAlt").addEventListener("change", () => (state.mapping.codeAlt = Number($("#colCodeAlt").value)));
  $("#colQty").addEventListener("change", () => (state.mapping.qty = Number($("#colQty").value)));
  $("#colOrderNo").addEventListener("change", () => (state.mapping.orderNo = Number($("#colOrderNo").value)));

  // 사은품 행에 복사할 컬럼 체크리스트
  const wrap = $("#copyCols");
  wrap.innerHTML = "";
  state.headers.forEach((h, i) => {
    const lab = document.createElement("label");
    lab.innerHTML = `<input type="checkbox" data-i="${i}"> ${columnLetter(i)} · ${escapeHtml(h)}`;
    wrap.appendChild(lab);
  });
  wrap.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const i = Number(e.target.dataset.i);
      if (e.target.checked) state.copyCols.add(i);
      else state.copyCols.delete(i);
    });
  });
}

function applyCopyColsToCheckboxes() {
  document.querySelectorAll("#copyCols input[type=checkbox]").forEach((cb) => {
    cb.checked = state.copyCols.has(Number(cb.dataset.i));
  });
}

function autoMap() {
  const norms = state.headers.map((h) => h.toLowerCase().replace(/\s+/g, ""));
  // 패턴 우선순위로 첫 매칭을 잡는다 (구체적인 키워드를 앞에 둘 것)
  const guess = (patterns, skipIdx = -1) => {
    for (const p of patterns) {
      const np = p.toLowerCase().replace(/\s+/g, "");
      for (let i = 0; i < norms.length; i++) {
        if (i === skipIdx) continue;
        if (norms[i].includes(np)) return i;
      }
    }
    return -1;
  };
  // 우선 제품코드: 품목코드 우선 (자체품목코드)
  state.mapping.code = guess(["품목코드", "상품코드", "productcode", "sku", "제품코드", "코드"]);
  // 보조 제품코드: 상품코드 우선 (자체 상품코드), 우선 컬럼은 제외
  state.mapping.codeAlt = guess(["상품코드", "productcode", "sku", "품목코드", "제품코드"], state.mapping.code);
  state.mapping.qty = guess(["수량", "주문수량", "구매수량", "qty", "quantity"]);
  state.mapping.orderNo = guess(["주문번호", "ordernumber", "orderno", "orderid"]);
  $("#colCode").value = String(state.mapping.code);
  $("#colCodeAlt").value = String(state.mapping.codeAlt);
  $("#colQty").value = String(state.mapping.qty);
  $("#colOrderNo").value = String(state.mapping.orderNo);

  // 사은품 행에 복사할 컬럼 자동 체크
  state.copyCols = computeDefaultCopyCols();
  applyCopyColsToCheckboxes();
}

function computeDefaultCopyCols() {
  const norms = state.headers.map((h) => h.toLowerCase().replace(/\s+/g, ""));
  // 주문자명 / 수령인계열 / 배송메시지(메모) 컬럼을 기본 추천
  const patterns = ["주문자명", "수령인", "받는분", "받는사람", "배송메시지", "배송메모"];
  const set = new Set();
  norms.forEach((h, i) => {
    if (patterns.some((p) => h.includes(p.toLowerCase().replace(/\s+/g, "")))) set.add(i);
  });
  return set;
}

// 모두 선택 / 해제 / 기본 추천 버튼
document.addEventListener("click", (e) => {
  if (e.target.id === "copyAll") {
    state.copyCols = new Set(state.headers.map((_, i) => i));
    applyCopyColsToCheckboxes();
  } else if (e.target.id === "copyNone") {
    state.copyCols = new Set();
    applyCopyColsToCheckboxes();
  } else if (e.target.id === "copyDefault") {
    state.copyCols = computeDefaultCopyCols();
    applyCopyColsToCheckboxes();
  }
});

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
  const dataRows = state.aoa.slice(headerIdx + 1);
  const totalPages = Math.max(1, Math.ceil(dataRows.length / PREVIEW_PER_PAGE));
  const page = Math.max(0, Math.min(state.previewPage || 0, totalPages - 1));
  state.previewPage = page;

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
  const start = page * PREVIEW_PER_PAGE;
  const end = Math.min(dataRows.length, start + PREVIEW_PER_PAGE);
  for (let r = start; r < end; r++) {
    const row = dataRows[r];
    const tr = document.createElement("tr");
    for (let i = 0; i < state.headers.length; i++) {
      const td = document.createElement("td");
      td.textContent = row[i] === undefined ? "" : String(row[i]);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  tbl.appendChild(tbody);

  renderPreviewPager(page, totalPages, dataRows.length);
}

function renderPreviewPager(page, totalPages, totalRows) {
  const pager = $("#previewPager");
  pager.innerHTML = "";
  const info = document.createElement("span");
  info.className = "hint";
  info.textContent = totalRows
    ? `총 ${totalRows}행 · ${page + 1}/${totalPages} 페이지`
    : "데이터 없음";
  pager.appendChild(info);
  if (totalPages <= 1) return;

  const wrap = document.createElement("div");
  wrap.className = "pages";
  const mkBtn = (label, p, opts = {}) => {
    const b = document.createElement("button");
    b.textContent = label;
    if (opts.disabled) b.disabled = true;
    if (opts.current) b.classList.add("current");
    b.addEventListener("click", () => { state.previewPage = p; renderPreview(); });
    return b;
  };
  wrap.appendChild(mkBtn("«", 0, { disabled: page === 0 }));
  wrap.appendChild(mkBtn("‹", page - 1, { disabled: page === 0 }));
  const winSize = 5;
  const winStart = Math.max(0, Math.min(page - Math.floor(winSize / 2), totalPages - winSize));
  const winEnd = Math.min(totalPages, winStart + winSize);
  for (let p = winStart; p < winEnd; p++) {
    wrap.appendChild(mkBtn(String(p + 1), p, { current: p === page }));
  }
  wrap.appendChild(mkBtn("›", page + 1, { disabled: page === totalPages - 1 }));
  wrap.appendChild(mkBtn("»", totalPages - 1, { disabled: page === totalPages - 1 }));
  pager.appendChild(wrap);
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

  const today = todayStr();
  const activeBogo = state.cfg.bogo.filter((b) => isActiveOnDate(b, today));
  const activeGifts = state.cfg.gifts.filter((g) => isActiveOnDate(g, today));
  const activeGlobalGifts = state.cfg.globalGifts.filter((g) => isActiveOnDate(g, today));
  const giftMap = new Map(activeGifts.map((g) => [g.trigger, g]));
  const bogoSet = new Set(activeBogo.map((b) => b.code));
  const skippedBogo = state.cfg.bogo.length - activeBogo.length;
  const skippedGifts = state.cfg.gifts.length - activeGifts.length;
  const skippedGlobalGifts = state.cfg.globalGifts.length - activeGlobalGifts.length;
  const orderNoCol = state.mapping.orderNo;

  if (activeGlobalGifts.length > 0 && orderNoCol < 0) {
    alert("'전체 주문 사은품' 행사가 등록되어 있는데 '주문번호 컬럼' 매핑이 비어 있습니다. 메뉴2 컬럼 매핑에서 주문번호 컬럼을 선택해 주세요.");
    return;
  }

  let bogoApplied = 0;
  let giftAdded = 0;
  let globalGiftAdded = 0;
  const bogoMods = []; // [{ r, c }]
  const giftMods = []; // [{ r, cs: [c, ...] }]

  // 주문 그룹 추적 (글로벌 사은품용)
  let curOrderNo = null;
  let curOrderQty = 0;
  let lastOriginalRow = null;
  const headerLen = state.aoa[headerIdx].length;

  const flushGlobalGifts = () => {
    if (curOrderNo === null || activeGlobalGifts.length === 0) return;
    activeGlobalGifts.forEach((rule) => {
      const count = rule.qtyMode === "unit" ? Math.max(1, Math.floor(curOrderQty || 1)) : 1;
      for (let n = 0; n < count; n++) {
        const giftCode = rule.pool[Math.floor(Math.random() * rule.pool.length)];
        const giftRow = new Array(headerLen).fill("");
        const cs = new Set();
        if (state.mapping.code >= 0) { giftRow[state.mapping.code] = giftCode; cs.add(state.mapping.code); }
        if (state.mapping.qty >= 0) { giftRow[state.mapping.qty] = 1; cs.add(state.mapping.qty); }
        if (orderNoCol >= 0 && curOrderNo) { giftRow[orderNoCol] = curOrderNo; cs.add(orderNoCol); }
        if (lastOriginalRow) {
          state.copyCols.forEach((c) => {
            if (cs.has(c)) return;
            giftRow[c] = lastOriginalRow[c] ?? "";
            cs.add(c);
          });
        }
        out.push(giftRow);
        giftMods.push({ r: out.length - 1, cs: Array.from(cs) });
        globalGiftAdded++;
      }
    });
  };

  for (let r = headerIdx + 1; r < state.aoa.length; r++) {
    const row = state.aoa[r].slice();
    const orderNo = orderNoCol >= 0 ? norm(row[orderNoCol]) : "";

    // 주문번호 변경 시점에 직전 주문의 글로벌 사은품 일괄 추가
    if (orderNoCol >= 0 && orderNo !== curOrderNo) {
      flushGlobalGifts();
      curOrderNo = orderNo;
      curOrderQty = 0;
    }

    // 우선 코드가 있으면 그 값, 없으면 보조 코드의 값 사용
    const codePrimary = state.mapping.code >= 0 ? norm(row[state.mapping.code]) : "";
    const codeAltVal = state.mapping.codeAlt >= 0 ? norm(row[state.mapping.codeAlt]) : "";
    const code = codePrimary || codeAltVal;
    const matchedCol = codePrimary ? state.mapping.code
                      : codeAltVal ? state.mapping.codeAlt
                      : state.mapping.code;

    // 원본 수량 (1+1 ×2 적용 전)
    const originalQty = state.mapping.qty >= 0 ? Number(row[state.mapping.qty]) : NaN;

    let bogoModified = false;
    if (code && bogoSet.has(code) && state.mapping.qty >= 0 && Number.isFinite(originalQty)) {
      row[state.mapping.qty] = originalQty * 2;
      bogoApplied++;
      bogoModified = true;
    }
    out.push(row);
    if (bogoModified) bogoMods.push({ r: out.length - 1, c: state.mapping.qty });

    // 주문 합계 수량은 원본 기준 누적 (1+1 보너스/사은품 행은 제외)
    if (Number.isFinite(originalQty)) curOrderQty += originalQty;
    lastOriginalRow = row;

    // 특정 코드 사은품
    if (code && giftMap.has(code)) {
      const rule = giftMap.get(code);
      const count = rule.qtyMode === "unit" && Number.isFinite(originalQty)
        ? Math.max(1, Math.floor(originalQty))
        : 1;
      for (let n = 0; n < count; n++) {
        const giftCode = rule.pool[Math.floor(Math.random() * rule.pool.length)];
        const giftRow = new Array(row.length).fill("");
        const cs = new Set();
        giftRow[matchedCol] = giftCode;
        cs.add(matchedCol);
        if (state.mapping.qty >= 0) {
          giftRow[state.mapping.qty] = 1;
          cs.add(state.mapping.qty);
        }
        state.copyCols.forEach((c) => {
          if (cs.has(c)) return;
          giftRow[c] = row[c] ?? "";
          cs.add(c);
        });
        out.push(giftRow);
        giftMods.push({ r: out.length - 1, cs: Array.from(cs) });
        giftAdded++;
      }
    }
  }

  // 마지막 주문 그룹의 글로벌 사은품 마무리
  flushGlobalGifts();

  // 새 워크북 생성 (원본 다른 시트는 그대로 복사)
  const wbOut = XLSX.utils.book_new();
  const wsOut = XLSX.utils.aoa_to_sheet(out);

  // 변경된 셀 색상 표시 (xlsx-js-style 필요)
  const bogoStyle = { fill: { patternType: "solid", fgColor: { rgb: "FFF59D" } } }; // 연한 노랑
  const giftStyle = { fill: { patternType: "solid", fgColor: { rgb: "C8E6C9" } } }; // 연한 연두
  const paintCell = (r, c, style) => {
    const ref = XLSX.utils.encode_cell({ r, c });
    if (!wsOut[ref]) wsOut[ref] = { t: "s", v: "" };
    wsOut[ref].s = style;
  };
  bogoMods.forEach(({ r, c }) => paintCell(r, c, bogoStyle));
  giftMods.forEach(({ r, cs }) => cs.forEach((c) => paintCell(r, c, giftStyle)));
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
    사은품 행 추가 (특정 코드): <b>${giftAdded}</b>건<br>
    사은품 행 추가 (전체 주문): <b>${globalGiftAdded}</b>건<br>
    오늘 날짜(${today}) 기준 기간 외 미적용 룰: 1+1 <b>${skippedBogo}</b>건, 사은품 <b>${skippedGifts}</b>건, 전체사은품 <b>${skippedGlobalGifts}</b>건<br>
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
renderGlobalGifts();
