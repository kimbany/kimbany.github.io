/* ==========================================================
   Taste OS — Report Reveal
   "당신 안에는 이런 분위기가 흐르고 있었어요."
   Signatures:
     A) Scroll as time — body tier shifts dawn → warming → noon → deep
     B) Genome constellation — stars + hairline connections draw on enter
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // ---------------------------------------------------------
  // SIGNATURE A — Scroll as Time
  // ---------------------------------------------------------

  const TIERS = ['tier-dawn', 'tier-warming', 'tier-noon', 'tier-deep'];

  function applyTier(tier) {
    const body = document.body;
    TIERS.forEach((t) => body.classList.remove(t));
    body.classList.add(tier);
  }

  function tierFromProgress(p) {
    if (p < 0.22) return 'tier-dawn';
    if (p < 0.50) return 'tier-warming';
    if (p < 0.74) return 'tier-noon';
    return 'tier-deep';
  }

  function setupScrollTier() {
    let raf = 0;
    let lastTier = '';

    function update() {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const next = tierFromProgress(p);
      if (next !== lastTier) {
        lastTier = next;
        applyTier(next);
      }
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  // ---------------------------------------------------------
  // REVEALS — IntersectionObserver
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
    }, { threshold: 0.18, rootMargin: '0px 0px -10% 0px' });

    items.forEach((el) => io.observe(el));
  }

  // ---------------------------------------------------------
  // LIST REVEALS — stagger children when container enters
  // ---------------------------------------------------------

  function setupListReveals() {
    const containers = $$('[data-reveal-list]');
    if (!containers.length) return;

    if (!('IntersectionObserver' in window)) {
      containers.forEach((c) => {
        c.classList.add('is-revealed');
        Array.from(c.children).forEach((ch) => ch.classList.add('is-revealed'));
      });
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const list = entry.target;
        list.classList.add('is-revealed');
        const children = Array.from(list.children);
        children.forEach((child, i) => {
          const delay = reducedMotion ? Math.min(i * 60, 240) : i * 220;
          window.setTimeout(() => child.classList.add('is-revealed'), delay);
        });
        io.unobserve(list);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    containers.forEach((c) => io.observe(c));
  }

  // ---------------------------------------------------------
  // SIGNATURE B — Genome Constellation
  // ---------------------------------------------------------

  function setupConstellation() {
    const constellation = $('[data-constellation]');
    if (!constellation) return;

    const stars = $$('.genome-star', constellation);

    if (!('IntersectionObserver' in window)) {
      stars.forEach((s) => s.classList.add('is-revealed'));
      constellation.classList.add('is-drawn');
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        // Stagger star reveals
        stars.forEach((star, i) => {
          const delay = reducedMotion ? Math.min(i * 100, 300) : i * 520;
          window.setTimeout(() => star.classList.add('is-revealed'), delay);
        });
        // Draw connecting lines after all stars are in
        const linesDelay = reducedMotion ? 200 : stars.length * 520 + 400;
        window.setTimeout(() => {
          constellation.classList.add('is-drawn');
        }, linesDelay);
        io.unobserve(constellation);
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });

    io.observe(constellation);

    // Hover affordance — highlight only lines touching the hovered star
    stars.forEach((star) => {
      const idx = star.dataset.star;
      star.addEventListener('mouseenter', () => highlightStarLines(idx, true));
      star.addEventListener('mouseleave', () => highlightStarLines(idx, false));
    });
  }

  function highlightStarLines(starIndex, on) {
    const lines = $$('.constellation-lines line');
    lines.forEach((line) => {
      const key = line.dataset.line || '';
      const touches = key.split('-').indexOf(String(starIndex)) !== -1;
      if (touches) {
        line.style.stroke = on
          ? 'rgba(216, 199, 172, 0.78)'
          : '';
      } else {
        line.style.stroke = on
          ? 'rgba(216, 199, 172, 0.12)'
          : '';
      }
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
      const delay = (i * 0.5) - 7;
      dust.style.animation =
        `dust-rise ${dur}s linear infinite, ` +
        `dust-fade ${dur}s ease-in-out infinite`;
      dust.style.animationDelay = `${delay}s, ${delay}s`;
      field.appendChild(dust);
    }
  }

  // ---------------------------------------------------------
  // PARALLAX (subtle, on hero text only)
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
  // FORWARD CTA
  // ---------------------------------------------------------

  function setupForward() {
    const cta = $('[data-action="forward"]');
    if (!cta) return;
    cta.addEventListener('click', () => {
      // In product, this would route to the dashboard.
      // For the static preview, scroll back to top for a gentle re-read.
      cta.style.opacity = '0.4';
      cta.style.pointerEvents = 'none';
      window.setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        cta.style.opacity = '';
        cta.style.pointerEvents = '';
      }, 400);
    });
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    spawnDust();
    setupParallax();
    setupScrollTier();
    setupReveals();
    setupListReveals();
    setupConstellation();
    setupForward();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
