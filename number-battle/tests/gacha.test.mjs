/* 가챠 뽑기 로직 테스트 — node tests/gacha.test.mjs
 * 핵심: (1) 중복 없음  (2) 각 숫자가 나올 확률이 동일  (3) 1~N 이 빠짐없이 나옴
 */
import {
  GACHA_PHASE, createGacha, drawCapsule, closeCapsule, undoLastDraw,
  checkGachaIntegrity, drawnNumbers, remainingCount, gachaSummary,
} from '../js/gacha/engine.js';
import { seededRng } from './harness.mjs';

let pass = 0; let fail = 0;
const failures = [];
function test(name, fn) {
  try { fn(); pass += 1; console.log(`  ✅ ${name}`); }
  catch (err) { fail += 1; failures.push({ name, err }); console.log(`  ❌ ${name}\n     ${err.message.split('\n').join('\n     ')}`); }
}
function section(t) { console.log(`\n▍${t}`); }
function assert(c, m) { if (!c) throw new Error(m || '조건 실패'); }
function eq(a, b, m) {
  const x = JSON.stringify(a); const y = JSON.stringify(b);
  if (x !== y) throw new Error(`${m || '값 불일치'}\n     기대: ${y}\n     실제: ${x}`);
}
function throws(fn, needle) {
  let e = null;
  try { fn(); } catch (err) { e = err; }
  assert(e, '예외가 발생해야 합니다.');
  if (needle) assert(e.message.includes(needle), `"${needle}" 포함 기대, 실제: ${e.message}`);
}

/** 통을 끝까지 비우고 나온 순서를 돌려준다 */
function drainAll(state, rng) {
  const out = [];
  while (state.phase !== GACHA_PHASE.DONE) {
    const entry = drawCapsule(state, { rng });
    out.push(entry.number);
    const problems = checkGachaIntegrity(state);
    if (problems.length) throw new Error(`뽑기 ${entry.seq}회차 무결성 실패:\n${problems.join('\n')}`);
    closeCapsule(state);
  }
  return out;
}

/* ============ 기본 ============ */
section('기본 동작');

test('진행자가 정한 개수만큼 1~N 이 통에 들어간다', () => {
  const s = createGacha({ totalNumbers: 11 });
  eq(s.remaining, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  eq(s.totalNumbers, 11);
  eq(s.phase, GACHA_PHASE.READY);
  eq(remainingCount(s), 11);
});

test('개수 범위를 벗어나면 만들 수 없다', () => {
  throws(() => createGacha({ totalNumbers: 1 }), '숫자 개수');
  throws(() => createGacha({ totalNumbers: 101 }), '숫자 개수');
  throws(() => createGacha({ totalNumbers: 7.5 }), '숫자 개수');
  throws(() => createGacha({ totalNumbers: 'abc' }), '숫자 개수');
});

test('한 번 뽑으면 남은 개수가 하나 줄고 공개 단계로 간다', () => {
  const s = createGacha({ totalNumbers: 5 });
  const e = drawCapsule(s, { rng: seededRng(1) });
  eq(s.phase, GACHA_PHASE.REVEAL);
  eq(remainingCount(s), 4);
  eq(e.seq, 1);
  assert(e.number >= 1 && e.number <= 5, '뽑힌 숫자가 범위 안');
  assert(!s.remaining.includes(e.number), '뽑힌 숫자는 통에서 빠진다');
});

test('공개 중에는 또 뽑을 수 없다', () => {
  const s = createGacha({ totalNumbers: 5 });
  drawCapsule(s, { rng: seededRng(2) });
  throws(() => drawCapsule(s), '뽑을 수 없습니다');
});

test('전부 뽑으면 DONE, 더는 뽑을 수 없다', () => {
  const s = createGacha({ totalNumbers: 6 });
  drainAll(s, seededRng(3));
  eq(s.phase, GACHA_PHASE.DONE);
  eq(remainingCount(s), 0);
  throws(() => drawCapsule(s), '뽑을 수 없습니다');
});

test('이름을 붙여 기록할 수 있다 (선택)', () => {
  const s = createGacha({ totalNumbers: 4, useNames: true });
  const e = drawCapsule(s, { name: '  현우 ', rng: seededRng(4) });
  eq(e.name, '현우', '앞뒤 공백은 제거된다');
  throws(() => { closeCapsule(s); drawCapsule(s, { name: '가'.repeat(13) }); }, '12자 이하');
});

/* ============ 중복 없음 ============ */
section('중복 없음 · 빠짐없이 배출');

test('N=11 을 끝까지 뽑으면 1~11 이 정확히 한 번씩 나온다', () => {
  const s = createGacha({ totalNumbers: 11 });
  const order = drainAll(s, seededRng(11));
  eq(order.length, 11);
  eq(new Set(order).size, 11, '중복 없음');
  eq(order.slice().sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], '1~11 전부 배출');
});

test('여러 크기 × 500회 반복 — 항상 중복 없이 전부 배출', () => {
  for (let seed = 1; seed <= 500; seed += 1) {
    const rng = seededRng(seed * 7919);
    const n = 2 + Math.floor(rng() * 40); // 2~41
    const s = createGacha({ totalNumbers: n });
    const order = drainAll(s, rng);
    if (order.length !== n) throw new Error(`seed=${seed} n=${n}: ${order.length}개만 배출`);
    if (new Set(order).size !== n) throw new Error(`seed=${seed} n=${n}: 중복 발생 ${order.join(',')}`);
    const sorted = order.slice().sort((a, b) => a - b);
    for (let i = 0; i < n; i += 1) {
      if (sorted[i] !== i + 1) throw new Error(`seed=${seed} n=${n}: ${i + 1} 이 빠짐`);
    }
  }
});

test('매 뽑기 직후 무결성 검사를 통과한다 (drainAll 내부에서 확인)', () => {
  const s = createGacha({ totalNumbers: 20 });
  drainAll(s, seededRng(77));
  eq(checkGachaIntegrity(s), []);
});

/* ============ 확률 균등 ============ */
section('확률 균등');

test('첫 뽑기에서 각 숫자가 나올 확률이 균등하다 (N=10, 60000회, χ²)', () => {
  const N = 10;
  const TRIALS = 60000;
  const rng = seededRng(20260829);
  const counts = new Array(N + 1).fill(0);
  for (let i = 0; i < TRIALS; i += 1) {
    const s = createGacha({ totalNumbers: N });
    counts[drawCapsule(s, { rng }).number] += 1;
  }
  const expected = TRIALS / N;
  let chi2 = 0;
  for (let n = 1; n <= N; n += 1) chi2 += ((counts[n] - expected) ** 2) / expected;
  // 자유도 9, 유의수준 0.001 임계값 = 27.88
  assert(chi2 < 27.88, `χ² = ${chi2.toFixed(2)} — 균등 분포로 보기 어렵습니다.\n     분포: ${counts.slice(1).join(', ')}`);
  const maxDev = Math.max(...counts.slice(1).map((c) => Math.abs(c / expected - 1)));
  assert(maxDev < 0.05, `기대값 대비 편차 ${(maxDev * 100).toFixed(1)}% 로 너무 큽니다.`);
});

test('모든 순번에서 균등하다 — 숫자×순번 교차표 검사 (N=6, 30000회)', () => {
  const N = 6;
  const TRIALS = 30000;
  const rng = seededRng(4242);
  // grid[숫자][순번] = 횟수
  const grid = Array.from({ length: N + 1 }, () => new Array(N + 1).fill(0));
  for (let i = 0; i < TRIALS; i += 1) {
    const s = createGacha({ totalNumbers: N });
    drainAll(s, rng).forEach((num, idx) => { grid[num][idx + 1] += 1; });
  }
  const expected = TRIALS / N;
  for (let num = 1; num <= N; num += 1) {
    let chi2 = 0;
    for (let seq = 1; seq <= N; seq += 1) chi2 += ((grid[num][seq] - expected) ** 2) / expected;
    // 자유도 5, 유의수준 0.001 임계값 = 20.52
    assert(chi2 < 20.52, `숫자 ${num} 의 순번 분포가 치우쳤습니다. χ²=${chi2.toFixed(2)}\n     ${grid[num].slice(1).join(', ')}`);
  }
});

test('남은 게 k개면 다음에 특정 숫자가 나올 확률은 정확히 1/k', () => {
  const N = 5;
  const TRIALS = 40000;
  const rng = seededRng(999);
  const counts = new Map();
  for (let i = 0; i < TRIALS; i += 1) {
    const s = createGacha({ totalNumbers: N });
    // 1, 2 를 먼저 빼고(남은 3개) 세 번째 뽑기를 관찰
    s.remaining = [3, 4, 5];
    s.draws = [{ seq: 1, number: 1, name: '', at: 0 }, { seq: 2, number: 2, name: '', at: 0 }];
    const n = drawCapsule(s, { rng }).number;
    counts.set(n, (counts.get(n) || 0) + 1);
  }
  eq([...counts.keys()].sort(), [3, 4, 5], '남은 숫자만 나온다');
  const expected = TRIALS / 3;
  for (const [n, c] of counts) {
    const dev = Math.abs(c / expected - 1);
    assert(dev < 0.04, `숫자 ${n} 확률 편차 ${(dev * 100).toFixed(1)}% (기대 1/3)`);
  }
  eq(gachaSummary({ ...createGacha({ totalNumbers: 5 }), remaining: [3, 4, 5] }).nextChance, '1 / 3');
});

/* ============ 진행자 기능 ============ */
section('진행자 기능 · 복구');

test('마지막 뽑기를 취소하면 숫자가 통으로 돌아간다', () => {
  const s = createGacha({ totalNumbers: 8 });
  const e = drawCapsule(s, { rng: seededRng(5) });
  closeCapsule(s);
  eq(remainingCount(s), 7);
  const undone = undoLastDraw(s);
  eq(undone.number, e.number);
  eq(remainingCount(s), 8);
  assert(s.remaining.includes(e.number), '취소한 숫자가 통에 돌아온다');
  eq(s.draws.length, 0);
  eq(checkGachaIntegrity(s), []);
  // 취소 후 다시 끝까지 뽑아도 정상
  const order = drainAll(s, seededRng(6));
  eq(new Set(order).size, 8);
});

test('취소할 게 없으면 거부한다', () => {
  const s = createGacha({ totalNumbers: 3 });
  throws(() => undoLastDraw(s), '취소할 뽑기가 없습니다');
});

test('저장/복원(JSON 왕복) 후에도 이어서 뽑을 수 있다', () => {
  const s = createGacha({ totalNumbers: 9 });
  const rng = seededRng(8);
  for (let i = 0; i < 4; i += 1) { drawCapsule(s, { rng }); closeCapsule(s); }
  const restored = JSON.parse(JSON.stringify(s));
  eq(checkGachaIntegrity(restored), []);
  const order = drainAll(restored, seededRng(9));
  eq(order.length, 5, '남은 5개를 이어서 뽑는다');
  const all = [...drawnNumbers(restored)];
  eq(new Set(all).size, 9, '전체 9개가 중복 없이 배출');
});

test('저장된 데이터에 다음 순서가 미리 들어있지 않다', () => {
  const s = createGacha({ totalNumbers: 12 });
  drawCapsule(s, { rng: seededRng(10) });
  closeCapsule(s);
  const sorted = s.remaining.slice().sort((a, b) => a - b);
  eq(s.remaining, sorted, 'remaining 은 정렬 상태로만 저장된다 (미리 섞어두지 않음)');
});

test('무결성 검사가 조작된 상태를 잡아낸다', () => {
  const s = createGacha({ totalNumbers: 5 });
  drawCapsule(s, { rng: seededRng(12) });
  closeCapsule(s);
  const dup = JSON.parse(JSON.stringify(s));
  dup.remaining.push(dup.draws[0].number); // 이미 나온 숫자를 통에 되돌림
  assert(checkGachaIntegrity(dup).some((p) => p.includes('이미 나온 숫자')), '중복 배출 위험을 감지');
  const broken = JSON.parse(JSON.stringify(s));
  broken.remaining.pop();
  assert(checkGachaIntegrity(broken).some((p) => p.includes('총합')), '개수 불일치를 감지');
});

console.log(`\n${'─'.repeat(50)}`);
console.log(`통과 ${pass} / 실패 ${fail}`);
if (fail) {
  console.log('\n실패 상세:');
  for (const f of failures) console.log(`\n[${f.name}]\n${f.err.stack}`);
  process.exit(1);
}
