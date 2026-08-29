/* 가챠 뽑기 — 화면 + 컨트롤러
 *
 * 로직은 전부 gacha/engine.js 에 있고 여기서는 그리기와 연출만 담당한다.
 */
import { createStore } from '../store.js';
import {
  GACHA_PHASE, GACHA_MIN, GACHA_MAX, GACHA_VERSION,
  createGacha, emptyGachaSetup, drawCapsule, closeCapsule, undoLastDraw,
  remainingCount, gachaSummary, checkGachaIntegrity,
} from './engine.js';
import { toast, confirmDialog, confetti } from '../ui.js';
import { escapeHtml } from '../util.js';

const STORE_KEY = 'numberBattle.gacha.v1';
const store = createStore({
  key: STORE_KEY,
  empty: emptyGachaSetup,
  validate: checkGachaIntegrity,
  version: GACHA_VERSION,
});

const PHASE_LABEL = {
  [GACHA_PHASE.SETUP]: '가챠 설정',
  [GACHA_PHASE.READY]: '뽑기',
  [GACHA_PHASE.REVEAL]: '캡슐 공개',
  [GACHA_PHASE.DONE]: '뽑기 완료',
};

/* 캡슐 색 — 참고 이미지의 파랑/노랑/빨강 톤 */
const CAPSULE_COLORS = ['#3f7fd8', '#f2c744', '#e8483f', '#4bb3e6', '#f28b3f', '#7ac74f'];

const ui = {
  setup: { totalNumbers: 11, useNames: false },
  drawName: '',
  spinning: false,
  drawerOpen: false,
  historyOpen: false,
};

let root = null;
let host = null;
let unsubscribe = null;

/* ===================== 기계 그리기 ===================== */

/** 통 안에 굴러다니는 캡슐들. 남은 개수에 따라 최대 12개까지 보여준다. */
function capsulesMarkup(count) {
  const shown = Math.min(count, 12);
  // 위치는 매번 흔들리지 않도록 인덱스 기반으로 고정
  return Array.from({ length: shown }, (_, i) => {
    const color = CAPSULE_COLORS[i % CAPSULE_COLORS.length];
    // 곱수와 나머지는 서로소여야 골고루 퍼진다. (37 % 74 는 주기가 2라 두 자리에만 쌓였다)
    const left = 3 + ((i * 29) % 74);
    const bottom = 2 + ((i * 17) % 30);
    const rot = ((i * 47) % 70) - 35;
    const z = 10 + ((i * 3) % 7);
    return `<span class="capsule" style="--c:${color};left:${left}%;bottom:${bottom}%;--rot:${rot}deg;z-index:${z};animation-delay:${i * 35}ms"></span>`;
  }).join('');
}

function machineMarkup(state, { dispensing = false } = {}) {
  const left = remainingCount(state);
  return `
    <div class="gacha-machine ${dispensing ? 'is-dispensing' : ''}">
      <div class="gm-top">
        <p class="gm-eyebrow">숫자 가챠</p>
        <div class="gm-title">GACHA<span>SHOP</span></div>
      </div>

      <div class="gm-glass">
        <div class="gm-shine"></div>
        <div class="gm-pile">${capsulesMarkup(left)}</div>
        ${left === 0 ? '<p class="gm-empty">텅 비었습니다</p>' : ''}
      </div>

      <div class="gm-panel">
        <button class="gm-knob" type="button" data-act="draw" ${left === 0 ? 'disabled' : ''} aria-label="뽑기">
          <span class="gm-knob-slot"></span>
        </button>
        <div class="gm-plate">
          <span class="gm-plate-label">${left}<small>개 남음</small></span>
        </div>
        <div class="gm-coin"><span></span></div>
      </div>

      <div class="gm-outlet">
        <div class="gm-outlet-mouth">
          <span class="gm-drop capsule" style="--c:${CAPSULE_COLORS[state.draws.length % CAPSULE_COLORS.length]}"></span>
        </div>
        <div class="gm-outlet-lip"></div>
      </div>
    </div>`;
}

/* ===================== 화면 ===================== */

function renderSetup() {
  const d = ui.setup;
  root.innerHTML = `
    <div class="card center">
      <p class="eyebrow">Number Gacha</p>
      <h1 class="title">가챠 뽑기</h1>
      <p class="subtitle">진행자가 정한 개수만큼 숫자를 넣고<br>한 명씩 돌려서 뽑습니다.</p>
    </div>

    <div class="card">
      <p class="eyebrow">숫자 개수</p>
      <div class="stepper">
        <button type="button" data-step="-1">−</button>
        <div class="val">${d.totalNumbers}</div>
        <button type="button" data-step="1">+</button>
      </div>
      <p class="subtitle center small" style="margin-top:10px">
        캡슐에 <b style="color:var(--yellow)">1 ~ ${d.totalNumbers}</b> 이 하나씩 들어갑니다.<br>
        같은 숫자는 두 번 나오지 않고, 매 뽑기마다 남은 숫자가 나올 확률은 모두 같습니다.
      </p>
    </div>

    <div class="card">
      <label class="switch-row">
        <span>
          뽑는 사람 이름 기록
          <small class="muted">누가 몇 번을 뽑았는지 목록에 남깁니다</small>
        </span>
        <input type="checkbox" data-act="names" ${d.useNames ? 'checked' : ''} />
      </label>
    </div>

    <button class="btn btn-hero" data-act="start" type="button">가챠 채우기</button>
  `;
  root.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    d.totalNumbers = Math.max(GACHA_MIN, Math.min(GACHA_MAX, d.totalNumbers + Number(b.dataset.step)));
    render();
  }));
  root.querySelector('[data-act="names"]').addEventListener('change', (e) => { d.useNames = e.target.checked; });
  root.querySelector('[data-act="start"]').addEventListener('click', () => {
    try {
      store.replace(createGacha({ totalNumbers: d.totalNumbers, useNames: d.useNames }));
    } catch (err) { toast(err.message); }
  });
}

function renderReady(state) {
  const left = remainingCount(state);
  root.innerHTML = `
    ${machineMarkup(state)}
    ${state.useNames ? `
      <div class="card tight">
        <div class="field">
          <label>뽑는 사람 (선택)</label>
          <input type="text" maxlength="12" data-input="name" placeholder="이름을 적고 손잡이를 돌리세요"
                 value="${escapeHtml(ui.drawName)}" autocomplete="off" />
        </div>
      </div>` : ''}
    <button class="btn btn-hero gacha-go" data-act="draw" type="button">🎰 뽑기</button>
    <p class="center small muted">
      남은 숫자 ${left}개 · 지금 뽑을 확률은 각각 <b style="color:var(--cyan)">1 / ${left}</b><br>
      이미 나온 숫자는 다시 나오지 않습니다
    </p>
    ${historyMarkup(state)}
  `;
  bindMachine(state);
  bindHistory();
  const input = root.querySelector('[data-input="name"]');
  if (input) {
    input.addEventListener('input', () => { ui.drawName = input.value; });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doDraw(); });
  }
}

function renderReveal(state) {
  const c = state.current;
  const color = CAPSULE_COLORS[(c.seq - 1) % CAPSULE_COLORS.length];
  const left = remainingCount(state);
  root.innerHTML = `
    <div class="card center reveal-card">
      <p class="eyebrow">${c.seq}번째 뽑기</p>
      <div class="capsule-open" style="--c:${color}">
        <span class="co-half co-top"></span>
        <span class="co-half co-bottom"></span>
        <span class="co-number">${c.number}</span>
      </div>
      <h2 class="title gacha-hit">${c.name ? `${escapeHtml(c.name)} → ${c.number}번` : `${c.number}번!`}</h2>
      <p class="subtitle">${left ? `남은 숫자 ${left}개` : '마지막 숫자였습니다!'}</p>
    </div>
    <button class="btn btn-hero ${left ? '' : 'btn-lime'}" data-act="next" type="button">
      ${left ? '다음 사람' : '결과 보기'}
    </button>
    ${historyMarkup(state)}
  `;
  root.querySelector('[data-act="next"]').addEventListener('click', () => {
    try {
      store.update((s) => { closeCapsule(s); });
      ui.drawName = '';
    } catch (err) { toast(err.message); }
  });
  bindHistory();
}

function renderDone(state) {
  root.innerHTML = `
    <div class="card center">
      <p class="eyebrow">All Drawn</p>
      <h1 class="title">뽑기 완료!</h1>
      <p class="subtitle">${state.totalNumbers}개 숫자가 모두 나왔습니다.</p>
    </div>
    ${resultTableMarkup(state)}
    <button class="btn btn-hero" data-act="again" type="button">새로 채우기</button>
  `;
  root.querySelector('[data-act="again"]').addEventListener('click', resetGacha);
}

function resultTableMarkup(state) {
  const rows = state.draws.slice().sort((a, b) => a.number - b.number);
  return `
    <div class="result-grid">
      ${rows.map((d, i) => `
        <div class="res-row" style="animation-delay:${i * 45}ms">
          <div class="res-num">${d.number}</div>
          <div class="res-body">
            <div class="res-name">${d.name ? escapeHtml(d.name) : `${d.seq}번째로 나옴`}</div>
            ${d.name ? `<div class="res-meta">${d.seq}번째 뽑기</div>` : ''}
          </div>
        </div>`).join('')}
    </div>`;
}

function historyMarkup(state) {
  if (!state.draws.length) return '';
  const recent = state.draws.slice().reverse();
  return `
    <div class="card tight">
      <button class="history-toggle" type="button" data-act="history">
        <span>지금까지 나온 숫자 ${state.draws.length}개</span>
        <span class="history-caret">${ui.historyOpen ? '▲' : '▼'}</span>
      </button>
      <div class="history-chips">
        ${recent.slice(0, ui.historyOpen ? recent.length : 8).map((d) => `
          <span class="name-tag win">${d.number}${d.name ? ` <small>${escapeHtml(d.name)}</small>` : ''}</span>`).join('')}
        ${!ui.historyOpen && recent.length > 8 ? `<span class="name-tag">＋${recent.length - 8}</span>` : ''}
      </div>
    </div>`;
}

function bindHistory() {
  const btn = root.querySelector('[data-act="history"]');
  if (btn) btn.addEventListener('click', () => { ui.historyOpen = !ui.historyOpen; render(); });
}

function bindMachine() {
  root.querySelectorAll('[data-act="draw"]').forEach((b) => b.addEventListener('click', doDraw));
}

/* ===================== 뽑기 연출 ===================== */

async function doDraw() {
  if (ui.spinning) return;
  const state = store.get();
  if (state.phase !== GACHA_PHASE.READY) return;

  ui.spinning = true;
  const machine = root.querySelector('.gacha-machine');
  const knob = root.querySelector('.gm-knob');
  const goBtn = root.querySelector('.gacha-go');
  if (goBtn) goBtn.disabled = true;
  if (knob) knob.classList.add('is-turning');
  if (machine) machine.classList.add('is-dispensing');

  await new Promise((r) => setTimeout(r, 1150)); // 손잡이 회전 + 캡슐 낙하

  try {
    store.update((s) => { drawCapsule(s, { name: ui.drawName }); });
    confetti({ duration: 1400 });
  } catch (err) {
    toast(err.message);
    render();
  } finally {
    ui.spinning = false;
  }
}

function resetGacha() {
  ui.drawName = '';
  ui.historyOpen = false;
  store.reset();
}

/* ===================== 진행자 메뉴 ===================== */

function closeDrawer() {
  ui.drawerOpen = false;
  document.querySelector('.drawer')?.remove();
}

function openDrawer() {
  ui.drawerOpen = true;
  renderDrawer();
}

function renderDrawer() {
  const state = store.get();
  document.querySelector('.drawer')?.remove();
  if (!ui.drawerOpen) return;
  const inSetup = state.phase === GACHA_PHASE.SETUP;
  const s = inSetup ? null : gachaSummary(state);

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
        <div class="kv"><span>현재 단계</span><b>${PHASE_LABEL[state.phase] || state.phase}</b></div>
        ${inSetup ? '' : `
          <div class="kv"><span>전체 숫자</span><b>${s.total}개</b></div>
          <div class="kv"><span>나온 숫자</span><b>${s.drawn}개</b></div>
          <div class="kv"><span>남은 숫자</span><b>${s.remaining}개</b></div>
          <div class="kv"><span>다음 확률</span><b>${s.nextChance}</b></div>
          <div class="kv"><span>이름 기록</span><b>${state.useNames ? '켜짐' : '꺼짐'}</b></div>`}
      </div>

      ${inSetup ? '' : `
        <div class="group">
          <div class="group-title">진행 도구</div>
          <button class="btn btn-sm btn-cyan" data-act="undo" type="button" ${state.draws.length ? '' : 'disabled'}>
            마지막 뽑기 취소
          </button>
          <p class="small muted" style="margin:0">잘못 눌렀을 때 방금 나온 숫자를 통에 되돌립니다.</p>
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
    if (e.target === wrap) return closeDrawer();
    const action = e.target.closest('[data-act]')?.dataset.act;
    if (!action) return;
    if (action === 'close') closeDrawer();
    else if (action === 'undo') {
      try {
        store.update((st) => { undoLastDraw(st); });
        closeDrawer();
        toast('마지막 뽑기를 취소했습니다.', 1600);
      } catch (err) { toast(err.message); }
    } else if (action === 'reset') {
      const ok = await confirmDialog({
        title: '가챠를 초기화할까요?',
        message: '뽑기 기록이 모두 삭제되고\n숫자 개수 설정 화면으로 돌아갑니다.',
        confirmLabel: '초기화',
        danger: true,
      });
      if (!ok) return;
      closeDrawer();
      resetGacha();
    }
  });

  document.getElementById('overlay-root').appendChild(wrap);
}

/* ===================== 라우팅 ===================== */

function render() {
  const state = store.get();
  host.setChip(PHASE_LABEL[state.phase] || state.phase, state.phase !== GACHA_PHASE.SETUP);
  try {
    if (state.phase === GACHA_PHASE.SETUP) renderSetup();
    else if (state.phase === GACHA_PHASE.REVEAL) renderReveal(state);
    else if (state.phase === GACHA_PHASE.DONE) renderDone(state);
    else renderReady(state);
  } catch (err) {
    console.error(err);
    root.innerHTML = `<div class="card center">
      <h2 class="title" style="font-size:22px">화면을 그리지 못했습니다</h2>
      <p class="subtitle small">${escapeHtml(err.message)}</p>
      <p class="small muted">진행자 메뉴에서 [가챠 초기화]를 눌러 주세요.</p></div>`;
  }
  if (ui.drawerOpen) renderDrawer();
}

function onKeydown(e) { if (e.key === 'Escape') closeDrawer(); }

export function hasGachaInProgress() {
  const s = store.get();
  return s.phase === GACHA_PHASE.READY || s.phase === GACHA_PHASE.REVEAL;
}

export function gachaStatusLine() {
  const s = store.get();
  if (s.phase === GACHA_PHASE.SETUP) return null;
  if (s.phase === GACHA_PHASE.DONE) return `지난 뽑기 결과 (숫자 ${s.totalNumbers}개)`;
  return `진행 중 · ${s.draws.length} / ${s.totalNumbers}개 뽑음`;
}

export function mount(shell) {
  host = shell;
  root = shell.root;
  ui.spinning = false;
  unsubscribe = store.subscribe(render);
  shell.setHostMenu(openDrawer);
  document.addEventListener('keydown', onKeydown);
  render();
}

export function unmount() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  document.removeEventListener('keydown', onKeydown);
  closeDrawer();
  ui.spinning = false;
  if (root) root.innerHTML = '';
  root = null;
  host = null;
}
