// DeskMemo — 연차 관리 (대한민국 기준)
//
// deskmemo 패널 통합판: 바닐라 JS + localStorage.
// 연차 정책/근무일/공휴일 계산은 순수 함수로 분리(정책 함수화).
// (동기화·감사로그·입사일변경 재계산·공휴일 API는 후속 단계)

// ── 연차 정책 (하드코딩 분산 금지, 여기서 관리) ─────────────────────────
export const LEAVE_POLICY = {
  monthlyAccrualAmount: 1, // 월 개근 1일
  monthlyAccrualLimit: 11, // 최대 11일
  firstAnnualGrant: 15, // 1주년 15일
  maximumAnnualGrant: 25, // 최대 25일
  additionalLeaveEveryYears: 2, // 2년마다 +1
};

// ── 대한민국 공휴일(로컬 데이터, 대체공휴일 포함) ──────────────────────
// 관리자가 공휴일 탭에서 추가/수정 가능. 정확도는 연도별로 갱신 필요.
const HOLIDAYS_KR = {
  2025: [
    ["2025-01-01", "신정"],
    ["2025-01-28", "설날 연휴"],
    ["2025-01-29", "설날"],
    ["2025-01-30", "설날 연휴"],
    ["2025-03-01", "삼일절"],
    ["2025-03-03", "대체공휴일(삼일절)", true],
    ["2025-05-05", "어린이날/부처님오신날"],
    ["2025-05-06", "대체공휴일", true],
    ["2025-06-06", "현충일"],
    ["2025-08-15", "광복절"],
    ["2025-10-03", "개천절"],
    ["2025-10-05", "추석 연휴"],
    ["2025-10-06", "추석"],
    ["2025-10-07", "추석 연휴"],
    ["2025-10-08", "대체공휴일(추석)", true],
    ["2025-10-09", "한글날"],
    ["2025-12-25", "성탄절"],
  ],
  2026: [
    ["2026-01-01", "신정"],
    ["2026-02-16", "설날 연휴"],
    ["2026-02-17", "설날"],
    ["2026-02-18", "설날 연휴"],
    ["2026-03-01", "삼일절"],
    ["2026-03-02", "대체공휴일(삼일절)", true],
    ["2026-05-05", "어린이날"],
    ["2026-05-24", "부처님오신날"],
    ["2026-05-25", "대체공휴일(부처님오신날)", true],
    ["2026-06-06", "현충일"],
    ["2026-08-15", "광복절"],
    ["2026-08-17", "대체공휴일(광복절)", true],
    ["2026-09-24", "추석 연휴"],
    ["2026-09-25", "추석"],
    ["2026-09-26", "추석 연휴"],
    ["2026-09-28", "대체공휴일(추석)", true],
    ["2026-10-03", "개천절"],
    ["2026-10-05", "대체공휴일(개천절)", true],
    ["2026-10-09", "한글날"],
    ["2026-12-25", "성탄절"],
  ],
  2027: [
    ["2027-01-01", "신정"],
    ["2027-02-06", "설날 연휴"],
    ["2027-02-07", "설날"],
    ["2027-02-08", "설날 연휴"],
    ["2027-02-09", "대체공휴일(설날)", true],
    ["2027-03-01", "삼일절"],
    ["2027-05-05", "어린이날"],
    ["2027-05-13", "부처님오신날"],
    ["2027-06-06", "현충일"],
    ["2027-06-07", "대체공휴일(현충일)", true],
    ["2027-08-15", "광복절"],
    ["2027-08-16", "대체공휴일(광복절)", true],
    ["2027-09-14", "추석 연휴"],
    ["2027-09-15", "추석"],
    ["2027-09-16", "추석 연휴"],
    ["2027-10-03", "개천절"],
    ["2027-10-04", "대체공휴일(개천절)", true],
    ["2027-10-09", "한글날"],
    ["2027-10-11", "대체공휴일(한글날)", true],
    ["2027-12-25", "성탄절"],
  ],
};

// ── 날짜 유틸 (Asia/Seoul: 로컬 자정 기준, UTC 밀림 방지) ───────────────
function pad(n) {
  return String(n).padStart(2, "0");
}
function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d); // 로컬 자정
}
function fmt(dt) {
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}
function todayKR() {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}
function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return fmt(d);
}
/** 입사일의 '일자'를 기준으로 n개월 뒤(말일 보정, 이후 밀리지 않음). */
function addMonthsKeepDay(hire, n) {
  const [y, m, d] = hire.split("-").map(Number);
  const idx = m - 1 + n;
  const ty = y + Math.floor(idx / 12);
  const tm = ((idx % 12) + 12) % 12; // 0-based
  const lastDay = new Date(ty, tm + 1, 0).getDate();
  return `${ty}-${pad(tm + 1)}-${pad(Math.min(d, lastDay))}`;
}
function addYearsKeepDay(hire, n) {
  return addMonthsKeepDay(hire, n * 12);
}
function fmtKorean(s) {
  const [y, m, d] = s.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}
export function fmtDays(n) {
  const v = Math.round(n * 2) / 2;
  return (Number.isInteger(v) ? String(v) : v.toFixed(1)) + "일";
}

// ── 공휴일 조회 ────────────────────────────────────────────────────────
function holidayMap(years, manual) {
  const map = new Map(); // date -> name
  for (const y of years) {
    for (const [date, name, _sub] of HOLIDAYS_KR[y] || []) map.set(date, name);
  }
  for (const h of manual || []) {
    if (h.isActive === false) map.delete(h.date);
    else map.set(h.date, h.name);
  }
  return map;
}

// ── 근무일 계산 (주말·공휴일 제외, 양끝 포함) ──────────────────────────
export function countWorkdays(start, end, hmap) {
  let cur = start;
  const res = {
    total: 0,
    workdays: 0,
    weekends: 0,
    holidays: 0,
    excluded: [], // {date, reason, name}
  };
  if (end < start) return res;
  while (cur <= end) {
    res.total++;
    const dow = parseDate(cur).getDay(); // 0 일, 6 토
    if (dow === 0 || dow === 6) {
      res.weekends++;
      res.excluded.push({ date: cur, reason: dow === 0 ? "일요일" : "토요일" });
    } else if (hmap.has(cur)) {
      res.holidays++;
      res.excluded.push({ date: cur, reason: hmap.get(cur), name: hmap.get(cur) });
    } else {
      res.workdays++;
    }
    cur = addDays(cur, 1);
  }
  return res;
}

// ── 근속연수별 부여량 ──────────────────────────────────────────────────
export function annualGrantForYear(Y) {
  if (Y <= 2) return LEAVE_POLICY.firstAnnualGrant; // 1,2년차 15
  const extra = Math.floor((Y - 1) / LEAVE_POLICY.additionalLeaveEveryYears);
  return Math.min(LEAVE_POLICY.firstAnnualGrant + extra, LEAVE_POLICY.maximumAnnualGrant);
}

// ── 자동 발생 계산(멱등: 고유키로 중복 방지) ───────────────────────────
export function computeAccruals(emp, asOf) {
  const hire = emp.hireDate;
  const out = [];
  if (!hire) return out;
  const attendance = emp.attendance || {};

  // 월 개근(입사 1년 미만, 최대 11)
  for (let n = 1; n <= LEAVE_POLICY.monthlyAccrualLimit; n++) {
    const accrualDate = addMonthsKeepDay(hire, n);
    if (accrualDate > asOf) break;
    const periodStart = addMonthsKeepDay(hire, n - 1);
    const periodEnd = addDays(accrualDate, -1);
    if (attendance[periodStart] === false) continue; // 미개근
    out.push({
      key: `monthly|${accrualDate}|${periodStart}`,
      transactionDate: accrualDate,
      amount: LEAVE_POLICY.monthlyAccrualAmount,
      transactionType: "월 개근 자동 발생",
      accrualPeriodStart: periodStart,
      accrualPeriodEnd: periodEnd,
      description: `${fmtKorean(periodStart)}~${fmtKorean(periodEnd)} 개근`,
    });
  }
  // 근속연수(주년마다)
  for (let Y = 1; Y <= 60; Y++) {
    const accrualDate = addYearsKeepDay(hire, Y);
    if (accrualDate > asOf) break;
    out.push({
      key: `annual|${accrualDate}|${Y}`,
      transactionDate: accrualDate,
      amount: annualGrantForYear(Y),
      transactionType: Y === 1 ? "입사 1주년 자동 발생" : "근속연수 자동 발생",
      accrualPeriodStart: null,
      accrualPeriodEnd: null,
      description: `입사 ${Y}주년`,
    });
  }
  return out;
}

// ── 저장/로드 (localStorage) ───────────────────────────────────────────
const LS_KEY = "deskmemo.leave.v1";
function emptyData() {
  return {
    employee: { name: "", employeeNumber: "", hireDate: "", department: "", allowNegative: false, attendance: {} },
    ledger: [], // {id, transactionDate, amount, transactionType, title, description, accrualPeriodStart, accrualPeriodEnd, isAutomatic, status, sourceId}
    usages: [], // {id, title, startDate, endDate, amount, usageType, memo, status, dates:[...]}
    holidaysManual: [], // {date, name, isActive}
  };
}
function load() {
  try {
    return { ...emptyData(), ...(JSON.parse(localStorage.getItem(LS_KEY)) || {}) };
  } catch {
    return emptyData();
  }
}
function save(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}
function uid() {
  return "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── 원장 동기화(누락 자동발생 반영) ────────────────────────────────────
function syncAccruals(data) {
  const asOf = todayKR();
  const existing = new Set(data.ledger.filter((l) => l.sourceKey).map((l) => l.sourceKey));
  const accruals = computeAccruals(data.employee, asOf);
  let added = 0;
  for (const a of accruals) {
    if (existing.has(a.key)) continue;
    data.ledger.push({
      id: uid(),
      sourceKey: a.key,
      transactionDate: a.transactionDate,
      amount: a.amount,
      transactionType: a.transactionType,
      title: "",
      description: a.description,
      accrualPeriodStart: a.accrualPeriodStart,
      accrualPeriodEnd: a.accrualPeriodEnd,
      isAutomatic: true,
      status: "active",
      createdAt: Date.now(),
    });
    added++;
  }
  return added;
}

// ── 잔여 = 원장 합계(취소 제외) ────────────────────────────────────────
function balance(data) {
  return data.ledger
    .filter((l) => l.status !== "cancelled")
    .reduce((s, l) => s + Number(l.amount), 0);
}
function yearSum(data, year, positiveOnly) {
  return data.ledger
    .filter((l) => l.status !== "cancelled" && l.transactionDate.startsWith(year))
    .reduce((s, l) => {
      const a = Number(l.amount);
      if (positiveOnly === "pos" && a > 0) return s + a;
      if (positiveOnly === "neg" && a < 0) return s - a;
      return positiveOnly ? s : s + a;
    }, 0);
}
function nextAccrual(data) {
  const asOf = todayKR();
  const hire = data.employee.hireDate;
  if (!hire) return null;
  const future = [];
  for (let n = 1; n <= LEAVE_POLICY.monthlyAccrualLimit; n++) {
    const d = addMonthsKeepDay(hire, n);
    if (d > asOf) {
      future.push({ date: d, amount: LEAVE_POLICY.monthlyAccrualAmount, type: "월 개근 연차" });
      break;
    }
  }
  for (let Y = 1; Y <= 60; Y++) {
    const d = addYearsKeepDay(hire, Y);
    if (d > asOf) {
      future.push({ date: d, amount: annualGrantForYear(Y), type: `입사 ${Y}주년 연차` });
      break;
    }
  }
  future.sort((a, b) => (a.date < b.date ? -1 : 1));
  return future[0] || null;
}

// ── 패널 UI ────────────────────────────────────────────────────────────
let panelEl = null;
let leaveTab = "dash";

function toast(msg, ok = true) {
  const t = document.createElement("div");
  t.className =
    "fixed bottom-4 left-1/2 z-[3100] -translate-x-1/2 rounded px-3 py-1.5 text-xs text-white shadow-lg " +
    (ok ? "bg-black/80" : "bg-rose-600");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}

export function openLeavePanel() {
  ensurePanel();
  const data = load();
  syncAccruals(data);
  save(data);
  panelEl.classList.remove("translate-x-full");
  renderLeave();
}

function closePanel() {
  panelEl?.classList.add("translate-x-full");
}

function ensurePanel() {
  if (panelEl) return;
  panelEl = document.createElement("aside");
  panelEl.id = "leave-panel";
  panelEl.className =
    "fixed right-0 top-0 z-[3000] flex h-full w-[400px] max-w-[92vw] translate-x-full flex-col " +
    "border-l border-black/10 bg-[#f5f4f2] text-neutral-800 shadow-2xl transition-transform duration-200";
  document.body.appendChild(panelEl);
}

const TABS = [
  ["dash", "대시보드"],
  ["accruals", "발생 내역"],
  ["usages", "사용 내역"],
  ["register", "사용 등록"],
  ["adjust", "수동 조정"],
  ["holidays", "공휴일"],
  ["settings", "설정"],
];

function renderLeave() {
  if (!panelEl) return;
  const data = load();
  panelEl.innerHTML = "";

  // 헤더
  const head = document.createElement("div");
  head.className = "flex items-center justify-between border-b border-black/10 px-3 py-2";
  head.innerHTML = '<div class="text-sm font-semibold">⛱️ 연차 관리</div>';
  const close = document.createElement("button");
  close.textContent = "✕";
  close.className = "rounded px-1 hover:bg-black/5";
  close.addEventListener("click", closePanel);
  head.appendChild(close);
  panelEl.appendChild(head);

  // 탭
  const tabs = document.createElement("div");
  tabs.className = "flex flex-wrap gap-1 border-b border-black/10 px-2 py-1.5 text-xs";
  for (const [key, label] of TABS) {
    const b = document.createElement("button");
    b.textContent = label;
    b.className =
      "rounded px-2 py-1 " +
      (leaveTab === key ? "bg-[#2b3a5c] text-white" : "hover:bg-black/5");
    b.addEventListener("click", () => {
      leaveTab = key;
      renderLeave();
    });
    tabs.appendChild(b);
  }
  panelEl.appendChild(tabs);

  // 본문
  const body = document.createElement("div");
  body.className = "no-scrollbar flex-1 overflow-auto p-3 text-sm";
  panelEl.appendChild(body);

  if (!data.employee.hireDate && leaveTab !== "settings") {
    body.innerHTML =
      '<div class="rounded border border-amber-300 bg-amber-50 p-3 text-neutral-700">' +
      "먼저 <b>설정</b> 탭에서 입사일을 입력하세요.</div>";
    return;
  }

  ({
    dash: renderDash,
    accruals: renderAccruals,
    usages: renderUsages,
    register: renderRegister,
    adjust: renderAdjust,
    holidays: renderHolidays,
    settings: renderSettings,
  })[leaveTab](body, data);
}

// helper UI
function field(labelText, el) {
  const w = document.createElement("label");
  w.className = "mb-2 block";
  const t = document.createElement("div");
  t.className = "mb-0.5 text-[11px] text-neutral-500";
  t.textContent = labelText;
  w.append(t, el);
  return w;
}
function input(type, value) {
  const el = document.createElement("input");
  el.type = type;
  if (value != null) el.value = value;
  el.className = "w-full rounded border border-neutral-300 px-2 py-1";
  return el;
}
function card(html) {
  const d = document.createElement("div");
  d.className = "mb-2 rounded-lg border border-black/10 bg-white p-3";
  d.innerHTML = html;
  return d;
}
function badge(text, cls) {
  return `<span class="rounded px-1.5 py-0.5 text-[10px] ${cls}">${text}</span>`;
}

// ── 탭: 대시보드 ───────────────────────────────────────────────────────
function renderDash(body, data) {
  const bal = balance(data);
  const y = todayKR().slice(0, 4);
  const next = nextAccrual(data);
  const grid = document.createElement("div");
  grid.className = "mb-3 grid grid-cols-2 gap-2";
  const stat = (label, val, color) =>
    `<div class="rounded-lg border border-black/10 bg-white p-2.5">
       <div class="text-[11px] text-neutral-500">${label}</div>
       <div class="text-lg font-bold ${color || ""}">${val}</div></div>`;
  grid.innerHTML =
    stat("현재 보유 연차", fmtDays(bal), bal < 0 ? "text-rose-600" : "text-[#2b3a5c]") +
    stat("올해 발생", fmtDays(yearSum(data, y, "pos"))) +
    stat("올해 사용", fmtDays(Math.max(0, -yearSumUsage(data, y)))) +
    stat(
      "다음 발생 예정",
      next ? fmtDays(next.amount) : "-"
    );
  body.appendChild(grid);

  if (next) {
    body.appendChild(
      card(
        `<div class="text-[11px] text-neutral-500 mb-1">다음 연차 발생 예정</div>
         <div class="font-semibold">${fmtKorean(next.date)}</div>
         <div class="text-neutral-600">${next.type} · ${fmtDays(next.amount)}</div>`
      )
    );
  }

  // 최근 원장
  const recent = [...data.ledger]
    .filter((l) => l.status !== "cancelled")
    .sort((a, b) => (a.transactionDate < b.transactionDate ? 1 : -1))
    .slice(0, 8);
  const list = document.createElement("div");
  list.className = "rounded-lg border border-black/10 bg-white p-2";
  list.innerHTML = '<div class="mb-1 text-[11px] font-semibold text-neutral-500">최근 원장</div>';
  if (!recent.length) list.innerHTML += '<div class="text-neutral-400 text-xs">기록 없음</div>';
  for (const l of recent) list.appendChild(ledgerRow(l));
  body.appendChild(list);
}
function yearSumUsage(data, year) {
  return data.ledger
    .filter((l) => l.status !== "cancelled" && l.transactionType === "연차 사용" && l.transactionDate.startsWith(year))
    .reduce((s, l) => s + Number(l.amount), 0);
}
function ledgerRow(l) {
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-2 border-t border-black/5 py-1 text-xs";
  const amt = Number(l.amount);
  const amtStr = (amt > 0 ? "+" : "") + fmtDays(amt);
  const b =
    amt >= 0
      ? badge(l.transactionType, "bg-emerald-100 text-emerald-700")
      : badge(l.transactionType, "bg-rose-100 text-rose-700");
  row.innerHTML =
    `<span class="text-neutral-500">${l.transactionDate}</span>
     <span class="flex-1 truncate">${b} ${l.title || l.description || ""}</span>
     <span class="font-semibold ${amt >= 0 ? "text-emerald-700" : "text-rose-600"}">${amtStr}</span>`;
  return row;
}

// ── 탭: 발생 내역 ──────────────────────────────────────────────────────
function renderAccruals(body, data) {
  const items = data.ledger
    .filter((l) => l.isAutomatic || l.transactionType.includes("자동"))
    .sort((a, b) => (a.transactionDate < b.transactionDate ? -1 : 1));
  if (!items.length) {
    body.innerHTML = '<div class="text-neutral-400">발생 내역이 없습니다.</div>';
    return;
  }
  const box = document.createElement("div");
  box.className = "rounded-lg border border-black/10 bg-white p-2";
  for (const l of items) {
    const r = document.createElement("div");
    r.className = "border-t border-black/5 py-1 text-xs first:border-t-0";
    r.innerHTML =
      `<span class="text-neutral-500">${l.transactionDate}</span> ·
       <span class="font-semibold text-emerald-700">+${fmtDays(l.amount)}</span> ·
       ${l.transactionType}
       ${l.accrualPeriodStart ? `<div class="text-[10px] text-neutral-400">${l.accrualPeriodStart}~${l.accrualPeriodEnd}</div>` : ""}`;
    box.appendChild(r);
  }
  body.appendChild(box);
}

// ── 탭: 사용 내역 ──────────────────────────────────────────────────────
function renderUsages(body, data) {
  const items = data.usages
    .filter((u) => u.status !== "deleted")
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  if (!items.length) {
    body.innerHTML = '<div class="text-neutral-400">사용 내역이 없습니다.</div>';
    return;
  }
  for (const u of items) {
    const c = document.createElement("div");
    c.className = "mb-2 rounded-lg border border-black/10 bg-white p-2.5 text-xs";
    c.innerHTML =
      `<div class="flex items-center justify-between">
         <span class="font-semibold">${u.title}</span>
         <span class="font-bold text-rose-600">-${fmtDays(u.amount)}</span>
       </div>
       <div class="text-neutral-500">${u.startDate} ~ ${u.endDate} ${u.usageType && u.usageType !== "full" ? "(" + (u.usageType === "am" ? "오전 반차" : "오후 반차") + ")" : ""}</div>
       ${u.memo ? `<div class="text-neutral-400">${u.memo}</div>` : ""}`;
    const del = document.createElement("button");
    del.textContent = "삭제(복구)";
    del.className = "mt-1 rounded bg-rose-50 px-2 py-0.5 text-rose-600 hover:bg-rose-100";
    del.addEventListener("click", () => deleteUsage(u.id));
    c.appendChild(del);
    body.appendChild(c);
  }
}
function deleteUsage(id) {
  if (!window.confirm("이 연차 사용 기록을 삭제하시겠습니까?\n삭제하면 차감된 연차가 다시 복구됩니다.")) return;
  const data = load();
  const u = data.usages.find((x) => x.id === id);
  if (!u) return;
  u.status = "deleted";
  u.deletedAt = Date.now();
  // 복구 원장
  data.ledger.push({
    id: uid(),
    transactionDate: todayKR(),
    amount: Number(u.amount), // 양수 복구
    transactionType: "사용 취소",
    title: u.title,
    description: "사용 기록 삭제 복구",
    isAutomatic: false,
    status: "active",
    sourceId: u.id,
    createdAt: Date.now(),
  });
  // 원래 차감 원장 취소 표시
  data.ledger
    .filter((l) => l.sourceId === u.id && l.transactionType === "연차 사용")
    .forEach((l) => (l.status = "cancelled"));
  save(data);
  toast("삭제되어 연차가 복구되었습니다");
  renderLeave();
}

// ── 탭: 사용 등록 ──────────────────────────────────────────────────────
function renderRegister(body, data) {
  const hmap = holidayMap([2025, 2026, 2027], data.holidaysManual);
  const title = input("text");
  title.placeholder = "예: 여름휴가, 병원 방문";
  const start = input("date", todayKR());
  const end = input("date", todayKR());
  const memo = input("text");
  memo.placeholder = "메모(선택)";

  const halfWrap = document.createElement("div");
  halfWrap.className = "mb-2";
  const halfSel = document.createElement("select");
  halfSel.className = "w-full rounded border border-neutral-300 px-2 py-1";
  halfSel.innerHTML =
    '<option value="full">종일</option><option value="am">오전 반차(0.5)</option><option value="pm">오후 반차(0.5)</option>';
  halfWrap.append(field("반차(같은 날짜만)", halfSel));

  const preview = document.createElement("div");
  preview.className = "mb-2 rounded-lg border border-black/10 bg-white p-2.5 text-xs";

  function recalc() {
    const s = start.value,
      e = end.value;
    const sameDay = s && e && s === e;
    halfSel.disabled = !sameDay;
    if (!sameDay) halfSel.value = "full";
    if (!s || !e || e < s) {
      preview.innerHTML = '<span class="text-neutral-400">시작일/종료일을 선택하세요.</span>';
      return null;
    }
    const w = countWorkdays(s, e, hmap);
    let amount = w.workdays;
    if (sameDay && halfSel.value !== "full") {
      // 반차: 그 날이 근무일이어야
      amount = w.workdays === 1 ? 0.5 : 0;
    }
    const bal = balance(data);
    const after = bal - amount;
    preview.innerHTML =
      `<div>전체 기간: ${w.total}일 / 평일 ${w.workdays} · 주말 ${w.weekends} · 공휴일 ${w.holidays}</div>
       <div class="mt-1">실제 차감: <b>${fmtDays(amount)}</b></div>
       <div>현재 보유: ${fmtDays(bal)} → 사용 후 예상: <b class="${after < 0 ? "text-rose-600" : ""}">${fmtDays(after)}</b></div>
       ${w.excluded.length ? '<div class="mt-1 text-neutral-500">제외: ' + w.excluded.map((x) => `${x.date.slice(5)} ${x.reason}`).join(", ") + "</div>" : ""}`;
    return { amount, workdays: w.workdays, w };
  }
  [start, end, halfSel].forEach((el) => el.addEventListener("change", recalc));

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "저장";
  saveBtn.className = "w-full rounded bg-[#2b3a5c] px-3 py-2 text-white hover:opacity-90";
  saveBtn.addEventListener("click", () => {
    const r = recalc();
    const s = start.value,
      e = end.value;
    if (!title.value.trim()) return toast("제목을 입력하세요", false);
    if (!s || !e) return toast("날짜를 선택하세요", false);
    if (e < s) return toast("종료일이 시작일보다 빠릅니다", false);
    if (!r || r.amount <= 0) return toast("실제 근무일이 없어 저장할 수 없습니다", false);
    const bal = balance(data);
    if (!data.employee.allowNegative && r.amount > bal) {
      return toast(`보유 연차 부족: 보유 ${fmtDays(bal)} / 신청 ${fmtDays(r.amount)}`, false);
    }
    // 중복 날짜 검사(종일)
    const usageType = s === e ? halfSel.value : "full";
    const dup = data.usages.some(
      (u) => u.status !== "deleted" && !(e < u.startDate || s > u.endDate) && u.usageType === "full" && usageType === "full"
    );
    if (dup) return toast("이미 겹치는 종일 연차가 있습니다", false);

    const u = {
      id: uid(),
      title: title.value.trim(),
      startDate: s,
      endDate: e,
      amount: r.amount,
      usageType,
      memo: memo.value.trim(),
      status: "active",
      dates: r.w.excluded,
      createdAt: Date.now(),
    };
    data.usages.push(u);
    data.ledger.push({
      id: uid(),
      transactionDate: s,
      amount: -r.amount,
      transactionType: "연차 사용",
      title: u.title,
      description: `${s}~${e}`,
      isAutomatic: false,
      status: "active",
      sourceId: u.id,
      createdAt: Date.now(),
    });
    save(data);
    toast("연차 사용이 등록되었습니다");
    leaveTab = "usages";
    renderLeave();
  });

  body.append(
    field("제목", title),
    field("시작일", start),
    field("종료일", end),
    halfWrap,
    field("메모", memo),
    preview,
    saveBtn
  );
  recalc();
}

// ── 탭: 수동 조정 ──────────────────────────────────────────────────────
function renderAdjust(body, data) {
  const date = input("date", todayKR());
  const kind = document.createElement("select");
  kind.className = "w-full rounded border border-neutral-300 px-2 py-1";
  kind.innerHTML = '<option value="add">연차 추가</option><option value="sub">연차 차감</option>';
  const amount = input("number", "1");
  amount.min = "0";
  amount.step = "0.5";
  const title = input("text");
  title.placeholder = "제목";
  const memo = input("text");
  memo.placeholder = "사유/메모";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "저장";
  saveBtn.className = "w-full rounded bg-[#2b3a5c] px-3 py-2 text-white hover:opacity-90";
  saveBtn.addEventListener("click", () => {
    const v = Number(amount.value);
    if (!(v > 0)) return toast("수량은 0보다 커야 합니다", false);
    const signed = kind.value === "add" ? v : -v;
    data.ledger.push({
      id: uid(),
      transactionDate: date.value || todayKR(),
      amount: signed,
      transactionType: kind.value === "add" ? "수동 추가" : "수동 차감",
      title: title.value.trim(),
      description: memo.value.trim(),
      isAutomatic: false,
      status: "active",
      createdAt: Date.now(),
    });
    save(data);
    toast("조정이 반영되었습니다");
    leaveTab = "dash";
    renderLeave();
  });

  // 최근 수동 기록
  const manual = data.ledger
    .filter((l) => l.transactionType === "수동 추가" || l.transactionType === "수동 차감")
    .sort((a, b) => (a.transactionDate < b.transactionDate ? 1 : -1))
    .slice(0, 6);
  const list = document.createElement("div");
  list.className = "mt-3 rounded-lg border border-black/10 bg-white p-2";
  list.innerHTML = '<div class="mb-1 text-[11px] font-semibold text-neutral-500">최근 수동 기록</div>';
  if (!manual.length) list.innerHTML += '<div class="text-neutral-400 text-xs">없음</div>';
  for (const l of manual) list.appendChild(ledgerRow(l));

  body.append(
    field("적용 날짜", date),
    field("구분", kind),
    field("수량", amount),
    field("제목", title),
    field("사유/메모", memo),
    saveBtn,
    list
  );
}

// ── 탭: 공휴일 ─────────────────────────────────────────────────────────
function renderHolidays(body, data) {
  const yearSel = document.createElement("select");
  yearSel.className = "mb-2 rounded border border-neutral-300 px-2 py-1";
  yearSel.innerHTML = [2025, 2026, 2027].map((y) => `<option>${y}</option>`).join("");
  yearSel.value = todayKR().slice(0, 4);
  const listBox = document.createElement("div");
  listBox.className = "rounded-lg border border-black/10 bg-white p-2 text-xs";

  function draw() {
    const y = Number(yearSel.value);
    const hmap = holidayMap([y], data.holidaysManual);
    const rows = [...hmap.entries()]
      .filter(([d]) => d.startsWith(String(y)))
      .sort();
    listBox.innerHTML = "";
    for (const [d, name] of rows) {
      const r = document.createElement("div");
      r.className = "flex justify-between border-t border-black/5 py-1 first:border-t-0";
      r.innerHTML = `<span>${d}</span><span class="text-neutral-600">${name}</span>`;
      listBox.appendChild(r);
    }
    if (!rows.length) listBox.innerHTML = '<div class="text-neutral-400">데이터 없음</div>';
  }
  yearSel.addEventListener("change", draw);

  // 수동 추가
  const md = input("date");
  const mn = input("text");
  mn.placeholder = "공휴일명";
  const add = document.createElement("button");
  add.textContent = "공휴일 추가";
  add.className = "w-full rounded bg-[#2b3a5c] px-3 py-1.5 text-white hover:opacity-90";
  add.addEventListener("click", () => {
    if (!md.value || !mn.value.trim()) return toast("날짜와 이름을 입력하세요", false);
    data.holidaysManual.push({ date: md.value, name: mn.value.trim(), isActive: true, isManual: true });
    save(data);
    toast("공휴일이 추가되었습니다");
    draw();
  });

  const note = document.createElement("div");
  note.className = "mb-2 rounded border border-amber-300 bg-amber-50 p-2 text-[11px] text-neutral-600";
  note.textContent = "공휴일은 로컬 데이터를 사용합니다(공휴일 API는 후속 단계). 필요 시 여기서 직접 추가/보정하세요.";

  body.append(note, yearSel, listBox, document.createElement("hr"), field("추가 날짜", md), field("이름", mn), add);
  draw();
}

// ── 탭: 설정 ───────────────────────────────────────────────────────────
function renderSettings(body, data) {
  const e = data.employee;
  const name = input("text", e.name);
  name.placeholder = "이름";
  const num = input("text", e.employeeNumber);
  num.placeholder = "사번";
  const hire = input("date", e.hireDate);
  const dept = input("text", e.department);
  dept.placeholder = "부서";
  const neg = document.createElement("input");
  neg.type = "checkbox";
  neg.checked = !!e.allowNegative;
  const negWrap = document.createElement("label");
  negWrap.className = "mb-2 flex items-center gap-2 text-xs";
  negWrap.append(neg, Object.assign(document.createElement("span"), { textContent: "마이너스 연차 허용" }));

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "저장";
  saveBtn.className = "w-full rounded bg-[#2b3a5c] px-3 py-2 text-white hover:opacity-90";
  saveBtn.addEventListener("click", () => {
    if (!hire.value) return toast("입사일을 입력하세요", false);
    data.employee = {
      ...e,
      name: name.value.trim(),
      employeeNumber: num.value.trim(),
      hireDate: hire.value,
      department: dept.value.trim(),
      allowNegative: neg.checked,
      attendance: e.attendance || {},
    };
    syncAccruals(data);
    save(data);
    toast("저장되었습니다");
    leaveTab = "dash";
    renderLeave();
  });

  const policy = card(
    `<div class="text-[11px] font-semibold text-neutral-500 mb-1">적용 정책</div>
     <div class="text-xs text-neutral-600">월 개근 ${LEAVE_POLICY.monthlyAccrualAmount}일(최대 ${LEAVE_POLICY.monthlyAccrualLimit}) · 1주년 ${LEAVE_POLICY.firstAnnualGrant}일 · ${LEAVE_POLICY.additionalLeaveEveryYears}년마다 +1 · 최대 ${LEAVE_POLICY.maximumAnnualGrant}일</div>`
  );

  body.append(
    field("이름", name),
    field("사번", num),
    field("입사일", hire),
    field("부서", dept),
    negWrap,
    saveBtn,
    policy
  );
}
