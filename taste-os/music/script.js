/* ==========================================================
   Taste OS — Music / 마음을 닮은 소리
   3-state: Intro → Sonic Canvas → Forward Threshold Beat
   Music added via input panel (text + optional memory)
   URL auto-detection for Spotify / Apple Music / YouTube
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
    phase: 'intro',     // 'intro' | 'canvas' | 'forward'
    entries: [],         // { id, display, sub, source, memory, tilt, drift, echoDelay, position }
  };

  // ---------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function wait(ms) { return new Promise((r) => window.setTimeout(r, ms)); }
  function uid() { return 'm-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function parseSource(rawText) {
    const t = rawText.trim();
    if (/spotify\.com/.test(t))
      return { source: 'spotify', display: t.replace(/^https?:\/\//, ''), sub: 'spotify' };
    if (/music\.apple/.test(t))
      return { source: 'apple', display: t.replace(/^https?:\/\//, ''), sub: 'apple music' };
    if (/youtube\.com|youtu\.be/.test(t))
      return { source: 'youtube', display: t.replace(/^https?:\/\//, ''), sub: 'youtube' };
    if (/soundcloud/.test(t))
      return { source: 'soundcloud', display: t.replace(/^https?:\/\//, ''), sub: 'soundcloud' };
    if (/^https?:\/\//.test(t))
      return { source: 'url', display: t.replace(/^https?:\/\//, ''), sub: 'link' };

    // Parse "Title - Artist" or "Artist - Title"
    const parts = t.split(/\s+[—–-]\s+/);
    if (parts.length === 2) {
      // Heuristic: usually "Artist - Title" but let user-provided order pass through
      return { source: 'text', display: parts[1] || t, sub: parts[0] || 'music' };
    }
    return { source: 'text', display: t, sub: 'music' };
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

    updateMusicTier(0);
  }

  // ---------------------------------------------------------
  // STATE B — SONIC CANVAS
  // ---------------------------------------------------------

  function calculatePosition(index) {
    const col = index % 4;
    const row = Math.floor(index / 4) % 4;
    const baseX = 12 + col * 22 + Math.random() * 4 - 2;
    const baseY = 8 + row * 22 + Math.random() * 4 - 2;
    const tilt = (Math.random() * 4 - 2).toFixed(2);
    const drift = (Math.random() * 8).toFixed(2);
    const echoDelay = (Math.random() * 3).toFixed(2);
    return { x: baseX, y: baseY, tilt, drift, echoDelay };
  }

  function addEntry(rawText, memory) {
    if (!rawText || !rawText.trim()) return;
    const parsed = parseSource(rawText);
    const pos = calculatePosition(state.entries.length);

    const entry = {
      id: uid(),
      display: parsed.display,
      sub: parsed.sub,
      source: parsed.source,
      memory: (memory || '').trim(),
      ...pos,
    };

    state.entries.push(entry);
    addMusicCard(entry);

    if (state.entries.length === 1) {
      const hint = $('[data-empty-hint]');
      if (hint) hint.classList.add('is-hidden');
    }

    updateCounter();
    updateMusicTier(state.entries.length);
    updateForwardCTA();
  }

  function addMusicCard(entry) {
    const layer = $('[data-music-layer]');
    if (!layer) return;

    const card = document.createElement('article');
    card.className = 'music-card is-fresh';
    card.dataset.entryId = entry.id;
    card.style.setProperty('--tilt', `${entry.tilt}deg`);
    card.style.setProperty('--drift', `${entry.drift}s`);
    card.style.setProperty('--echo-delay', `${entry.echoDelay}s`);
    card.style.left = `${entry.x}%`;
    card.style.top = `${entry.y}%`;

    card.innerHTML = `
      <div class="disc" aria-hidden="true"></div>
      <p class="track-title" title="${escapeHtml(entry.display)}">${escapeHtml(entry.display)}</p>
      <p class="track-sub">${escapeHtml(entry.sub)}</p>
      ${entry.memory ? `
        <hr class="micro-rule" />
        <p class="memory-note">${escapeHtml(entry.memory)}</p>
      ` : ''}
    `;

    card.addEventListener('click', () => removeEntry(entry.id));
    layer.appendChild(card);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.add('is-placed');
      });
    });

    window.setTimeout(() => {
      card.classList.remove('is-fresh');
    }, reducedMotion ? 200 : 900);
  }

  function removeEntry(id) {
    const card = $(`[data-entry-id="${id}"]`);
    if (!card) return;

    card.classList.add('is-releasing');
    window.setTimeout(() => {
      card.remove();
      state.entries = state.entries.filter((e) => e.id !== id);
      updateCounter();
      updateMusicTier(state.entries.length);
      updateForwardCTA();

      if (state.entries.length === 0) {
        const hint = $('[data-empty-hint]');
        if (hint) hint.classList.remove('is-hidden');
      }
    }, reducedMotion ? 200 : 1000);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------------------------------------------------------
  // COUNTER + MUSIC TIER + FORWARD CTA
  // ---------------------------------------------------------

  function counterText(n) {
    if (n === 0) return '';
    if (n === 1) return '1곡 들으셨어요. 더 두어도 좋고요.';
    if (n === 2) return '2곡 들으셨어요. 더 두어도 좋고요.';
    if (n === 3) return '3곡 들으셨어요. 충분해요. 더 두어도 좋고요.';
    if (n === 4) return '4곡. 결이 들리기 시작해요.';
    if (n === 5) return '5곡. 감정의 리듬이 모이고 있어요.';
    if (n <= 7) return `${n}곡. 감정의 리듬이 모이고 있어요.`;
    if (n <= 11) return `${n}곡 들으셨어요. 당신의 소리가 보여요.`;
    return `${n}곡. 두고 싶은 만큼 두세요.`;
  }

  function updateCounter() {
    const counter = $('[data-counter]');
    if (!counter) return;
    const n = state.entries.length;
    counter.textContent = counterText(n);
    counter.classList.toggle('is-visible', n > 0);
  }

  function updateMusicTier(count) {
    const body = document.body;
    body.classList.remove('music-silent', 'music-low', 'music-mid', 'music-full');
    if (count === 0)      body.classList.add('music-silent');
    else if (count <= 2)  body.classList.add('music-low');
    else if (count <= 5)  body.classList.add('music-mid');
    else                  body.classList.add('music-full');
  }

  function updateForwardCTA() {
    const cta = $('.cta-forward');
    if (!cta) return;
    if (state.entries.length >= 3) {
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
    const mainInput = $('[data-panel-main]');
    const memoryInput = $('[data-panel-memory]');

    function openPanel(prefill = '') {
      mainInput.value = prefill;
      memoryInput.value = '';
      confirmBtn.disabled = !prefill.trim();
      scrim.classList.add('is-visible');
      panel.setAttribute('data-panel-state', 'visible');
      setTimeout(() => mainInput.focus(), 600);
    }

    function closePanel() {
      scrim.classList.remove('is-visible');
      panel.setAttribute('data-panel-state', 'hidden');
    }

    openBtn.addEventListener('click', () => openPanel());
    closeBtn.addEventListener('click', closePanel);
    scrim.addEventListener('click', closePanel);

    mainInput.addEventListener('input', () => {
      confirmBtn.disabled = !mainInput.value.trim();
    });

    [mainInput, memoryInput].forEach((input) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (mainInput.value.trim()) handleConfirm();
        }
        if (e.key === 'Escape') closePanel();
      });
    });

    function handleConfirm() {
      const text = mainInput.value.trim();
      const memory = memoryInput.value.trim();
      if (!text) return;
      addEntry(text, memory);
      closePanel();
    }

    confirmBtn.addEventListener('click', handleConfirm);

    // Auto-detect music URL paste anywhere
    window.addEventListener('paste', (e) => {
      if (state.phase !== 'canvas') return;
      const target = e.target;
      // If user is pasting into our panel inputs, let it through
      if (target === mainInput || target === memoryInput) return;

      const text = e.clipboardData ? e.clipboardData.getData('text') : '';
      if (/spotify\.com|music\.apple|youtube\.com|youtu\.be|soundcloud/.test(text)) {
        e.preventDefault();
        openPanel(text);
      }
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

    // Clear entries
    const layer = $('[data-music-layer]');
    if (layer) layer.innerHTML = '';
    state.entries = [];
    updateCounter();
    updateMusicTier(0);
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
  // MOUSE PARALLAX (intro only, light)
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
