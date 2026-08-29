/* 미니게임: 럭키 타이밍 (기본 1차 쟁탈전)
 *
 * 빠르게 왕복하는 게이지를 각자 한 번씩 STOP.
 * 모두 끝날 때까지 TARGET 은 비공개. 이후 |STOP - TARGET| 이 작은 순서로 순위.
 * 거리가 같으면 동점 -> 상위 resolver 가 재대결을 붙여준다.
 */
import { randInt, shuffle, escapeHtml } from '../util.js';

export const GAUGE_MIN = 0;
export const GAUGE_MAX = 100;

export const luckyTiming = {
  id: 'lucky-timing',
  name: '럭키 타이밍',
  icon: '🎯',
  tagline: '움직이는 게이지를 멈춰 TARGET에 가장 가깝게!',
  howto: '내 차례에 STOP! TARGET은 전원이 끝난 뒤에 공개됩니다.',

  createRound(playerIds, rng = Math.random) {
    return {
      gameId: 'lucky-timing',
      order: shuffle(playerIds, rng), // 플레이 순서는 매 라운드 섞는다
      stops: {}, // { playerId: 0~100 }
      turnIndex: 0,
      target: randInt(GAUGE_MIN, GAUGE_MAX, rng), // 끝날 때까지 화면에 절대 노출 금지
    };
  },

  isComplete(round) {
    return round.turnIndex >= round.order.length;
  },

  /** 거리 오름차순 tier. 같은 거리는 한 tier(=동점) 로 묶인다. */
  getTiers(round) {
    const scored = round.order.map((id) => ({
      id,
      dist: Math.abs(round.stops[id] - round.target),
    }));
    scored.sort((a, b) => a.dist - b.dist);
    const tiers = [];
    for (const entry of scored) {
      const last = tiers[tiers.length - 1];
      if (last && last.dist === entry.dist) last.ids.push(entry.id);
      else tiers.push({ dist: entry.dist, ids: [entry.id] });
    }
    return tiers.map((t) => t.ids);
  },

  /** 결과 표 (연출용) — 거리순 정렬된 상세 */
  detail(round) {
    return round.order
      .map((id) => ({ id, stop: round.stops[id], dist: Math.abs(round.stops[id] - round.target) }))
      .sort((a, b) => a.dist - b.dist);
  },

  /** 결과 연출용 요약 — 화면 쪽은 이 구조만 알면 된다 */
  summary(round, getName) {
    return {
      headline: { label: 'TARGET', value: String(round.target) },
      rows: luckyTiming.detail(round).map((r) => ({
        name: getName(r.id),
        value: `STOP ${r.stop}`,
        note: `차이 ${r.dist}`,
      })),
    };
  },

  /* ---------- UI ---------- */
  mount(el, round, api) {
    let raf = null;
    let pos = 0;
    let dir = 1;
    let running = false;
    let armed = false; // 게이지가 실제로 돌고 있고 STOP 을 받을 수 있는 상태

    const speed = api.fast ? 1.5 : 1.05; // 프레임당 이동량 기준값

    function currentPlayerId() {
      return round.order[round.turnIndex];
    }

    function paint() {
      const marker = el.querySelector('.lt-marker');
      if (marker) marker.style.left = `${pos}%`;
    }

    function loop() {
      pos += dir * speed * (0.85 + Math.random() * 0.3); // 살짝 불규칙하게
      if (pos >= GAUGE_MAX) { pos = GAUGE_MAX; dir = -1; }
      if (pos <= GAUGE_MIN) { pos = GAUGE_MIN; dir = 1; }
      paint();
      raf = requestAnimationFrame(loop);
    }

    function stopLoop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      running = false;
    }

    function renderTurn() {
      stopLoop();
      armed = false;
      const pid = currentPlayerId();
      const done = round.order.slice(0, round.turnIndex);
      el.innerHTML = `
        <div class="lt">
          <div class="lt-turn">
            <span class="lt-turn-label">${round.turnIndex + 1} / ${round.order.length}</span>
            <h3 class="lt-name">${escapeHtml(api.getName(pid))}</h3>
            <p class="lt-sub">차례입니다. 준비되면 시작하세요.</p>
          </div>
          <div class="lt-gauge" aria-hidden="true">
            <div class="lt-track"><div class="lt-marker" style="left:0%"></div></div>
            <div class="lt-scale"><span>0</span><span>50</span><span>100</span></div>
          </div>
          <button class="btn btn-hero lt-action" type="button">시작</button>
          <p class="lt-secret">🔒 TARGET은 전원이 끝난 뒤 공개됩니다</p>
          ${done.length ? `<ul class="lt-done">${done.map((id) => `
            <li><b>${escapeHtml(api.getName(id))}</b><span>STOP ${round.stops[id]}</span></li>`).join('')}</ul>` : ''}
        </div>`;

      const btn = el.querySelector('.lt-action');
      btn.addEventListener('click', () => {
        if (!running) {
          pos = randInt(0, 100);
          dir = Math.random() < 0.5 ? 1 : -1;
          running = true;
          armed = true;
          btn.textContent = 'STOP!';
          btn.classList.add('is-stop');
          el.querySelector('.lt-sub').textContent = 'TARGET에 가깝다고 느낄 때 STOP!';
          loop();
        } else if (armed) {
          armed = false;
          stopLoop();
          const value = Math.round(pos);
          round.stops[pid] = value;
          round.turnIndex += 1;
          api.commit(); // 상태 저장
          showStopped(pid, value);
        }
      });
    }

    function showStopped(pid, value) {
      el.innerHTML = `
        <div class="lt lt-stopped">
          <div class="lt-stamp">STOP</div>
          <h3 class="lt-name">${escapeHtml(api.getName(pid))}</h3>
          <div class="lt-value">${value}</div>
          <p class="lt-sub">${luckyTiming.isComplete(round)
            ? '전원 완료! TARGET을 공개합니다.'
            : '다음 참가자에게 넘겨주세요.'}</p>
          <button class="btn btn-hero lt-next" type="button">${
            luckyTiming.isComplete(round) ? 'TARGET 공개' : '다음 참가자'}</button>
        </div>`;
      el.querySelector('.lt-next').addEventListener('click', () => {
        if (luckyTiming.isComplete(round)) api.finish();
        else renderTurn();
      });
    }

    renderTurn();
    return () => stopLoop();
  },
};

export default luckyTiming;
