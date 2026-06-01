/* ==========================================================
   Taste OS — Atmosphere / 마음이 머무는 공기
   3-state: Intro → Atmosphere Worlds → Forward Threshold Beat
   Signature: Selected atmospheres compose the page's ambient lighting
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // ATMOSPHERE DATA — 8 worlds
  // ---------------------------------------------------------

  const ATMOSPHERES = [
    {
      id: 'dawn-city',
      name: '새벽 도시',
      palette: ['#0F1620', '#2A3540', '#5A6878', '#8FA0AC', '#C8B69B'],
      cardBg: 'linear-gradient(165deg, #0F1620 0%, #2A3540 35%, #5A6878 70%, #8FA0AC 100%)',
      ambient: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(143, 160, 172, 0.10), transparent 60%)',
      tone: 'cool',
    },
    {
      id: 'rainy-window',
      name: '비 오는 창가',
      palette: ['#1A2030', '#3A4555', '#6B7888', '#A8B0BC', '#D8DDE2'],
      cardBg: 'linear-gradient(180deg, #1A2030 0%, #3A4555 40%, #6B7888 75%, #A8B0BC 100%)',
      ambient: 'radial-gradient(ellipse 60% 50% at 0% 50%, rgba(107, 120, 136, 0.10), transparent 60%)',
      tone: 'cool',
    },
    {
      id: 'warm-film',
      name: '따뜻한 필름톤',
      palette: ['#2A1F18', '#4A2620', '#7A4030', '#B07672', '#D9A66C'],
      cardBg: 'linear-gradient(155deg, #2A1F18 0%, #4A2620 35%, #7A4030 65%, #D9A66C 100%)',
      ambient: 'radial-gradient(ellipse 70% 50% at 100% 0%, rgba(217, 166, 108, 0.10), transparent 60%)',
      tone: 'warm',
    },
    {
      id: 'quiet-future',
      name: '조용한 미래감',
      palette: ['#0E1418', '#1A2030', '#3A4555', '#8FA0AC', '#C8D2DC'],
      cardBg: 'linear-gradient(180deg, #0E1418 0%, #1A2030 35%, #3A4555 65%, #C8D2DC 100%)',
      ambient: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(200, 210, 220, 0.08), transparent 60%)',
      tone: 'cool',
    },
    {
      id: 'human-traces',
      name: '인간적인 흔적',
      palette: ['#1A0F08', '#3A2620', '#7A5040', '#C8B69B', '#D8C7AC'],
      cardBg: 'linear-gradient(170deg, #1A0F08 0%, #3A2620 35%, #7A5040 65%, #D8C7AC 100%)',
      ambient: 'radial-gradient(circle at 50% 50%, rgba(122, 80, 64, 0.10), transparent 60%)',
      tone: 'warm',
    },
    {
      id: 'cold-solitude',
      name: '차가운 고독감',
      palette: ['#0A0A0B', '#1A1F28', '#3A4555', '#6B7888', '#8FA0AC'],
      cardBg: 'linear-gradient(170deg, #0A0A0B 0%, #1A1F28 40%, #3A4555 75%, #8FA0AC 100%)',
      ambient: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(58, 69, 85, 0.10), transparent 60%)',
      tone: 'cool',
    },
    {
      id: 'analog-warmth',
      name: '아날로그 온기',
      palette: ['#2A1F18', '#5A3D25', '#9A7060', '#C8B69B', '#D9A66C'],
      cardBg: 'linear-gradient(160deg, #2A1F18 0%, #5A3D25 35%, #9A7060 65%, #D9A66C 100%)',
      ambient: 'radial-gradient(ellipse 60% 50% at 100% 50%, rgba(217, 166, 108, 0.12), transparent 60%)',
      tone: 'warm',
    },
    {
      id: 'slow-night',
      name: '느린 밤공기',
      palette: ['#0E0C0B', '#2A1F28', '#4A2540', '#7A5060', '#B07672'],
      cardBg: 'linear-gradient(175deg, #0E0C0B 0%, #2A1F28 40%, #4A2540 70%, #B07672 100%)',
      ambient: 'radial-gradient(ellipse 60% 50% at 100% 100%, rgba(176, 118, 114, 0.10), transparent 60%)',
      tone: 'warm',
    },
  ];

  // ---------------------------------------------------------
  // STATE
  // ---------------------------------------------------------

  const state = {
    phase: 'intro',
    selected: new Set(),
    previewing: null,
  };

  // ---------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function wait(ms) { return new Promise((r) => window.setTimeout(r, ms)); }

  // ---------------------------------------------------------
  // BUILD WORLDS GRID
  // ---------------------------------------------------------

  function buildWorldsGrid() {
    const grid = $('[data-worlds-grid]');
    if (!grid) return;

    ATMOSPHERES.forEach((atm, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'world-card';
      card.dataset.atmId = atm.id;
      card.dataset.tone = atm.tone;
      card.style.setProperty('--card-bg', atm.cardBg);
      card.style.background = atm.cardBg;

      const swatches = atm.palette.slice(0, 4).map((color) =>
        `<span class="swatch" style="background:${color}"></span>`
      ).join('');

      card.innerHTML = `
        <span class="selection-mark" aria-hidden="true">◆</span>
        <h3 class="world-name">${atm.name}</h3>
        <div class="world-palette">${swatches}</div>
      `;

      card.addEventListener('click', () => toggleAtmosphere(atm.id));
      card.addEventListener('mouseenter', () => startPreview(atm.id));
      card.addEventListener('mouseleave', () => endPreview(atm.id));

      grid.appendChild(card);

      // Staggered reveal on enter
      const delay = i * 80;
      window.setTimeout(() => {
        card.classList.add('is-revealed');
      }, reducedMotion ? 0 : delay);
    });
  }

  // ---------------------------------------------------------
  // TOGGLE / PREVIEW
  // ---------------------------------------------------------

  function toggleAtmosphere(id) {
    const card = document.querySelector(`[data-atm-id="${id}"]`);
    if (!card) return;

    if (state.selected.has(id)) {
      state.selected.delete(id);
      card.classList.remove('is-selected');
    } else {
      state.selected.add(id);
      card.classList.add('is-selected');
    }

    rebuildAtmosphereBlend();
    updateCounter();
    updateTier();
    updateDominantTone();
    updateForwardCTA();

    // If we were previewing this one, end preview (it's now selected)
    if (state.previewing === id) {
      endPreview(id);
    }
  }

  function startPreview(id) {
    if (state.selected.has(id)) return;     // already selected, no preview needed
    state.previewing = id;
    const atm = ATMOSPHERES.find((a) => a.id === id);
    if (!atm) return;
    document.documentElement.style.setProperty('--preview-blend', atm.ambient);
  }

  function endPreview(id) {
    if (state.previewing === id) {
      state.previewing = null;
      document.documentElement.style.setProperty('--preview-blend', 'transparent');
    }
  }

  // ---------------------------------------------------------
  // AMBIENT BLENDING — SIGNATURE
  // ---------------------------------------------------------

  function rebuildAtmosphereBlend() {
    const ambients = [];
    state.selected.forEach((id) => {
      const atm = ATMOSPHERES.find((a) => a.id === id);
      if (atm) ambients.push(atm.ambient);
    });

    const blend = ambients.length > 0 ? ambients.join(', ') : 'transparent';
    document.documentElement.style.setProperty('--atmosphere-blend', blend);
  }

  function updateTier() {
    const body = document.body;
    body.classList.remove('atm-zero', 'atm-low', 'atm-mid', 'atm-full');
    const n = state.selected.size;
    if (n === 0)        body.classList.add('atm-zero');
    else if (n === 1)   body.classList.add('atm-low');
    else if (n <= 3)    body.classList.add('atm-mid');
    else                body.classList.add('atm-full');
  }

  function updateDominantTone() {
    const tones = { warm: 0, cool: 0 };
    state.selected.forEach((id) => {
      const atm = ATMOSPHERES.find((a) => a.id === id);
      if (atm && atm.tone in tones) tones[atm.tone]++;
    });

    const body = document.body;
    if (tones.warm > tones.cool) {
      body.setAttribute('data-dominant-tone', 'warm');
    } else if (tones.cool > tones.warm) {
      body.setAttribute('data-dominant-tone', 'cool');
    } else {
      body.removeAttribute('data-dominant-tone');
    }
  }

  // ---------------------------------------------------------
  // COUNTER + CTA
  // ---------------------------------------------------------

  function counterText(n) {
    if (n === 0) return '';
    if (n === 1) return '1곳에 머무셨어요.';
    if (n === 2) return '2곳에 머무셨어요. 더 머물러도 좋아요.';
    if (n === 3) return '3곳. 당신의 공기가 보여요.';
    if (n === 4) return '4곳. 풍부한 결이 보여요.';
    return `${n}곳에 머무셨어요. 당신만의 세계가 만들어지고 있어요.`;
  }

  function updateCounter() {
    const counter = $('[data-counter]');
    if (!counter) return;
    const n = state.selected.size;
    counter.textContent = counterText(n);
    counter.classList.toggle('is-visible', n > 0);
  }

  function updateForwardCTA() {
    const cta = $('.cta-forward');
    if (!cta) return;
    if (state.selected.size >= 2) {
      cta.setAttribute('data-state', 'visible');
    } else {
      cta.setAttribute('data-state', 'hidden');
    }
  }

  // ---------------------------------------------------------
  // STATE A — INTRO
  // ---------------------------------------------------------

  const introSchedule = [
    { selector: '[data-reveal="headline"]', delay: 1500 },
    { selector: '[data-reveal="hairline"]', delay: 3800 },
    { selector: '[data-reveal="sub-1"]',    delay: 4400 },
    { selector: '[data-reveal="cta"]',      delay: 6400 },
  ];

  function startIntro() {
    introSchedule.forEach((step) => {
      const el = $(step.selector);
      if (!el) return;
      const delay = reducedMotion ? Math.min(step.delay, 400) : step.delay;
      window.setTimeout(() => el.classList.add('is-revealed'), delay);
    });
  }

  async function exitIntro() {
    const intro = $('.intro');
    intro.setAttribute('data-phase', 'exiting');
    await wait(reducedMotion ? 200 : 1400);
    intro.setAttribute('data-phase', 'hidden');

    const canvas = $('.canvas-state');
    canvas.setAttribute('data-phase', 'active');
    state.phase = 'canvas';

    // Build the worlds grid now that we're in canvas state
    if (!$('[data-worlds-grid]').hasChildNodes()) {
      buildWorldsGrid();
    }
  }

  // ---------------------------------------------------------
  // STATE C — FORWARD THRESHOLD BEAT
  // ---------------------------------------------------------

  async function playForwardBeat() {
    state.phase = 'forward';
    document.body.setAttribute('data-threshold', 'active');

    const canvas = $('.canvas-state');
    canvas.setAttribute('data-phase', 'exiting');

    await wait(reducedMotion ? 200 : 1400);

    const beat = $('.forward-beat');
    beat.setAttribute('data-phase', 'active');

    await wait(reducedMotion ? 200 : 400);

    const line1 = $('.beat-line[data-line="0"]');
    const line2 = $('.beat-line[data-line="1"]');

    line1.classList.add('is-revealed');
    await wait(reducedMotion ? 1500 : 3000);

    line1.classList.remove('is-revealed');
    line1.classList.add('is-exiting');
    await wait(reducedMotion ? 400 : 1400);

    await wait(reducedMotion ? 200 : 400);

    line2.classList.add('is-revealed');
    await wait(reducedMotion ? 1500 : 2400);

    line2.classList.remove('is-revealed');
    line2.classList.add('is-exiting');
    await wait(reducedMotion ? 400 : 1400);

    await wait(reducedMotion ? 300 : 800);
    resetToIntro();
  }

  function resetToIntro() {
    const beat = $('.forward-beat');
    beat.setAttribute('data-phase', 'hidden');

    const line1 = $('.beat-line[data-line="0"]');
    const line2 = $('.beat-line[data-line="1"]');
    line1.classList.remove('is-revealed', 'is-exiting');
    line2.classList.remove('is-revealed', 'is-exiting');

    document.body.removeAttribute('data-threshold');
    document.body.removeAttribute('data-dominant-tone');

    // Clear selections
    state.selected.clear();
    state.previewing = null;
    document.documentElement.style.setProperty('--atmosphere-blend', 'transparent');
    document.documentElement.style.setProperty('--preview-blend', 'transparent');

    // Reset world cards
    const grid = $('[data-worlds-grid]');
    if (grid) grid.innerHTML = '';

    updateCounter();
    updateTier();
    updateForwardCTA();

    // Hide canvas, show intro
    const canvas = $('.canvas-state');
    canvas.setAttribute('data-phase', 'hidden');

    const intro = $('.intro');
    intro.setAttribute('data-phase', 'active');

    introSchedule.forEach((step) => {
      const el = $(step.selector);
      if (el) el.classList.remove('is-revealed');
    });

    state.phase = 'intro';
    startIntro();
  }

  // ---------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------

  function setupActions() {
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');

      if (action === 'start') {
        exitIntro();
      } else if (action === 'forward') {
        playForwardBeat();
      }
    });
  }

  // ---------------------------------------------------------
  // DUST FIELD
  // ---------------------------------------------------------

  function spawnDust() {
    if (reducedMotion) return;

    const field = $('.dust-field');
    if (!field) return;

    const width = window.innerWidth;
    let count = 24;
    if (width < 768) count = 0;
    else if (width < 1280) count = 18;

    for (let i = 0; i < count; i++) {
      const dust = document.createElement('span');
      dust.className = 'dust ' + (i % 4 === 0 ? 'dust-silver' : 'dust-rose');
      const size = 1.5 + Math.random() * 1.5;
      dust.style.left = `${Math.random() * 100}%`;
      dust.style.width = `${size}px`;
      dust.style.height = `${size}px`;
      const dur = 14 + Math.random() * 6;
      const delay = (i * 0.5) - 6;
      dust.style.animation =
        `dust-rise ${dur}s linear infinite, ` +
        `dust-fade ${dur}s ease-in-out infinite`;
      dust.style.animationDelay = `${delay}s, ${delay}s`;
      field.appendChild(dust);
    }
  }

  // ---------------------------------------------------------
  // MOUSE PARALLAX (intro only)
  // ---------------------------------------------------------

  function setupParallax() {
    if (reducedMotion) return;
    if ('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    function onMove(e) {
      if (state.phase === 'forward') return;
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    function tick() {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      document.documentElement.style.setProperty('--parallax-x', currentX.toFixed(3));
      document.documentElement.style.setProperty('--parallax-y', currentY.toFixed(3));
      requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove);
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    spawnDust();
    setupParallax();
    setupActions();
    startIntro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
