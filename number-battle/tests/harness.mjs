/* 테스트용 드라이버 — DOM 없이 엔진만 돌린다. */
import {
  PHASE, createGame, addParticipant, closeSelection, revealAll, startBattlePhase,
  isBattleResolved, commitBattleRound, applyBattleRanking, keepPassContext,
  doKeep, doPass, passPickNumber, nextGroup, isFinalResolved, commitFinalRound,
  applyFinalRanking, finalSelectionContext, finalPickNumber, checkIntegrity,
} from '../js/engine.js';
import { clamp } from '../js/util.js';

/** 재현 가능한 난수 (mulberry32) */
export function seededRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 미니게임 라운드를 사람 대신 채운다.
 * tie=false 면 순위가 round.order 와 정확히 같아지도록 (거리 1,2,3...) 값을 넣는다.
 */
export function fillRound(round, { tie = false } = {}) {
  if (round.gameId === 'lucky-timing') {
    round.order.forEach((id, i) => {
      if (tie) { round.stops[id] = clamp(round.target + 5, 0, 100); return; }
      const d = i + 1;
      round.stops[id] = round.target + d <= 100 ? round.target + d : round.target - d;
    });
    round.turnIndex = round.order.length;
  } else if (round.gameId === 'fate-cards') {
    round.order.forEach((id, i) => { round.cards[i].ownerId = id; });
    round.turnIndex = round.order.length;
  } else {
    throw new Error(`테스트 드라이버가 모르는 미니게임: ${round.gameId}`);
  }
}

export function setupGame({ total, picks, rng, ...opts }) {
  const state = createGame({ totalNumbers: total, ...opts });
  for (const [name, number] of picks) addParticipant(state, name, number);
  return state;
}

/**
 * @param {object} opts.onKeepPass (ctx, state) => 'KEEP' | 'PASS'
 * @param {function} opts.pickEmpty (pool, ctx, state) => number
 * @param {function} opts.tieOnce  첫 쟁탈전 라운드를 일부러 동점으로 만들지 여부
 */
export function drive(state, {
  onKeepPass = () => 'KEEP',
  pickEmpty = (pool) => pool[0],
  tiePlan = () => false,
  rng = Math.random,
  trace = [],
} = {}) {
  let guard = 0;
  let roundNo = 0;
  while (state.phase !== PHASE.RESULT) {
    if (guard++ > 2000) throw new Error(`무한 루프 (phase=${state.phase})`);
    switch (state.phase) {
      case PHASE.SECRET_SELECTION:
        closeSelection(state);
        break;
      case PHASE.REVEAL:
        revealAll(state);
        startBattlePhase(state, rng);
        break;
      case PHASE.BATTLE: {
        while (!isBattleResolved(state)) {
          roundNo += 1;
          fillRound(state.battle.resolver.round, { tie: tiePlan(roundNo, state) });
          commitBattleRound(state, rng);
        }
        applyBattleRanking(state);
        break;
      }
      case PHASE.KEEP_PASS: {
        if (state.keepPass.done) { nextGroup(state, rng); break; }
        const ctx = keepPassContext(state);
        const action = ctx.isLast ? 'KEEP' : onKeepPass(ctx, state);
        if (action === 'PASS' && ctx.canPass) {
          doPass(state);
          passPickNumber(state, pickEmpty(ctx.pool, ctx, state));
          trace.push(`PASS ${ctx.participant.name}`);
        } else {
          doKeep(state);
          trace.push(`${ctx.isLast ? 'AUTO_KEEP' : 'KEEP'} ${ctx.participant.name}@${ctx.group.number}`);
        }
        break;
      }
      case PHASE.FINAL_BATTLE: {
        while (!isFinalResolved(state)) {
          fillRound(state.final.resolver.round, {});
          commitFinalRound(state, rng);
        }
        applyFinalRanking(state);
        break;
      }
      case PHASE.FINAL_SELECTION: {
        const ctx = finalSelectionContext(state);
        finalPickNumber(state, pickEmpty(ctx.pool, ctx, state));
        break;
      }
      default:
        throw new Error(`예상치 못한 단계: ${state.phase}`);
    }
  }
  const problems = checkIntegrity(state);
  if (problems.length) throw new Error(`무결성 실패:\n${problems.join('\n')}`);
  return state;
}

export function assignment(state) {
  return state.participants
    .slice()
    .sort((a, b) => a.finalNumber - b.finalNumber)
    .map((p) => `${p.finalNumber}:${p.name}(${p.resolution})`);
}
