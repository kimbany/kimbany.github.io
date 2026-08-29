/* 게임 엔진 — 순수 상태 전이 로직 (DOM 의존 없음)
 *
 * 규칙상 절대 깨지면 안 되는 것:
 *  - 한 번호는 최대 한 명에게만 배정된다 (LOCKED 는 되돌릴 수 없음)
 *  - 한 참가자는 정확히 하나의 번호만 갖는다
 *  - 게임이 끝나면 모든 참가자에게 번호가 있다
 * 이를 위해 상태를 바꾸는 지점마다 방어적으로 예외를 던진다.
 */
import { uid, groupBy } from './util.js';
import { getGame, DEFAULT_BATTLE_GAME, DEFAULT_FINAL_GAME } from './games/registry.js';
import { createResolver, pump, commitRound, isResolved, getRanking } from './ranking.js';

export const STATE_VERSION = 1;

export const PHASE = {
  SETUP: 'SETUP',
  SECRET_SELECTION: 'SECRET_SELECTION',
  REVEAL: 'REVEAL',
  BATTLE: 'BATTLE',
  KEEP_PASS: 'KEEP_PASS',
  FINAL_BATTLE: 'FINAL_BATTLE',
  FINAL_SELECTION: 'FINAL_SELECTION',
  RESULT: 'RESULT',
};

export const NUMBER_STATE = {
  EMPTY: 'EMPTY',     // 아무도 선택하지 않음 / 아직 주인 없음
  SELECTED: 'SELECTED', // 공개 전 내부적으로 선택된 상태 (화면에는 노출하지 않음)
  BATTLE: 'BATTLE',   // 2명 이상 중복 -> 쟁탈전 대상
  LOCKED: 'LOCKED',   // 주인 확정
};

export const PARTICIPANT_STATUS = {
  SELECTED: 'SELECTED',     // 비밀 선택 완료, 공개 대기
  IN_BATTLE: 'IN_BATTLE',   // 중복 번호 쟁탈전 참가 중
  UNASSIGNED: 'UNASSIGNED', // 번호를 못 얻어 FINAL 대기
  CONFIRMED: 'CONFIRMED',   // 번호 확정
};

export const RESOLUTION = {
  SOLO: 'SOLO',           // 단독 선택으로 바로 확정
  KEEP: 'KEEP',           // 쟁탈전에서 원래 번호 유지
  AUTO_KEEP: 'AUTO_KEEP', // 마지막 순위 자동 KEEP
  PASS: 'PASS',           // 포기하고 빈 번호 선택
  FINAL: 'FINAL',         // FINAL 경쟁 후 남은 번호 선택
};

export const MIN_NUMBERS = 2;
export const MAX_NUMBERS = 50;

/* ===================== 생성 ===================== */

export function createGame({
  totalNumbers,
  battleGameId = DEFAULT_BATTLE_GAME,
  finalGameId = DEFAULT_FINAL_GAME,
  hostPin = null,
} = {}) {
  const n = Number(totalNumbers);
  if (!Number.isInteger(n) || n < MIN_NUMBERS || n > MAX_NUMBERS) {
    throw new Error(`번호 개수는 ${MIN_NUMBERS}~${MAX_NUMBERS} 사이의 정수여야 합니다.`);
  }
  return {
    version: STATE_VERSION,
    createdAt: Date.now(),
    finishedAt: null,
    phase: PHASE.SECRET_SELECTION,
    totalNumbers: n,
    battleGameId,
    finalGameId,
    hostPin: hostPin || null,
    fastMode: false,
    participants: [],
    numbers: Array.from({ length: n }, (_, i) => ({
      n: i + 1,
      state: NUMBER_STATE.EMPTY,
      ownerId: null,
    })),
    reveal: null,
    battle: null,
    keepPass: null,
    final: null,
    log: [],
  };
}

export function emptySetupState() {
  return { version: STATE_VERSION, phase: PHASE.SETUP };
}

/* ===================== 조회 헬퍼 ===================== */

export function participantById(state, id) {
  const found = state.participants.find((p) => p.id === id);
  if (!found) throw new Error(`참가자를 찾을 수 없습니다: ${id}`);
  return found;
}

export function numberSlot(state, n) {
  const slot = state.numbers[n - 1];
  if (!slot || slot.n !== n) throw new Error(`존재하지 않는 번호입니다: ${n}`);
  return slot;
}

/** 지금 선택 가능한 빈 번호 목록 */
export function emptyNumbers(state) {
  return state.numbers.filter((s) => s.state === NUMBER_STATE.EMPTY).map((s) => s.n);
}

export function unassignedParticipants(state) {
  return state.participants.filter((p) => p.status === PARTICIPANT_STATUS.UNASSIGNED);
}

export function nameOf(state, id) {
  const p = state.participants.find((x) => x.id === id);
  return p ? p.name : '???';
}

export function currentGroup(state) {
  if (!state.battle) return null;
  return state.battle.groups[state.battle.index] || null;
}

/* ===================== 1) 비밀 선택 ===================== */

export function addParticipant(state, rawName, chosenNumber) {
  if (state.phase !== PHASE.SECRET_SELECTION) {
    throw new Error('지금은 참가자를 추가할 수 없습니다.');
  }
  const name = String(rawName || '').trim();
  if (!name) throw new Error('이름을 입력해 주세요.');
  if (name.length > 12) throw new Error('이름은 12자 이하로 입력해 주세요.');
  if (state.participants.some((p) => p.name === name)) {
    throw new Error('이미 같은 이름의 참가자가 있습니다. 다르게 입력해 주세요.');
  }
  if (state.participants.length >= state.totalNumbers) {
    throw new Error('참가자 수는 전체 번호 개수를 넘을 수 없습니다.');
  }
  const n = Number(chosenNumber);
  if (!Number.isInteger(n) || n < 1 || n > state.totalNumbers) {
    throw new Error('올바른 번호를 선택해 주세요.');
  }

  const participant = {
    id: uid('p'),
    name,
    originalNumber: n,      // 선택 종료 전까지 어떤 화면에도 노출 금지
    finalNumber: null,
    status: PARTICIPANT_STATUS.SELECTED,
    battleRank: null,
    finalRank: null,
    resolution: null,
    joinedAt: Date.now(),
  };
  state.participants.push(participant);
  // 번호 상태는 일부러 건드리지 않는다. (중복 선택 허용 + 인원수 비공개)
  return participant;
}

export function removeParticipant(state, id) {
  if (state.phase !== PHASE.SECRET_SELECTION) {
    throw new Error('선택 종료 후에는 참가자를 뺄 수 없습니다.');
  }
  const idx = state.participants.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error('참가자를 찾을 수 없습니다.');
  state.participants.splice(idx, 1);
}

/* ===================== 2) 선택 종료 + 공개 ===================== */

export function closeSelection(state) {
  if (state.phase !== PHASE.SECRET_SELECTION) throw new Error('지금은 선택을 종료할 수 없습니다.');
  if (state.participants.length < 2) throw new Error('참가자가 2명 이상이어야 합니다.');

  const byNumber = groupBy(state.participants, (p) => p.originalNumber);
  const entries = [];

  for (const slot of state.numbers) {
    const picks = byNumber.get(slot.n) || [];
    if (picks.length === 0) {
      slot.state = NUMBER_STATE.EMPTY;
      slot.ownerId = null;
      entries.push({ n: slot.n, kind: 'EMPTY', memberIds: [] });
    } else if (picks.length === 1) {
      const winner = picks[0];
      slot.state = NUMBER_STATE.LOCKED;
      slot.ownerId = winner.id;
      winner.status = PARTICIPANT_STATUS.CONFIRMED;
      winner.finalNumber = slot.n;
      winner.resolution = RESOLUTION.SOLO;
      entries.push({ n: slot.n, kind: 'SAFE', memberIds: [winner.id] });
      pushLog(state, `${winner.name} → ${slot.n}번 단독 선택 확정`);
    } else {
      slot.state = NUMBER_STATE.BATTLE;
      slot.ownerId = null;
      picks.forEach((p) => { p.status = PARTICIPANT_STATUS.IN_BATTLE; });
      entries.push({ n: slot.n, kind: 'BATTLE', memberIds: picks.map((p) => p.id) });
      pushLog(state, `${slot.n}번 ${picks.length}명 중복 — 쟁탈전`);
    }
  }

  state.reveal = { cursor: 0, entries };
  state.phase = PHASE.REVEAL;
  return state.reveal;
}

export function revealNext(state) {
  if (state.phase !== PHASE.REVEAL) return false;
  if (state.reveal.cursor >= state.reveal.entries.length) return false;
  state.reveal.cursor += 1;
  return true;
}

export function revealAll(state) {
  if (state.phase !== PHASE.REVEAL) return;
  state.reveal.cursor = state.reveal.entries.length;
}

export function isRevealDone(state) {
  return state.phase === PHASE.REVEAL && state.reveal.cursor >= state.reveal.entries.length;
}

/* ===================== 3) 쟁탈전 ===================== */

export function startBattlePhase(state, rng = Math.random) {
  if (state.phase !== PHASE.REVEAL) throw new Error('공개 단계가 끝나야 합니다.');

  const groups = state.numbers
    .filter((s) => s.state === NUMBER_STATE.BATTLE)
    .map((s) => ({
      number: s.n,
      memberIds: state.participants
        .filter((p) => p.originalNumber === s.n)
        .map((p) => p.id),
      ranking: null,
      resolved: false,
    }));

  state.battle = { groups, index: 0, resolver: null, stage: 'INTRO' };
  state.reveal = null;

  if (groups.length === 0) return goToFinal(state, rng);
  prepareGroup(state, rng);
  state.phase = PHASE.BATTLE;
  return state;
}

function prepareGroup(state, rng) {
  const group = currentGroup(state);
  const game = getGame(state.battleGameId);
  state.battle.resolver = pump(createResolver(game.id, group.memberIds), game, rng);
  state.battle.stage = 'INTRO';
  state.keepPass = null;
}

/** 미니게임 라운드가 끝났을 때 호출 */
export function commitBattleRound(state, rng = Math.random) {
  const game = getGame(state.battleGameId);
  commitRound(state.battle.resolver, game, rng);
  return isResolved(state.battle.resolver);
}

export function isBattleResolved(state) {
  return Boolean(state.battle && state.battle.resolver && isResolved(state.battle.resolver));
}

/** 순위 확정 -> KEEP/PASS 단계로 */
export function applyBattleRanking(state) {
  if (!isBattleResolved(state)) throw new Error('아직 순위가 확정되지 않았습니다.');
  const group = currentGroup(state);
  const ranking = getRanking(state.battle.resolver);
  if (ranking.length !== group.memberIds.length) {
    throw new Error('쟁탈전 순위 인원이 그룹 인원과 다릅니다.');
  }
  group.ranking = ranking;
  ranking.forEach((id, i) => { participantById(state, id).battleRank = i + 1; });
  state.keepPass = { pointer: 0, awaitingPick: false, lastPass: null, done: false };
  state.phase = PHASE.KEEP_PASS;
  pushLog(state, `${group.number}번 쟁탈전 순위: ${ranking.map((id, i) => `${i + 1}위 ${nameOf(state, id)}`).join(' / ')}`);
  return ranking;
}

/* ===================== 4) KEEP / PASS ===================== */

export function keepPassContext(state) {
  if (state.phase !== PHASE.KEEP_PASS) return null;
  const group = currentGroup(state);
  const { pointer } = state.keepPass;
  const participantId = group.ranking[pointer];
  const isLast = pointer === group.ranking.length - 1;
  const pool = emptyNumbers(state);
  return {
    group,
    pointer,
    participantId,
    participant: participantById(state, participantId),
    isLast,
    // 마지막 순위는 자동 KEEP (규칙 11/14). 그 외에는 빈 번호가 있을 때만 PASS 가능.
    canPass: !isLast && pool.length > 0,
    pool,
    waiting: group.ranking.slice(pointer + 1),
  };
}

export function doKeep(state) {
  const ctx = keepPassContext(state);
  if (!ctx) throw new Error('지금은 KEEP 할 수 없습니다.');
  lockNumber(state, ctx.group.number, ctx.participantId,
    ctx.isLast ? RESOLUTION.AUTO_KEEP : RESOLUTION.KEEP);

  // 같은 번호를 골랐던 나머지는 전부 미확정 -> FINAL 로
  for (const id of ctx.waiting) {
    const p = participantById(state, id);
    if (p.status !== PARTICIPANT_STATUS.CONFIRMED) {
      p.status = PARTICIPANT_STATUS.UNASSIGNED;
    }
  }
  ctx.group.resolved = true;
  state.keepPass.done = true;
  state.keepPass.awaitingPick = false;
  state.keepPass.result = {
    type: ctx.isLast ? 'AUTO_KEEP' : 'KEEP',
    participantId: ctx.participantId,
    number: ctx.group.number,
    releasedIds: ctx.waiting.slice(),
  };
  pushLog(state, `${ctx.participant.name} ${ctx.isLast ? '자동 ' : ''}KEEP → ${ctx.group.number}번 확정`);
  return state.keepPass.result;
}

export function doPass(state) {
  const ctx = keepPassContext(state);
  if (!ctx) throw new Error('지금은 PASS 할 수 없습니다.');
  if (!ctx.canPass) throw new Error('PASS 할 수 없는 상황입니다.');
  state.keepPass.awaitingPick = true;
  return ctx.pool;
}

export function passPickNumber(state, n) {
  const ctx = keepPassContext(state);
  if (!ctx) throw new Error('지금은 번호를 고를 수 없습니다.');
  if (!state.keepPass.awaitingPick) throw new Error('PASS 상태가 아닙니다.');
  lockNumber(state, n, ctx.participantId, RESOLUTION.PASS);
  state.keepPass.awaitingPick = false;
  state.keepPass.lastPass = { participantId: ctx.participantId, number: n };
  state.keepPass.pointer += 1;
  pushLog(state, `${ctx.participant.name} PASS → ${n}번 확정 (${ctx.group.number}번 선택권 다음 순위로)`);
  return state.keepPass.lastPass;
}

/** 현재 그룹 처리를 끝내고 다음 그룹 또는 FINAL 로 */
export function nextGroup(state, rng = Math.random) {
  if (!state.keepPass || !state.keepPass.done) throw new Error('아직 이 그룹이 끝나지 않았습니다.');
  state.battle.index += 1;
  state.keepPass = null;
  if (state.battle.index >= state.battle.groups.length) return goToFinal(state, rng);
  prepareGroup(state, rng);
  state.phase = PHASE.BATTLE;
  return state;
}

/* ===================== 5) FINAL ===================== */

export function goToFinal(state, rng = Math.random) {
  const pending = unassignedParticipants(state);
  if (pending.length === 0) {
    finishGame(state);
    return state;
  }
  const game = getGame(state.finalGameId);
  state.final = {
    resolver: pump(createResolver(game.id, pending.map((p) => p.id)), game, rng),
    order: null,
    pointer: 0,
    stage: 'INTRO',
  };
  state.phase = PHASE.FINAL_BATTLE;
  // 1명뿐이면 미니게임 없이 resolver 가 이미 확정 상태다.
  if (isResolved(state.final.resolver)) applyFinalRanking(state);
  return state;
}

export function commitFinalRound(state, rng = Math.random) {
  const game = getGame(state.finalGameId);
  commitRound(state.final.resolver, game, rng);
  return isResolved(state.final.resolver);
}

export function isFinalResolved(state) {
  return Boolean(state.final && state.final.resolver && isResolved(state.final.resolver));
}

export function applyFinalRanking(state) {
  if (!isFinalResolved(state)) throw new Error('FINAL 순위가 아직 확정되지 않았습니다.');
  const order = getRanking(state.final.resolver);
  state.final.order = order;
  order.forEach((id, i) => { participantById(state, id).finalRank = i + 1; });
  state.final.pointer = 0;
  state.phase = PHASE.FINAL_SELECTION;
  pushLog(state, `FINAL 순위: ${order.map((id, i) => `${i + 1}위 ${nameOf(state, id)}`).join(' / ')}`);
  return order;
}

export function finalSelectionContext(state) {
  if (state.phase !== PHASE.FINAL_SELECTION) return null;
  const { order, pointer } = state.final;
  if (pointer >= order.length) return null;
  const participantId = order[pointer];
  return {
    participantId,
    participant: participantById(state, participantId),
    rank: pointer + 1,
    total: order.length,
    pool: emptyNumbers(state),
    waiting: order.slice(pointer + 1),
  };
}

export function finalPickNumber(state, n) {
  const ctx = finalSelectionContext(state);
  if (!ctx) throw new Error('지금은 번호를 고를 수 없습니다.');
  lockNumber(state, n, ctx.participantId, RESOLUTION.FINAL);
  state.final.pointer += 1;
  pushLog(state, `${ctx.participant.name} → ${n}번 확정 (FINAL ${ctx.rank}위)`);
  if (state.final.pointer >= state.final.order.length) finishGame(state);
  return n;
}

/* ===================== 공통 ===================== */

function lockNumber(state, n, participantId, resolution) {
  const slot = numberSlot(state, n);
  if (slot.state === NUMBER_STATE.LOCKED) {
    throw new Error(`${n}번은 이미 확정된 번호입니다.`);
  }
  const p = participantById(state, participantId);
  if (p.status === PARTICIPANT_STATUS.CONFIRMED || p.finalNumber !== null) {
    throw new Error(`${p.name} 님은 이미 번호를 배정받았습니다.`);
  }
  slot.state = NUMBER_STATE.LOCKED;
  slot.ownerId = participantId;
  p.finalNumber = n;
  p.status = PARTICIPANT_STATUS.CONFIRMED;
  p.resolution = resolution;
}

function finishGame(state) {
  // 남은 BATTLE 번호가 있으면 안 된다 (모든 그룹은 반드시 주인이 생긴다)
  const stuck = state.numbers.filter((s) => s.state === NUMBER_STATE.BATTLE);
  if (stuck.length) throw new Error(`주인이 정해지지 않은 번호가 남아 있습니다: ${stuck.map((s) => s.n).join(', ')}`);
  assertIntegrity(state);
  state.phase = PHASE.RESULT;
  state.finishedAt = Date.now();
  pushLog(state, '모든 번호 배정 완료');
}

function pushLog(state, message) {
  state.log.push({ at: Date.now(), message });
  if (state.log.length > 200) state.log.shift();
}

/* ===================== 무결성 검사 ===================== */

/**
 * 게임 종료 시점의 필수 조건을 검사한다. 테스트와 런타임 양쪽에서 사용.
 * 위반 시 예외를 던져 잘못된 상태가 화면까지 흘러가지 않게 한다.
 */
export function assertIntegrity(state) {
  const problems = checkIntegrity(state);
  if (problems.length) throw new Error(`게임 상태 오류:\n- ${problems.join('\n- ')}`);
  return true;
}

export function checkIntegrity(state, { final = true } = {}) {
  const problems = [];
  const seen = new Map();

  for (const p of state.participants) {
    if (final && p.finalNumber === null) {
      problems.push(`${p.name} 님에게 번호가 배정되지 않았습니다.`);
      continue;
    }
    if (p.finalNumber === null) continue;
    if (p.finalNumber < 1 || p.finalNumber > state.totalNumbers) {
      problems.push(`${p.name} 님의 번호(${p.finalNumber})가 범위를 벗어났습니다.`);
    }
    if (seen.has(p.finalNumber)) {
      problems.push(`${p.finalNumber}번이 ${seen.get(p.finalNumber)} / ${p.name} 두 명에게 배정되었습니다.`);
    }
    seen.set(p.finalNumber, p.name);
    const slot = state.numbers[p.finalNumber - 1];
    if (slot.state !== NUMBER_STATE.LOCKED || slot.ownerId !== p.id) {
      problems.push(`${p.finalNumber}번 슬롯과 ${p.name} 님의 배정이 어긋납니다.`);
    }
  }

  for (const slot of state.numbers) {
    if (slot.state === NUMBER_STATE.LOCKED && !slot.ownerId) {
      problems.push(`${slot.n}번이 주인 없이 LOCK 되었습니다.`);
    }
    if (slot.state !== NUMBER_STATE.LOCKED && slot.ownerId) {
      problems.push(`${slot.n}번에 주인이 있는데 LOCK 상태가 아닙니다.`);
    }
  }

  if (state.participants.length > state.totalNumbers) {
    problems.push('참가자 수가 전체 번호 개수를 초과했습니다.');
  }
  return problems;
}

/** 진행자 화면용 요약 (비밀 선택 내용은 포함하지 않는다) */
export function publicSummary(state) {
  const revealed = state.phase !== PHASE.SECRET_SELECTION && state.phase !== PHASE.SETUP;
  return {
    phase: state.phase,
    totalNumbers: state.totalNumbers,
    participantCount: state.participants.length,
    confirmed: state.participants.filter((p) => p.status === PARTICIPANT_STATUS.CONFIRMED).length,
    unassigned: unassignedParticipants(state).length,
    emptyCount: revealed ? emptyNumbers(state).length : null,
    battleGroups: state.battle ? state.battle.groups.length : null,
    battleIndex: state.battle ? state.battle.index : null,
  };
}
