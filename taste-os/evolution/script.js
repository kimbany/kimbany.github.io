/* ==========================================================
   Taste OS — Identity Evolution
   "당신은 생각보다 많은 계절을 지나오고 있었습니다."
   Signatures:
     A) Era warming — body era shifts cold → warming → warm on scroll
     B) Ghost year — huge faint year numeral fades in per season
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // ---------------------------------------------------------
  // MEMORY FRAGMENTS — per season
  // ---------------------------------------------------------

  const SEASON_FRAGMENTS = {
    cool: [
      { kind: 'image',      tone: 'silver', x: 8,  y: 12 },
      { kind: 'image',      tone: 'sand',   x: 70, y: 8  },
      { kind: 'atmosphere', tone: 'silver', x: 42, y: 38 },
      { kind: 'quote',      tone: 'silver', x: 14, y: 64, text: '차가운 새벽' },
      { kind: 'quote',      tone: 'silver', x: 58, y: 70, text: '혼자의 거리' },
      { kind: 'atmosphere', tone: 'silver', x: 84, y: 52 },
    ],
    mixed: [
      { kind: 'image',      tone: 'rose',   x: 10, y: 10 },
      { kind: 'image',      tone: 'silver', x: 72, y: 14 },
      { kind: 'atmosphere', tone: 'rose',   x: 40, y: 42 },
      { kind: 'quote',      tone: 'rose',   x: 16, y: 66, text: '스며드는 온기' },
      { kind: 'quote',      tone: 'silver', x: 60, y: 68, text: '천천히 열리는 마음' },
      { kind: 'atmosphere', tone: 'silver', x: 86, y: 48 },
    ],
    warm: [
      { kind: 'image',      tone: 'ember',  x: 8,  y: 14 },
      { kind: 'image',      tone: 'beige',  x: 70, y: 10 },
      { kind: 'atmosphere', tone: 'ember',  x: 38, y: 40 },
      { kind: 'quote',      tone: 'rose',   x: 14, y: 64, text: '인간적인 흔적' },
      { kind: 'quote',      tone: 'ember',  x: 56, y: 70, text: '오래 머무는 빛' },
      { kind: 'atmosphere', tone: 'rose',   x: 86, y: 50 },
    ],
  };

  function buildSeasonFragments() {
    $$('[data-memory-field]').forEach((field) => {
      const season = field.dataset.season || 'cool';
      const list = SEASON_FRAGMENTS[season] || [];

      list.forEach((f, i) => {
        const el = document.createElement('div');
        el.className =
          'memory-fragment kind-' + f.kind +
          (f.tone ? ' tone-' + f.tone : '');
        el.style.left = f.x + '%';
        el.style.top  = f.y + '%';

        if (f.kind === 'quote') {
          el.textContent = f.text || '';
        } else {
          const inner = document.createElement('div');
          inner.className = 'frag-visual';
          if (f.kind === 'image') {
            const rot = (Math.random() - 0.5) * 10;
            inner.style.transform = `rotate(${rot.toFixed(1)}deg)`;
          }
          el.appendChild(inner);
        }

        field.appendChild(el);

        // Drift via WAAPI
        if (!reducedMotion) {
          const dur = 10 + Math.random() * 6;
          const dx = (Math.random() - 0.5) * 50;
          const dy = (Math.random() - 0.5) * 36;
          el.animate(
            [
              { transform: 'translate(0,0)' },
              { transform: `translate(${dx}px, ${dy}px)` },
              { transform: 'translate(0,0)' },
            ],
            { duration: dur * 1000, iterations: Infinity, easing: 'ease-in-out', delay: i * 400 }
          );
        }

        el._fragIndex = i;
      });
    });
  }

  // ---------------------------------------------------------
  // SIGNATURE A — Era warming on scroll
  // ---------------------------------------------------------

  const ERAS = ['era-cold', 'era-warming', 'era-warm'];

  function applyEra(era) {
    const body = document.body;
    ERAS.forEach((e) => body.classList.remove(e));
    body.classList.add(era);

    const label = $('[data-era-label]');
    if (label) {
      const map = {
        'era-cold':    '차가운 계절',
        'era-warming': '데워지는 공기',
        'era-warm':    '지금의 온기',
      };
      label.textContent = map[era] || '지나온 계절';
    }
  }

  function setupEraScroll() {
    const sections = $$('.section[data-era]');
    if (!sections.length) return;

    if (!('IntersectionObserver' in window)) {
      applyEra('era-warm');
      return;
    }

    // Track the section most in view and apply its era
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const era = entry.target.dataset.era;
          if (era) applyEra('era-' + era);
        }
      });
    }, { threshold: [0.5] });

    sections.forEach((s) => io.observe(s));
  }

  // ---------------------------------------------------------
  // SIGNATURE B — Ghost year reveal
  // ---------------------------------------------------------

  function setupGhostYears() {
    const ghosts = $$('[data-ghost-year]');
    if (!ghosts.length) return;

    if (!('IntersectionObserver' in window)) {
      ghosts.forEach((g) => g.classList.add('is-revealed'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    ghosts.forEach((g) => io.observe(g));
  }

  // ---------------------------------------------------------
  // REVEALS
  // ---------------------------------------------------------

  function setupReveals() {
    const items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseInt(el.dataset.revealDelay || '0', 10);
        const scaled = reducedMotion ? Math.min(delay, 200) : delay;
        window.setTimeout(() => el.classList.add('is-revealed'), scaled);
        io.unobserve(el);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    items.forEach((el) => io.observe(el));
  }

  // Reveal memory fragments when their field enters
  function setupFragmentReveals() {
    const fields = $$('[data-memory-field]');
    if (!('IntersectionObserver' in window)) {
      $$('.memory-fragment').forEach((f) => f.classList.add('is-revealed'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const frags = $$('.memory-fragment', entry.target);
        frags.forEach((frag) => {
          const i = frag._fragIndex || 0;
          const delay = reducedMotion ? Math.min(i * 80, 320) : i * 260;
          window.setTimeout(() => frag.classList.add('is-revealed'), delay);
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.25 });

    fields.forEach((f) => io.observe(f));
  }

  // ---------------------------------------------------------
  // DUST + PARALLAX
  // ---------------------------------------------------------

  function spawnDust() {
    if (reducedMotion) return;
    const field = $('.dust-field');
    if (!field) return;

    const width = window.innerWidth;
    let count = 26;
    if (width < 768) count = 10;
    else if (width < 1280) count = 18;

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

  function setupParallax() {
    if (reducedMotion) return;
    if ('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    const ghosts = $$('[data-ghost-year]');

    window.addEventListener('mousemove', (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function tick() {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      document.documentElement.style.setProperty('--parallax-x', currentX.toFixed(3));
      document.documentElement.style.setProperty('--parallax-y', currentY.toFixed(3));

      // Ghost years drift very subtly (independent of the reveal transform)
      ghosts.forEach((g) => {
        if (!g.classList.contains('is-revealed')) return;
        const gx = currentX * 14;
        const gy = currentY * 10;
        g.style.transform = `translate(calc(-50% + ${gx.toFixed(1)}px), calc(-50% + ${gy.toFixed(1)}px))`;
      });

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------
  // RETURN CTA
  // ---------------------------------------------------------

  function setupReturn() {
    const cta = $('[data-action="return"]');
    if (!cta) return;
    cta.addEventListener('click', () => {
      cta.style.opacity = '0.4';
      cta.style.pointerEvents = 'none';
      window.setTimeout(() => {
        window.location.href = '../home/';
      }, 600);
    });
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    buildSeasonFragments();
    spawnDust();
    setupParallax();
    setupEraScroll();
    setupGhostYears();
    setupReveals();
    setupFragmentReveals();
    setupReturn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
