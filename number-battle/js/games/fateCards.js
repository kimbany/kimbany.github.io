/* 미니게임: 운명의 카드 (기본 FINAL 순위 결정전)
 *
 * 인원 수만큼 카드를 뒤집어 놓고, 각자 한 장씩 고른다.
 * 카드 안에는 1위~N위가 무작위로 들어 있고, 전원이 고를 때까지 공개하지 않는다.
 * 순위가 서로 다르므로 동점(tier 2개 이상)은 발생하지 않는다.
 */
import { shuffle, escapeHtml, ordinal } from '../util.js';

export const fateCards = {
  id: 'fate-cards',
  name: '운명의 카드',
  icon: '🃏',
  tagline: '한 장을 골라라. 그 안에 순위가 들어 있다.',
  howto: '내 차례에 카드 한 장 선택. 모두 고르면 동시에 공개됩니다.',

  createRound(playerIds, rng = Math.random) {
    const ranks = shuffle(playerIds.map((_, i) => i + 1), rng);
    return {
      gameId: 'fate-cards',
      order: shuffle(playerIds, rng),
      cards: ranks.map((rank, i) => ({ index: i, rank, ownerId: null })),
      turnIndex: 0,
    };
  },

  isComplete(round) {
    return round.turnIndex >= round.order.length;
  },

  getTiers(round) {
    return round.cards
      .filter((c) => c.ownerId)
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((c) => [c.ownerId]); // 순위가 유일하므로 항상 1인 tier
  },

  detail(round) {
    return round.cards
      .filter((c) => c.ownerId)
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((c) => ({ id: c.ownerId, rank: c.rank, cardIndex: c.index }));
  },

  summary(round, getName) {
    return {
      headline: { label: 'CARD OPEN', value: '🃏' },
      rows: fateCards.detail(round).map((r) => ({
        name: getName(r.id),
        value: ordinal(r.rank),
        note: `${r.cardIndex + 1}번째 카드`,
      })),
    };
  },

  /* ---------- UI ---------- */
  mount(el, round, api) {
    function currentPlayerId() {
      return round.order[round.turnIndex];
    }

    function cardsMarkup({ revealed }) {
      // 5장씩 넘어가면 줄을 고르게 나눈다 (예: 7장 → 4 + 3)
      const n = round.cards.length;
      const perRow = n <= 5 ? n : Math.ceil(n / Math.ceil(n / 5));
      return `<div class="fc-deck" style="grid-template-columns:repeat(${perRow},1fr)">${round.cards.map((c) => {
        const taken = Boolean(c.ownerId);
        const cls = ['fc-card'];
        if (taken) cls.push('is-taken');
        if (revealed) cls.push('is-open');
        return `<button class="${cls.join(' ')}" type="button" data-card="${c.index}"
          ${taken || revealed ? 'disabled' : ''} style="--i:${c.index}">
          <span class="fc-face fc-back">?</span>
          <span class="fc-face fc-front">${revealed ? ordinal(c.rank) : ''}</span>
          ${taken ? `<span class="fc-owner">${escapeHtml(api.getName(c.ownerId))}</span>` : ''}
        </button>`;
      }).join('')}</div>`;
    }

    function renderTurn() {
      const pid = currentPlayerId();
      el.innerHTML = `
        <div class="fc">
          <div class="lt-turn">
            <span class="lt-turn-label">${round.turnIndex + 1} / ${round.order.length}</span>
            <h3 class="lt-name">${escapeHtml(api.getName(pid))}</h3>
            <p class="lt-sub">카드 한 장을 선택하세요.</p>
          </div>
          ${cardsMarkup({ revealed: false })}
          <p class="lt-secret">🔒 카드 내용은 전원이 고른 뒤 동시에 공개됩니다</p>
        </div>`;

      el.querySelectorAll('.fc-card:not([disabled])').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.card);
          const card = round.cards[idx];
          if (card.ownerId) return;
          card.ownerId = pid;
          round.turnIndex += 1;
          api.commit();
          btn.classList.add('is-taken', 'just-taken');
          setTimeout(() => {
            if (fateCards.isComplete(round)) renderReady();
            else renderTurn();
          }, api.fast ? 180 : 520);
        });
      });
    }

    function renderReady() {
      el.innerHTML = `
        <div class="fc">
          <div class="lt-turn">
            <h3 class="lt-name">전원 선택 완료</h3>
            <p class="lt-sub">운명의 카드를 공개합니다.</p>
          </div>
          ${cardsMarkup({ revealed: false })}
          <button class="btn btn-hero fc-open" type="button">카드 공개</button>
        </div>`;
      el.querySelector('.fc-open').addEventListener('click', () => api.finish());
    }

    if (fateCards.isComplete(round)) renderReady();
    else renderTurn();
    return () => {};
  },
};

export default fateCards;
