/* 화면 렌더러 — 단계별로 하나씩. 게임 로직은 engine.js 가 전부 갖고 있고
 * 여기서는 "상태를 그림으로 바꾸는 일"과 "사용자 입력을 액션으로 넘기는 일"만 한다. */
import { escapeHtml, ordinal } from './util.js';
import { nameTag, numberGrid } from './ui.js';
import {
  PHASE, RESOLUTION, MIN_NUMBERS, MAX_NUMBERS,
  nameOf, emptyNumbers, currentGroup, keepPassContext, finalSelectionContext,
  unassignedParticipants,
} from './engine.js';
import { getGame, BATTLE_GAME_IDS, FINAL_GAME_IDS, listGames } from './games/registry.js';
import { lastRound, isResolved } from './ranking.js';

const RESOLUTION_LABEL = {
  [RESOLUTION.SOLO]: '단독',
  [RESOLUTION.KEEP]: 'KEEP',
  [RESOLUTION.AUTO_KEEP]: '자동 KEEP',
  [RESOLUTION.PASS]: 'PASS',
  [RESOLUTION.FINAL]: 'FINAL',
};

export const PHASE_LABEL = {
  [PHASE.SETUP]: '게임 설정',
  [PHASE.SECRET_SELECTION]: '비밀 선택',
  [PHASE.REVEAL]: '선택 공개',
  [PHASE.BATTLE]: '번호 쟁탈전',
  [PHASE.KEEP_PASS]: 'KEEP / PASS',
  [PHASE.FINAL_BATTLE]: 'FINAL 순위전',
  [PHASE.FINAL_SELECTION]: '남은 번호 선택',
  [PHASE.RESULT]: '최종 결과',
};

/* ===================== SETUP ===================== */
export function renderSetup(root, ctx) {
  const draft = ctx.ui.setup;
  root.innerHTML = `
    <div class="card center">
      <p class="eyebrow">Secret Number Battle</p>
      <h1 class="title">비밀 번호<br>쟁탈전</h1>
      <p class="subtitle">번호를 몰래 고르고, 겹치면 붙는다.<br>피규어의 주인은 누가 될까?</p>
    </div>

    <div class="card">
      <p class="eyebrow">전체 번호 개수</p>
      <div class="stepper">
        <button type="button" data-step="-1">−</button>
        <div class="val">${draft.totalNumbers}</div>
        <button type="button" data-step="1">+</button>
      </div>
      <p class="subtitle center small" style="margin-top:10px">
        사용 가능한 번호: 1 ~ ${draft.totalNumbers}<br>참가자는 ${draft.totalNumbers}명까지 참여할 수 있습니다.
      </p>
    </div>

    <div class="card">
      <p class="eyebrow">미니게임 선택</p>
      <div class="field" style="margin-bottom:12px">
        <label>1차 번호 쟁탈전</label>
        <select data-select="battle">
          ${listGames(BATTLE_GAME_IDS).map((g) => `<option value="${g.id}" ${g.id === draft.battleGameId ? 'selected' : ''}>${g.icon} ${g.name} — ${escapeHtml(g.tagline)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>FINAL 순위 결정전</label>
        <select data-select="final">
          ${listGames(FINAL_GAME_IDS).map((g) => `<option value="${g.id}" ${g.id === draft.finalGameId ? 'selected' : ''}>${g.icon} ${g.name} — ${escapeHtml(g.tagline)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="card">
      <div class="field">
        <label>진행자 PIN (선택) — 진행자 메뉴 잠금</label>
        <input type="text" inputmode="numeric" maxlength="8" data-input="pin"
               placeholder="비워두면 잠그지 않습니다" value="${escapeHtml(draft.hostPin || '')}" />
      </div>
    </div>

    <button class="btn btn-hero" data-act="start" type="button">게임 시작</button>
  `;

  root.querySelectorAll('[data-step]').forEach((btn) => btn.addEventListener('click', () => {
    const next = draft.totalNumbers + Number(btn.dataset.step);
    draft.totalNumbers = Math.max(MIN_NUMBERS, Math.min(MAX_NUMBERS, next));
    ctx.refresh();
  }));
  root.querySelector('[data-select="battle"]').addEventListener('change', (e) => { draft.battleGameId = e.target.value; });
  root.querySelector('[data-select="final"]').addEventListener('change', (e) => { draft.finalGameId = e.target.value; });
  root.querySelector('[data-input="pin"]').addEventListener('input', (e) => { draft.hostPin = e.target.value.trim(); });
  root.querySelector('[data-act="start"]').addEventListener('click', () => ctx.act.startGame(draft));
}

/* ===================== 비밀 선택 ===================== */
export function renderSecretSelection(root, ctx) {
  const { state } = ctx;
  const sel = ctx.ui.selection;
  const count = state.participants.length;
  const full = count >= state.totalNumbers;

  if (sel.step === 'SAVED') {
    root.innerHTML = `
      <div class="handoff">
        <div class="lock">🔒</div>
        <h2 class="title" style="font-size:30px;margin-top:8px">선택이 저장되었습니다</h2>
        <p class="subtitle">다음 참가자에게 화면을 넘겨주세요.<br>선택한 번호는 아무에게도 보이지 않습니다.</p>
      </div>
      <button class="btn btn-hero btn-cyan" data-act="next" type="button">다음 참가자</button>
      <p class="center small muted">현재 ${count}명 참가${full ? ' · 정원이 가득 찼습니다' : ''}</p>`;
    root.querySelector('[data-act="next"]').addEventListener('click', () => {
      sel.step = 'NAME';
      sel.name = '';
      sel.number = null;
      ctx.refresh();
    });
    return;
  }

  if (sel.step === 'PICK') {
    root.innerHTML = `
      <div class="card center">
        <p class="eyebrow">${escapeHtml(sel.name)} 님</p>
        <h2 class="title" style="font-size:28px">원하는 번호를<br>선택하세요</h2>
        <p class="subtitle small">1 ~ ${state.totalNumbers} 중 하나. 다른 사람이 고른 번호도 고를 수 있습니다.</p>
      </div>
      <div class="card">
        ${numberGrid(state.numbers.map((n) => n.n), { selected: sel.number, dense: state.totalNumbers > 16 })}
      </div>
      <div class="btn-row">
        <button class="btn btn-ghost" data-act="back" type="button">이름 다시</button>
        <button class="btn" data-act="confirm" type="button" ${sel.number ? '' : 'disabled'}>
          ${sel.number ? `${sel.number}번으로 확정` : '번호를 고르세요'}
        </button>
      </div>
      <p class="center small muted">🔒 아무도 당신의 선택을 볼 수 없습니다</p>`;

    root.querySelectorAll('.num').forEach((btn) => btn.addEventListener('click', () => {
      sel.number = Number(btn.dataset.number);
      ctx.refresh();
    }));
    root.querySelector('[data-act="back"]').addEventListener('click', () => { sel.step = 'NAME'; ctx.refresh(); });
    root.querySelector('[data-act="confirm"]').addEventListener('click', () => ctx.act.confirmSelection());
    return;
  }

  // NAME
  root.innerHTML = `
    <div class="card center">
      <p class="eyebrow">참가자 ${count + 1}번째</p>
      <h2 class="title" style="font-size:30px">이름을<br>입력하세요</h2>
      <p class="subtitle small">한 명씩 순서대로 입력합니다.</p>
    </div>
    <div class="card">
      <div class="field">
        <input type="text" maxlength="12" data-input="name" placeholder="예: 현우" value="${escapeHtml(sel.name || '')}"
               autocomplete="off" autocapitalize="off" ${full ? 'disabled' : ''} />
      </div>
    </div>
    <button class="btn btn-hero" data-act="next" type="button" ${full ? 'disabled' : ''}>
      ${full ? '정원이 가득 찼습니다' : '번호 고르러 가기'}
    </button>
    <div class="card tight center">
      <p class="small muted" style="margin:0">
        현재 <b style="color:var(--cyan)">${count}명</b> 참가 · 번호 ${state.totalNumbers}개<br>
        모두 입력했다면 진행자가 상단 <b>진행자</b> 메뉴에서 [선택 종료]를 누르세요.
      </p>
    </div>`;

  const input = root.querySelector('[data-input="name"]');
  const go = () => {
    sel.name = input.value.trim();
    ctx.act.toPickStep();
  };
  input.addEventListener('input', () => { sel.name = input.value; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  root.querySelector('[data-act="next"]').addEventListener('click', go);
  if (!full) setTimeout(() => input.focus(), 60);
}

/* ===================== 공개 ===================== */
export function renderReveal(root, ctx) {
  const { state } = ctx;
  const { entries, cursor } = state.reveal;
  const done = cursor >= entries.length;
  const current = done ? null : entries[cursor];
  const battleCount = entries.filter((e) => e.kind === 'BATTLE').length;

  let stage;
  if (done) {
    stage = `
      <div class="reveal-stage">
        <div class="reveal-verdict ${battleCount ? 'battle' : 'safe'}" style="font-size:26px">
          ${battleCount ? `🔥 중복 번호 ${battleCount}개 발생!` : '✨ 중복 없음! 전원 확정!'}
        </div>
        <p class="subtitle center">${battleCount
          ? '겹친 번호는 쟁탈전으로 주인을 가립니다.'
          : '모두 원하는 번호를 그대로 가져갑니다.'}</p>
      </div>`;
  } else {
    const verdict = current.kind === 'EMPTY' ? '아무도 선택하지 않았습니다'
      : current.kind === 'SAFE' ? '단독 선택!'
      : `${current.memberIds.length}명 중복!`;
    stage = `
      <div class="reveal-stage" data-cursor="${cursor}">
        <div class="reveal-num">${current.n}</div>
        <div class="reveal-verdict ${current.kind.toLowerCase()}">${verdict}</div>
        <div class="reveal-names">${current.memberIds
          .map((id) => nameTag(nameOf(state, id), current.kind === 'BATTLE' ? 'hot' : 'win')).join('')}</div>
      </div>`;
  }

  root.innerHTML = `
    <div class="card center">
      <p class="eyebrow">Reveal</p>
      <h2 class="title" style="font-size:26px">과연 여러분의 선택은<br>겹쳤을까요?</h2>
    </div>
    <div class="card">${stage}</div>
    <div class="card tight">
      <div class="reveal-board">
        ${entries.map((e, i) => `
          <div class="rv k-${e.kind} ${i < cursor ? 'done' : ''}">
            ${i < cursor ? e.n : '?'}
            ${i < cursor ? `<small>${e.kind === 'EMPTY' ? '빈' : e.kind === 'SAFE' ? '확정' : `${e.memberIds.length}명`}</small>` : ''}
          </div>`).join('')}
      </div>
    </div>
    ${done
      ? `<button class="btn btn-hero" data-act="next" type="button">${battleCount ? '쟁탈전 시작' : '결과 보기'}</button>`
      : `<div class="btn-row">
           <button class="btn btn-ghost btn-sm" data-act="all" type="button">전체 공개 (SKIP)</button>
           <button class="btn btn-sm btn-cyan" data-act="one" type="button">다음 번호</button>
         </div>`}`;

  if (done) {
    root.querySelector('[data-act="next"]').addEventListener('click', () => ctx.act.startBattles());
  } else {
    root.querySelector('[data-act="all"]').addEventListener('click', () => ctx.act.revealAll());
    root.querySelector('[data-act="one"]').addEventListener('click', () => ctx.act.revealNext());
    ctx.ui.timer = setTimeout(() => ctx.act.revealNext(), state.fastMode ? 550 : 1500);
  }
}

/* ===================== 쟁탈전 / FINAL 공통 ===================== */
function renderCompetition(root, ctx, kind) {
  const { state } = ctx;
  const isFinal = kind === 'FINAL';
  const slot = isFinal ? state.final : state.battle;
  const game = getGame(isFinal ? state.finalGameId : state.battleGameId);
  const resolver = slot.resolver;
  const headerNumber = isFinal ? null : currentGroup(state).number;

  if (slot.stage === 'INTRO') {
    const names = isFinal
      ? unassignedParticipants(state).map((p) => p.name)
      : currentGroup(state).memberIds.map((id) => nameOf(state, id));
    root.innerHTML = `
      <div class="card vs-stage">
        <p class="eyebrow">${isFinal ? 'Final Round' : 'Battle'}</p>
        <div class="vs-number">${isFinal ? 'FINAL' : `${headerNumber}번`}</div>
        <p class="subtitle">${isFinal ? '번호를 못 얻은 참가자들의 마지막 승부' : '쟁탈전'}</p>
        <div class="vs-list">
          ${names.map((n, i) => (i
            ? `<span class="vs-pair"><span class="vs-sep">VS</span><span class="vs-player">${escapeHtml(n)}</span></span>`
            : `<span class="vs-player">${escapeHtml(n)}</span>`)).join('')}
        </div>
      </div>
      <div class="card center">
        <p class="eyebrow">${game.icon} ${escapeHtml(game.name)}</p>
        <p class="subtitle">${escapeHtml(game.tagline)}</p>
        <p class="small muted" style="margin-top:8px">${escapeHtml(game.howto)}</p>
      </div>
      ${isFinal ? `<div class="card tight center"><p class="small muted" style="margin:0">
        남은 빈 번호 ${emptyNumbers(state).length}개 · 여기서 정해진 순위대로 번호를 고릅니다.</p></div>` : ''}
      <button class="btn btn-hero" data-act="go" type="button">${game.name} 시작</button>`;
    root.querySelector('[data-act="go"]').addEventListener('click', () => ctx.act.startRound(kind));
    return;
  }

  if (slot.stage === 'PLAY') {
    const tie = resolver.round?.tieBreak;
    root.innerHTML = `
      <div class="card tight center">
        <p class="eyebrow" style="margin:0">${isFinal ? 'FINAL' : `${headerNumber}번 쟁탈전`} · ${game.icon} ${escapeHtml(game.name)}</p>
        ${tie ? '<p class="reveal-verdict battle" style="font-size:18px;margin:6px 0 0">동점자 재대결!</p>' : ''}
      </div>
      <div class="card game-host"></div>`;
    const host = root.querySelector('.game-host');
    ctx.ui.cleanup = game.mount(host, resolver.round, {
      getName: (id) => nameOf(state, id),
      fast: state.fastMode,
      commit: () => ctx.act.save(),
      finish: () => ctx.act.finishRound(kind),
    });
    return;
  }

  // RESULT — 마지막 라운드 요약 + (확정 순위 or 재대결 안내)
  const round = lastRound(resolver);
  const summary = round ? game.summary(round, (id) => nameOf(state, id)) : null;
  const resolved = isResolved(resolver);
  const tiedGroups = resolved ? [] : (round?.tiers || []).filter((t) => t.length > 1);

  root.innerHTML = `
    ${summary ? `
      <div class="headline-box">
        <div class="hl-label">${escapeHtml(summary.headline.label)}</div>
        <div class="hl-value">${escapeHtml(summary.headline.value)}</div>
      </div>
      <ul class="rank-list">
        ${summary.rows.map((r, i) => `
          <li class="rank-item ${i === 0 && resolved ? 'top' : ''}" style="animation-delay:${i * (state.fastMode ? 60 : 160)}ms">
            <span class="medal">${resolved ? ordinal(i + 1) : `${i + 1}`}</span>
            <span class="who">${escapeHtml(r.name)}</span>
            <span class="val">${escapeHtml(r.value)}<br><span class="note">${escapeHtml(r.note)}</span></span>
          </li>`).join('')}
      </ul>` : ''}
    ${resolved ? '' : `
      <div class="card center">
        <div class="reveal-verdict battle">동점 발생!</div>
        <p class="subtitle">${tiedGroups.map((t) => t.map((id) => escapeHtml(nameOf(state, id))).join(' · ')).join(' / ')}<br>
        동점자끼리 다시 겨룹니다.</p>
      </div>`}
    <button class="btn btn-hero ${resolved ? '' : 'btn-cyan'}" data-act="next" type="button">
      ${resolved ? (isFinal ? '번호 선택으로' : 'KEEP / PASS 로') : '재대결 시작'}
    </button>`;

  root.querySelector('[data-act="next"]').addEventListener('click', () => {
    if (resolved) ctx.act.applyRanking(kind);
    else ctx.act.startRound(kind);
  });
}

export function renderBattle(root, ctx) { renderCompetition(root, ctx, 'BATTLE'); }
export function renderFinalBattle(root, ctx) { renderCompetition(root, ctx, 'FINAL'); }

/* ===================== KEEP / PASS ===================== */
export function renderKeepPass(root, ctx) {
  const { state } = ctx;
  const group = currentGroup(state);
  const kp = state.keepPass;

  if (kp.done) {
    const res = kp.result;
    const owner = nameOf(state, res.participantId);
    const isLastGroup = state.battle.index >= state.battle.groups.length - 1;
    const nextLabel = isLastGroup
      ? (unassignedParticipants(state).length ? 'FINAL 경쟁으로' : '최종 결과 보기')
      : '다음 중복 번호로';
    root.innerHTML = `
      <div class="card center">
        <p class="eyebrow">${res.type === 'AUTO_KEEP' ? '마지막 순위 · 자동 KEEP' : 'KEEP'}</p>
        <div class="kp-number">🔒 ${res.number}</div>
        <h2 class="title" style="font-size:28px;margin-top:8px">${escapeHtml(owner)} 확정!</h2>
        <p class="subtitle">${res.number}번의 주인이 결정되었습니다.</p>
      </div>
      ${res.releasedIds.length ? `
        <div class="card center">
          <p class="eyebrow">FINAL 경쟁으로 이동</p>
          <div class="reveal-names">${res.releasedIds.map((id) => nameTag(nameOf(state, id))).join('')}</div>
        </div>` : ''}
      <button class="btn btn-hero" data-act="next" type="button">${nextLabel}</button>`;
    root.querySelector('[data-act="next"]').addEventListener('click', () => ctx.act.nextGroup());
    return;
  }

  const ctxKp = keepPassContext(state);

  if (kp.awaitingPick) {
    root.innerHTML = `
      <div class="card center">
        <p class="eyebrow">PASS · 빈 번호 우선 선택권</p>
        <h2 class="title" style="font-size:28px">${escapeHtml(ctxKp.participant.name)} 님</h2>
        <p class="subtitle">남아 있는 빈 번호 중 하나를 고르세요.</p>
      </div>
      <div class="card">
        ${numberGrid(ctxKp.pool, { dense: ctxKp.pool.length > 12 })}
      </div>`;
    root.querySelectorAll('.num').forEach((btn) => btn.addEventListener('click', () => {
      ctx.act.passPick(Number(btn.dataset.number));
    }));
    return;
  }

  root.innerHTML = `
    <div class="card kp-question">
      <p class="eyebrow">${group.number}번 쟁탈전 결과 · ${ordinal(ctxKp.pointer + 1)}</p>
      <div class="kp-number">${group.number}</div>
      <h2 class="title" style="font-size:28px;margin-top:6px">${escapeHtml(ctxKp.participant.name)} 님</h2>
      <p class="subtitle">처음 선택했던 ${group.number}번을<br>그대로 가져가시겠습니까?</p>
    </div>
    ${ctxKp.isLast ? `
      <div class="card center">
        <p class="subtitle">앞 순위가 모두 PASS 했습니다.<br><b style="color:var(--lime)">마지막 순위는 자동으로 KEEP</b> 합니다.</p>
      </div>
      <button class="btn btn-hero btn-lime" data-act="keep" type="button">${group.number}번 받기</button>`
    : `
      <div class="kp-actions">
        <button class="kp-btn kp-keep" data-act="keep" type="button">KEEP<small>${group.number}번 확정</small></button>
        <button class="kp-btn kp-pass" data-act="pass" type="button" ${ctxKp.canPass ? '' : 'disabled'}>PASS<small>빈 번호 ${ctxKp.pool.length}개 중 선택</small></button>
      </div>`}
    <div class="card tight">
      <p class="eyebrow center">선택 순서</p>
      <div class="kp-queue">
        ${group.ranking.map((id, i) => {
          const p = state.participants.find((x) => x.id === id);
          const cls = i === ctxKp.pointer ? 'now' : '';
          const mark = i < ctxKp.pointer ? `→ ${p.finalNumber}번` : '';
          return `<span class="name-tag ${cls}">${ordinal(i + 1)} ${escapeHtml(p.name)} ${mark}</span>`;
        }).join('')}
      </div>
    </div>
    <p class="center small muted">남은 빈 번호 ${ctxKp.pool.length}개 · ${ctxKp.pool.join(' / ') || '없음'}</p>`;

  root.querySelector('[data-act="keep"]').addEventListener('click', () => ctx.act.keep());
  const passBtn = root.querySelector('[data-act="pass"]');
  if (passBtn) passBtn.addEventListener('click', () => ctx.act.pass());
}

/* ===================== FINAL 번호 선택 ===================== */
export function renderFinalSelection(root, ctx) {
  const { state } = ctx;
  const sel = finalSelectionContext(state);
  if (!sel) return;
  root.innerHTML = `
    <div class="card center">
      <p class="eyebrow">FINAL 순위 ${sel.rank} / ${sel.total}</p>
      <div class="kp-number">${ordinal(sel.rank)}</div>
      <h2 class="title" style="font-size:28px;margin-top:6px">${escapeHtml(sel.participant.name)} 님</h2>
      <p class="subtitle">남아 있는 번호 중 하나를 고르세요.</p>
    </div>
    <div class="card">${numberGrid(sel.pool, { dense: sel.pool.length > 12 })}</div>
    ${sel.waiting.length ? `
      <div class="card tight">
        <p class="eyebrow center">다음 순서</p>
        <div class="kp-queue">${sel.waiting.map((id, i) => `<span class="name-tag">${ordinal(sel.rank + i + 1)} ${escapeHtml(nameOf(state, id))}</span>`).join('')}</div>
      </div>` : ''}`;
  root.querySelectorAll('.num').forEach((btn) => btn.addEventListener('click', () => {
    ctx.act.finalPick(Number(btn.dataset.number));
  }));
}

/* ===================== 최종 결과 ===================== */
export function renderResult(root, ctx) {
  const { state } = ctx;
  const tab = ctx.ui.resultTab || 'number';

  if (state.figureRevealed) {
    root.innerHTML = `
      <div class="card center">
        <p class="eyebrow">Open the box</p>
        <h1 class="title">이제 피규어를<br>공개하세요!</h1>
        <p class="subtitle">각자 배정받은 번호의 피규어를 확인해 주세요.<br>행운을 빕니다 🎁</p>
      </div>
      ${resultTableMarkup(state, tab)}
      <button class="btn btn-hero btn-ghost" data-act="again" type="button">결과 화면으로</button>`;
    bindResultTabs(root, ctx);
    root.querySelector('[data-act="again"]').addEventListener('click', () => {
      ctx.store.update((s) => { s.figureRevealed = false; });
    });
    return;
  }

  root.innerHTML = `
    <div class="card center">
      <p class="eyebrow">Final Result</p>
      <h1 class="title">최종 결과</h1>
      <p class="subtitle">모든 번호가 결정되었습니다.</p>
    </div>
    ${resultTableMarkup(state, tab)}
    <button class="btn btn-hero" data-act="reveal" type="button">🎁 피규어 공개하기</button>
    <button class="btn btn-ghost btn-sm" data-act="log" type="button">진행 기록 보기</button>
    <div class="card tight hidden" data-log>
      <ol class="small muted" style="padding-left:18px;margin:0">
        ${state.log.map((l) => `<li>${escapeHtml(l.message)}</li>`).join('')}
      </ol>
    </div>`;

  bindResultTabs(root, ctx);
  root.querySelector('[data-act="reveal"]').addEventListener('click', () => ctx.act.revealFigures());
  root.querySelector('[data-act="log"]').addEventListener('click', () => {
    root.querySelector('[data-log]').classList.toggle('hidden');
  });
}

function resultTableMarkup(state, tab) {
  const rows = state.participants.slice().sort((a, b) => (
    tab === 'number' ? a.finalNumber - b.finalNumber : a.name.localeCompare(b.name, 'ko')
  ));
  const changedCount = state.participants.filter((p) => p.finalNumber !== p.originalNumber).length;
  const leftover = emptyNumbers(state);
  return `
    <div class="tabs">
      <button class="tab ${tab === 'number' ? 'on' : ''}" data-tab="number" type="button">번호순</button>
      <button class="tab ${tab === 'name' ? 'on' : ''}" data-tab="name" type="button">이름순</button>
    </div>
    <div class="result-grid">
      ${rows.map((p, i) => {
        const changed = p.finalNumber !== p.originalNumber;
        return `<div class="res-row" style="animation-delay:${i * (state.fastMode ? 30 : 70)}ms">
          <div class="res-num">${p.finalNumber}</div>
          <div class="res-body">
            <div class="res-name">${escapeHtml(p.name)}</div>
            <div class="res-meta">최초 선택 ${p.originalNumber} → 최종 <span class="${changed ? 'changed' : ''}">${p.finalNumber}</span></div>
          </div>
          <span class="badge ${p.resolution}">${RESOLUTION_LABEL[p.resolution] || p.resolution}</span>
        </div>`;
      }).join('')}
    </div>
    <p class="center small muted">참가자 ${state.participants.length}명 · 번호 ${state.totalNumbers}개 · 최초 선택과 달라진 사람 ${changedCount}명${
      leftover.length ? `<br>주인 없는 번호: ${leftover.join(' / ')}` : ''}</p>`;
}

function bindResultTabs(root, ctx) {
  root.querySelectorAll('[data-tab]').forEach((btn) => btn.addEventListener('click', () => {
    ctx.ui.resultTab = btn.dataset.tab;
    ctx.refresh();
  }));
}
