/* ==========================================================
   Taste OS — Quotes / 마음에 머문 문장들
   3-state: Intro → Floating Language Canvas → Forward Threshold Beat
   Signature: Floating italic text (no card box) + Paper-line texture
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // STATE
  // ---------------------------------------------------------

  const state = {
    phase: 'intro',
    quotes: [],
  };

  // ---------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function wait(ms) { return new Promise((r) => window.setTimeout(r, ms)); }
  function uid() { return 'q-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getQuoteSize(text) {
    const len = text.trim().length;
    if (len <= 30) return 'lg';
    if (len <= 80) return 'md';
    return 'sm';
  }

  // ---------------------------------------------------------
  // STATE A — INTRO
  // ---------------------------------------------------------

  const introSchedule = [
    { selector: '[data-reveal="headline"]', delay: 1500 },
    { selector: '[data-reveal="hairline"]', delay: 3800 },
    { selector: '[data-reveal="sub-1"]',    delay: 4400 },
    { selector: '[data-reveal="sub-2"]',    delay: 5200 },
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

    updateQuotesTier(0);
  }

  // ---------------------------------------------------------
  // STATE B — CANVAS
  // ---------------------------------------------------------

  function calculatePosition(index) {
    const col = index % 4;
    const row = Math.floor(index / 4) % 4;
    const baseX = 10 + col * 22 + Math.random() * 6 - 3;
    const baseY = 6 + row * 22 + Math.random() * 6 - 3;
    const tilt = (Math.random() * 4 - 2).toFixed(2);
    const drift = (Math.random() * 8).toFixed(2);
    return { x: baseX, y: baseY, tilt, drift };
  }

  function addQuote(body, attribution, memory) {
    const trimmed = (body || '').trim();
    if (!trimmed) return;

    const pos = calculatePosition(state.quotes.length);
    const size = getQuoteSize(trimmed);

    const quote = {
      id: uid(),
      body: trimmed,
      attribution: (attribution || '').trim(),
      memory: (memory || '').trim(),
      size,
      ...pos,
    };

    state.quotes.push(quote);
    addQuoteFragment(quote);

    if (state.quotes.length === 1) {
      const hint = $('[data-empty-hint]');
      if (hint) hint.classList.add('is-hidden');
    }

    updateCounter();
    updateQuotesTier(state.quotes.length);
    updateForwardCTA();
  }

  function addQuoteFragment(quote) {
    const layer = $('[data-quote-layer]');
    if (!layer) return;

    const frag = document.createElement('blockquote');
    frag.className = `quote-fragment q-${quote.size} is-fresh`;
    frag.dataset.quoteId = quote.id;
    frag.style.setProperty('--tilt', `${quote.tilt}deg`);
    frag.style.setProperty('--drift', `${quote.drift}s`);
    frag.style.left = `${quote.x}%`;
    frag.style.top = `${quote.y}%`;
    frag.style.transform = `rotate(${quote.tilt}deg)`;

    let html = `<p class="q-body">${escapeHtml(quote.body)}</p>`;
    if (quote.attribution) {
      html += `<p class="q-attribution">─── ${escapeHtml(quote.attribution)}</p>`;
    }
    if (quote.memory) {
      html += `<p class="q-memory">${escapeHtml(quote.memory)}</p>`;
    }
    frag.innerHTML = html;

    frag.addEventListener('click', () => removeQuote(quote.id));

    layer.appendChild(frag);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        frag.classList.add('is-placed');
      });
    });

    window.setTimeout(() => {
      frag.classList.remove('is-fresh');
    }, reducedMotion ? 200 : 1200);
  }

  function removeQuote(id) {
    const frag = $(`[data-quote-id="${id}"]`);
    if (!frag) return;

    frag.classList.add('is-releasing');
    window.setTimeout(() => {
      frag.remove();
      state.quotes = state.quotes.filter((q) => q.id !== id);
      updateCounter();
      updateQuotesTier(state.quotes.length);
      updateForwardCTA();

      if (state.quotes.length === 0) {
        const hint = $('[data-empty-hint]');
        if (hint) hint.classList.remove('is-hidden');
      }
    }, reducedMotion ? 200 : 1000);
  }

  // ---------------------------------------------------------
  // COUNTER + TIER + FORWARD
  // ---------------------------------------------------------

  function counterText(n) {
    if (n === 0) return '';
    if (n === 1) return '1개 두셨어요. 더 두어도 좋고요.';
    if (n === 2) return '2개 두셨어요. 더 두어도 좋고요.';
    if (n === 3) return '3개 두셨어요. 충분해요. 더 두어도 좋고요.';
    if (n === 4) return '4개. 결이 모이고 있어요.';
    if (n === 5) return '5개. 당신의 언어가 보여요.';
    if (n <= 7) return `${n}개. 당신의 언어가 보여요.`;
    if (n <= 11) return `${n}개 두셨어요. 당신의 세계관이 들려요.`;
    return `${n}개. 두고 싶은 만큼 두세요.`;
  }

  function updateCounter() {
    const counter = $('[data-counter]');
    if (!counter) return;
    const n = state.quotes.length;
    counter.textContent = counterText(n);
    counter.classList.toggle('is-visible', n > 0);
  }

  function updateQuotesTier(count) {
    const body = document.body;
    body.classList.remove('quotes-silent', 'quotes-low', 'quotes-mid', 'quotes-full');
    if (count === 0)      body.classList.add('quotes-silent');
    else if (count <= 2)  body.classList.add('quotes-low');
    else if (count <= 5)  body.classList.add('quotes-mid');
    else                  body.classList.add('quotes-full');
  }

  function updateForwardCTA() {
    const cta = $('.cta-forward');
    if (!cta) return;
    if (state.quotes.length >= 3) {
      cta.setAttribute('data-state', 'visible');
    } else {
      cta.setAttribute('data-state', 'hidden');
    }
  }

  // ---------------------------------------------------------
  // ADD PANEL
  // ---------------------------------------------------------

  function setupAddPanel() {
    const openBtn = $('[data-action="open-panel"]');
    const closeBtn = $('[data-action="close-panel"]');
    const confirmBtn = $('[data-action="confirm-add"]');
    const scrim = $('[data-scrim]');
    const panel = $('.add-panel');
    const bodyInput = $('[data-panel-body]');
    const attrInput = $('[data-panel-attribution]');
    const memoryInput = $('[data-panel-memory]');

    function openPanel() {
      bodyInput.value = '';
      attrInput.value = '';
      memoryInput.value = '';
      confirmBtn.disabled = true;
      scrim.classList.add('is-visible');
      panel.setAttribute('data-panel-state', 'visible');
      setTimeout(() => bodyInput.focus(), 600);
    }

    function closePanel() {
      scrim.classList.remove('is-visible');
      panel.setAttribute('data-panel-state', 'hidden');
    }

    function handleConfirm() {
      const body = bodyInput.value.trim();
      if (!body) return;
      addQuote(body, attrInput.value, memoryInput.value);
      closePanel();
    }

    openBtn.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', closePanel);
    scrim.addEventListener('click', closePanel);
    confirmBtn.addEventListener('click', handleConfirm);

    bodyInput.addEventListener('input', () => {
      confirmBtn.disabled = !bodyInput.value.trim();
    });

    // Keyboard
    [bodyInput, attrInput, memoryInput].forEach((input) => {
      input.addEventListener('keydown', (e) => {
        // Cmd/Ctrl + Enter on body = confirm
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          if (bodyInput.value.trim()) handleConfirm();
        }
        if (e.key === 'Escape') closePanel();
        // Enter in single-line inputs also confirms
        if (e.key === 'Enter' && !e.shiftKey && input !== bodyInput) {
          e.preventDefault();
          if (bodyInput.value.trim()) handleConfirm();
        }
      });
    });
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

    // Clear quotes
    const layer = $('[data-quote-layer]');
    if (layer) layer.innerHTML = '';
    state.quotes = [];
    updateCounter();
    updateQuotesTier(0);
    updateForwardCTA();

    const hint = $('[data-empty-hint]');
    if (hint) hint.classList.remove('is-hidden');

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
    setupAddPanel();
    startIntro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
