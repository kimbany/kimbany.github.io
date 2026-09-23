/* ===== 공통 유틸 + 파이어베이스 초기화 ===== */
"use strict";

const $ = id => document.getElementById(id);
const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- 토스트 ---------- */
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- 모달 ---------- */
function openModal(html) {
  $("modalBox").innerHTML = html;
  $("modalBg").classList.remove("hidden");
  return $("modalBox");
}
function closeModal() { $("modalBg").classList.add("hidden"); }
document.addEventListener("click", e => { if (e.target.id === "modalBg") closeModal(); });

function confirmDialog(title, text, okLabel, danger) {
  return new Promise(resolve => {
    const box = openModal(`
      <h3>${esc(title)}</h3>
      <p class="muted" style="white-space:pre-wrap;margin-top:6px">${esc(text)}</p>
      <div class="m-btns">
        <button class="btn plain" id="mNo">취소</button>
        <button class="btn ${danger === false ? "" : "danger"}" id="mYes">${esc(okLabel || "확인")}</button>
      </div>`);
    box.querySelector("#mNo").onclick = () => { closeModal(); resolve(false); };
    box.querySelector("#mYes").onclick = () => { closeModal(); resolve(true); };
  });
}

function alertDialog(title, html) {
  const box = openModal(`
    <h3>${esc(title)}</h3>
    <div class="mt12">${html}</div>
    <div class="m-btns"><button class="btn" id="mOk">닫기</button></div>`);
  box.querySelector("#mOk").onclick = closeModal;
}

/* ---------- 날짜 ---------- */
function todayStr() {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fmtDate(s) {
  if (!s) return "-";
  const d = new Date(s + (s.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d)) return s;
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
function fmtDateTime(ts) {
  if (!ts) return "-";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  if (isNaN(d)) return "-";
  return d.toLocaleString("ko-KR", { year: "2-digit", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
/** 모집 마감일까지 남은 일수 (오늘 마감이면 0, 지났으면 음수) */
function daysLeft(endStr) {
  if (!endStr) return null;
  const end = new Date(endStr + "T23:59:59");
  if (isNaN(end)) return null;
  return Math.ceil((end - new Date()) / 86400000) - 1;
}
function ddayLabel(endStr) {
  const n = daysLeft(endStr);
  if (n === null) return "";
  if (n < 0) return "모집 마감";
  if (n === 0) return "오늘 마감";
  return `D-${n}`;
}
function isOpen(c) {
  if (c.status !== "published") return false;
  const n = daysLeft(c.recruitEnd);
  return n === null || n >= 0;
}
function comma(n) {
  if (n === "" || n === null || n === undefined || isNaN(n)) return "-";
  return Number(n).toLocaleString("ko-KR");
}

/* ---------- 채널 ---------- */
const CHANNELS = {
  youtube: "유튜브",
  instagram: "인스타그램",
  cafe: "카페",
  blog: "블로그",
  etc: "기타"
};
function channelLabel(c) {
  if (!c) return "-";
  if (c.type === "etc" && c.custom) return c.custom;
  return CHANNELS[c.type] || c.type || "-";
}

/* ---------- 신청 상태 ---------- */
const APP_STATUS = {
  pending: { t: "미선정", cls: "draft" },
  candidate: { t: "1차 후보", cls: "soon" },
  selected: { t: "최종 대상자", cls: "live" }
};

/* ---------- 이미지: 정사각(1:1) 리사이즈 → dataURL ---------- */
function fileToSquareDataUrl(file, size = 800) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("이미지 파일만 올릴 수 있어요"));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽지 못했어요"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("이미지를 열지 못했어요"));
      img.onload = () => {
        // 가운데를 정사각형으로 잘라내기
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const cv = document.createElement("canvas");
        cv.width = cv.height = size;
        const ctx = cv.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        let q = 0.82, out = cv.toDataURL("image/jpeg", q);
        // 파이어스토어 문서 용량(1MB) 안에 들어오도록 축소
        while (out.length > 700000 && q > 0.4) {
          q -= 0.12;
          out = cv.toDataURL("image/jpeg", q);
        }
        resolve(out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- 다음(카카오) 우편번호 검색 ---------- */
let _pcLoading = null;
function loadPostcode() {
  if (window.daum && window.daum.Postcode) return Promise.resolve();
  if (_pcLoading) return _pcLoading;
  _pcLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("우편번호 서비스를 불러오지 못했어요"));
    document.head.appendChild(s);
  });
  return _pcLoading;
}
/** cb({zipcode, address}) */
async function openPostcode(cb) {
  try {
    await loadPostcode();
  } catch (e) {
    toast("주소 검색을 열지 못했어요. 직접 입력해 주세요.");
    return;
  }
  new daum.Postcode({
    oncomplete(data) {
      const addr = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
      let extra = "";
      if (data.userSelectedType === "R") {
        if (data.bname && /[동|로|가]$/.test(data.bname)) extra += data.bname;
        if (data.buildingName && data.apartment === "Y") extra += (extra ? ", " : "") + data.buildingName;
      }
      cb({ zipcode: data.zonecode, address: addr + (extra ? ` (${extra})` : "") });
    }
  }).open();
}

/* ---------- 파이어베이스 ---------- */
const CFG = window.firebaseConfig || {};
const CONFIGURED = !!(CFG.apiKey && !String(CFG.apiKey).includes("붙여넣"));
let auth = null, db = null;
if (CONFIGURED) {
  firebase.initializeApp(CFG);
  auth = firebase.auth();
  db = firebase.firestore();
}
const TS = () => firebase.firestore.FieldValue.serverTimestamp();
const INC = n => firebase.firestore.FieldValue.increment(n);

/* ---------- 관리자 핀번호 로그인 ----------
   화면에서는 숫자 핀번호만 입력하지만,
   실제로는 파이어베이스 로그인 비밀번호로 바뀌어 서버에서 검사돼요.
   (비밀번호는 6자 이상이어야 해서 앞뒤에 고정 문자를 붙여요) */
const PIN_MIN = 4, PIN_MAX = 8;
function pinToPassword(pin) { return "mfpin-" + String(pin).trim() + "-adm"; }
function isValidPin(pin) { return new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`).test(String(pin || "").trim()); }

function isAdminUser(user) {
  return !!user && String(user.email || "").toLowerCase() === String(window.ADMIN_LOGIN_EMAIL).toLowerCase();
}

/** 핀번호로 로그인. 계정이 아직 없으면 '처음 핀번호'일 때만 만들어 줘요. */
async function adminLogin(pin) {
  const email = window.ADMIN_LOGIN_EMAIL;
  const pw = pinToPassword(pin);
  try {
    await auth.signInWithEmailAndPassword(email, pw);
    return { ok: true };
  } catch (e) {
    if (e.code === "auth/operation-not-allowed") return { ok: false, reason: "notenabled" };
    if (e.code === "auth/too-many-requests") return { ok: false, reason: "toomany" };
    // 아직 관리자 계정이 만들어지지 않은 첫 로그인
    if (String(pin).trim() === String(window.ADMIN_INITIAL_PIN)) {
      try {
        await auth.createUserWithEmailAndPassword(email, pw);
        return { ok: true, created: true };
      } catch (e2) {
        if (e2.code === "auth/email-already-in-use") return { ok: false, reason: "wrong" };
        if (e2.code === "auth/operation-not-allowed") return { ok: false, reason: "notenabled" };
        return { ok: false, reason: "error", error: e2 };
      }
    }
    return { ok: false, reason: "wrong" };
  }
}

/** 핀번호 변경 (현재 핀번호로 본인 확인 후 변경) */
async function changeAdminPin(curPin, newPin) {
  const cred = firebase.auth.EmailAuthProvider.credential(window.ADMIN_LOGIN_EMAIL, pinToPassword(curPin));
  await auth.currentUser.reauthenticateWithCredential(cred);
  await auth.currentUser.updatePassword(pinToPassword(newPin));
}
function googleLogin() {
  return auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .catch(e => {
      if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
      toast("로그인 실패: " + e.message);
    });
}

/* ---------- 상단 사용자 영역 ---------- */
function renderUserBox(user) {
  const box = $("userBox");
  if (!box) return;
  if (!user) { box.innerHTML = ""; return; }
  box.innerHTML =
    (user.photoURL ? `<img src="${esc(user.photoURL)}" alt="">` : "") +
    `<span class="uname">${esc(user.displayName || user.email)}</span>
     <button class="btn sm plain" id="btnLogout">로그아웃</button>`;
  $("btnLogout").onclick = () => auth.signOut();
}

/* ---------- 화면 전환 ---------- */
function makeShow(ids) {
  return function show(name) {
    ids.forEach(v => $(v) && $(v).classList.toggle("hidden", v !== name));
    window.scrollTo({ top: 0, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
  };
}

/* ---------- 캠페인 상세 본문 (관리자 확인 / 신청자 상세에서 공용) ---------- */
function renderCampaignBody(c) {
  const chText = c.channelMode === "self"
    ? "신청자가 직접 선택"
    : channelLabel(c.channel);
  const prodHtml = (c.products || []).map((p, i) => `
    <div class="prod">
      <div class="pt">${i + 1}. ${esc(p.name)}
        ${p.url ? `<a class="btn sm line" href="${esc(p.url)}" target="_blank" rel="noopener">상세페이지 ↗</a>` : ""}</div>
      <div class="pm">판매가 ${comma(p.price)}원 · 지급 수량 ${p.qty || 1}개</div>
      ${(p.options || []).length
        ? `<div class="opts">${p.options.map(o => `<span class="tagc">${esc(o)}</span>`).join("")}</div>` : ""}
    </div>`).join("");

  const shipText = { required: "필수 요청", optional: "선택 요청", none: "요청 안 함" }[c.shipping] || "-";

  return `
  <div class="card">
    <div class="detail-hero">
      <div class="img" style="background-image:url(${c.coverImage || ""})"></div>
      <div class="meta">
        <span class="badge ${isOpen(c) ? "live" : "closed"}">${ddayLabel(c.recruitEnd)}</span>
        <h2>${esc(c.title)}</h2>
        <dl>
          <div class="kv"><dt>모집 인원</dt><dd>${c.goalCount}명</dd></div>
          <div class="kv"><dt>모집 마감</dt><dd>${fmtDate(c.recruitEnd)}</dd></div>
          <div class="kv"><dt>대상 발표</dt><dd>${fmtDate(c.announceDate)}</dd></div>
          <div class="kv"><dt>진행 조건</dt><dd>${c.progressType === "select" ? "선택 진행 (상품 중 1개 선택)" : "모두 진행"}</dd></div>
          <div class="kv"><dt>발행 채널</dt><dd>${esc(chText)}</dd></div>
          <div class="kv"><dt>제출 기간</dt><dd>${fmtDate(c.submitStart)} ~ ${fmtDate(c.submitEnd)}</dd></div>
        </dl>
      </div>
    </div>
  </div>

  <div class="sec"><div class="sec-h">상품정보</div><div class="sec-b">${prodHtml}</div></div>

  ${c.guide ? `<div class="sec"><div class="sec-h">진행 가이드</div>
    <div class="sec-b"><div class="guide-box">${esc(c.guide)}</div></div></div>` : ""}

  <div class="sec"><div class="sec-h">크리에이터 입력사항</div><div class="sec-b">
    <div class="kv"><dt>배송 정보</dt><dd>${shipText}</dd></div>
    ${(c.questions || []).length ? `
      <div class="kv" style="align-items:flex-start"><dt>추가 질문</dt><dd>
        ${c.questions.map((q, i) => `<div style="margin-bottom:6px">${i + 1}. ${esc(q.text)}
          ${q.required !== false ? '<span class="badge info">필수</span>' : '<span class="badge draft">선택</span>'}</div>`).join("")}
      </dd></div>` : ""}
  </div></div>`;
}

/* ---------- 에러 안내 ---------- */
function friendlyError(e) {
  const m = String(e && e.message || e);
  if (m.includes("permission") || m.includes("Missing or insufficient")) {
    return "권한이 없어요. SETUP.md의 보안 규칙을 게시했는지 확인해 주세요.";
  }
  return m;
}
