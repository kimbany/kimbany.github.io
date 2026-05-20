/* ==========================================================
   Taste OS — Sound Atmosphere demo controller
   Wires the page to the generative ambient engine (./ambient.js).
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  let activePreset = 'report';   // matches the .is-active button in HTML

  // ---------------------------------------------------------
  // AUDIO TOGGLE
  // ---------------------------------------------------------

  function setupAudioToggle() {
    const toggle = $('[data-audio-toggle]');
    const label = $('[data-audio-label]');
    if (!toggle || !window.TasteAmbient) return;

    toggle.addEventListener('click', () => {
      if (TasteAmbient.isPlaying()) {
        TasteAmbient.stop();
        document.body.removeAttribute('data-audio');
        toggle.setAttribute('aria-pressed', 'false');
        if (label) label.textContent = '소리 들이기';
      } else {
        TasteAmbient.start(activePreset);
        const warmthEl = $('[data-warmth]');
        if (warmthEl) TasteAmbient.setWarmth(parseInt(warmthEl.value, 10) / 100);
        document.body.setAttribute('data-audio', 'on');
        toggle.setAttribute('aria-pressed', 'true');
        if (label) label.textContent = '소리 잠재우기';
      }
    });
  }

  // ---------------------------------------------------------
  // PRESETS
  // ---------------------------------------------------------

  function setupPresets() {
    $$('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        activePreset = preset;
        document.body.setAttribute('data-preset', preset);
        $$('[data-preset]').forEach((b) => b.classList.toggle('is-active', b === btn));
        if (window.TasteAmbient && TasteAmbient.isPlaying()) {
          TasteAmbient.setPreset(preset);
        }
      });
    });
    // reflect initial active preset on body
    document.body.setAttribute('data-preset', activePreset);
  }

  // ---------------------------------------------------------
  // WARMTH
  // ---------------------------------------------------------

  function setupWarmth() {
    const slider = $('[data-warmth]');
    if (!slider) return;
    slider.addEventListener('input', () => {
      if (window.TasteAmbient) TasteAmbient.setWarmth(parseInt(slider.value, 10) / 100);
    });
  }

  // ---------------------------------------------------------
  // CHIME
  // ---------------------------------------------------------

  function setupChime() {
    const btn = $('[data-chime]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (window.TasteAmbient && TasteAmbient.isPlaying()) TasteAmbient.chime();
    });
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

  function init() {
    setupAudioToggle();
    setupPresets();
    setupWarmth();
    setupChime();
    setupReveals();
    spawnDust();
    setupParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
