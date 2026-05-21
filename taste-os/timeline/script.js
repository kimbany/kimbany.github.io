/* ==========================================================
   Taste OS — Timeline / 변해온 결
   Scroll reveals + era-aware orb color shifts.
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // ---------------------------------------------------------
  // SCROLL REVEALS
  // ---------------------------------------------------------

  function setupScrollReveals() {
    const sections = $$('[data-section]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const section = entry.target;

          const els = $$('[data-reveal]', section);
          els.forEach((el) => {
            const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
            const t = reducedMotion ? Math.min(delay, 200) : delay;
            window.setTimeout(() => el.classList.add('is-revealed'), t);
          });

          observer.unobserve(section);
        });
      },
      {
        threshold: 0.22,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    sections.forEach((s) => observer.observe(s));
  }

  // also reveal entry section immediately on load
  function revealEntry() {
    const entry = $('.entry-section');
    if (!entry) return;
    const els = $$('[data-reveal]', entry);
    els.forEach((el) => {
      const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      const t = reducedMotion ? Math.min(delay, 200) : 600 + delay;
      window.setTimeout(() => el.classList.add('is-revealed'), t);
    });
  }

  // ---------------------------------------------------------
  // ERA-AWARE ORB COLOR — as user scrolls, body gets a class
  // (era-2024, era-2025, era-2026) that shifts orb tints
  // ---------------------------------------------------------

  function setupEraDetection() {
    const chapters = $$('.chapter');
    if (!chapters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const year = entry.target.dataset.year;
          if (!year) return;

          // remove all era classes, add the current one
          document.body.classList.remove('era-2024', 'era-2025', 'era-2026');
          document.body.classList.add(`era-${year}`);
        });
      },
      {
        // trigger when chapter is ~halfway through viewport
        threshold: 0.4,
        rootMargin: '-20% 0px -20% 0px',
      }
    );

    chapters.forEach((c) => observer.observe(c));
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    revealEntry();
    setupScrollReveals();
    setupEraDetection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
