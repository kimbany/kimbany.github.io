/* 시나리오 테스트 — node tests/engine.test.mjs
 * 모든 케이스에서 "참가자 전원이 서로 다른 번호를 정확히 하나씩" 갖는지 검증한다.
 */
import {
  PHASE, NUMBER_STATE, PARTICIPANT_STATUS, RESOLUTION,
  createGame, addParticipant, closeSelection, emptyNumbers, checkIntegrity,
} from '../js/engine.js';
import { seededRng, setupGame, drive, assignment } from './harness.mjs';

let pass = 0;
let fail = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    pass += 1;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    fail += 1;
    failures.push({ name, err });
    console.log(`  ❌ ${name}\n     ${err.message.split('\n').join('\n     ')}`);
  }
}
function section(title) { console.log(`\n▍${title}`); }
function assert(cond, msg) { if (!cond) throw new Error(msg || '조건 실패'); }
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg || '값 불일치'}\n     기대: ${b}\n     실제: ${a}`);
}
function throws(fn, needle) {
  let thrown = null;
  try { fn(); } catch (e) { thrown = e; }
  assert(thrown, '예외가 발생해야 합니다.');
  if (needle) assert(thrown.message.includes(needle), `예외 메시지에 "${needle}" 포함 기대, 실제: ${thrown.message}`);
}

/** 최종 상태 공통 검증 */
function verifyFinished(state) {
  eq(state.phase, PHASE.RESULT, '게임이 RESULT 단계로 끝나야 합니다.');
  assert(checkIntegrity(state).length === 0, '무결성 검사 통과');

  const numbers = state.participants.map((p) => p.finalNumber);
  assert(numbers.every((n) => Number.isInteger(n) && n >= 1 && n <= state.totalNumbers),
    '모든 번호가 1~N 범위여야 합니다.');
  eq(new Set(numbers).size, state.participants.length, '번호가 서로 겹치면 안 됩니다.');
  assert(state.participants.every((p) => p.status === PARTICIPANT_STATUS.CONFIRMED),
    '모든 참가자가 CONFIRMED 여야 합니다.');

  const locked = state.numbers.filter((s) => s.state === NUMBER_STATE.LOCKED);
  eq(locked.length, state.participants.length, 'LOCKED 번호 수 = 참가자 수');
  eq(emptyNumbers(state).length, state.totalNumbers - state.participants.length,
    '남은 빈 번호 = N - 참가자 수');
  assert(state.numbers.every((s) => s.state !== NUMBER_STATE.BATTLE),
    'BATTLE 상태로 남은 번호가 없어야 합니다.');
}

/* ============ 설정 / 비밀 선택 ============ */
section('기본 설정 · 비밀 선택 규칙');

test('참가자 수는 번호 개수를 넘을 수 없다', () => {
  const s = createGame({ totalNumbers: 3 });
  addParticipant(s, 'a', 1); addParticipant(s, 'b', 1); addParticipant(s, 'c', 1);
  throws(() => addParticipant(s, 'd', 2), '넘을 수 없습니다');
});

test('이미 선택된 번호도 다른 참가자가 선택할 수 있다 (규칙 3)', () => {
  const s = createGame({ totalNumbers: 5 });
  addParticipant(s, 'a', 3);
  addParticipant(s, 'b', 3);
  addParticipant(s, 'c', 3);
  eq(s.participants.length, 3);
});

test('선택 종료 전에는 번호 상태가 전부 EMPTY (인원수 비공개, 규칙 2·4)', () => {
  const s = createGame({ totalNumbers: 5 });
  addParticipant(s, 'a', 3); addParticipant(s, 'b', 3);
  assert(s.numbers.every((n) => n.state === NUMBER_STATE.EMPTY && n.ownerId === null),
    '공개 전에는 어떤 번호에도 흔적이 남지 않아야 합니다.');
  eq(emptyNumbers(s).length, 5);
});

test('잘못된 입력은 거부한다', () => {
  const s = createGame({ totalNumbers: 5 });
  throws(() => addParticipant(s, '   ', 1), '이름');
  throws(() => addParticipant(s, 'a', 0), '올바른 번호');
  throws(() => addParticipant(s, 'a', 6), '올바른 번호');
  addParticipant(s, 'a', 1);
  throws(() => addParticipant(s, 'a', 2), '같은 이름');
});

test('번호 개수 범위를 벗어나면 게임을 만들 수 없다', () => {
  throws(() => createGame({ totalNumbers: 1 }), '번호 개수');
  throws(() => createGame({ totalNumbers: 51 }), '번호 개수');
  throws(() => createGame({ totalNumbers: 5.5 }), '번호 개수');
});

/* ============ CASE A ~ D ============ */
section('CASE A~D — 중복 구성별 전체 진행');

test('CASE A: 11개 번호 / 7명 / 중복 없음 → 전원 단독 확정', () => {
  const rng = seededRng(1);
  const s = setupGame({
    total: 11, rng,
    picks: [['현우', 1], ['영희', 3], ['철수', 5], ['민수', 6], ['지수', 10], ['준호', 8], ['수진', 11]],
  });
  drive(s, { rng });
  verifyFinished(s);
  assert(s.participants.every((p) => p.resolution === RESOLUTION.SOLO), '전원 SOLO 확정');
  assert(s.participants.every((p) => p.finalNumber === p.originalNumber), '최초 선택 = 최종 번호');
  assert(s.battle.groups.length === 0, '쟁탈전 그룹이 없어야 합니다.');
});

test('CASE B: 11개 번호 / 7명 / 한 번호에 2명 중복', () => {
  const rng = seededRng(2);
  const s = setupGame({
    total: 11, rng,
    picks: [['현우', 1], ['영희', 3], ['준호', 3], ['철수', 5], ['민수', 6], ['지수', 10], ['수진', 11]],
  });
  drive(s, { rng, onKeepPass: () => 'KEEP' });
  verifyFinished(s);
  eq(s.battle.groups.length, 1, '중복 그룹 1개');
  eq(s.battle.groups[0].number, 3);
  const loser = s.participants.find((p) => p.originalNumber === 3 && p.finalNumber !== 3);
  assert(loser && loser.resolution === RESOLUTION.FINAL, '패자는 FINAL 로 넘어가 빈 번호를 받는다.');
});

test('CASE C: 11개 번호 / 7명 / 한 번호에 5명 중복', () => {
  const rng = seededRng(3);
  const s = setupGame({
    total: 11, rng,
    picks: [['A', 7], ['B', 7], ['C', 7], ['D', 7], ['E', 7], ['현우', 1], ['지수', 10]],
  });
  drive(s, { rng, onKeepPass: () => 'KEEP' });
  verifyFinished(s);
  eq(s.battle.groups.length, 1);
  eq(s.battle.groups[0].memberIds.length, 5, '5명 그룹');
  eq(s.battle.groups[0].ranking.length, 5, '5명 전원 순위가 나와야 한다 (규칙 9)');
  const seven = s.participants.filter((p) => p.finalNumber === 7);
  eq(seven.length, 1, '7번 주인은 정확히 1명');
  eq(seven[0].resolution, RESOLUTION.KEEP);
});

test('CASE D: 11개 번호 / 11명 / 여러 번호에서 동시 중복 (N = P)', () => {
  const rng = seededRng(4);
  const s = setupGame({
    total: 11, rng,
    picks: [
      ['영희', 3], ['준호', 3],
      ['철수', 7], ['민수', 7], ['수진', 7],
      ['A', 9], ['B', 9], ['C', 9], ['D', 9],
      ['현우', 1], ['지수', 10],
    ],
  });
  const trace = [];
  drive(s, { rng, trace, onKeepPass: (ctx) => (ctx.pointer === 0 ? 'PASS' : 'KEEP') });
  verifyFinished(s);
  eq(s.battle.groups.map((g) => g.number), [3, 7, 9], '중복 그룹은 번호 오름차순으로 처리');
  eq(emptyNumbers(s).length, 0, 'N = P 이면 남는 번호가 없다');
});

/* ============ CASE E ~ H : KEEP/PASS 분기 ============ */
section('CASE E~H — KEEP / PASS 시나리오');

function battleGroupOf5(seed, onKeepPass) {
  const rng = seededRng(seed);
  const s = setupGame({
    total: 11, rng,
    picks: [['A', 7], ['B', 7], ['C', 7], ['D', 7], ['E', 7], ['현우', 1], ['지수', 10]],
  });
  const trace = [];
  drive(s, { rng, trace, onKeepPass });
  verifyFinished(s);
  return { state: s, trace, ranking: s.battle.groups[0].ranking.map((id) => s.participants.find((p) => p.id === id)) };
}

test('CASE E: 1위가 바로 KEEP', () => {
  const { state, ranking } = battleGroupOf5(11, () => 'KEEP');
  const first = ranking[0];
  eq(first.finalNumber, 7, '1위가 7번을 가져간다');
  eq(first.resolution, RESOLUTION.KEEP);
  assert(ranking.slice(1).every((p) => p.resolution === RESOLUTION.FINAL),
    '나머지 4명은 FINAL 경쟁으로 이동 (규칙 13)');
});

test('CASE F: 1위 PASS → 2위 KEEP', () => {
  const { state, ranking } = battleGroupOf5(12, (ctx) => (ctx.pointer === 0 ? 'PASS' : 'KEEP'));
  eq(ranking[0].resolution, RESOLUTION.PASS);
  assert(ranking[0].finalNumber !== 7, '1위는 빈 번호를 가져간다');
  assert(ranking[0].finalNumber !== ranking[0].originalNumber, 'PASS 이므로 최초 선택과 달라진다');
  eq(ranking[1].finalNumber, 7, '2위가 7번 확정');
  eq(ranking[1].resolution, RESOLUTION.KEEP);
  assert(ranking.slice(2).every((p) => p.resolution === RESOLUTION.FINAL), '3~5위는 FINAL');
});

test('CASE G: 1위 PASS → 2위 PASS → 3위 KEEP', () => {
  const { state, ranking } = battleGroupOf5(13, (ctx) => (ctx.pointer < 2 ? 'PASS' : 'KEEP'));
  eq(ranking[0].resolution, RESOLUTION.PASS);
  eq(ranking[1].resolution, RESOLUTION.PASS);
  eq(ranking[2].finalNumber, 7);
  eq(ranking[2].resolution, RESOLUTION.KEEP);
  assert(ranking[0].finalNumber !== ranking[1].finalNumber, 'PASS 한 두 사람이 같은 번호를 가질 수 없다');
});

test('CASE H: 전원 PASS → 마지막 순위 자동 KEEP (규칙 14)', () => {
  const { state, ranking, trace } = battleGroupOf5(14, () => 'PASS');
  eq(ranking.slice(0, 4).map((p) => p.resolution), Array(4).fill(RESOLUTION.PASS));
  eq(ranking[4].finalNumber, 7, '마지막 참가자가 7번을 가져간다');
  eq(ranking[4].resolution, RESOLUTION.AUTO_KEEP);
  assert(trace[trace.length - 1].startsWith('AUTO_KEEP'), '마지막 동작이 자동 KEEP');
  // 전원 PASS 라 FINAL 경쟁 대상이 없다
  eq(state.final, null, 'FINAL 경쟁이 필요 없다');
});

/* ============ 경계/불변식 ============ */
section('경계 조건 · 불변식');

test('마지막 순위에게는 PASS 를 제안하지 않는다', () => {
  const rng = seededRng(21);
  const s = setupGame({ total: 4, rng, picks: [['A', 2], ['B', 2], ['C', 2], ['D', 1]] });
  const seen = [];
  drive(s, {
    rng,
    onKeepPass: (ctx) => { seen.push({ p: ctx.pointer, canPass: ctx.canPass, isLast: ctx.isLast }); return 'PASS'; },
  });
  verifyFinished(s);
  assert(seen.every((x) => !x.isLast), '마지막 순위는 onKeepPass 로 오지 않는다 (자동 KEEP)');
  assert(seen.every((x) => x.canPass), 'PASS 를 물어보는 시점에는 항상 빈 번호가 남아 있다');
});

test('불변식: PASS 를 물어보는 순간 빈 번호 풀은 절대 비지 않는다 (N = P 최악 케이스)', () => {
  const rng = seededRng(22);
  // 6개 번호 / 6명 전원이 같은 번호 선택 → 5명이 연속 PASS 해도 번호가 모자라지 않아야 한다
  const s = setupGame({
    total: 6, rng,
    picks: [['A', 4], ['B', 4], ['C', 4], ['D', 4], ['E', 4], ['F', 4]],
  });
  drive(s, {
    rng,
    onKeepPass: (ctx) => { assert(ctx.pool.length > 0, 'PASS 제안 시 빈 번호 존재'); return 'PASS'; },
  });
  verifyFinished(s);
  eq(emptyNumbers(s).length, 0);
});

test('참가자 수 < 번호 개수: 남는 번호가 정확히 N-P 개', () => {
  const rng = seededRng(23);
  const s = setupGame({
    total: 11, rng,
    picks: [['A', 2], ['B', 2], ['C', 5], ['D', 9]],
  });
  drive(s, { rng });
  verifyFinished(s);
  eq(emptyNumbers(s).length, 7);
});

test('LOCK 된 번호는 다시 선택할 수 없다 (규칙 17)', () => {
  const rng = seededRng(24);
  const s = setupGame({ total: 5, rng, picks: [['A', 1], ['B', 1], ['C', 3]] });
  throws(() => drive(s, {
    rng,
    onKeepPass: () => 'PASS',
    pickEmpty: () => 3, // 이미 C 가 단독 확정한 번호를 억지로 고르게 한다
  }), '이미 확정된 번호');
});

test('동점 발생 시 동점자끼리만 재대결한다 (7항)', () => {
  const rng = seededRng(25);
  const s = setupGame({ total: 8, rng, picks: [['A', 4], ['B', 4], ['C', 4], ['D', 1]] });
  // 첫 라운드를 전원 동점으로 만들고, 재대결부터는 정상 진행
  drive(s, { rng, tiePlan: (roundNo) => roundNo === 1 });
  verifyFinished(s);
  const resolver = s.battle.groups[0];
  eq(resolver.ranking.length, 3);
  assert(s.battle.resolver.history.length >= 2, '재대결 라운드가 실제로 한 번 더 열려야 한다');
});

test('미확정자가 1명이면 FINAL 미니게임 없이 바로 번호를 고른다', () => {
  const rng = seededRng(26);
  const s = setupGame({ total: 6, rng, picks: [['A', 2], ['B', 2], ['C', 5]] });
  drive(s, { rng, onKeepPass: () => 'KEEP' });
  verifyFinished(s);
  eq(s.final.order.length, 1);
  eq(s.final.resolver.history.length, 0, '미니게임 라운드가 열리지 않아야 한다');
});

test('중복 그룹이 여러 개일 때 각 그룹마다 주인이 정확히 1명 생긴다', () => {
  const rng = seededRng(27);
  const s = setupGame({
    total: 12, rng,
    picks: [
      ['A', 2], ['B', 2],
      ['C', 5], ['D', 5], ['E', 5],
      ['F', 8], ['G', 8],
      ['H', 11],
    ],
  });
  drive(s, { rng, onKeepPass: (ctx) => (ctx.pointer === 0 ? 'PASS' : 'KEEP') });
  verifyFinished(s);
  for (const g of s.battle.groups) {
    const owner = s.participants.filter((p) => p.finalNumber === g.number);
    eq(owner.length, 1, `${g.number}번 주인은 1명`);
  }
});

/* ============ 무작위 대량 검증 ============ */
section('무작위 시나리오 400회');

test('임의 구성 × 임의 KEEP/PASS 400회 — 항상 전원이 서로 다른 번호 1개', () => {
  for (let seed = 1; seed <= 400; seed += 1) {
    const rng = seededRng(seed * 7919);
    const total = 2 + Math.floor(rng() * 14); // 2~15
    const count = 2 + Math.floor(rng() * (total - 1)); // 2~total
    const picks = [];
    for (let i = 0; i < count; i += 1) {
      picks.push([`P${i}`, 1 + Math.floor(rng() * total)]);
    }
    const s = setupGame({ total, rng, picks });
    try {
      drive(s, {
        rng,
        onKeepPass: () => (rng() < 0.5 ? 'PASS' : 'KEEP'),
        pickEmpty: (pool) => pool[Math.floor(rng() * pool.length)],
        tiePlan: () => rng() < 0.15,
      });
      verifyFinished(s);
    } catch (err) {
      throw new Error(`seed=${seed} total=${total} count=${count}\n  picks=${JSON.stringify(picks)}\n  ${err.message}`);
    }
  }
});

test('미니게임을 서로 바꿔도 동작한다 (모듈 교체 가능성)', () => {
  for (const [battleGameId, finalGameId] of [
    ['fate-cards', 'lucky-timing'],
    ['fate-cards', 'fate-cards'],
    ['lucky-timing', 'lucky-timing'],
  ]) {
    const rng = seededRng(99);
    const s = setupGame({
      total: 10, battleGameId, finalGameId, rng,
      picks: [['A', 3], ['B', 3], ['C', 3], ['D', 7], ['E', 7], ['F', 1]],
    });
    drive(s, { rng, onKeepPass: (ctx) => (ctx.pointer === 0 ? 'PASS' : 'KEEP') });
    verifyFinished(s);
  }
});

/* ============ 결과 ============ */
console.log(`\n${'─'.repeat(50)}`);
console.log(`통과 ${pass} / 실패 ${fail}`);
if (fail) {
  console.log('\n실패 상세:');
  for (const f of failures) console.log(`\n[${f.name}]\n${f.err.stack}`);
  process.exit(1);
}
