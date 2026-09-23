/* ===== 체험단 신청자(크리에이터) 페이지 ===== */
"use strict";

const show = makeShow([
  "viewSetup", "viewLogin", "viewProfile", "viewList", "viewDetail",
  "viewApply", "viewDone", "viewMy", "viewNotice", "viewSettings"
]);

let me = null;
let profile = null;        // users/{uid}
let siteSettings = { notice: "" };
let curCampaign = null;    // 상세 보기 중
let myAppIds = [];         // 내가 신청한 캠페인 id 목록
let applyState = null;     // 신청 진행 중 데이터
let profileReturn = null;  // 프로필 저장 후 돌아갈 곳

$("siteName").textContent = window.SITE_NAME || "체험단";
document.title = window.SITE_NAME || "체험단";

/* ---------- 연락처 자동 하이픈 ---------- */
function bindPhone(el) {
  el.addEventListener("input", () => {
    const d = el.value.replace(/\D/g, "").slice(0, 11);
    let out = d;
    if (d.length > 7) out = d.slice(0, 3) + "-" + d.slice(3, d.length - 4) + "-" + d.slice(-4);
    else if (d.length > 3) out = d.slice(0, 3) + "-" + d.slice(3);
    el.value = out;
  });
}
["pPhone", "aPhone", "aRecvPhone"].forEach(id => bindPhone($(id)));
const phoneOk = v => /^\d{2,3}-\d{3,4}-\d{4}$/.test(v);

/* ================= 진입 ================= */
if (!CONFIGURED) {
  show("viewSetup");
} else {
  auth.onAuthStateChanged(async user => {
    me = user;
    renderUserBox(user);
    if (!user) {
      $("navBar").classList.add("hidden");
      show("viewLogin");
      return;
    }
    try {
      const [pDoc, sDoc] = await Promise.all([
        db.collection("users").doc(user.uid).get(),
        db.collection("settings").doc("site").get()
      ]);
      profile = pDoc.exists ? pDoc.data() : null;
      siteSettings = sDoc.exists ? sDoc.data() : { notice: "" };
      myAppIds = (profile && profile.appliedCampaigns) || [];
    } catch (e) {
      toast("불러오기 실패: " + friendlyError(e));
    }
    if (!profile || !profile.name) {
      $("navBar").classList.add("hidden");
      openProfile(true);
    } else {
      $("navBar").classList.remove("hidden");
      go("list");
    }
  });
}

$("btnLogin").onclick = googleLogin;

/* ================= 네비게이션 ================= */
$$(".nav button").forEach(b => b.onclick = () => go(b.dataset.go));
function setNav(name) {
  $$(".nav button").forEach(b => b.classList.toggle("on", b.dataset.go === name));
}
function go(name) {
  setNav(name);
  if (name === "list") loadList();
  else if (name === "my") loadMy();
  else if (name === "notice") loadNotice();
  else if (name === "settings") openSettings();
}

/* ================= 기본 정보 ================= */
function openProfile(isFirst) {
  profileReturn = isFirst ? null : "settings";
  $("pfTitle").textContent = isFirst ? "기본 정보 등록" : "내 정보 수정";
  $("pfSub").textContent = isFirst
    ? "체험단 안내와 제품 배송을 위해 아래 정보를 등록해 주세요."
    : "등록한 정보를 바꿀 수 있어요.";
  $("btnPfSave").textContent = isFirst ? "저장하고 시작하기" : "저장하기";
  $("btnPfCancel").classList.toggle("hidden", !!isFirst);
  const p = profile || {};
  $("pName").value = p.name || (me.displayName || "");
  $("pPhone").value = p.phone || "";
  $("pMallId").value = p.mallId || "";
  $("pZip").value = p.zipcode || "";
  $("pAddr").value = p.address || "";
  $("pAddr2").value = p.detail || "";
  show("viewProfile");
}

$("btnFindAddr").onclick = () => openPostcode(r => {
  $("pZip").value = r.zipcode;
  $("pAddr").value = r.address;
  $("pAddr2").focus();
});
$("btnPfCancel").onclick = () => go("settings");

$("btnPfSave").onclick = async () => {
  const name = $("pName").value.trim();
  const phone = $("pPhone").value.trim();
  const mallId = $("pMallId").value.trim();
  if (!name) return toast("성함을 입력해 주세요");
  if (!phoneOk(phone)) return toast("연락처를 010-0000-0000 형식으로 입력해 주세요");
  if (!mallId) return toast("몽프루이 자사몰 아이디를 입력해 주세요");

  const btn = $("btnPfSave");
  btn.disabled = true;
  try {
    const data = {
      name, phone, mallId,
      zipcode: $("pZip").value.trim(),
      address: $("pAddr").value.trim(),
      detail: $("pAddr2").value.trim(),
      email: me.email, photoURL: me.photoURL || "",
      updatedAt: TS()
    };
    await db.collection("users").doc(me.uid).set(data, { merge: true });
    profile = { ...(profile || {}), ...data };
    toast("저장했어요 ✅");
    $("navBar").classList.remove("hidden");
    go(profileReturn === "settings" ? "settings" : "list");
  } catch (e) {
    toast("저장 실패: " + friendlyError(e));
  }
  btn.disabled = false;
};

/* ================= 캠페인 찾기 ================= */
async function loadList() {
  show("viewList");
  const box = $("cardGrid");
  box.innerHTML = '<div class="loading">불러오는 중…</div>';
  try {
    const snap = await db.collection("campaigns").where("status", "==", "published").get();
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // 모집 중 먼저, 그 다음 마감일 빠른 순
    items.sort((a, b) => {
      const oa = isOpen(a) ? 0 : 1, ob = isOpen(b) ? 0 : 1;
      if (oa !== ob) return oa - ob;
      return String(a.recruitEnd).localeCompare(String(b.recruitEnd));
    });
    if (!items.length) {
      box.innerHTML = `<div class="card empty"><div class="big">🔍</div>
        지금은 모집 중인 캠페인이 없어요.<br><span class="dim">새 캠페인이 열리면 여기에 보여요.</span></div>`;
      return;
    }
    box.className = "cgrid";
    box.innerHTML = items.map(c => {
      const open = isOpen(c);
      const cnt = c.applicantCount || 0;
      const pct = Math.min(100, Math.round(cnt / Math.max(1, c.goalCount) * 100));
      return `<div class="ccard" data-id="${c.id}">
        <div class="thumb" style="background-image:url(${c.coverImage || ""})">
          ${c.coverImage ? "" : '<span class="no-img">이미지 없음</span>'}
          <span class="badge ${open ? "live" : "closed"} dday">${ddayLabel(c.recruitEnd)}</span>
        </div>
        <div class="body">
          <div class="t">${esc(c.title)}</div>
          <div class="meta"><b>${c.goalCount}명</b> 모집 · <b>${cnt}명</b> 신청
            ${myAppIds.includes(c.id) ? '<span class="badge info">신청함</span>' : ""}</div>
          <div class="bar-mini"><i style="width:${pct}%"></i></div>
        </div>
      </div>`;
    }).join("");
    $$(".ccard", box).forEach(el => el.onclick = () => openDetail(el.dataset.id));
  } catch (e) {
    box.className = "";
    box.innerHTML = `<div class="card empty">불러오기 실패: ${esc(friendlyError(e))}</div>`;
  }
}

/* ================= 캠페인 상세 ================= */
$("btnBackList").onclick = () => go("list");

async function openDetail(id) {
  setNav("list");
  show("viewDetail");
  $("detailBody").innerHTML = '<div class="loading">불러오는 중…</div>';
  $("detailFoot").innerHTML = "";
  try {
    const [cDoc, aDoc] = await Promise.all([
      db.collection("campaigns").doc(id).get(),
      db.collection("campaigns").doc(id).collection("applications").doc(me.uid).get()
    ]);
    if (!cDoc.exists) { toast("캠페인을 찾을 수 없어요"); go("list"); return; }
    curCampaign = { id, ...cDoc.data() };
    $("detailBody").innerHTML = renderCampaignBody(curCampaign);
    const applied = aDoc.exists;
    const open = isOpen(curCampaign);
    if (applied) {
      const st = APP_STATUS[aDoc.data().status || "pending"];
      $("detailFoot").innerHTML = `<div class="card center">
        <p class="muted">이미 신청한 캠페인이에요. 현재 상태: <span class="badge ${st.cls}">${st.t}</span></p>
        <button class="btn ghost mt16" onclick="go('my')">내 캠페인에서 확인하기</button></div>`;
    } else if (!open) {
      $("detailFoot").innerHTML = `<div class="card center"><p class="muted">모집이 마감된 캠페인이에요.</p></div>`;
    } else {
      $("detailFoot").innerHTML = `<button class="btn lg full mt8" id="btnApply">이 캠페인 신청하기</button>`;
      $("btnApply").onclick = () => startApply();
    }
  } catch (e) {
    $("detailBody").innerHTML = `<div class="card empty">불러오기 실패: ${esc(friendlyError(e))}</div>`;
  }
}

/* ================= 신청 (3단계) ================= */
function startApply() {
  const c = curCampaign;
  applyState = { step: 1, channel: { type: "blog", custom: "", link: "" }, productChoice: null };
  $("apTitle").textContent = c.title;

  // 상품 선택 (선택 진행일 때만)
  const needPick = c.progressType === "select";
  $("apProdSec").classList.toggle("hidden", !needPick);
  if (needPick) {
    const choices = [];
    (c.products || []).forEach(p => {
      if ((p.options || []).length) p.options.forEach(o => choices.push(`${p.name} - ${o}`));
      else choices.push(p.name);
    });
    $("apProdList").innerHTML = `<div class="opt-pills">${choices.map((v, i) => `
      <label class="pill"><input type="radio" name="apProd" value="${esc(v)}"> ${esc(v)}</label>`).join("")}</div>`;
    $$('input[name=apProd]', $("apProdList")).forEach(inp => inp.onchange = () => {
      $$('input[name=apProd]', $("apProdList")).forEach(o => o.closest(".pill").classList.toggle("on", o.checked));
    });
  }

  // 채널
  const sel = $("apChannel");
  if (c.channelMode === "self") {
    sel.disabled = false;
    sel.value = "blog";
    $("apChannelHint").textContent = "콘텐츠를 올릴 채널을 고르고, 채널 주소를 입력해 주세요.";
  } else {
    sel.value = c.channel.type;
    sel.disabled = true;
    $("apChannelHint").textContent = `이 캠페인은 ${channelLabel(c.channel)} 채널로 진행돼요. 채널 주소를 입력해 주세요.`;
  }
  $("apChannelLink").value = "";

  // 신청 정보 기본값 = 내 프로필
  $("aName").value = profile.name || "";
  $("aPhone").value = profile.phone || "";
  $("aMallId").value = profile.mallId || "";

  // 배송 정보
  const needShip = c.shipping !== "none";
  $("apShipSec").classList.toggle("hidden", !needShip);
  if (needShip) {
    $("apShipHead").innerHTML = `배송 정보 ${c.shipping === "required" ? '<span class="req" style="color:#ef4444">*</span> 필수' : "(선택)"}`;
    $("aRecv").value = profile.name || "";
    $("aRecvPhone").value = profile.phone || "";
    $("aZip").value = profile.zipcode || "";
    $("aAddr").value = profile.address || "";
    $("aAddr2").value = profile.detail || "";
  }

  // 추가 질문
  const qs = c.questions || [];
  $("apQSec").classList.toggle("hidden", !qs.length);
  $("apQList").innerHTML = qs.map((q, i) => `
    <div class="field">
      <label class="fl">${esc(q.text)} ${q.required !== false ? '<span class="req">*</span>' : '<span class="dim">(선택)</span>'}</label>
      <textarea class="ap-ans" data-i="${i}" rows="3" placeholder="답변을 입력해 주세요"></textarea>
    </div>`).join("");

  // 유의사항
  $("apNotice").textContent = siteSettings.notice
    || "유의사항이 아직 등록되지 않았어요. 담당자 안내에 따라 진행해 주세요.";
  $("apAgree").checked = false;

  applyStep(1);
  show("viewApply");
}

function applyStep(n) {
  applyState.step = n;
  ["ap1", "ap2", "ap3"].forEach((id, i) => $(id).classList.toggle("hidden", i + 1 !== n));
  $$("#apSteps .s").forEach(s => {
    const v = Number(s.dataset.s);
    s.classList.toggle("on", v === n);
    s.classList.toggle("done", v < n);
  });
  window.scrollTo(0, 0);
}

$("btnApplyBack").onclick = () => openDetail(curCampaign.id);
$("btnAp2Prev").onclick = () => applyStep(1);
$("btnAp3Prev").onclick = () => applyStep(2);
$("btnFindAddr2").onclick = () => openPostcode(r => {
  $("aZip").value = r.zipcode;
  $("aAddr").value = r.address;
  $("aAddr2").focus();
});

$("btnAp1").onclick = () => {
  const c = curCampaign;
  if (c.progressType === "select") {
    const picked = $$('input[name=apProd]:checked', $("apProdList"))[0];
    if (!picked) return toast("체험할 상품을 선택해 주세요");
    applyState.productChoice = picked.value;
  }
  const link = $("apChannelLink").value.trim();
  if (!link) return toast("채널 주소를 입력해 주세요");
  if (!/^https?:\/\/.+\..+/.test(link)) return toast("채널 주소를 https:// 로 시작하는 주소로 입력해 주세요");
  applyState.channel = {
    type: $("apChannel").value,
    custom: c.channelMode === "self" ? "" : (c.channel.custom || ""),
    link
  };
  applyStep(2);
};

$("btnAp2").onclick = () => {
  const c = curCampaign;
  const name = $("aName").value.trim();
  const phone = $("aPhone").value.trim();
  const mallId = $("aMallId").value.trim();
  if (!name) return toast("성함을 입력해 주세요");
  if (!phoneOk(phone)) return toast("연락처를 010-0000-0000 형식으로 입력해 주세요");
  if (!mallId) return toast("몽프루이 자사몰 아이디를 입력해 주세요");

  let shipping = null;
  if (c.shipping !== "none") {
    const zip = $("aZip").value.trim(), addr = $("aAddr").value.trim();
    const recv = $("aRecv").value.trim(), rphone = $("aRecvPhone").value.trim();
    if (c.shipping === "required") {
      if (!recv) return toast("받는 분을 입력해 주세요");
      if (!phoneOk(rphone)) return toast("받는 분 연락처를 010-0000-0000 형식으로 입력해 주세요");
      if (!addr) return toast("주소 검색으로 배송 주소를 입력해 주세요");
    }
    if (addr || recv) {
      shipping = { receiver: recv, phone: rphone, zipcode: zip, address: addr, detail: $("aAddr2").value.trim() };
    }
  }

  const answers = [];
  const qs = c.questions || [];
  for (let i = 0; i < qs.length; i++) {
    const el = $$(`.ap-ans[data-i="${i}"]`)[0];
    const a = el.value.trim();
    if (qs[i].required !== false && !a) {
      toast(`"${qs[i].text}" 질문에 답변해 주세요`);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    answers.push({ q: qs[i].text, a });
  }

  applyState = { ...applyState, name, phone, mallId, shipping, answers };
  applyStep(3);
};

$("btnApSubmit").onclick = async () => {
  if (!$("apAgree").checked) return toast("유의사항 동의에 체크해 주세요");
  const c = curCampaign, btn = $("btnApSubmit");
  btn.disabled = true;
  btn.textContent = "신청 중…";
  try {
    const cref = db.collection("campaigns").doc(c.id);
    await cref.collection("applications").doc(me.uid).set({
      uid: me.uid, email: me.email, displayName: me.displayName || "",
      name: applyState.name, phone: applyState.phone, mallId: applyState.mallId,
      channel: applyState.channel,
      productChoice: applyState.productChoice || null,
      shipping: applyState.shipping || null,
      answers: applyState.answers || [],
      status: "pending",
      progress: null,
      createdAt: TS()
    });
    await cref.update({ applicantCount: INC(1) }).catch(() => {});
    await db.collection("users").doc(me.uid).set({
      name: applyState.name, phone: applyState.phone, mallId: applyState.mallId,
      appliedCampaigns: firebase.firestore.FieldValue.arrayUnion(c.id)
    }, { merge: true });
    if (!myAppIds.includes(c.id)) myAppIds.push(c.id);
    profile = { ...profile, name: applyState.name, phone: applyState.phone, mallId: applyState.mallId };
    $("doneMsg").innerHTML = `<b>${esc(c.title)}</b><br>대상자 발표는 <b>${fmtDate(c.announceDate)}</b>에 진행돼요.<br>
      결과는 <b>내 캠페인</b>에서 확인할 수 있어요.`;
    show("viewDone");
  } catch (e) {
    toast("신청 실패: " + friendlyError(e));
    btn.disabled = false;
    btn.textContent = "신청하기";
  }
};
$("btnDoneMy").onclick = () => go("my");
$("btnDoneList").onclick = () => go("list");

/* ================= 내 캠페인 ================= */
async function loadMy() {
  show("viewMy");
  const box = $("myList");
  box.innerHTML = '<div class="loading">불러오는 중…</div>';
  if (!myAppIds.length) {
    box.innerHTML = `<div class="card empty"><div class="big">📭</div>
      아직 신청한 캠페인이 없어요.<br><button class="btn mt16" onclick="go('list')">캠페인 찾아보기</button></div>`;
    return;
  }
  try {
    const rows = await Promise.all(myAppIds.map(async id => {
      const [c, a] = await Promise.all([
        db.collection("campaigns").doc(id).get(),
        db.collection("campaigns").doc(id).collection("applications").doc(me.uid).get()
      ]);
      if (!c.exists || !a.exists) return null;
      return { id, c: c.data(), a: a.data() };
    }));
    const items = rows.filter(Boolean)
      .sort((x, y) => (y.a.createdAt?.seconds || 0) - (x.a.createdAt?.seconds || 0));
    if (!items.length) {
      box.innerHTML = `<div class="card empty"><div class="big">📭</div>신청 내역이 없어요.</div>`;
      return;
    }
    box.innerHTML = items.map(({ id, c, a }) => {
      const open = isOpen(c);
      let st, cls;
      if (a.status === "selected") { st = "최종 선정 🎉"; cls = "live"; }
      else if (a.status === "candidate") { st = "1차 후보"; cls = "soon"; }
      else if (open) { st = "심사 중"; cls = "info"; }
      else { st = "미선정"; cls = "closed"; }
      return `<div class="lrow" data-open="${id}">
        <div class="th" style="background-image:url(${c.coverImage || ""})"></div>
        <div class="info">
          <div class="t">${esc(c.title)} <span class="badge ${cls}">${st}</span></div>
          <div class="m">신청 ${fmtDateTime(a.createdAt)} · 발표 ${fmtDate(c.announceDate)}</div>
          ${a.status === "selected"
            ? `<div class="m" style="color:var(--green);font-weight:700">콘텐츠 제출 기간 ${fmtDate(c.submitStart)} ~ ${fmtDate(c.submitEnd)}</div>` : ""}
        </div>
        ${open ? `<button class="btn sm danger" data-cancel="${id}">신청 취소</button>` : ""}
      </div>`;
    }).join("");
    $$("[data-open]", box).forEach(el => el.onclick = ev => {
      if (ev.target.dataset.cancel) return;
      openDetail(el.dataset.open);
    });
    $$("[data-cancel]", box).forEach(b => b.onclick = async ev => {
      ev.stopPropagation();
      const id = b.dataset.cancel;
      const it = items.find(x => x.id === id);
      const ok = await confirmDialog("신청을 취소할까요?",
        `"${it.c.title}" 신청이 취소되고, 입력한 내용은 삭제돼요.\n모집 기간 안이라면 다시 신청할 수 있어요.`, "신청 취소");
      if (!ok) return;
      try {
        const cref = db.collection("campaigns").doc(id);
        await cref.collection("applications").doc(me.uid).delete();
        await cref.update({ applicantCount: INC(-1) }).catch(() => {});
        await db.collection("users").doc(me.uid).set({
          appliedCampaigns: firebase.firestore.FieldValue.arrayRemove(id)
        }, { merge: true });
        myAppIds = myAppIds.filter(x => x !== id);
        toast("신청을 취소했어요");
        loadMy();
      } catch (e) { toast("취소 실패: " + friendlyError(e)); }
    });
  } catch (e) {
    box.innerHTML = `<div class="card empty">불러오기 실패: ${esc(friendlyError(e))}</div>`;
  }
}

/* ================= 공지 ================= */
async function loadNotice() {
  show("viewNotice");
  const box = $("noticeBody");
  box.innerHTML = '<div class="loading">불러오는 중…</div>';
  try {
    const snap = await db.collection("notices").orderBy("createdAt", "desc").get();
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    let html = "";
    if (siteSettings.notice) {
      html += `<div class="card"><h3>📌 체험단 기본 유의사항</h3>
        <div class="notice-box mt12" style="max-height:none">${esc(siteSettings.notice)}</div></div>`;
    }
    html += items.map(n => `<div class="card">
      <h3>${n.pinned ? '<span class="badge info">중요</span> ' : ""}${esc(n.title)}</h3>
      <p class="dim mt8">${fmtDateTime(n.createdAt)}</p>
      <div class="notice-box mt12" style="max-height:none">${esc(n.body)}</div>
    </div>`).join("");
    box.innerHTML = html || `<div class="card empty"><div class="big">📢</div>등록된 공지가 없어요.</div>`;
  } catch (e) {
    box.innerHTML = `<div class="card empty">불러오기 실패: ${esc(friendlyError(e))}</div>`;
  }
}

/* ================= 설정 ================= */
function openSettings() {
  show("viewSettings");
  const p = profile || {};
  $("vName").textContent = p.name || "-";
  $("vPhone").textContent = p.phone || "-";
  $("vMallId").textContent = p.mallId || "-";
  $("vAddr").textContent = p.address
    ? `(${p.zipcode || ""}) ${p.address} ${p.detail || ""}`.trim()
    : "등록 안 됨";
  $("vEmail").textContent = me.email;
}
$("btnEditProfile").onclick = () => openProfile(false);
