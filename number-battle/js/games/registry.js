/* 미니게임 레지스트리
 *
 * 새 게임을 추가하려면: 모듈을 만들고 여기 등록만 하면 된다.
 * (계약: createRound / isComplete / getTiers / mount — ranking.js 주석 참고)
 *
 * 앞으로 추가 예정 후보:
 *   폭탄 타이머 · 슬롯머신 · 하이카드 · 랜덤박스 · 가위바위보 · 룰렛
 */
import luckyTiming from './luckyTiming.js';
import fateCards from './fateCards.js';

const REGISTRY = new Map([
  [luckyTiming.id, luckyTiming],
  [fateCards.id, fateCards],
]);

/** 1차 번호 쟁탈전에 쓸 수 있는 게임 */
export const BATTLE_GAME_IDS = [luckyTiming.id, fateCards.id];
/** FINAL 순위 결정전에 쓸 수 있는 게임 */
export const FINAL_GAME_IDS = [fateCards.id, luckyTiming.id];

export const DEFAULT_BATTLE_GAME = luckyTiming.id;
export const DEFAULT_FINAL_GAME = fateCards.id;

export function getGame(id) {
  const game = REGISTRY.get(id);
  if (!game) throw new Error(`등록되지 않은 미니게임입니다: ${id}`);
  return game;
}

export function listGames(ids) {
  return ids.map(getGame);
}
