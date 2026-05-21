/* ==========================================================
   Taste OS — Images / 마음에 머문 장면들
   3-state: Intro → Canvas → Forward Threshold Beat
   Image upload via drag-drop / paste / file picker
   Atmosphere shifts as image count grows
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
    images: [],          // { id, dataUrl, tilt, drift, position }
  };

  // ---------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function wait(ms) { return new Promise((r) => window.setTimeout(r, ms)); }
  function uid() { return 'i-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

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

    // Show canvas state
    const canvas = $('.canvas-state');
    canvas.setAttribute('data-phase', 'active');
    state.phase = 'canvas';

    updateAtmosphereTier(0);
  }

  // ---------------------------------------------------------
  // STATE B — CANVAS / IMAGE UPLOAD
  // ---------------------------------------------------------

  function calculatePosition(index) {
    // 4-column invisible grid, with jitter
    const col = index % 4;
    const row = Math.floor(index / 4) % 4;

    const baseX = 12 + col * 22 + Math.random() * 4 - 2;     // % within canvas
    const baseY = 10 + row * 22 + Math.random() * 4 - 2;
    const tilt = (Math.random() * 4 - 2).toFixed(2);
    const drift = (Math.random() * 8).toFixed(2);

    return { x: baseX, y: baseY, tilt, drift };
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function addImages(files) {
    const imageFiles = Array.from(files).filter((f) => f.type && f.type.startsWith('image/'));

    for (let i = 0; i < imageFiles.length; i++) {
      const f = imageFiles[i];

      // Stagger drops 200ms each
      if (i > 0 && !reducedMotion) await wait(200);

      const pos = calculatePosition(state.images.length);
      const imageData = {
        id: uid(),
        dataUrl: '',
        ...pos,
      };

      // Add placeholder card
      addImageCard(imageData, true);
      state.images.push(imageData);

      // Hide empty hint after first add
      if (state.images.length === 1) {
        const hint = $('[data-empty-hint]');
        if (hint) hint.classList.add('is-hidden');
      }

      // Update counter + atmosphere
      updateCounter();
      updateAtmosphereTier(state.images.length);
      updateForwardCTA();

      // Load file async, replace placeholder
      try {
        const dataUrl = await readFile(f);
        imageData.dataUrl = dataUrl;
        const card = $(`[data-image-id="${imageData.id}"]`);
        if (card) {
          card.style.backgroundImage = `url('${dataUrl}')`;
          card.classList.remove('is-loading');
        }
      } catch (err) {
        // Remove failed card silently
        const card = $(`[data-image-id="${imageData.id}"]`);
        if (card) card.remove();
        state.images = state.images.filter((img) => img.id !== imageData.id);
        updateCounter();
        updateAtmosphereTier(state.images.length);
        updateForwardCTA();
      }
    }
  }

  function addImageCard(imageData, isLoading) {
    const layer = $('[data-image-layer]');
    if (!layer) return;

    const card = document.createElement('div');
    card.className = 'image-card' + (isLoading ? ' is-loading is-fresh' : ' is-fresh');
    card.dataset.imageId = imageData.id;
    card.style.setProperty('--tilt', `${imageData.tilt}deg`);
    card.style.setProperty('--drift', `${imageData.drift}s`);
    card.style.left = `${imageData.x}%`;
    card.style.top = `${imageData.y}%`;

    if (imageData.dataUrl) {
      card.style.backgroundImage = `url('${imageData.dataUrl}')`;
    }

    card.addEventListener('click', () => removeImage(imageData.id));

    layer.appendChild(card);

    // Trigger settle animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.add('is-placed');
      });
    });

    // Remove "fresh" glow after 800ms
    window.setTimeout(() => {
      card.classList.remove('is-fresh');
    }, reducedMotion ? 200 : 900);
  }

  function removeImage(id) {
    const card = $(`[data-image-id="${id}"]`);
    if (!card) return;

    card.classList.add('is-releasing');
    window.setTimeout(() => {
      card.remove();
      state.images = state.images.filter((img) => img.id !== id);
      updateCounter();
      updateAtmosphereTier(state.images.length);
      updateForwardCTA();

      if (state.images.length === 0) {
        const hint = $('[data-empty-hint]');
        if (hint) hint.classList.remove('is-hidden');
      }
    }, reducedMotion ? 200 : 1000);
  }

  // ---------------------------------------------------------
  // COUNTER + ATMOSPHERE + FORWARD CTA
  // ---------------------------------------------------------

  function counterText(n) {
    if (n === 0) return '';
    if (n === 1) return '1장 두셨어요. 더 두어도 좋고요.';
    if (n === 2) return '2장 두셨어요. 더 두어도 좋고요.';
    if (n === 3) return '3장 두셨어요. 충분해요. 더 두어도 좋고요.';
    if (n === 4) return '4장 두셨어요. 결이 모이고 있어요.';
    if (n === 5) return '5장 두셨어요. 풍경이 모이고 있어요.';
    if (n <= 7) return `${n}장 두셨어요. 풍경이 모이고 있어요.`;
    if (n <= 11) return `${n}장 두셨어요. 당신의 결이 보여요.`;
    return `${n}장. 두고 싶은 만큼 두세요.`;
  }

  function updateCounter() {
    const counter = $('[data-counter]');
    if (!counter) return;
    const n = state.images.length;
    counter.textContent = counterText(n);
    counter.classList.toggle('is-visible', n > 0);
  }

  function updateAtmosphereTier(count) {
    const body = document.body;
    body.classList.remove('atmo-cold', 'atmo-warming', 'atmo-warm', 'atmo-glow');
    if (count === 0)      body.classList.add('atmo-cold');
    else if (count <= 2)  body.classList.add('atmo-warming');
    else if (count <= 5)  body.classList.add('atmo-warm');
    else                  body.classList.add('atmo-glow');
  }

  function updateForwardCTA() {
    const cta = $('.cta-forward');
    if (!cta) return;
    if (state.images.length >= 3) {
      cta.setAttribute('data-state', 'visible');
    } else {
      cta.setAttribute('data-state', 'hidden');
    }
  }

  // ---------------------------------------------------------
  // DRAG-DROP / PASTE / FILE PICKER
  // ---------------------------------------------------------

  function setupUploadInputs() {
    const fileInput = $('.file-input');
    const addBtn = $('[data-action="add"]');

    addBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      addImages(e.target.files);
      fileInput.value = '';
    });

    // Drag-drop on entire page
    let dragCounter = 0;
    function isFiles(e) {
      if (!e.dataTransfer) return false;
      const types = e.dataTransfer.types;
      return types && Array.from(types).indexOf('Files') !== -1;
    }

    window.addEventListener('dragenter', (e) => {
      if (!isFiles(e) || state.phase !== 'canvas') return;
      e.preventDefault();
      dragCounter++;
      document.body.classList.add('is-dragging');
    });

    window.addEventListener('dragover', (e) => {
      if (!isFiles(e) || state.phase !== 'canvas') return;
      e.preventDefault();
    });

    window.addEventListener('dragleave', (e) => {
      if (!isFiles(e) || state.phase !== 'canvas') return;
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        document.body.classList.remove('is-dragging');
      }
    });

    window.addEventListener('drop', (e) => {
      if (!isFiles(e) || state.phase !== 'canvas') return;
      e.preventDefault();
      dragCounter = 0;
      document.body.classList.remove('is-dragging');
      addImages(e.dataTransfer.files);
    });

    // Paste (clipboard images)
    window.addEventListener('paste', (e) => {
      if (state.phase !== 'canvas') return;
      const items = (e.clipboardData || {}).items;
      if (!items) return;
      const images = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.startsWith('image/')) {
          const f = items[i].getAsFile();
          if (f) images.push(f);
        }
      }
      if (images.length) addImages(images);
    });
  }

  // ---------------------------------------------------------
  // STATE C — FORWARD THRESHOLD BEAT
  // ---------------------------------------------------------

  async function playForwardBeat() {
    state.phase = 'forward';
    document.body.setAttribute('data-threshold', 'active');

    // Fade canvas out
    const canvas = $('.canvas-state');
    canvas.setAttribute('data-phase', 'exiting');

    await wait(reducedMotion ? 200 : 1400);

    // Show forward beat container
    const beat = $('.forward-beat');
    beat.setAttribute('data-phase', 'active');

    // Brief pause
    await wait(reducedMotion ? 200 : 400);

    // First line
    const line1 = $('.beat-line[data-line="0"]');
    const line2 = $('.beat-line[data-line="1"]');

    line1.classList.add('is-revealed');
    await wait(reducedMotion ? 1500 : 3000);

    // First line exits
    line1.classList.remove('is-revealed');
    line1.classList.add('is-exiting');
    await wait(reducedMotion ? 400 : 1400);

    // Brief pause
    await wait(reducedMotion ? 200 : 400);

    // Second line
    line2.classList.add('is-revealed');
    await wait(reducedMotion ? 1500 : 2400);

    // Second line exits
    line2.classList.remove('is-revealed');
    line2.classList.add('is-exiting');
    await wait(reducedMotion ? 400 : 1400);

    // Real app: router.push('/onboarding/sound')
    // Demo: reset to Intro
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

    // Clear images
    const layer = $('[data-image-layer]');
    if (layer) layer.innerHTML = '';
    state.images = [];
    updateCounter();
    updateAtmosphereTier(0);
    updateForwardCTA();

    // Show empty hint
    const hint = $('[data-empty-hint]');
    if (hint) hint.classList.remove('is-hidden');

    // Hide canvas, show intro
    const canvas = $('.canvas-state');
    canvas.setAttribute('data-phase', 'hidden');

    const intro = $('.intro');
    intro.setAttribute('data-phase', 'active');
    intro.style.opacity = '';

    // Reset reveal classes
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
    setupUploadInputs();
    startIntro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
