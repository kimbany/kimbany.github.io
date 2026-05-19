/* ==========================================================
   Taste OS — Taste Report
   Entry choreography + scroll reveals + Mirror Line climax.
   Vanilla JS, no dependencies.
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // DATA — Six Axes positions (0 = far-left ... 4 = far-right)
  // ---------------------------------------------------------

  const AXES = [
    { axis: '빛',   poleL: 'Vesper',   poleR: 'Meridian', position: 1 },
    { axis: '밀도', poleL: 'Hush',     poleR: 'Loam',     position: 1 },
    { axis: '거리', poleL: 'Intimate', poleR: 'Sublime',  position: 1 },
    { axis: '자세', poleL: 'Inward',   poleR: 'Outward',  position: 1 },
    { axis: '표면', poleL: 'Stone',    poleR: 'Smoke',    position: 1 },
    { axis: '시대', poleL: 'Linen',    poleR: 'Chrome',   position: 1 },
  ];

  // ---------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function wait(ms) { return new Promise((r) => window.setTimeout(r, ms)); }

  // ---------------------------------------------------------
  // 1) ENTRY CHOREOGRAPHY
  // ---------------------------------------------------------

  let entryDone = false;

  async function playEntry() {
    const line = $('.entry-line');
    const word1 = $('.taste-name .word-1');
    const word2 = $('.taste-name .word-2');
    const en = $('.taste-name-en');
    const date = $('.taste-name-date');
    const scrollHint = $('.scroll-hint');

    // fill date
    if (date) {
      const d = new Date();
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const h = d.getHours();
      const phase = h < 12 ? '오전' : (h < 18 ? '오후' : '저녁');
      date.textContent = `${d.getFullYear()}년 ${m}월 ${day}일 ${phase}에 만들어졌어요.`;
    }

    if (reducedMotion) {
      // compressed entry — show everything within 1s
      line && line.classList.add('is-visible');
      await wait(600);
      line && line.classList.add('is-fading');
      document.body.classList.remove('entry-pending');
      word1 && word1.classList.add('is-visible');
      word2 && word2.classList.add('is-visible');
      en && en.classList.add('is-visible');
      date && date.classList.add('is-visible');
      scrollHint && scrollHint.classList.add('is-visible');
      entryDone = true;
      return;
    }

    // t = 0   black field, grain + orbs already on their own animations
    await wait(1800);

    // t = 1.8   entry line appears
    if (line) line.classList.add('is-visible');
    await wait(2400);

    // t = 4.2   line fades out
    if (line) line.classList.add('is-fading');
    await wait(1400);

    // t = 5.6   first word of Taste Name reveals
    document.body.classList.remove('entry-pending');
    if (word1) word1.classList.add('is-visible');
    await wait(800);

    // t = 6.4   second word reveals (slightly later — the rose climax)
    if (word2) word2.classList.add('is-visible');
    await wait(2200);

    // t = 8.6   metadata fades in
    if (en) en.classList.add('is-visible');
    await wait(400);
    if (date) date.classList.add('is-visible');
    await wait(700);

    // t = 9.7   scroll hint appears
    if (scrollHint) scrollHint.classList.add('is-visible');
    entryDone = true;
  }

  // Compress entry if user scrolls early
  function setupEntryShortcircuit() {
    if (reducedMotion) return;

    const compress = () => {
      if (entryDone) return;
      entryDone = true;
      // reveal everything immediately
      $('.entry-line') && $('.entry-line').classList.add('is-fading');
      document.body.classList.remove('entry-pending');
      $('.taste-name .word-1') && $('.taste-name .word-1').classList.add('is-visible');
      $('.taste-name .word-2') && $('.taste-name .word-2').classList.add('is-visible');
      $('.taste-name-en') && $('.taste-name-en').classList.add('is-visible');
      $('.taste-name-date') && $('.taste-name-date').classList.add('is-visible');
      $('.scroll-hint') && $('.scroll-hint').classList.add('is-visible');
    };

    // First scroll, wheel, or touch
    const opts = { passive: true, once: true };
    let triggered = false;
    function onInput() {
      if (triggered) return;
      triggered = true;
      compress();
    }
    window.addEventListener('scroll', onInput, opts);
    window.addEventListener('wheel', onInput, opts);
    window.addEventListener('touchmove', onInput, opts);
  }

  // ---------------------------------------------------------
  // 2) BUILD SIX AXES
  // ---------------------------------------------------------

  function buildAxes() {
    const container = $('[data-axes]');
    if (!container) return;
    container.innerHTML = '';

    AXES.forEach((a) => {
      const row = document.createElement('div');
      row.className = 'axis-row';
      row.innerHTML = `
        <div class="axis-label">${a.axis}</div>
        <div class="axis-rail">
          <span class="axis-pole pole-l ${a.position < 2 ? 'is-near' : ''}">${a.poleL}</span>
          <div class="axis-track">
            <div class="axis-line"></div>
            <span class="axis-dot" data-axis-dot data-position="${a.position}"></span>
          </div>
          <span class="axis-pole pole-r ${a.position > 2 ? 'is-near' : ''}">${a.poleR}</span>
        </div>
      `;
      container.appendChild(row);
    });
  }

  function animateAxesInto(section) {
    const dots = $$('[data-axis-dot]', section);
    dots.forEach((dot, i) => {
      const pos = parseInt(dot.dataset.position || '2', 10);
      // 5-step positions: 0 = 10%, 1 = 30%, 2 = 50%, 3 = 70%, 4 = 90%
      const percent = 10 + pos * 20;
      window.setTimeout(() => {
        dot.style.left = percent + '%';
        dot.classList.add('is-set');
      }, reducedMotion ? 0 : 200 + i * 120);
    });
  }

  // ---------------------------------------------------------
  // 3) SCROLL-TRIGGERED SECTION REVEALS
  // ---------------------------------------------------------

  function setupScrollReveals() {
    const sections = $$('[data-section]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const section = entry.target;
          section.classList.add('is-revealed');

          // reveal children with data-reveal
          const revealEls = $$('[data-reveal]', section);
          revealEls.forEach((el) => {
            const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
            const t = reducedMotion ? Math.min(delay, 200) : delay;
            window.setTimeout(() => el.classList.add('is-revealed'), t);
          });

          // animate axes if this is the axes section
          if (section.classList.contains('section-axes')) {
            animateAxesInto(section);
          }

          observer.unobserve(section);
        });
      },
      {
        threshold: 0.25,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    sections.forEach((s) => observer.observe(s));
  }

  // ---------------------------------------------------------
  // 4) MIRROR LINE — climactic reveal
  // ---------------------------------------------------------

  function setupMirrorReveal() {
    const section = $('[data-mirror]');
    if (!section) return;

    const lines = $$('[data-mirror-line]', section);
    const actions = $('[data-mirror-actions]', section);

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();

        // sequential reveal of 3 mirror line lines
        const interval = reducedMotion ? 200 : 1400;
        const wait_initial = reducedMotion ? 0 : 600;

        await wait(wait_initial);

        for (let i = 0; i < lines.length; i++) {
          lines[i].classList.add('is-revealed');
          if (i < lines.length - 1) await wait(interval);
        }

        // wait for full mirror line to settle, then show actions
        await wait(reducedMotion ? 400 : 1800);
        if (actions) actions.classList.add('is-visible');
      },
      { threshold: 0.4 }
    );

    observer.observe(section);
  }

  // ---------------------------------------------------------
  // 5) KEEP ACTION
  // ---------------------------------------------------------

  function setupKeepAction() {
    const beacon = $('[data-action="keep"]');
    const kept = $('[data-kept-message]');
    if (!beacon || !kept) return;

    let isKept = false;

    beacon.addEventListener('click', () => {
      if (isKept) return;
      isKept = true;
      beacon.classList.add('is-kept');

      // change label
      const label = beacon.querySelector('.beacon-label');
      if (label) label.textContent = '간직했어요';

      // show acknowledgment
      kept.classList.add('is-visible');

      // try to copy mirror text to clipboard (silent, no notification)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          const lines = $$('[data-mirror-line]');
          const text = lines.map((l) => l.textContent.trim().replace(/\s+/g, ' ')).join('\n');
          navigator.clipboard.writeText(text).catch(() => {});
        }
      } catch (_) {}
    });
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    buildAxes();
    setupEntryShortcircuit();
    setupScrollReveals();
    setupMirrorReveal();
    setupKeepAction();
    playEntry();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
