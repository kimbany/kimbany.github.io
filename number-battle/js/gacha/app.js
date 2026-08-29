/* 가챠 뽑기 — 화면 + 컨트롤러 (클레이 3D 무드)
 *
 * 로직은 전부 gacha/engine.js 에 있고 여기서는 그리기와 연출만 담당한다.
 * 스타일은 gacha.css 의 .gacha-mode 스코프. 진입 시 <body> 에 클래스를 붙이고 나갈 때 뗀다.
 */
import { createStore } from '../store.js';
import {
  GACHA_PHASE, GACHA_MIN, GACHA_MAX, GACHA_VERSION,
  createGacha, emptyGachaSetup, drawCapsule, closeCapsule, undoLastDraw,
  endGachaEarly, resumeGacha, canEndGacha,
  remainingCount, gachaSummary, checkGachaIntegrity,
} from './engine.js';
import { toast, confirmDialog, bindNameInput, NAME_MAX_LENGTH } from '../ui.js';
import { escapeHtml } from '../util.js';
import {
  아이콘_캡슐, 아이콘_더하기, 아이콘_빼기, 아이콘_돌리기,
  아이콘_아래, 아이콘_위, 아이콘_별, 아이콘_되돌리기, 아이콘_깃발,
} from './icons.js';

const STORE_KEY = 'numberBattle.gacha.v1';
const store = createStore({
  key: STORE_KEY,
  empty: emptyGachaSetup,
  validate: checkGachaIntegrity,
  version: GACHA_VERSION,
});

const 단계_이름 = {
  [GACHA_PHASE.SETUP]: '가챠 설정',
  [GACHA_PHASE.READY]: '뽑기',
  [GACHA_PHASE.REVEAL]: '캡슐 공개',
  [GACHA_PHASE.DONE]: '뽑기 완료',
};

/* 캡슐 색 — 유리에 비치는 톤이라 채도를 낮춰 잡는다 */
const 캡슐_색 = ['#5B8DEF', '#FF8A5B', '#3ECFA6', '#A98CFF', '#FFC24B', '#FF6E9C'];

/* 배경에 떠다니는 구슬 (크기·색·속도를 달리해 배치) */
const 배경_구슬 = [
  { size: 104, top: 5, left: -7, color: '#6E96FF', dur: 6.4, delay: 0 },
  { size: 46, top: 19, left: 82, color: '#FF9E7A', dur: 5.1, delay: 0.9 },
  { size: 138, top: 46, left: 74, color: '#A98CFF', dur: 7.2, delay: 1.6 },
  { size: 34, top: 60, left: 9, color: '#3ECFA6', dur: 4.6, delay: 0.5 },
  { size: 80, top: 78, left: -9, color: '#5B8DEF', dur: 6.8, delay: 2.2 },
  { size: 40, top: 90, left: 68, color: '#FFC24B', dur: 5.4, delay: 1.3 },
];

const ui = {
  setup: { totalNumbers: 11, useNames: false },
  drawName: '',
  resultSort: 'number', // 'number' | 'seq'
  spinning: false,
  drawerOpen: false,
  historyOpen: false,
};

let root = null;
let host = null;
let unsubscribe = null;
let 배경엘리먼트 = null;

/* ===================== 배경 (물결 + 떠다니는 구슬) ===================== */

function 배경_그리기() {
  if (배경엘리먼트) return;
  const el = document.createElement('div');
  el.className = 'g-bg';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    ${물결(1, 'rgba(120,150,255,0.30)', 'M0,60 C120,120 260,0 400,54 L400,160 L0,160 Z')}
    ${물결(2, 'rgba(255,160,130,0.24)', 'M0,86 C110,20 250,130 400,64 L400,160 L0,160 Z')}
    ${물결(3, 'rgba(150,130,255,0.26)', 'M0,110 C130,54 250,138 400,96 L400,160 L0,160 Z')}
    ${배경_구슬.map((b) => `
      <span class="g-bead" style="
        width:${b.size}px;height:${b.size}px;
        top:${b.top}%;left:${b.left}%;
        --bead:${b.color};--dur:${b.dur}s;--delay:${b.delay}s"></span>`).join('')}
  `;
  document.body.appendChild(el);
  배경엘리먼트 = el;
}

function 물결(n, color, path) {
  // fill 을 프레젠테이션 속성으로 주면 var() 가 해석되지 않는다. 반드시 style 로.
  return `<svg class="g-bg-wave w${n}" viewBox="0 0 400 160" preserveAspectRatio="none" height="${n === 3 ? 320 : 260}">
    <path d="${path}" style="fill:${color}" />
  </svg>`;
}

function 배경_지우기() {
  배경엘리먼트?.remove();
  배경엘리먼트 = null;
}

/* ===================== 기계 그리기 ===================== */

/** 통 안에 굴러다니는 캡슐. 남은 개수에 따라 최대 12개까지 보여준다. */
function 캡슐들(count) {
  const shown = Math.min(count, 12);
  return Array.from({ length: shown }, (_, i) => {
    // 곱수와 나머지는 서로소여야 골고루 퍼진다. (37 % 74 는 주기가 2라 두 자리에만 쌓였다)
    const color = 캡슐_색[i % 캡슐_색.length];
    const left = 4 + ((i * 29) % 72);
    const bottom = 2 + ((i * 17) % 26);
    const rot = ((i * 47) % 70) - 35;
    return `<span class="g-capsule" style="
      --c:${color};left:${left}%;bottom:${bottom}%;--rot:${rot}deg;
      z-index:${10 + ((i * 3) % 7)};--delay:${i * 35}ms"></span>`;
  }).join('');
}

function 기계(state) {
  const left = remainingCount(state);
  const dropColor = 캡슐_색[state.draws.length % 캡슐_색.length];
  // 돔 · 조작부 · 배출구를 하나의 유리 본체 안에 넣어 한 덩어리 기기로 읽히게 한다
  return `
    <div class="gacha-machine">
      <div class="g-shell">
        <div class="g-dome">
          <div class="g-pile">${캡슐들(left)}</div>
          ${left === 0 ? '<p class="g-dome-empty">EMPTY</p>' : ''}
        </div>

        <div class="g-body-panel">
          <button class="g-knob" type="button" data-act="draw" ${left === 0 ? 'disabled' : ''} aria-label="손잡이 돌리기">
            ${아이콘_돌리기}
          </button>
          <div class="g-counter"><b>${left}</b><span>개 남음</span></div>
          <div class="g-slot"><i></i></div>
        </div>

        <div class="g-tray">
          <div class="g-tray-mouth">
            <span class="g-drop g-capsule" style="--c:${dropColor};--delay:0ms"></span>
          </div>
        </div>
      </div>
    </div>`;
}

/* ===================== 화면 ===================== */

function 설정_화면() {
  const d = ui.setup;
  root.classList.add('has-dock');
  root.innerHTML = `
    <section class="g-card g-hero" style="--stagger:0ms">
      <div class="g-hero-mark">${아이콘_캡슐}</div>
      <h1 class="g-title">가챠 뽑기</h1>
      <p class="g-body">진행자가 정한 개수만큼 숫자를 넣고<br>한 명씩 돌려서 뽑습니다.</p>
    </section>

    <section class="g-card" style="--stagger:60ms">
      <p class="g-label">숫자 개수</p>
      <div class="g-stepper">
        <button class="g-clay g-clay-round" type="button" data-step="-1" aria-label="하나 줄이기">${아이콘_빼기}</button>
        <div class="g-stepper-val">${d.totalNumbers}</div>
        <button class="g-clay g-clay-round" type="button" data-step="1" aria-label="하나 늘리기">${아이콘_더하기}</button>
      </div>
      <p class="g-note">
        캡슐에 <b>1 ~ ${d.totalNumbers}</b> 이 하나씩 들어갑니다.<br>
        같은 숫자는 두 번 나오지 않고, 매 뽑기마다 남은 숫자가 나올 확률은 모두 같습니다.
      </p>
    </section>

    <section class="g-card" style="--stagger:120ms">
      <label class="g-switch-row">
        <span class="g-switch-text">
          <b>뽑는 사람 이름 기록</b>
          <small>누가 몇 번을 뽑았는지 목록에 남깁니다</small>
        </span>
        <input class="g-switch" type="checkbox" data-act="names" ${d.useNames ? 'checked' : ''} />
      </label>
    </section>

    <div class="g-dock">
      <button class="g-clay g-clay-lg g-clay-hot" data-act="start" type="button">가챠 채우기</button>
    </div>
  `;
  root.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    d.totalNumbers = Math.max(GACHA_MIN, Math.min(GACHA_MAX, d.totalNumbers + Number(b.dataset.step)));
    그리기();
  }));
  root.querySelector('[data-act="names"]').addEventListener('change', (e) => { d.useNames = e.target.checked; });
  root.querySelector('[data-act="start"]').addEventListener('click', () => {
    try {
      store.replace(createGacha({ totalNumbers: d.totalNumbers, useNames: d.useNames }));
    } catch (err) { toast(err.message); }
  });
}

function 뽑기_화면(state) {
  const left = remainingCount(state);
  root.classList.add('has-dock');
  root.innerHTML = `
    ${기계(state)}
    ${state.useNames ? `
      <section class="g-card" style="--stagger:60ms">
        <div class="g-field">
          <label for="g-name">뽑는 사람 (선택)</label>
          <input id="g-name" class="g-input" type="text" data-input="name"
                 placeholder="이름을 적고 손잡이를 돌리세요"
                 value="${escapeHtml(ui.drawName)}" />
        </div>
      </section>` : ''}
    <section class="g-card soft" style="--stagger:120ms">
      <p class="g-note" style="margin:0">
        남은 숫자 <b>${left}개</b> · 지금 뽑을 확률은 각각 <b>1 / ${left}</b><br>
        이미 나온 숫자는 다시 나오지 않습니다
      </p>
    </section>
    ${기록(state, 180)}
    <div class="g-dock">
      <button class="g-clay g-clay-lg g-clay-hot gacha-go" data-act="draw" type="button">뽑기하기</button>
    </div>
  `;
  기계_연결();
  기록_연결();
  const input = root.querySelector('[data-input="name"]');
  if (input) {
    bindNameInput(input, {
      onChange: (v) => { ui.drawName = v; },
      onEnter: () => { input.blur(); 뽑기(); },
    });
  }
}

function 공개_화면(state) {
  const c = state.current;
  const color = 캡슐_색[(c.seq - 1) % 캡슐_색.length];
  const left = remainingCount(state);
  const 마지막 = left === 0;
  root.classList.add('has-dock');
  const 결과카드 = `
    <section class="g-result g-card ${마지막 ? 'is-final' : ''}">
      ${마지막 ? 파티클() : ''}
      <p class="g-result-seq">${마지막 ? '마지막 캡슐' : `${c.seq}번째 뽑기`}</p>
      <div class="capsule-open" style="--c:${color}">
        <span class="co-half co-top"></span>
        <span class="co-half co-bottom"></span>
        <span class="co-number">${c.number}</span>
      </div>
      ${c.name ? `<p class="g-result-who">${escapeHtml(c.name)}</p>` : ''}
      <p class="g-body" style="margin-top:6px">
        ${마지막 ? '모든 숫자가 나왔습니다' : `남은 숫자 ${left}개`}
      </p>
    </section>`;

  root.innerHTML = `
    ${마지막
      ? `<div class="g-final-ring"><span class="g-final-ring-spin"></span>${결과카드}</div>`
      : 결과카드}
    ${기록(state, 120)}
    <div class="g-dock">
      <button class="g-clay g-clay-lg ${마지막 ? 'g-clay-mint' : ''}" data-act="next" type="button">
        ${마지막 ? '결과 보기' : '다음 사람'}
      </button>
    </div>
  `;
  root.querySelector('[data-act="next"]').addEventListener('click', () => {
    try {
      // store.update() 가 동기적으로 다시 그리므로, 그 전에 비워야
      // 다음 사람 차례에 입력란이 깨끗하게 나온다
      ui.drawName = '';
      store.update((s) => { closeCapsule(s); });
    } catch (err) { toast(err.message); }
  });
  기록_연결();
}

/** 마지막 캡슐용 파티클 */
function 파티클() {
  const 색 = ['#FFC24B', '#FF6E9C', '#3ECFA6', '#5B8DEF', '#A98CFF'];
  return `<span class="g-sparks">${Array.from({ length: 18 }, (_, i) => {
    const 각도 = (i / 18) * Math.PI * 2;
    const 거리 = 90 + ((i * 37) % 70);
    return `<span class="g-spark" style="
      --dx:${Math.round(Math.cos(각도) * 거리)}px;
      --dy:${Math.round(Math.sin(각도) * 거리)}px;
      --sc:${색[i % 색.length]};--delay:${i * 22}ms"></span>`;
  }).join('')}</span>`;
}

/** 결과 화면 — 누가 몇 번을 뽑았는지 한 화면에 모아 보여준다 */
function 완료_화면(state) {
  const 중간종료 = Boolean(state.endedEarly);
  const 남음 = remainingCount(state);
  const rows = state.draws.slice().sort((a, b) => (
    ui.resultSort === 'seq' ? a.seq - b.seq : a.number - b.number
  ));
  root.classList.add('has-dock');
  root.innerHTML = `
    <section class="g-card g-hero" style="--stagger:0ms">
      <div class="g-hero-mark">${중간종료 ? 아이콘_깃발 : 아이콘_별}</div>
      <h1 class="g-title">${중간종료 ? '가챠 종료' : '뽑기 완료!'}</h1>
      <p class="g-body">${중간종료
        ? '진행자가 여기까지로 마무리했습니다.'
        : `${state.totalNumbers}개 숫자가 모두 나왔습니다.`}</p>
      <div class="g-stats">
        <span class="g-stat"><b>${state.draws.length}</b><small>뽑음</small></span>
        <span class="g-stat"><b>${남음}</b><small>남은 숫자</small></span>
        <span class="g-stat"><b>${state.totalNumbers}</b><small>전체</small></span>
      </div>
    </section>

    ${state.draws.length ? `
      <div class="g-segment" role="tablist">
        <button class="g-seg ${ui.resultSort === 'number' ? 'on' : ''}" data-sort="number" type="button">번호순</button>
        <button class="g-seg ${ui.resultSort === 'seq' ? 'on' : ''}" data-sort="seq" type="button">뽑은 순서</button>
      </div>
      <div class="g-result-list">
        ${rows.map((d, i) => `
          <div class="g-result-row" style="--stagger:${i * 45}ms">
            <span class="g-num-badge">${d.number}</span>
            <span class="g-row-body">
              <span class="g-row-name">${d.name ? escapeHtml(d.name) : `${d.seq}번째 뽑기`}</span>
              ${d.name ? `<span class="g-row-meta">${d.seq}번째 뽑기</span>` : ''}
            </span>
          </div>`).join('')}
      </div>`
    : `<section class="g-card g-center"><p class="g-body">아직 아무도 뽑지 않았습니다.</p></section>`}

    ${중간종료 && 남음 ? `
      <section class="g-card soft" style="--stagger:60ms">
        <p class="g-label">주인 없이 남은 숫자 ${남음}개</p>
        <div class="g-chips">
          ${state.remaining.map((n) => `<span class="g-chip g-chip-ghost">${n}</span>`).join('')}
        </div>
      </section>` : ''}

    <div class="g-dock">
      <button class="g-clay g-clay-lg g-clay-violet" data-act="again" type="button">새로 채우기</button>
    </div>
  `;
  root.querySelector('[data-act="again"]').addEventListener('click', 초기화);
  root.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => {
    ui.resultSort = b.dataset.sort;
    그리기();
  }));
}

function 기록(state, stagger = 0) {
  if (!state.draws.length) return '';
  const 최근 = state.draws.slice().reverse();
  const 보일것 = ui.historyOpen ? 최근 : 최근.slice(0, 8);
  return `
    <section class="g-card" style="--stagger:${stagger}ms">
      <button class="g-history-toggle" type="button" data-act="history"
              aria-expanded="${ui.historyOpen}">
        <span>지금까지 나온 숫자 ${state.draws.length}개</span>
        ${ui.historyOpen ? 아이콘_위 : 아이콘_아래}
      </button>
      <div class="g-chips">
        ${보일것.map((d) => `
          <span class="g-chip">${d.number}${d.name ? `<small>${escapeHtml(d.name)}</small>` : ''}</span>`).join('')}
        ${!ui.historyOpen && 최근.length > 8 ? `<span class="g-chip"><small>외 ${최근.length - 8}개</small></span>` : ''}
      </div>
    </section>`;
}

function 기록_연결() {
  const btn = root.querySelector('[data-act="history"]');
  if (btn) btn.addEventListener('click', () => { ui.historyOpen = !ui.historyOpen; 그리기(); });
}

function 기계_연결() {
  root.querySelectorAll('[data-act="draw"]').forEach((b) => b.addEventListener('click', 뽑기));
}

/* ===================== 뽑기 연출 ===================== */

async function 뽑기() {
  if (ui.spinning) return;
  const state = store.get();
  if (state.phase !== GACHA_PHASE.READY) return;

  ui.spinning = true;
  const machine = root.querySelector('.gacha-machine');
  const knob = root.querySelector('.g-knob');
  const go = root.querySelector('.gacha-go');
  if (go) go.disabled = true;
  if (knob) { knob.disabled = true; knob.classList.add('is-turning'); }
  if (machine) machine.classList.add('is-dispensing');

  // 흔들림 → 튀어오름 → 트레이로 낙하
  await new Promise((r) => setTimeout(r, 1150));

  // 조합 중이던 글자는 버튼을 누르며 확정되므로, 저장 직전에 화면 값을 그대로 읽는다
  const 입력 = root.querySelector('[data-input="name"]');
  if (입력) ui.drawName = 입력.value.slice(0, NAME_MAX_LENGTH);

  try {
    store.update((s) => { drawCapsule(s, { name: ui.drawName }); });
  } catch (err) {
    toast(err.message);
    그리기();
  } finally {
    ui.spinning = false;
  }
}

function 초기화() {
  ui.drawName = '';
  ui.historyOpen = false;
  ui.resultSort = 'number';
  store.reset();
}

/* ===================== 진행자 메뉴 ===================== */

function 드로어_닫기() {
  ui.drawerOpen = false;
  document.querySelector('.drawer')?.remove();
}

function 드로어_열기() {
  ui.drawerOpen = true;
  드로어_그리기();
}

function 드로어_그리기() {
  const state = store.get();
  document.querySelector('.drawer')?.remove();
  if (!ui.drawerOpen) return;
  const 설정중 = state.phase === GACHA_PHASE.SETUP;
  const s = 설정중 ? null : gachaSummary(state);

  const wrap = document.createElement('div');
  wrap.className = 'drawer';
  wrap.innerHTML = `
    <div class="drawer-panel">
      <div style="display:flex;align-items:center;gap:10px">
        <h3>진행자 메뉴</h3>
        <div style="flex:1"></div>
        <button class="btn btn-ghost btn-sm" data-act="close" type="button">닫기</button>
      </div>

      <div class="group">
        <div class="group-title">가챠 상태</div>
        <div class="kv"><span>현재 단계</span><b>${단계_이름[state.phase] || state.phase}</b></div>
        ${설정중 ? '' : `
          <div class="kv"><span>전체 숫자</span><b>${s.total}개</b></div>
          <div class="kv"><span>나온 숫자</span><b>${s.drawn}개</b></div>
          <div class="kv"><span>남은 숫자</span><b>${s.remaining}개</b></div>
          <div class="kv"><span>다음 확률</span><b>${s.nextChance}</b></div>
          <div class="kv"><span>이름 기록</span><b>${state.useNames ? '켜짐' : '꺼짐'}</b></div>
          ${state.endedEarly ? '<div class="kv"><span>종료 방식</span><b>진행자 중간 종료</b></div>' : ''}`}
      </div>

      ${설정중 ? '' : `
        <div class="group">
          <div class="group-title">진행 도구</div>
          <button class="btn btn-sm btn-cyan" data-act="undo" type="button" ${state.draws.length ? '' : 'disabled'}>
            마지막 뽑기 취소
          </button>
          <p class="small muted" style="margin:0">잘못 눌렀을 때 방금 나온 숫자를 통에 되돌립니다.</p>
          ${canEndGacha(state) ? `
            <button class="btn btn-sm btn-danger" data-act="end" type="button" style="margin-top:6px">게임 종료</button>
            <p class="small muted" style="margin:0">숫자가 남아 있어도 여기까지로 마무리하고 결과를 보여줍니다.</p>` : ''}
          ${state.endedEarly && s.remaining ? `
            <button class="btn btn-sm" data-act="resume" type="button" style="margin-top:6px">이어서 뽑기</button>
            <p class="small muted" style="margin:0">종료를 되돌려 남은 ${s.remaining}개를 계속 뽑습니다.</p>` : ''}
        </div>

        <div class="group">
          <div class="group-title">남은 숫자 (${s.remaining}개)</div>
          <p class="small muted" style="margin:0">진행자만 확인하세요. 참가자에게 보이면 재미가 없습니다.</p>
          <ul class="roster">${state.remaining.map((n) => `<li>${n}</li>`).join('') || '<li class="muted">없음</li>'}</ul>
        </div>

        <div class="group">
          <div class="group-title">위험 구역</div>
          <button class="btn btn-danger" data-act="reset" type="button">가챠 초기화</button>
          <p class="small muted" style="margin:0">뽑기 기록이 모두 삭제되고 설정 화면으로 돌아갑니다.</p>
        </div>`}
    </div>`;

  wrap.addEventListener('click', async (e) => {
    if (e.target === wrap) return 드로어_닫기();
    const action = e.target.closest('[data-act]')?.dataset.act;
    if (!action) return;
    if (action === 'close') 드로어_닫기();
    else if (action === 'undo') {
      try {
        store.update((st) => { undoLastDraw(st); });
        드로어_닫기();
        toast('마지막 뽑기를 취소했습니다.', 1600);
      } catch (err) { toast(err.message); }
    } else if (action === 'end') {
      const left = remainingCount(store.get());
      const ok = await confirmDialog({
        title: '가챠를 종료할까요?',
        message: `아직 ${left}개가 남아 있습니다.\n여기까지의 결과를 한 화면에 보여주고 뽑기를 끝냅니다.`,
        confirmLabel: '종료',
        danger: true,
      });
      if (!ok) return;
      try {
        ui.resultSort = 'number';
        store.update((st) => { endGachaEarly(st); });
        드로어_닫기();
      } catch (err) { toast(err.message); }
    } else if (action === 'resume') {
      try {
        ui.drawName = '';
        store.update((st) => { resumeGacha(st); });
        드로어_닫기();
        toast('이어서 뽑습니다.', 1600);
      } catch (err) { toast(err.message); }
    } else if (action === 'reset') {
      const ok = await confirmDialog({
        title: '가챠를 초기화할까요?',
        message: '뽑기 기록이 모두 삭제되고\n숫자 개수 설정 화면으로 돌아갑니다.',
        confirmLabel: '초기화',
        danger: true,
      });
      if (!ok) return;
      드로어_닫기();
      초기화();
    }
  });

  document.getElementById('overlay-root').appendChild(wrap);
}

/* ===================== 라우팅 ===================== */

function 그리기() {
  const state = store.get();
  const 칩 = state.phase === GACHA_PHASE.DONE && state.endedEarly
    ? '가챠 종료'
    : (단계_이름[state.phase] || state.phase);
  host.setChip(칩, state.phase !== GACHA_PHASE.SETUP);
  root.classList.remove('has-dock');
  try {
    if (state.phase === GACHA_PHASE.SETUP) 설정_화면();
    else if (state.phase === GACHA_PHASE.REVEAL) 공개_화면(state);
    else if (state.phase === GACHA_PHASE.DONE) 완료_화면(state);
    else 뽑기_화면(state);
  } catch (err) {
    console.error(err);
    root.innerHTML = `<section class="g-card g-center">
      <h2 class="g-title" style="font-size:24px">화면을 그리지 못했습니다</h2>
      <p class="g-body">${escapeHtml(err.message)}</p>
      <p class="g-body">진행자 메뉴에서 [가챠 초기화]를 눌러 주세요.</p></section>`;
  }
  if (ui.drawerOpen) 드로어_그리기();
}

function 키입력(e) { if (e.key === 'Escape') 드로어_닫기(); }

export function hasGachaInProgress() {
  const s = store.get();
  return s.phase === GACHA_PHASE.READY || s.phase === GACHA_PHASE.REVEAL;
}

export function gachaStatusLine() {
  const s = store.get();
  if (s.phase === GACHA_PHASE.SETUP) return null;
  if (s.phase === GACHA_PHASE.DONE) {
    return s.endedEarly
      ? `중간 종료 · ${s.draws.length} / ${s.totalNumbers}개 뽑음`
      : `지난 뽑기 결과 (숫자 ${s.totalNumbers}개)`;
  }
  return `진행 중 · ${s.draws.length} / ${s.totalNumbers}개 뽑음`;
}

export function mount(shell) {
  host = shell;
  root = shell.root;
  ui.spinning = false;
  document.body.classList.add('gacha-mode');
  배경_그리기();
  unsubscribe = store.subscribe(그리기);
  shell.setHostMenu(드로어_열기);
  document.addEventListener('keydown', 키입력);
  그리기();
}

export function unmount() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  document.removeEventListener('keydown', 키입력);
  드로어_닫기();
  배경_지우기();
  document.body.classList.remove('gacha-mode');
  ui.spinning = false;
  // 결과까지 확인한 뒤 화면을 벗어나면 다음 판을 위해 자동 초기화한다.
  // (구독을 끊은 뒤라 store.reset() 이 사라진 화면을 다시 그리지 않는다)
  if (store.get().phase === GACHA_PHASE.DONE) 초기화();
  if (root) { root.classList.remove('has-dock'); root.innerHTML = ''; }
  root = null;
  host = null;
}
