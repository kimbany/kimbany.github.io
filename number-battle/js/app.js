/* 번호 쟁탈전 — 앱 컨트롤러 (화면 라우팅, 액션, 진행자 메뉴)
 *
 * main.js 의 라우터가 mount()/unmount() 로 이 화면을 켜고 끈다.
 * 동시에 두 개가 뜨는 일이 없으므로 상태는 모듈 수준 싱글턴으로 둔다. */
import { createStore } from './store.js';
import * as engine from './engine.js';
import { PHASE, MIN_NUMBERS, MAX_NUMBERS } from './engine.js';
import { DEFAULT_BATTLE_GAME, DEFAULT_FINAL_GAME, getGame } from './games/registry.js';
import { toast, confirmDialog, promptPin, countdown, confetti } from './ui.js';
import { escapeHtml } from './util.js';
import {
  PHASE_LABEL, renderSetup, renderSecretSelection, renderReveal,
  renderBattle, renderKeepPass, renderFinalBattle, renderFinalSelection, renderResult,
} from './screens.js';

const store = createStore();

/* 화면에서만 쓰는 휘발성 상태.
 * 비밀 선택 중인 이름/번호는 여기에만 두어 새로고침 시 흔적이 남지 않게 한다. */
const ui = {
  setup: {
    totalNumbers: 11,
    battleGameId: DEFAULT_BATTLE_GAME,
    finalGameId: DEFAULT_FINAL_GAME,
    hostPin: '',
  },
  selection: { step: 'NAME', name: '', number: null },
  resultTab: 'number',
  timer: null,
  cleanup: null,
  drawerOpen: false,
  hostUnlocked: false,
  busy: false,
};

let root = null;   // mount 시 셸이 넘겨준다
let host = null;   // 셸 API (setChip / setHostMenu)

/* ui.selection 은 화면 이벤트 핸들러가 붙잡고 있는 객체이므로
 * 통째로 교체하지 말고 항상 제자리에서 초기화한다. */
function resetSelection(step = 'NAME') {
  ui.selection.step = step;
  ui.selection.name = '';
  ui.selection.number = null;
}

/* ===================== 액션 ===================== */
const act = {
  save() { store.update(() => {}, { silent: true }); },

  startGame(draft) {
    try {
      resetSelection('NAME');
      ui.hostUnlocked = !draft.hostPin;
      store.replace(engine.createGame({
        totalNumbers: draft.totalNumbers,
        battleGameId: draft.battleGameId,
        finalGameId: draft.finalGameId,
        hostPin: draft.hostPin || null,
      }));
    } catch (err) { toast(err.message); }
  },

  toPickStep() {
    const state = store.get();
    const name = (ui.selection.name || '').trim();
    if (!name) return toast('이름을 입력해 주세요.');
    if (name.length > 12) return toast('이름은 12자 이하로 입력해 주세요.');
    if (state.participants.some((p) => p.name === name)) {
      return toast('이미 같은 이름의 참가자가 있습니다.');
    }
    ui.selection.name = name;
    ui.selection.number = null;
    ui.selection.step = 'PICK';
    render();
  },

  async confirmSelection() {
    const { name, number } = ui.selection;
    if (!number) return;
    const ok = await confirmDialog({
      title: `${number}번으로 확정할까요?`,
      message: '확정하면 바꿀 수 없습니다.\n선택 내용은 아무에게도 공개되지 않습니다.',
      confirmLabel: `${number}번 확정`,
    });
    if (!ok) return;
    try {
      store.update((s) => { engine.addParticipant(s, name, number); }, { silent: true });
      // 이전 참가자의 흔적을 즉시 지운다
      resetSelection('SAVED');
      render();
    } catch (err) { toast(err.message); }
  },

  async closeSelection() {
    const state = store.get();
    if (state.participants.length < 2) return toast('참가자가 2명 이상이어야 합니다.');
    const ok = await confirmDialog({
      title: '정말 선택을 종료하시겠습니까?',
      message: `현재 ${state.participants.length}명 참가.\n종료 후에는 새로운 참가자를 추가할 수 없습니다.`,
      confirmLabel: '선택 종료',
      danger: true,
    });
    if (!ok) return;
    closeDrawer();
    try {
      store.update((s) => { engine.closeSelection(s); });
      await countdown({ from: 3, go: 'REVEAL!', fast: store.get().fastMode });
      render();
    } catch (err) { toast(err.message); }
  },

  revealNext() { store.update((s) => { engine.revealNext(s); }); },
  revealAll() { store.update((s) => { engine.revealAll(s); }); },

  startBattles() {
    try {
      store.update((s) => { engine.startBattlePhase(s); });
    } catch (err) { toast(err.message); }
  },

  startRound(kind) {
    store.update((s) => { (kind === 'FINAL' ? s.final : s.battle).stage = 'PLAY'; });
  },

  async finishRound(kind) {
    const state = store.get();
    try {
      if (kind === 'FINAL') engine.commitFinalRound(state);
      else engine.commitBattleRound(state);
    } catch (err) { return toast(err.message); }
    store.update((s) => { (kind === 'FINAL' ? s.final : s.battle).stage = 'RESULT'; }, { silent: true });
    await countdown({ from: 3, fast: state.fastMode });
    render();
  },

  applyRanking(kind) {
    try {
      store.update((s) => {
        if (kind === 'FINAL') engine.applyFinalRanking(s);
        else engine.applyBattleRanking(s);
      });
    } catch (err) { toast(err.message); }
  },

  keep() {
    try { store.update((s) => { engine.doKeep(s); }); } catch (err) { toast(err.message); }
  },

  pass() {
    try { store.update((s) => { engine.doPass(s); }); } catch (err) { toast(err.message); }
  },

  passPick(n) {
    try { store.update((s) => { engine.passPickNumber(s, n); }); } catch (err) { toast(err.message); }
  },

  nextGroup() {
    try {
      store.update((s) => { engine.nextGroup(s); });
      if (store.get().phase === PHASE.RESULT) celebrate();
    } catch (err) { toast(err.message); }
  },

  finalPick(n) {
    try {
      store.update((s) => { engine.finalPickNumber(s, n); });
      if (store.get().phase === PHASE.RESULT) celebrate();
    } catch (err) { toast(err.message); }
  },

  /* 진행자용 "다음 단계 진행".
   * 참가자의 입력(번호 선택, STOP, 카드 뽑기, KEEP/PASS)은 절대 대신 눌러주지 않고,
   * "누르기만 하면 되는" 연출 단계만 넘긴다. */
  advancePhase() {
    const state = store.get();
    switch (state.phase) {
      case PHASE.REVEAL:
        if (!engine.isRevealDone(state)) { act.revealAll(); return toast('공개를 모두 건너뛰었습니다.', 1400); }
        act.startBattles();
        return toast('쟁탈전으로 진행합니다.', 1400);
      case PHASE.BATTLE:
      case PHASE.FINAL_BATTLE: {
        const kind = state.phase === PHASE.FINAL_BATTLE ? 'FINAL' : 'BATTLE';
        const slot = kind === 'FINAL' ? state.final : state.battle;
        if (slot.stage === 'INTRO') { act.startRound(kind); return toast('미니게임을 시작합니다.', 1400); }
        if (slot.stage === 'RESULT') {
          const resolved = kind === 'FINAL' ? engine.isFinalResolved(state) : engine.isBattleResolved(state);
          if (resolved) { act.applyRanking(kind); return toast('순위를 확정했습니다.', 1400); }
          act.startRound(kind);
          return toast('재대결을 시작합니다.', 1400);
        }
        return toast('참가자가 직접 플레이해야 하는 단계입니다.');
      }
      case PHASE.KEEP_PASS:
        if (state.keepPass.done) { act.nextGroup(); return toast('다음으로 진행합니다.', 1400); }
        return toast('KEEP / PASS 는 해당 참가자가 직접 선택해야 합니다.');
      case PHASE.SECRET_SELECTION:
        return toast('[선택 종료] 버튼으로 진행하세요.');
      default:
        return toast('건너뛸 수 있는 단계가 아닙니다.');
    }
  },

  async revealFigures() {
    const state = store.get();
    await countdown({ from: 3, go: 'OPEN!', fast: state.fastMode });
    store.update((s) => { s.figureRevealed = true; });
    confetti({ duration: 4000 });
  },
};

function celebrate() {
  setTimeout(() => confetti({ duration: 4000 }), 260);
}

/* ===================== 진행자 메뉴 ===================== */
async function openDrawer() {
  const state = store.get();
  if (state.hostPin && !ui.hostUnlocked) {
    const entered = await promptPin({ message: '진행자 PIN을 입력하세요.' });
    if (entered === null) return;
    if (entered !== state.hostPin) return toast('PIN이 올바르지 않습니다.');
    ui.hostUnlocked = true;
  }
  ui.drawerOpen = true;
  renderDrawer();
}

function closeDrawer() {
  ui.drawerOpen = false;
  const el = document.querySelector('.drawer');
  if (el) el.remove();
}

function renderDrawer() {
  const state = store.get();
  document.querySelector('.drawer')?.remove();
  if (!ui.drawerOpen) return;

  const s = engine.publicSummary(state);
  const inSetup = state.phase === PHASE.SETUP;
  const inSelection = state.phase === PHASE.SECRET_SELECTION;
  const battleGame = inSetup ? null : getGame(state.battleGameId);
  const finalGame = inSetup ? null : getGame(state.finalGameId);

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
        <div class="group-title">게임 상태</div>
        <div class="kv"><span>현재 단계</span><b>${PHASE_LABEL[state.phase] || state.phase}</b></div>
        ${inSetup ? '' : `
          <div class="kv"><span>전체 번호</span><b>${state.totalNumbers}개</b></div>
          <div class="kv"><span>참가 인원</span><b>${s.participantCount}명</b></div>
          <div class="kv"><span>번호 확정</span><b>${s.confirmed}명</b></div>
          ${s.emptyCount === null ? '' : `<div class="kv"><span>빈 번호</span><b>${s.emptyCount}개</b></div>`}
          ${s.unassigned ? `<div class="kv"><span>미확정자</span><b>${s.unassigned}명</b></div>` : ''}
          ${s.battleGroups ? `<div class="kv"><span>중복 그룹</span><b>${Math.min(s.battleIndex + 1, s.battleGroups)} / ${s.battleGroups}</b></div>` : ''}
          <div class="kv"><span>1차 쟁탈전</span><b>${battleGame.icon} ${escapeHtml(battleGame.name)}</b></div>
          <div class="kv"><span>FINAL</span><b>${finalGame.icon} ${escapeHtml(finalGame.name)}</b></div>`}
      </div>

      ${inSelection ? `
        <div class="group">
          <div class="group-title">참가 인원 (${state.participants.length}명)</div>
          <p class="small muted" style="margin:0">🔒 선택한 번호는 진행자에게도 공개되지 않습니다.</p>
          <ul class="roster">${state.participants.map((p) => `<li>${escapeHtml(p.name)} ✓</li>`).join('') || '<li class="muted">아직 없음</li>'}</ul>
          <button class="btn btn-danger" data-act="close-selection" type="button">선택 종료</button>
        </div>` : ''}

      <div class="group">
        <div class="group-title">진행 도구</div>
        <label class="kv" style="cursor:pointer">
          <span>빠른 진행 (애니메이션 축소)</span>
          <input type="checkbox" data-act="fast" ${state.fastMode ? 'checked' : ''} style="width:auto;transform:scale(1.4)">
        </label>
        ${inSetup || inSelection ? '' : `
          <button class="btn btn-sm btn-cyan" data-act="advance" type="button">다음 단계 진행</button>
          <p class="small muted" style="margin:0">연출·대기 화면만 넘깁니다. 참가자가 직접 눌러야 하는 입력은 건너뛰지 않습니다.</p>`}
        ${inSetup ? '' : '<button class="btn btn-ghost btn-sm" data-act="log" type="button">진행 기록 보기</button>'}
      </div>

      ${inSetup ? '' : `
        <div class="group">
          <div class="group-title">위험 구역</div>
          <button class="btn btn-danger" data-act="reset" type="button">게임 초기화</button>
          <p class="small muted" style="margin:0">모든 참가자와 진행 상황이 삭제됩니다.</p>
        </div>`}

      <div class="group" data-log-box style="display:none">
        <div class="group-title">진행 기록</div>
        <ol class="small muted" style="padding-left:18px;margin:0">
          ${state.log?.map((l) => `<li>${escapeHtml(l.message)}</li>`).join('') || '<li>기록 없음</li>'}
        </ol>
      </div>
    </div>`;

  wrap.addEventListener('click', async (e) => {
    if (e.target === wrap) return closeDrawer();
    const action = e.target.closest('[data-act]')?.dataset.act;
    if (!action) return;
    if (action === 'close') closeDrawer();
    else if (action === 'close-selection') await act.closeSelection();
    else if (action === 'advance') { closeDrawer(); act.advancePhase(); }
    else if (action === 'fast') {
      store.update((st) => { st.fastMode = e.target.checked; }, { silent: true });
      toast(e.target.checked ? '빠른 진행 켜짐' : '빠른 진행 꺼짐', 1200);
    } else if (action === 'log') {
      const box = wrap.querySelector('[data-log-box]');
      box.style.display = box.style.display === 'none' ? 'flex' : 'none';
    } else if (action === 'reset') {
      const ok = await confirmDialog({
        title: '게임을 초기화할까요?',
        message: '모든 참가자, 선택, 진행 상황이 삭제되고\n처음 설정 화면으로 돌아갑니다.',
        confirmLabel: '초기화',
        danger: true,
      });
      if (!ok) return;
      closeDrawer();
      resetSelection('NAME');
      ui.hostUnlocked = false;
      store.reset();
    }
  });

  document.getElementById('overlay-root').appendChild(wrap);
}

/* ===================== 라우팅 ===================== */
const ROUTES = {
  [PHASE.SETUP]: renderSetup,
  [PHASE.SECRET_SELECTION]: renderSecretSelection,
  [PHASE.REVEAL]: renderReveal,
  [PHASE.BATTLE]: renderBattle,
  [PHASE.KEEP_PASS]: renderKeepPass,
  [PHASE.FINAL_BATTLE]: renderFinalBattle,
  [PHASE.FINAL_SELECTION]: renderFinalSelection,
  [PHASE.RESULT]: renderResult,
};

function render() {
  if (ui.timer) { clearTimeout(ui.timer); ui.timer = null; }
  if (ui.cleanup) { try { ui.cleanup(); } catch { /* 무시 */ } ui.cleanup = null; }

  const state = store.get();
  const view = ROUTES[state.phase];
  const ctx = { state, store, ui, act, refresh: render };

  host.setChip(PHASE_LABEL[state.phase] || state.phase, state.phase !== PHASE.SETUP);

  if (!view) {
    root.innerHTML = '<div class="card center"><p>알 수 없는 단계입니다. 진행자 메뉴에서 초기화해 주세요.</p></div>';
    return;
  }
  try {
    view(root, ctx);
  } catch (err) {
    console.error(err);
    root.innerHTML = `<div class="card center">
      <h2 class="title" style="font-size:22px">화면을 그리지 못했습니다</h2>
      <p class="subtitle small">${escapeHtml(err.message)}</p>
      <p class="small muted">진행자 메뉴에서 [게임 초기화]를 눌러 주세요.</p></div>`;
  }
  if (ui.drawerOpen) renderDrawer();
}

/* ===================== 마운트 / 해제 ===================== */
let unsubscribe = null;

function onKeydown(e) { if (e.key === 'Escape') closeDrawer(); }

/** 진행 중인 게임이 있는지 (홈 화면에서 "이어하기" 표시용) */
export function hasBattleInProgress() {
  const s = store.get();
  return s.phase !== PHASE.SETUP && s.phase !== PHASE.RESULT;
}

export function battleStatusLine() {
  const s = store.get();
  if (s.phase === PHASE.SETUP) return null;
  if (s.phase === PHASE.RESULT) return `지난 게임 결과 (${s.participants.length}명)`;
  return `진행 중 · ${PHASE_LABEL[s.phase]} · ${s.participants.length}명`;
}

export function mount(shell) {
  host = shell;
  root = shell.root;
  unsubscribe = store.subscribe(render);
  shell.setHostMenu(openDrawer);
  document.addEventListener('keydown', onKeydown);

  // 새로고침/복귀: 진행 중이던 게임이 있으면 그대로 이어간다
  const booted = store.get();
  if (booted.phase !== PHASE.SETUP) {
    ui.hostUnlocked = !booted.hostPin;
    // 이전 참가자의 입력 흔적은 남기지 않는다
    resetSelection('NAME');
    ui.setup.totalNumbers = booted.totalNumbers ?? ui.setup.totalNumbers;
  }
  render();
}

export function unmount() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  document.removeEventListener('keydown', onKeydown);
  if (ui.timer) { clearTimeout(ui.timer); ui.timer = null; }
  if (ui.cleanup) { try { ui.cleanup(); } catch { /* 무시 */ } ui.cleanup = null; }
  closeDrawer();
  if (root) root.innerHTML = '';
  root = null;
  host = null;
}
