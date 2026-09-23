/* ===== 관리자 페이지 ===== */
"use strict";

const show = makeShow([
  "viewSetup", "viewLogin", "viewNew", "viewPreview",
  "viewManage", "viewCampaign", "viewNotices", "viewSettings"
]);

let me = null;
let editingId = null;    // 수정 중인 캠페인 id (신규면 null)
let previewId = null;    // 방금 저장해서 확인 중인 캠페인 id
let curImage = "";       // 업로드한 대표 이미지 (dataURL)
let curCampaign = null;  // 상세 보기 중인 캠페인
let curApps = [];        // 상세 보기 중인 캠페인의 신청자
let appTab = "pending";
let siteSettings = { notice: "" };

$("siteName").textContent = window.SITE_NAME || "체험단";
document.title = "관리자 — " + (window.SITE_NAME || "체험단");

/* ================= 진입 ================= */
if (!CONFIGURED) {
  show("viewSetup");
} else {
  auth.onAuthStateChanged(async user => {
    me = user;
    // 관리자 계정이 아니면(로그아웃 상태이거나 신청자 계정이면) 핀번호 화면
    if (!isAdminUser(user)) {
      me = null;
      $("userBox").innerHTML = "";
      $("navBar").classList.add("hidden");
      show("viewLogin");
      setTimeout(() => $("pinInput").focus(), 50);
      return;
    }
    $("userBox").innerHTML = `<span class="uname">관리자</span>
      <button class="btn sm plain" id="btnLogout">로그아웃</button>`;
    $("btnLogout").onclick = () => auth.signOut();
    $("navBar").classList.remove("hidden");
    await loadSettings();
    go("manage");
  });
}

/* ---------- 핀번호 로그인 ---------- */
const pinErr = msg => { $("pinErr").textContent = msg || ""; if (msg) $("pinInput").classList.add("shake"); setTimeout(() => $("pinInput").classList.remove("shake"), 400); };

$("pinInput").addEventListener("input", () => {
  $("pinInput").value = $("pinInput").value.replace(/\D/g, "").slice(0, 8);
  pinErr("");
});
$("pinInput").addEventListener("keydown", e => { if (e.key === "Enter") $("btnPinLogin").click(); });

$("btnPinLogin").onclick = async () => {
  const pin = $("pinInput").value.trim();
  if (!isValidPin(pin)) return pinErr("핀번호는 숫자 4~8자리예요.");
  const btn = $("btnPinLogin");
  btn.disabled = true;
  btn.textContent = "확인 중…";
  const r = await adminLogin(pin);
  btn.disabled = false;
  btn.textContent = "들어가기";
  if (r.ok) {
    $("pinInput").value = "";
    pinErr("");
    if (r.created) toast("관리자 계정이 만들어졌어요. 설정에서 핀번호를 꼭 바꿔 주세요!");
    return; // onAuthStateChanged 가 화면을 넘겨 줘요
  }
  if (r.reason === "notenabled") {
    pinErr("파이어베이스에서 이메일/비밀번호 로그인을 켜 주세요. (SETUP.md 3번)");
  } else if (r.reason === "toomany") {
    pinErr("시도가 너무 많았어요. 잠시 후 다시 시도해 주세요.");
  } else if (r.reason === "error") {
    pinErr("오류: " + friendlyError(r.error));
  } else {
    pinErr("핀번호가 맞지 않아요.");
    $("pinInput").value = "";
    $("pinInput").focus();
  }
};

/* ================= 네비게이션 ================= */
$$(".nav button").forEach(b => b.onclick = () => go(b.dataset.go));

function setNav(name) {
  $$(".nav button").forEach(b => b.classList.toggle("on", b.dataset.go === name));
}
function go(name) {
  setNav(name);
  if (name === "new") { openForm(null); }
  else if (name === "manage") { loadManage(); }
  else if (name === "notices") { loadNotices(); }
  else if (name === "settings") { openSettings(); }
}

/* ================= 설정 ================= */
async function loadSettings() {
  try {
    const d = await db.collection("settings").doc("site").get();
    siteSettings = d.exists ? d.data() : { notice: "" };
  } catch (e) { siteSettings = { notice: "" }; }
}

function openSettings() {
  show("viewSettings");
  $("sNotice").value = siteSettings.notice || "";
  ["pinCur", "pinNew", "pinNew2"].forEach(id => $(id).value = "");
}

/* ---------- 핀번호 변경 ---------- */
["pinCur", "pinNew", "pinNew2"].forEach(id =>
  $(id).addEventListener("input", () => { $(id).value = $(id).value.replace(/\D/g, "").slice(0, 8); }));

$("btnChangePin").onclick = async () => {
  const cur = $("pinCur").value.trim(), nw = $("pinNew").value.trim(), nw2 = $("pinNew2").value.trim();
  if (!isValidPin(cur)) return toast("현재 핀번호를 입력해 주세요");
  if (!isValidPin(nw)) return toast("새 핀번호는 숫자 4~8자리로 정해 주세요");
  if (nw !== nw2) return toast("새 핀번호가 서로 달라요");
  if (nw === cur) return toast("지금 쓰는 핀번호와 같아요");

  const btn = $("btnChangePin");
  btn.disabled = true;
  btn.textContent = "변경 중…";
  try {
    await changeAdminPin(cur, nw);
    ["pinCur", "pinNew", "pinNew2"].forEach(id => $(id).value = "");
    toast("핀번호를 바꿨어요 ✅ 다음부터는 새 핀번호로 들어오세요");
  } catch (e) {
    if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential")
      toast("현재 핀번호가 맞지 않아요");
    else if (e.code === "auth/too-many-requests")
      toast("시도가 너무 많았어요. 잠시 후 다시 시도해 주세요");
    else toast("변경 실패: " + friendlyError(e));
  }
  btn.disabled = false;
  btn.textContent = "핀번호 변경";
};

$("btnSaveNotice").onclick = async () => {
  const btn = $("btnSaveNotice");
  btn.disabled = true;
  try {
    const notice = $("sNotice").value;
    await db.collection("settings").doc("site").set({ notice, updatedAt: TS() }, { merge: true });
    siteSettings.notice = notice;
    toast("저장했어요 ✅");
  } catch (e) { toast("저장 실패: " + friendlyError(e)); }
  btn.disabled = false;
};

/* ================= 캠페인 등록/수정 폼 ================= */
$("btnPickImg").onclick = () => $("fImgFile").click();
$("fImgPrev").onclick = () => $("fImgFile").click();
$("fImgFile").onchange = async ev => {
  const f = ev.target.files[0];
  if (!f) return;
  try {
    curImage = await fileToSquareDataUrl(f);
    paintImage();
  } catch (e) { toast(e.message); }
  ev.target.value = "";
};
$("btnClearImg").onclick = () => { curImage = ""; paintImage(); };

function paintImage() {
  const p = $("fImgPrev");
  p.style.backgroundImage = curImage ? `url(${curImage})` : "";
  p.innerHTML = curImage ? "" : "사진 선택<br>(자동 1:1)";
  $("btnClearImg").classList.toggle("hidden", !curImage);
}

$("fChannel").onchange = () => {
  const v = $("fChannel").value;
  $("fChannelEtc").classList.toggle("hidden", v !== "etc");
  $("chHint").textContent = v === "self"
    ? "신청자가 유튜브 · 인스타그램 · 카페 · 블로그 · 기타 중에서 직접 고르고 링크를 입력해요."
    : "신청자는 이 채널의 링크만 입력하면 돼요.";
};

$("btnAddProduct").onclick = () => addProductRow({ name: "", url: "", price: "", qty: 1, options: [] });
$("btnAddQ").onclick = () => addQuestionRow({ text: "", required: true });

function openForm(c) {
  editingId = c ? c.id : null;
  $("formTitle").textContent = c ? "캠페인 수정" : "캠페인 등록";
  $("btnSubmitForm").textContent = c ? "수정 저장하기" : "등록하기";
  $("fTitle").value = c ? c.title : "";
  $("fGoal").value = c ? c.goalCount : "";
  $("fRecruitEnd").value = c ? (c.recruitEnd || "") : "";
  $("fAnnounce").value = c ? (c.announceDate || "") : "";
  curImage = c ? (c.coverImage || "") : "";
  paintImage();
  $$("input[name=fProgress]").forEach(r => r.checked = r.value === (c ? c.progressType : "all"));
  $$("input[name=fShip]").forEach(r => r.checked = r.value === (c ? c.shipping : "required"));
  syncPills();

  $("fProducts").innerHTML = "";
  const prods = (c && c.products && c.products.length) ? c.products : [{ name: "", url: "", price: "", qty: 1, options: [] }];
  prods.forEach(p => addProductRow(p));

  $("fChannel").value = c ? (c.channelMode === "self" ? "self" : c.channel.type) : "blog";
  $("fChannelEtc").value = c && c.channel ? (c.channel.custom || "") : "";
  $("fChannel").onchange();

  $("fSubStart").value = c ? (c.submitStart || "") : "";
  $("fSubEnd").value = c ? (c.submitEnd || "") : "";
  $("fGuide").value = c ? (c.guide || "") : "";

  $("fQuestions").innerHTML = "";
  (c && c.questions ? c.questions : []).forEach(q => addQuestionRow(q));

  show("viewNew");
}

function addProductRow(p) {
  const box = $("fProducts");
  const el = document.createElement("div");
  el.className = "rep prod-rep";
  el.innerHTML = `
    <div class="rep-h">
      <span class="no">상품</span>
      <input type="text" class="p-name" placeholder="상품명 (예: 수분크림 50ml)" value="${esc(p.name || "")}">
      <button class="btn danger sm p-del">삭제</button>
    </div>
    <div class="field">
      <label class="fl">상품 상세페이지 주소</label>
      <input type="url" class="p-url" placeholder="https://" value="${esc(p.url || "")}">
    </div>
    <div class="grid2">
      <div class="field" style="margin-bottom:12px">
        <label class="fl">상품 판매가 (원)</label>
        <input type="number" class="p-price" min="0" placeholder="29000" value="${p.price === 0 || p.price ? esc(p.price) : ""}">
      </div>
      <div class="field" style="margin-bottom:12px">
        <label class="fl">지급 수량</label>
        <input type="number" class="p-qty" min="1" placeholder="1" value="${p.qty || 1}">
      </div>
    </div>
    <label class="fl">옵션 (색상 · 사이즈 등 · 없으면 비워두세요)</label>
    <div class="p-opts"></div>
    <button class="btn line sm p-addopt">＋ 옵션 추가</button>`;
  const optsBox = el.querySelector(".p-opts");
  const addOpt = v => {
    const row = document.createElement("div");
    row.className = "opt-row";
    row.innerHTML = `<span class="idx"></span>
      <input type="text" class="p-opt" placeholder="옵션명 (예: 블랙 / L사이즈)" value="${esc(v || "")}">
      <button class="btn plain sm">✕</button>`;
    row.querySelector("button").onclick = () => { row.remove(); renumber(); };
    optsBox.appendChild(row);
    renumber();
  };
  const renumber = () => {
    const pi = [...box.children].indexOf(el) + 1;
    el.querySelector(".no").textContent = `상품 ${pi}`;
    $$(".opt-row .idx", optsBox).forEach((s, i) => s.textContent = `${pi}-${i + 1})`);
  };
  (p.options || []).forEach(addOpt);
  el.querySelector(".p-addopt").onclick = () => addOpt("");
  el.querySelector(".p-del").onclick = () => {
    if (box.children.length <= 1) { toast("상품은 최소 1개 필요해요"); return; }
    el.remove();
    renumberAll();
  };
  box.appendChild(el);
  renumberAll();
}
function renumberAll() {
  $$(".prod-rep", $("fProducts")).forEach((el, i) => {
    el.querySelector(".no").textContent = `상품 ${i + 1}`;
    $$(".opt-row .idx", el).forEach((s, j) => s.textContent = `${i + 1}-${j + 1})`);
  });
}

function addQuestionRow(q) {
  const box = $("fQuestions");
  const el = document.createElement("div");
  el.className = "rep q-rep";
  el.innerHTML = `
    <div class="rep-h">
      <span class="no">질문</span>
      <input type="text" class="q-text" placeholder="예) 체험 후 후기를 언제쯤 올릴 수 있나요?" value="${esc(q.text || "")}">
      <button class="btn danger sm q-del">삭제</button>
    </div>
    <label class="check"><input type="checkbox" class="q-req" ${q.required !== false ? "checked" : ""}> 필수 답변 (답하지 않으면 신청할 수 없어요)</label>`;
  el.querySelector(".q-del").onclick = () => { el.remove(); renumberQ(); };
  box.appendChild(el);
  renumberQ();
}
function renumberQ() {
  $$(".q-rep", $("fQuestions")).forEach((el, i) => el.querySelector(".no").textContent = `질문 ${i + 1}`);
}

/* 라디오 pill 강조 */
function syncPills() {
  $$(".pill input").forEach(inp => {
    const upd = () => $$(`.pill input[name="${inp.name}"]`).forEach(o => o.closest(".pill").classList.toggle("on", o.checked));
    inp.onchange = upd;
    upd();
  });
}
syncPills();

function readForm() {
  const title = $("fTitle").value.trim();
  if (!title) return toast("캠페인명을 입력해 주세요"), null;
  const goalCount = Number($("fGoal").value);
  if (!goalCount || goalCount < 1) return toast("목표 인원을 1명 이상으로 입력해 주세요"), null;
  const recruitEnd = $("fRecruitEnd").value;
  if (!recruitEnd) return toast("모집 마감일을 선택해 주세요"), null;
  const announceDate = $("fAnnounce").value;
  if (!announceDate) return toast("대상 발표일을 선택해 주세요"), null;
  if (!curImage) return toast("제품 사진을 올려 주세요"), null;

  const products = [];
  for (const el of $$(".prod-rep", $("fProducts"))) {
    const name = el.querySelector(".p-name").value.trim();
    if (!name) return toast("상품명을 입력해 주세요"), null;
    const options = $$(".p-opt", el).map(i => i.value.trim()).filter(Boolean);
    products.push({
      name,
      url: el.querySelector(".p-url").value.trim(),
      price: Number(el.querySelector(".p-price").value) || 0,
      qty: Number(el.querySelector(".p-qty").value) || 1,
      options
    });
  }
  if (!products.length) return toast("상품을 1개 이상 등록해 주세요"), null;

  const chv = $("fChannel").value;
  const channelMode = chv === "self" ? "self" : "fixed";
  let channel = null;
  if (channelMode === "fixed") {
    const custom = $("fChannelEtc").value.trim();
    if (chv === "etc" && !custom) return toast("기타 채널 이름을 입력해 주세요"), null;
    channel = { type: chv, custom };
  }
  const submitStart = $("fSubStart").value;
  const submitEnd = $("fSubEnd").value;
  if (!submitStart || !submitEnd) return toast("콘텐츠 제출 기간을 선택해 주세요"), null;
  if (submitEnd < submitStart) return toast("제출 마감일이 시작일보다 빨라요"), null;

  const questions = [];
  for (const el of $$(".q-rep", $("fQuestions"))) {
    const text = el.querySelector(".q-text").value.trim();
    if (!text) return toast("빈 질문이 있어요. 질문 내용을 입력해 주세요"), null;
    questions.push({ text, required: el.querySelector(".q-req").checked });
  }

  return {
    title, goalCount, recruitEnd, announceDate,
    coverImage: curImage,
    progressType: document.querySelector("input[name=fProgress]:checked").value,
    products, channelMode, channel, submitStart, submitEnd,
    guide: $("fGuide").value.trim(),
    shipping: document.querySelector("input[name=fShip]:checked").value,
    questions
  };
}

$("btnCancelForm").onclick = () => { editingId ? openCampaign(editingId) : go("manage"); };

$("btnSubmitForm").onclick = async () => {
  const data = readForm();
  if (!data) return;
  const btn = $("btnSubmitForm");
  btn.disabled = true;
  try {
    if (editingId) {
      await db.collection("campaigns").doc(editingId).update({ ...data, updatedAt: TS() });
      toast("수정했어요 ✅");
      await openCampaign(editingId);
    } else {
      const ref = await db.collection("campaigns").add({
        ...data,
        status: "draft",
        applicantCount: 0,
        ownerUid: me.uid, ownerEmail: me.email,
        createdAt: TS(), updatedAt: TS()
      });
      previewId = ref.id;
      $("previewBody").innerHTML = renderCampaignBody({ id: ref.id, ...data, status: "draft", applicantCount: 0 });
      show("viewPreview");
    }
  } catch (e) {
    toast("저장 실패: " + friendlyError(e));
  }
  btn.disabled = false;
};

$("btnPvConfirm").onclick = async () => {
  try {
    await db.collection("campaigns").doc(previewId).update({ status: "published", publishedAt: TS() });
    toast("확정했어요! 이제 신청자에게 보여요 🎉");
    go("manage");
  } catch (e) { toast("실패: " + friendlyError(e)); }
};
$("btnPvLater").onclick = () => {
  toast("미노출 상태로 보관했어요. 캠페인 관리에서 언제든 공개할 수 있어요.");
  go("manage");
};

/* ================= 캠페인 관리 ================= */
async function loadManage() {
  show("viewManage");
  const box = $("manageList");
  box.innerHTML = '<div class="loading">불러오는 중…</div>';
  try {
    const snap = await db.collection("campaigns").orderBy("createdAt", "desc").get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!items.length) {
      box.innerHTML = `<div class="card empty"><div class="big">📋</div>아직 등록한 캠페인이 없어요.<br>
        <button class="btn mt16" onclick="go('new')">첫 캠페인 등록하기</button></div>`;
      return;
    }
    box.innerHTML = items.map(c => {
      const st = c.status === "published"
        ? (daysLeft(c.recruitEnd) < 0 ? `<span class="badge closed">모집 마감</span>` : `<span class="badge live">노출 중</span>`)
        : `<span class="badge draft">미노출 중</span>`;
      const cnt = c.applicantCount || 0;
      const pct = Math.min(100, Math.round(cnt / Math.max(1, c.goalCount) * 100));
      return `<div class="lrow" data-id="${c.id}">
        <div class="th" style="background-image:url(${c.coverImage || ""})"></div>
        <div class="info">
          <div class="t">${esc(c.title)} ${st}</div>
          <div class="m">모집 마감 ${fmtDate(c.recruitEnd)} · 발표 ${fmtDate(c.announceDate)}</div>
          <div class="bar-mini" style="max-width:220px"><i style="width:${pct}%"></i></div>
        </div>
        <div class="num"><b>${cnt}</b><span>${c.goalCount}명 모집 중 신청</span></div>
      </div>`;
    }).join("");
    $$(".lrow", box).forEach(el => el.onclick = () => openCampaign(el.dataset.id));
  } catch (e) {
    box.innerHTML = `<div class="card empty">불러오기 실패: ${esc(friendlyError(e))}</div>`;
  }
}

/* ================= 캠페인 상세 ================= */
$("btnBackManage").onclick = () => go("manage");
$$("#viewCampaign .subtabs button").forEach(b => b.onclick = () => {
  $$("#viewCampaign .subtabs button").forEach(x => x.classList.toggle("on", x === b));
  ["info", "apps", "prog"].forEach(t =>
    $("tab" + t[0].toUpperCase() + t.slice(1)).classList.toggle("hidden", t !== b.dataset.tab));
});

async function openCampaign(id) {
  setNav("manage");
  show("viewCampaign");
  $("cpTitle").textContent = "불러오는 중…";
  $("cpSub").textContent = "";
  $("tabInfo").innerHTML = '<div class="loading">불러오는 중…</div>';
  $("tabApps").innerHTML = "";
  $("tabProg").innerHTML = "";
  try {
    const [cDoc, aSnap] = await Promise.all([
      db.collection("campaigns").doc(id).get(),
      db.collection("campaigns").doc(id).collection("applications").get()
    ]);
    if (!cDoc.exists) { toast("캠페인을 찾을 수 없어요"); go("manage"); return; }
    curCampaign = { id, ...cDoc.data() };
    curApps = aSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
    curApps.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    renderCampaignHead();
    renderInfoTab();
    renderAppsTab();
    renderProgTab();
  } catch (e) {
    $("tabInfo").innerHTML = `<div class="card empty">불러오기 실패: ${esc(friendlyError(e))}</div>`;
  }
}

function renderCampaignHead() {
  const c = curCampaign;
  const st = c.status === "published"
    ? (daysLeft(c.recruitEnd) < 0 ? `<span class="badge closed">모집 마감</span>` : `<span class="badge live">노출 중</span>`)
    : `<span class="badge draft">미노출 중</span>`;
  $("cpTitle").innerHTML = `${esc(c.title)} ${st}`;
  const sel = curApps.filter(a => a.status === "selected").length;
  $("cpSub").textContent = `신청 ${curApps.length}명 · 최종 대상자 ${sel}명 / 목표 ${c.goalCount}명`;
}

function renderInfoTab() {
  const c = curCampaign;
  $("tabInfo").innerHTML = `
    <div class="row mt8" style="margin-bottom:16px">
      <button class="btn" id="btnEditCp">캠페인 수정</button>
      <button class="btn line" id="btnToggleCp">${c.status === "published" ? "미노출로 전환" : "확정 · 공개하기"}</button>
      <div class="spacer"></div>
      <button class="btn danger" id="btnDelCp">캠페인 삭제</button>
    </div>
    ${renderCampaignBody(c)}`;
  $("btnEditCp").onclick = () => openForm(c);
  $("btnToggleCp").onclick = async () => {
    const pub = c.status !== "published";
    if (!pub) {
      const ok = await confirmDialog("미노출로 전환할까요?",
        "신청자 목록에서 이 캠페인이 사라지고, 새로 신청할 수 없게 돼요.\n이미 접수된 신청 내용은 그대로 남아요.", "미노출로 전환");
      if (!ok) return;
    }
    await db.collection("campaigns").doc(c.id).update({ status: pub ? "published" : "draft" });
    toast(pub ? "공개했어요 🎉" : "미노출로 바꿨어요");
    openCampaign(c.id);
  };
  $("btnDelCp").onclick = async () => {
    const ok = await confirmDialog("캠페인을 삭제할까요?",
      `"${c.title}" 캠페인과 신청자 ${curApps.length}명의 신청 내용이 모두 사라져요.\n되돌릴 수 없어요.`, "삭제하기");
    if (!ok) return;
    const batch = db.batch();
    curApps.forEach(a => batch.delete(db.collection("campaigns").doc(c.id).collection("applications").doc(a.uid)));
    batch.delete(db.collection("campaigns").doc(c.id));
    await batch.commit();
    toast("삭제했어요");
    go("manage");
  };
}

/* ---------- 신청자 조회 · 선정 ---------- */
function renderAppsTab() {
  const c = curCampaign;
  const by = s => curApps.filter(a => (a.status || "pending") === s);
  const counts = { pending: by("pending").length, candidate: by("candidate").length, selected: by("selected").length };
  $("tabApps").innerHTML = `
    <div class="subtabs" id="appTabs">
      <button data-s="pending">미선정 ${counts.pending}명</button>
      <button data-s="candidate">1차 후보 ${counts.candidate}명</button>
      <button data-s="selected">최종 대상자 ${counts.selected}명 (목표 ${c.goalCount}명)</button>
    </div>
    <div class="card pad0" id="appTable"></div>`;
  $$("#appTabs button").forEach(b => b.onclick = () => { appTab = b.dataset.s; paintAppTable(); });
  paintAppTable();
}

function paintAppTable() {
  $$("#appTabs button").forEach(b => b.classList.toggle("on", b.dataset.s === appTab));
  const list = curApps.filter(a => (a.status || "pending") === appTab);
  const box = $("appTable");
  if (!list.length) {
    const msg = { pending: "미선정 상태인 신청자가 없어요.", candidate: "1차 후보로 올린 신청자가 없어요.", selected: "아직 최종 대상자가 없어요." }[appTab];
    box.innerHTML = `<div class="empty"><div class="big">👤</div>${msg}</div>`;
    return;
  }
  const showShip = appTab === "selected";
  box.innerHTML = `<div class="tbl-wrap"><table class="tbl">
    <thead><tr>
      <th>신청일</th><th>이름</th><th>채널</th><th>채널 링크</th>
      ${curCampaign.progressType === "select" ? "<th>선택 상품</th>" : ""}
      ${showShip ? "<th>배송 정보</th>" : ""}
      <th>답변</th><th style="text-align:right">선정</th>
    </tr></thead>
    <tbody>${list.map(a => rowHtml(a, showShip)).join("")}</tbody>
  </table></div>`;
  $$("[data-act]", box).forEach(b => b.onclick = () => appAction(b.dataset.uid, b.dataset.act));
  $$("[data-ans]", box).forEach(b => b.onclick = () => showAnswers(b.dataset.ans));
}

function rowHtml(a, showShip) {
  const ch = a.channel || {};
  const linkTd = ch.link
    ? `<a class="link" href="${esc(ch.link)}" target="_blank" rel="noopener">${esc(ch.link.replace(/^https?:\/\//, "").slice(0, 34))}</a>`
    : '<span class="dim">-</span>';
  const ship = a.shipping && a.shipping.address
    ? `${esc(a.shipping.receiver || a.name)} · ${esc(a.shipping.phone || a.phone || "")}<br><span class="dim">(${esc(a.shipping.zipcode || "")}) ${esc(a.shipping.address || "")} ${esc(a.shipping.detail || "")}</span>`
    : '<span class="dim">미입력</span>';
  const btns = {
    pending: `<button class="btn sm ghost" data-act="candidate" data-uid="${a.uid}">1차 후보로 →</button>`,
    candidate: `<button class="btn sm ok" data-act="selected" data-uid="${a.uid}">최종 선정 ✓</button>
                <button class="btn sm plain" data-act="pending" data-uid="${a.uid}">되돌리기</button>`,
    selected: `<button class="btn sm plain" data-act="candidate" data-uid="${a.uid}">1차 후보로 내리기</button>`
  }[a.status || "pending"];
  return `<tr>
    <td class="dim" style="white-space:nowrap">${fmtDateTime(a.createdAt)}</td>
    <td class="nm">${esc(a.name || "-")}<br><span class="dim">${esc(a.mallId || "")}</span></td>
    <td style="white-space:nowrap">${esc(channelLabel(a.channel))}</td>
    <td>${linkTd}</td>
    ${curCampaign.progressType === "select" ? `<td>${esc(a.productChoice || "-")}</td>` : ""}
    ${showShip ? `<td style="min-width:200px">${ship}</td>` : ""}
    <td>${(a.answers && a.answers.length)
      ? `<button class="btn sm line" data-ans="${a.uid}">답변 ${a.answers.length}개</button>`
      : '<span class="dim">-</span>'}</td>
    <td style="text-align:right;white-space:nowrap">${btns}</td>
  </tr>`;
}

async function appAction(uid, next) {
  const a = curApps.find(x => x.uid === uid);
  if (!a) return;
  if (next === "selected") {
    const cur = curApps.filter(x => x.status === "selected").length;
    if (cur >= curCampaign.goalCount) {
      const ok = await confirmDialog("목표 인원을 넘어요",
        `목표 ${curCampaign.goalCount}명을 이미 채웠어요. 그래도 추가로 선정할까요?`, "추가 선정", false);
      if (!ok) return;
    }
  }
  try {
    await db.collection("campaigns").doc(curCampaign.id).collection("applications").doc(uid).update({ status: next });
    a.status = next;
    renderCampaignHead();
    renderAppsTab();
    renderProgTab();
    toast(`${a.name || "신청자"} → ${APP_STATUS[next].t}`);
  } catch (e) { toast("실패: " + friendlyError(e)); }
}

function showAnswers(uid) {
  const a = curApps.find(x => x.uid === uid);
  if (!a) return;
  alertDialog(`${a.name || "신청자"} 님의 답변`,
    (a.answers || []).map(x => `
      <div class="field">
        <label class="fl">${esc(x.q)}</label>
        <div class="notice-box" style="max-height:none">${esc(x.a || "(답변 없음)")}</div>
      </div>`).join("") || '<p class="muted">답변이 없어요.</p>');
}

/* ---------- 진행관리 ---------- */
function renderProgTab() {
  const list = curApps.filter(a => a.status === "selected");
  if (!list.length) {
    $("tabProg").innerHTML = `<div class="card empty"><div class="big">🚚</div>
      최종 대상자를 먼저 선정해 주세요.<br><span class="dim">선정이 끝나면 여기서 배송과 콘텐츠 제출을 관리할 수 있어요.</span></div>`;
    return;
  }
  const c = curCampaign;
  const done = list.filter(a => a.progress && a.progress.url).length;
  $("tabProg").innerHTML = `
    <div class="card">
      <div class="row between">
        <div><b>콘텐츠 제출 ${done} / ${list.length}명</b>
          <div class="dim">제출 기간 ${fmtDate(c.submitStart)} ~ ${fmtDate(c.submitEnd)}</div></div>
        <div class="bar-mini" style="width:160px"><i style="width:${Math.round(done / list.length * 100)}%"></i></div>
      </div>
    </div>
    <div class="card pad0"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>이름</th><th>연락처</th><th>배송 정보</th><th>콘텐츠 URL</th><th style="text-align:right">상태</th></tr></thead>
      <tbody>${list.map(a => {
        const s = a.shipping || {};
        return `<tr>
          <td class="nm">${esc(a.name || "-")}<br><span class="dim">${esc(channelLabel(a.channel))}</span></td>
          <td style="white-space:nowrap">${esc(a.phone || "-")}</td>
          <td style="min-width:190px">${s.address
            ? `${esc(s.receiver || a.name)}<br><span class="dim">(${esc(s.zipcode || "")}) ${esc(s.address)} ${esc(s.detail || "")}</span>`
            : '<span class="dim">미입력</span>'}</td>
          <td style="min-width:220px">
            <input type="url" class="pg-url" data-uid="${a.uid}" placeholder="https://" value="${esc(a.progress?.url || "")}">
          </td>
          <td style="text-align:right;white-space:nowrap">
            ${a.progress?.url ? '<span class="badge live">제출 완료</span>' : '<span class="badge draft">미제출</span>'}
            <button class="btn sm ghost pg-save" data-uid="${a.uid}">저장</button>
          </td>
        </tr>`;
      }).join("")}</tbody>
    </table></div></div>`;
  $$(".pg-save", $("tabProg")).forEach(b => b.onclick = async () => {
    const uid = b.dataset.uid;
    const url = $$(`.pg-url[data-uid="${uid}"]`)[0].value.trim();
    b.disabled = true;
    try {
      await db.collection("campaigns").doc(curCampaign.id).collection("applications").doc(uid)
        .update({ progress: { url, submittedAt: url ? TS() : null } });
      const a = curApps.find(x => x.uid === uid);
      a.progress = { url };
      toast(url ? "콘텐츠 URL을 저장했어요 ✅" : "URL을 비웠어요");
      renderProgTab();
    } catch (e) { toast("실패: " + friendlyError(e)); b.disabled = false; }
  });
}

/* ================= 공지 · 유의사항 ================= */
async function loadNotices() {
  show("viewNotices");
  const box = $("noticeList");
  box.innerHTML = '<div class="loading">불러오는 중…</div>';
  try {
    const snap = await db.collection("notices").orderBy("createdAt", "desc").get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!items.length) {
      box.innerHTML = `<div class="card empty"><div class="big">📢</div>등록한 공지가 없어요.</div>`;
      return;
    }
    box.innerHTML = items.map(n => `
      <div class="card">
        <div class="row between">
          <h3>${n.pinned ? '<span class="badge info">중요</span> ' : ""}${esc(n.title)}</h3>
          <div class="row">
            <button class="btn sm line" data-edit="${n.id}">수정</button>
            <button class="btn sm danger" data-del="${n.id}">삭제</button>
          </div>
        </div>
        <p class="dim mt8">${fmtDateTime(n.createdAt)}</p>
        <div class="notice-box mt12">${esc(n.body)}</div>
      </div>`).join("");
    $$("[data-edit]", box).forEach(b => b.onclick = () => noticeModal(items.find(x => x.id === b.dataset.edit)));
    $$("[data-del]", box).forEach(b => b.onclick = async () => {
      const ok = await confirmDialog("공지를 삭제할까요?", "되돌릴 수 없어요.", "삭제하기");
      if (!ok) return;
      await db.collection("notices").doc(b.dataset.del).delete();
      toast("삭제했어요");
      loadNotices();
    });
  } catch (e) {
    box.innerHTML = `<div class="card empty">불러오기 실패: ${esc(friendlyError(e))}</div>`;
  }
}

$("btnNewNotice").onclick = () => noticeModal(null);

function noticeModal(n) {
  const box = openModal(`
    <h3>${n ? "공지 수정" : "공지 등록"}</h3>
    <div class="field mt16">
      <label class="fl">제목 <span class="req">*</span></label>
      <input type="text" id="nTitle" value="${n ? esc(n.title) : ""}" placeholder="예) 체험단 진행 시 꼭 확인해 주세요">
    </div>
    <div class="field">
      <label class="fl">내용 <span class="req">*</span></label>
      <textarea id="nBody" rows="9" placeholder="공지 내용을 적어 주세요.">${n ? esc(n.body) : ""}</textarea>
    </div>
    <label class="check"><input type="checkbox" id="nPin" ${n && n.pinned ? "checked" : ""}> 중요 공지로 맨 위에 고정</label>
    <div class="m-btns">
      <button class="btn plain" id="nCancel">취소</button>
      <button class="btn" id="nSave">${n ? "수정 저장" : "등록하기"}</button>
    </div>`);
  box.querySelector("#nCancel").onclick = closeModal;
  box.querySelector("#nSave").onclick = async () => {
    const title = box.querySelector("#nTitle").value.trim();
    const body = box.querySelector("#nBody").value.trim();
    if (!title) return toast("제목을 입력해 주세요");
    if (!body) return toast("내용을 입력해 주세요");
    const pinned = box.querySelector("#nPin").checked;
    try {
      if (n) await db.collection("notices").doc(n.id).update({ title, body, pinned, updatedAt: TS() });
      else await db.collection("notices").add({ title, body, pinned, createdAt: TS() });
      closeModal();
      toast(n ? "수정했어요 ✅" : "등록했어요 ✅");
      loadNotices();
    } catch (e) { toast("실패: " + friendlyError(e)); }
  };
}
