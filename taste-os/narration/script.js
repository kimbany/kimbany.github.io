/* ==========================================================
   Taste OS — Narration (the quiet voice)
   A felt demo of the streaming cinematic reveal + breathing pace.
   The real system streams tokens from gpt-4.1 (see ../narration.md);
   here we replay curated narrations with the same breath timing.
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function wait(ms) { return new Promise((r) => window.setTimeout(r, ms)); }

  // ---------------------------------------------------------
  // NARRATION SCRIPTS — one per mode (mirrors narration.md §3–7)
  // Each "line" reveals, breathes, then dissolves into silence.
  // ---------------------------------------------------------

  const SCRIPTS = [
    {
      mode: 'atmosphere', label: '분위기',
      lines: [
        '당신은 조용한 따뜻함 속에서\n가장 오래 머무르는 사람입니다.',
        '완벽함보다, 인간적인 흔적에\n마음이 머물러요.',
      ],
    },
    {
      mode: 'daily', label: '오늘의 결',
      lines: [
        '오늘은 조용한 따뜻함이\n오래 머무르고 있어요.',
        '해질녘의 빛이, 당신 안에\n천천히 번지고 있습니다.',
      ],
    },
    {
      mode: 'timeline', label: '계절',
      lines: [
        '예전보다 조금 더 따뜻한 것들에\n오래 시선이 머물고 있어요.',
        '많은 게 변했지만,\n혼자 있는 시간을 아끼는 마음은 그대로네요.',
      ],
    },
    {
      mode: 'recall', label: '다시 떠오름',
      lines: [
        '한동안 잊고 있던 새벽의 결로,\n요즘 다시 돌아오고 있어요.',
        '오래전 자주 머물던 그 빛이,\n다시 당신 곁에 와 있네요.',
      ],
    },
    {
      mode: 'contrast', label: '함께 흐르는 결',
      lines: [
        '차가운 고독감 속에서도,\n당신은 따뜻한 감정을 놓지 않고 있어요.',
        '단정한 미래의 빛 안에,\n오래된 향수가 함께 머물러요.',
      ],
    },
  ];

  // ---------------------------------------------------------
  // BREATH PACING (mirrors narration.md §8)
  // ---------------------------------------------------------

  function breathFor(line) {
    if (reducedMotion) return 1200;
    const chars = line.replace(/\s/g, '').length;
    return Math.min(4200, 900 + chars * 95);
  }

  const REVEAL_MS = reducedMotion ? 200 : 1600;   // matches CSS transition
  const EXIT_MS   = reducedMotion ? 200 : 1400;
  const SILENCE   = reducedMotion ? 300 : 1300;   // the breath between lines

  // ---------------------------------------------------------
  // PLAYER
  // ---------------------------------------------------------

  const state = {
    scriptIndex: 0,
    paused: false,
    token: 0,       // cancellation token; bumped on next/replay
  };

  const screen = () => $('[data-narration-screen]');

  function setMode(script) {
    document.body.setAttribute('data-mode', script.mode);
    const label = $('[data-mode-label]');
    if (label) label.textContent = script.label;
  }

  async function showLine(text, myToken) {
    const el = document.createElement('p');
    el.className = 'narration-line';
    // preserve line breaks
    text.split('\n').forEach((seg, i) => {
      if (i > 0) el.appendChild(document.createElement('br'));
      el.appendChild(document.createTextNode(seg));
    });
    screen().appendChild(el);

    // reveal
    await wait(40);
    if (myToken !== state.token) { el.remove(); return; }
    el.classList.add('is-revealed');
    await waitPausable(REVEAL_MS, myToken);
    if (myToken !== state.token) { el.remove(); return; }

    // dwell (breath) — the line lingers
    await waitPausable(breathFor(text), myToken);
    if (myToken !== state.token) { el.remove(); return; }

    // dissolve
    el.classList.remove('is-revealed');
    el.classList.add('is-exiting');
    await waitPausable(EXIT_MS, myToken);
    el.remove();
  }

  // wait that respects pause + cancellation
  async function waitPausable(ms, myToken) {
    let elapsed = 0;
    const step = 100;
    while (elapsed < ms) {
      if (myToken !== state.token) return;
      if (!state.paused) elapsed += step;
      await wait(step);
    }
  }

  async function playScript(index) {
    state.token++;
    const myToken = state.token;
    state.scriptIndex = ((index % SCRIPTS.length) + SCRIPTS.length) % SCRIPTS.length;
    const script = SCRIPTS[state.scriptIndex];

    // clear screen
    screen().innerHTML = '';
    setMode(script);

    await waitPausable(SILENCE, myToken);
    if (myToken !== state.token) return;

    for (const line of script.lines) {
      await showLine(line, myToken);
      if (myToken !== state.token) return;
      await waitPausable(SILENCE, myToken);          // silence between lines
      if (myToken !== state.token) return;
    }

    // pause in stillness, then drift to the next mode
    await waitPausable(SILENCE * 1.5, myToken);
    if (myToken !== state.token) return;
    playScript(state.scriptIndex + 1);
  }

  // ---------------------------------------------------------
  // CONTROLS
  // ---------------------------------------------------------

  function setupControls() {
    const toggle = $('[data-action="toggle"]');
    const icon = $('[data-ctl-icon]');
    const next = $('[data-action="next"]');

    if (toggle) {
      toggle.addEventListener('click', () => {
        state.paused = !state.paused;
        if (icon) icon.textContent = state.paused ? '▶' : '❙❙';
      });
    }
    if (next) {
      next.addEventListener('click', () => {
        state.paused = false;
        if (icon) icon.textContent = '❙❙';
        playScript(state.scriptIndex + 1);
      });
    }
  }

  // ---------------------------------------------------------
  // REVEALS / DUST / PARALLAX
  // ---------------------------------------------------------

  function setupReveals() {
    $$('[data-reveal]').forEach((el) => {
      const delay = parseInt(el.dataset.revealDelay || '0', 10);
      const scaled = reducedMotion ? Math.min(delay, 200) : delay;
      window.setTimeout(() => el.classList.add('is-revealed'), 400 + scaled);
    });
  }

  function spawnDust() {
    if (reducedMotion) return;
    const field = $('.dust-field');
    if (!field) return;
    const width = window.innerWidth;
    let count = 20;
    if (width < 768) count = 8;
    else if (width < 1280) count = 14;
    const tones = ['dust-rose', 'dust-silver', 'dust-ember'];
    for (let i = 0; i < count; i++) {
      const dust = document.createElement('span');
      dust.className = 'dust ' + tones[i % tones.length];
      const size = 1.5 + Math.random() * 1.8;
      dust.style.left = `${Math.random() * 100}%`;
      dust.style.width = `${size}px`;
      dust.style.height = `${size}px`;
      const dur = 16 + Math.random() * 8;
      const delay = (i * 0.6) - 8;
      dust.style.animation =
        `dust-rise ${dur}s linear infinite, dust-fade ${dur}s ease-in-out infinite`;
      dust.style.animationDelay = `${delay}s, ${delay}s`;
      field.appendChild(dust);
    }
  }

  function setupParallax() {
    if (reducedMotion) return;
    if ('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches) return;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    function tick() {
      cx += (tx - cx) * 0.04;
      cy += (ty - cy) * 0.04;
      document.documentElement.style.setProperty('--parallax-x', cx.toFixed(3));
      document.documentElement.style.setProperty('--parallax-y', cy.toFixed(3));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    spawnDust();
    setupParallax();
    setupReveals();
    setupControls();
    // begin after the intro reveals settle
    window.setTimeout(() => playScript(0), reducedMotion ? 400 : 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
