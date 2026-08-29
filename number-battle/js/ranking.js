/* 순위 결정기(Rank Resolver)
 *
 * 미니게임은 "한 라운드를 치르고 동점 그룹(tier) 목록을 돌려주는 것"만 책임진다.
 * 동점자 재대결 / 최종 순위 조립은 전부 여기서 처리하므로
 * 새 미니게임을 붙일 때 동점 처리를 다시 구현할 필요가 없다.
 *
 * resolver 는 순수 JSON 이라 localStorage 에 그대로 저장/복원된다.
 */

/**
 * @param {string} gameId  미니게임 id
 * @param {string[]} playerIds 순위를 매길 참가자 id 목록
 */
export function createResolver(gameId, playerIds) {
  return {
    gameId,
    // 아직 순위가 확정되지 않은 구간들. 앞쪽이 높은 순위.
    queue: [{ playerIds: playerIds.slice(), startRank: 1 }],
    settled: [], // [{ rank, playerId }]
    round: null, // 현재 진행 중인 미니게임 라운드
    history: [], // 끝난 라운드들 (연출/기록용)
  };
}

export function isResolved(resolver) {
  return !resolver.round && resolver.queue.length === 0;
}

/** 확정된 순위를 1위부터 순서대로 돌려준다. */
export function getRanking(resolver) {
  return resolver.settled
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.playerId);
}

/** 지금 진행 중인 라운드가 "동점자 재대결"인지 */
export function isTieBreak(resolver) {
  return Boolean(resolver.round) && resolver.round.tieBreak === true;
}

/**
 * 큐를 소진하면서 다음 라운드를 준비한다.
 * 1명짜리 구간은 미니게임 없이 즉시 순위 확정.
 */
export function pump(resolver, game, rng) {
  while (!resolver.round && resolver.queue.length > 0) {
    const seg = resolver.queue[0];
    if (seg.playerIds.length === 1) {
      resolver.queue.shift();
      resolver.settled.push({ rank: seg.startRank, playerId: seg.playerIds[0] });
      continue;
    }
    resolver.round = game.createRound(seg.playerIds, rng);
    resolver.round.startRank = seg.startRank;
    resolver.round.tieBreak = seg.tieBreak === true;
  }
  return resolver;
}

/**
 * 현재 라운드가 끝났을 때 호출. tier 를 읽어 순위를 확정하거나 재대결 구간을 만든다.
 */
export function commitRound(resolver, game, rng) {
  if (!resolver.round) throw new Error('진행 중인 라운드가 없습니다.');
  if (!game.isComplete(resolver.round)) throw new Error('아직 모든 참가자가 플레이하지 않았습니다.');

  const seg = resolver.queue.shift();
  const tiers = game.getTiers(resolver.round);

  const flat = tiers.flat();
  if (flat.length !== seg.playerIds.length) {
    throw new Error('미니게임이 반환한 인원 수가 구간 인원과 다릅니다.');
  }

  const newSegments = [];
  let rank = seg.startRank;
  for (const tier of tiers) {
    newSegments.push({ playerIds: tier.slice(), startRank: rank, tieBreak: tier.length > 1 });
    rank += tier.length;
  }

  resolver.history.push({ ...resolver.round, tiers });
  resolver.round = null;
  resolver.queue.unshift(...newSegments);
  return pump(resolver, game, rng);
}

/** 마지막으로 끝난 라운드 (결과 연출용) */
export function lastRound(resolver) {
  return resolver.history.length ? resolver.history[resolver.history.length - 1] : null;
}
