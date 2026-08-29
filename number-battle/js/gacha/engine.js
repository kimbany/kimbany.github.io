/* 가챠 뽑기 — 순수 로직 (DOM 의존 없음)
 *
 * 진행자가 정한 개수 N 만큼 캡슐 1~N 을 넣어두고, 한 번 돌릴 때마다
 * "아직 안 나온 숫자" 중에서 균등 확률로 하나를 꺼낸다.
 *
 * 확률 보장:
 *  - 매 뽑기마다 남은 숫자 전체에서 균등하게 고르므로 (비복원 추출)
 *    모든 배출 순서가 같은 확률로 나온다 = 각 숫자가 특정 순번에 나올 확률도 모두 같다.
 *  - 뽑은 숫자는 remaining 에서 제거하므로 중복이 원천적으로 불가능하다.
 *  - remaining 은 "정렬된 남은 숫자"만 들고 있고 미리 섞어두지 않는다.
 *    (섞어서 저장하면 localStorage 를 열어 다음에 나올 순서를 볼 수 있다)
 */

export const GACHA_VERSION = 1;

export const GACHA_PHASE = {
  SETUP: 'SETUP',     // 개수 설정
  READY: 'READY',     // 뽑기 대기
  REVEAL: 'REVEAL',   // 캡슐 공개 중
  DONE: 'DONE',       // 전부 소진
};

export const GACHA_MIN = 2;
export const GACHA_MAX = 100;

export function createGacha({ totalNumbers, useNames = false } = {}) {
  const n = Number(totalNumbers);
  if (!Number.isInteger(n) || n < GACHA_MIN || n > GACHA_MAX) {
    throw new Error(`숫자 개수는 ${GACHA_MIN}~${GACHA_MAX} 사이의 정수여야 합니다.`);
  }
  return {
    version: GACHA_VERSION,
    kind: 'gacha',
    phase: GACHA_PHASE.READY,
    totalNumbers: n,
    remaining: Array.from({ length: n }, (_, i) => i + 1),
    draws: [],      // [{ seq, number, name, at }]
    current: null,  // 방금 뽑은 것 (공개 연출 중)
    useNames,
    createdAt: Date.now(),
  };
}

export function emptyGachaSetup() {
  return { version: GACHA_VERSION, kind: 'gacha', phase: GACHA_PHASE.SETUP };
}

export function remainingCount(state) {
  return state.remaining ? state.remaining.length : 0;
}

export function drawnNumbers(state) {
  return state.draws.map((d) => d.number);
}

/** 한 번 뽑는다. 남은 숫자 중 균등 확률, 중복 없음. */
export function drawCapsule(state, { name = '', rng = Math.random } = {}) {
  if (state.phase !== GACHA_PHASE.READY) {
    throw new Error('지금은 뽑을 수 없습니다.');
  }
  if (!state.remaining.length) {
    throw new Error('남은 숫자가 없습니다.');
  }
  const label = String(name || '').trim();
  if (label.length > 12) throw new Error('이름은 12자 이하로 입력해 주세요.');

  const index = Math.floor(rng() * state.remaining.length);
  if (index < 0 || index >= state.remaining.length) {
    throw new Error('뽑기에 실패했습니다. 다시 시도해 주세요.');
  }
  const [number] = state.remaining.splice(index, 1);

  const entry = { seq: state.draws.length + 1, number, name: label, at: Date.now() };
  state.draws.push(entry);
  state.current = entry;
  state.phase = GACHA_PHASE.REVEAL;
  assertGachaIntegrity(state);
  return entry;
}

/** 공개 연출을 닫고 다음 뽑기로 (남은 게 없으면 종료) */
export function closeCapsule(state) {
  if (state.phase !== GACHA_PHASE.REVEAL) throw new Error('공개 중이 아닙니다.');
  state.current = null;
  state.phase = state.remaining.length ? GACHA_PHASE.READY : GACHA_PHASE.DONE;
  return state.phase;
}

/** 마지막 뽑기 취소 (진행자용 실수 복구) */
export function undoLastDraw(state) {
  if (!state.draws.length) throw new Error('취소할 뽑기가 없습니다.');
  const last = state.draws.pop();
  state.remaining.push(last.number);
  state.remaining.sort((a, b) => a - b);
  state.current = null;
  state.phase = GACHA_PHASE.READY;
  assertGachaIntegrity(state);
  return last;
}

export function checkGachaIntegrity(state) {
  const problems = [];
  const drawn = drawnNumbers(state);

  if (new Set(drawn).size !== drawn.length) {
    problems.push('같은 숫자가 두 번 나왔습니다.');
  }
  for (const n of drawn) {
    if (!Number.isInteger(n) || n < 1 || n > state.totalNumbers) {
      problems.push(`범위를 벗어난 숫자입니다: ${n}`);
    }
  }
  if (new Set(state.remaining).size !== state.remaining.length) {
    problems.push('남은 숫자에 중복이 있습니다.');
  }
  const overlap = state.remaining.filter((n) => drawn.includes(n));
  if (overlap.length) {
    problems.push(`이미 나온 숫자가 아직 통에 남아 있습니다: ${overlap.join(', ')}`);
  }
  if (drawn.length + state.remaining.length !== state.totalNumbers) {
    problems.push(`숫자 총합이 맞지 않습니다: 뽑음 ${drawn.length} + 남음 ${state.remaining.length} ≠ ${state.totalNumbers}`);
  }
  const all = new Set([...drawn, ...state.remaining]);
  if (all.size !== state.totalNumbers) {
    problems.push('1~N 숫자가 전부 들어있지 않습니다.');
  }
  state.draws.forEach((d, i) => {
    if (d.seq !== i + 1) problems.push(`뽑기 순번이 어긋났습니다: ${d.seq} (기대 ${i + 1})`);
  });
  return problems;
}

export function assertGachaIntegrity(state) {
  const problems = checkGachaIntegrity(state);
  if (problems.length) throw new Error(`가챠 상태 오류:\n- ${problems.join('\n- ')}`);
  return true;
}

export function gachaSummary(state) {
  return {
    phase: state.phase,
    total: state.totalNumbers,
    drawn: state.draws.length,
    remaining: remainingCount(state),
    nextChance: remainingCount(state) ? `1 / ${remainingCount(state)}` : '-',
  };
}
