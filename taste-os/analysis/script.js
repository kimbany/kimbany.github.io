/* ==========================================================
   Taste OS — Analysis Transition
   "당신 안에 오래 머물렀던 감정들을 연결하고 있어요."
   Not a loading screen. A cinematic emotional interpretation space.
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
  // STATE
  // ---------------------------------------------------------

  const state = {
    timeMultiplier: 1,   // slow mode → 1.5
    paused: false,
  };

  function scale(ms) {
    if (reducedMotion) return Math.max(120, Math.round(ms * 0.3));
    return Math.round(ms * state.timeMultiplier);
  }

  // ---------------------------------------------------------
  // FRAGMENT DATA
  // ---------------------------------------------------------

  // Each fragment: kind, tone, position (vw/vh), drift animation index
  const FRAGMENTS = [
    // Image fragments
    { kind: 'image',      tone: 'rose',   x: 12,  y: 24, rot: -6,  drift: 'a', dur: 11 },
    { kind: 'image',      tone: 'silver', x: 72,  y: 18, rot:  4,  drift: 'b', dur: 13 },
    { kind: 'image',      tone: 'ember',  x: 18,  y: 68, rot:  5,  drift: 'c', dur: 12 },
    { kind: 'image',      tone: 'beige',  x: 80,  y: 70, rot: -3,  drift: 'd', dur: 14 },

    // Quote fragments
    { kind: 'quote',      tone: 'rose',   x: 38,  y: 16, drift: 'a', dur: 12, text: '오래 머무는 빛' },
    { kind: 'quote',      tone: 'silver', x: 64,  y: 40, drift: 'b', dur: 14, text: '차가운 새벽' },
    { kind: 'quote',      tone: 'mist',   x: 28,  y: 80, drift: 'c', dur: 13, text: '혼자의 음악' },
    { kind: 'quote',      tone: 'beige',  x: 56,  y: 78, drift: 'd', dur: 15, text: '느린 손길' },

    // Atmosphere fragments
    { kind: 'atmosphere', tone: 'rose',   x: 50,  y: 30, drift: 'b', dur: 10 },
    { kind: 'atmosphere', tone: 'silver', x: 30,  y: 50, drift: 'a', dur: 11 },
    { kind: 'atmosphere', tone: 'ember',  x: 72,  y: 56, drift: 'c', dur: 12 },
    { kind: 'atmosphere', tone: 'beige',  x: 46,  y: 88, drift: 'd', dur: 14 },

    // Music fragments
    { kind: 'music', x: 22,  y: 38, drift: 'd', dur: 13 },
    { kind: 'music', x: 84,  y: 32, drift: 'a', dur: 12 },
    { kind: 'music', x: 14,  y: 50, drift: 'b', dur: 14 },
    { kind: 'music', x: 90,  y: 86, drift: 'c', dur: 11 },
  ];

  function buildFragments() {
    const field = $('[data-fragment-field]');
    if (!field) return;

    FRAGMENTS.forEach((f, i) => {
      const el = document.createElement('div');
      el.className = 'fragment fragment-' + f.kind +
        (f.tone ? ' tone-' + f.tone : '');
      el.style.left = f.x + 'vw';
      el.style.top  = f.y + 'vh';
      el.style.animation =
        `drift-${f.drift} ${f.dur}s ease-in-out infinite`;
      el.style.animationDelay = `${(i * 0.4).toFixed(2)}s`;

      if (f.kind === 'quote') {
        el.textContent = f.text || '';
      } else if (f.kind === 'music') {
        el.appendChild(document.createElement('span'));
      } else if (f.kind === 'image' && f.rot) {
        // Apply rotation via inner transform (the keyframe transform owns the rest)
        el.style.transform = `rotate(${f.rot}deg)`;
      }

      field.appendChild(el);

      // Stagger reveal
      const delay = scale(200 + i * 120);
      window.setTimeout(() => {
        el.classList.add('is-revealed');
      }, delay);
    });
  }

  // ---------------------------------------------------------
  // DUST
  // ---------------------------------------------------------

  function spawnDust() {
    if (reducedMotion) return;
    const field = $('.dust-field');
    if (!field) return;

    const width = window.innerWidth;
    let count = 32;
    if (width < 768) count = 12;
    else if (width < 1280) count = 24;

    const tones = ['dust-rose', 'dust-silver', 'dust-ember'];

    for (let i = 0; i < count; i++) {
      const dust = document.createElement('span');
      dust.className = 'dust ' + tones[i % tones.length];
      const size = 1.5 + Math.random() * 1.8;
      dust.style.left = `${Math.random() * 100}%`;
      dust.style.width = `${size}px`;
      dust.style.height = `${size}px`;
      const dur = 16 + Math.random() * 8;
      const delay = (i * 0.55) - 8;
      dust.style.animation =
        `dust-rise ${dur}s linear infinite, ` +
        `dust-fade ${dur}s ease-in-out infinite`;
      dust.style.animationDelay = `${delay}s, ${delay}s`;
      field.appendChild(dust);
    }
  }

  // ---------------------------------------------------------
  // PARALLAX
  // ---------------------------------------------------------

  function setupParallax() {
    if (reducedMotion) return;
    if ('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    window.addEventListener('mousemove', (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function tick() {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      document.documentElement.style.setProperty('--parallax-x', currentX.toFixed(3));
      document.documentElement.style.setProperty('--parallax-y', currentY.toFixed(3));
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------
  // PHASE TIERS — gradient + orb deepening
  // ---------------------------------------------------------

  function setTier(name) {
    const body = document.body;
    ['phase-stillness', 'tier-cool', 'tier-warming', 'tier-warm', 'tier-deep']
      .forEach((c) => body.classList.remove(c));
    body.classList.add(name);
  }

  // ---------------------------------------------------------
  // MASTER TIMELINE
  // Each phase awaits scaled ms before transitioning.
  // ---------------------------------------------------------

  async function runTimeline() {
    const body = document.body;
    const opening = $('[data-opening]');
    const headline = $('[data-reveal="headline"]');
    const subLines = $$('.sub-line');
    const narration0 = $('[data-narration="0"]');
    const narration1 = $('[data-narration="1"]');
    const narration2 = $('[data-narration="2"]');
    const finalStage = $('[data-final-stage]');
    const convergencePoint = $('[data-convergence-point]');
    const finalLine = $('[data-final-line]');
    const finalBeacon = $('[data-final-beacon]');

    // ============== PHASE 0 — Stillness ==============
    await wait(scale(2400));
    setTier('tier-cool');

    // ============== PHASE 1 — Opening Headline ==============
    await wait(scale(800));
    headline.classList.add('is-revealed');
    await wait(scale(5200));

    // ============== PHASE 2 — Sub Copy ==============
    opening.setAttribute('data-headline', 'dimmed');
    for (let i = 0; i < subLines.length; i++) {
      subLines[i].classList.add('is-revealed');
      await wait(scale(450));
    }

    await wait(scale(3400));

    // ============== PHASE 3 — Opening exits, fragments emerge ==============
    opening.setAttribute('data-phase', 'exiting');
    setTier('tier-warming');
    body.classList.add('fragments-visible');
    buildFragments();

    await wait(scale(3800));

    // ============== PHASE 4 — Narration I ==============
    body.classList.add('fragments-dim');
    narration0.classList.add('is-revealed');
    await wait(scale(4200));
    narration0.classList.remove('is-revealed');
    narration0.classList.add('is-exiting');
    body.classList.remove('fragments-dim');
    await wait(scale(1600));        // breath of silence

    // ============== PHASE 5 — Narration II ==============
    setTier('tier-warm');
    body.classList.add('fragments-dim');
    narration1.classList.add('is-revealed');
    await wait(scale(4400));
    narration1.classList.remove('is-revealed');
    narration1.classList.add('is-exiting');
    body.classList.remove('fragments-dim');
    await wait(scale(1600));

    // ============== PHASE 6 — Narration III ==============
    body.classList.add('fragments-dim');
    narration2.classList.add('is-revealed');
    await wait(scale(4400));
    narration2.classList.remove('is-revealed');
    narration2.classList.add('is-exiting');
    body.classList.remove('fragments-dim');
    await wait(scale(1200));

    // ============== PHASE 7 — Convergence ==============
    setTier('tier-deep');
    body.classList.add('fragments-converging');
    finalStage.setAttribute('data-phase', 'active');
    await wait(scale(2400));
    convergencePoint.setAttribute('data-state', 'visible');
    await wait(scale(3200));

    // ============== PHASE 8 — Final Line + Beacon ==============
    convergencePoint.setAttribute('data-state', 'dissolved');
    await wait(scale(1000));
    finalLine.classList.add('is-revealed');
    await wait(scale(2000));
    finalBeacon.classList.add('is-revealed');
  }

  // ---------------------------------------------------------
  // SLOW TOGGLE
  // ---------------------------------------------------------

  function setupSlowToggle() {
    const toggle = $('[data-slow-toggle]');
    const label = $('[data-slow-label]');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const isSlow = state.timeMultiplier > 1;
      if (isSlow) {
        state.timeMultiplier = 1;
        document.body.removeAttribute('data-slow');
        if (label) label.textContent = '더 천천히 보고 싶어요';
      } else {
        state.timeMultiplier = 1.5;
        document.body.setAttribute('data-slow', 'true');
        if (label) label.textContent = '원래 속도로 돌아갈게요';
      }
    });
  }

  // ---------------------------------------------------------
  // FINAL BEACON ACTION
  // ---------------------------------------------------------

  function setupBeacon() {
    const beacon = $('[data-final-beacon]');
    if (!beacon) return;
    beacon.addEventListener('click', () => {
      // In the real product this would route to /report.
      // For the static preview, restart the cinematic.
      window.location.reload();
    });
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    spawnDust();
    setupParallax();
    setupSlowToggle();
    setupBeacon();
    runTimeline();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
