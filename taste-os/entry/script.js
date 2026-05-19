/* ==========================================================
   Taste OS — Entry / 들어가는 자리
   12s entry sequence + 8s threshold beat
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // MOMENT 1 — ENTRY SEQUENCE (12 seconds)
  // ---------------------------------------------------------

  const entrySchedule = [
    { selector: '[data-reveal="pre-line"]',  delay: 2000 },
    { selector: '[data-reveal="headline"]',  delay: 4000 },
    { selector: '[data-reveal="hairline"]',  delay: 6800 },
    { selector: '[data-reveal="sub-1"]',     delay: 7500 },
    { selector: '[data-reveal="sub-2"]',     delay: 8300 },
    { selector: '[data-reveal="sub-3"]',     delay: 9100 },
    { selector: '[data-reveal="beacon"]',    delay: 10000 },
    { selector: '[data-reveal="info"]',      delay: 11500 },
  ];

  function startEntry() {
    entrySchedule.forEach((step) => {
      const el = document.querySelector(step.selector);
      if (!el) return;
      const delay = reducedMotion ? Math.min(step.delay, 400) : step.delay;
      window.setTimeout(() => el.classList.add('is-revealed'), delay);
    });
  }

  // ---------------------------------------------------------
  // MOUSE PARALLAX — Moment 1 only
  // ---------------------------------------------------------

  let parallaxActive = true;

  function setupParallax() {
    if (reducedMotion) return;
    if ('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    function onMove(e) {
      if (!parallaxActive) return;
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    function onLeave() {
      targetX = 0;
      targetY = 0;
    }

    function tick() {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      document.documentElement.style.setProperty('--parallax-x', currentX.toFixed(3));
      document.documentElement.style.setProperty('--parallax-y', currentY.toFixed(3));
      requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------
  // DUST FIELD
  // ---------------------------------------------------------

  function spawnDust() {
    if (reducedMotion) return;

    const field = document.querySelector('.dust-field');
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
  // MOMENT 2 — THRESHOLD BEAT (after CTA click, 8 seconds)
  // ---------------------------------------------------------

  async function playThresholdBeat() {
    // Disable parallax — Moment 2 is fully still
    parallaxActive = false;
    document.documentElement.style.setProperty('--parallax-x', '0');
    document.documentElement.style.setProperty('--parallax-y', '0');
    document.body.setAttribute('data-threshold', 'active');

    const beat = document.querySelector('.threshold-beat');
    const line1 = document.querySelector('.threshold-line[data-line="0"]');
    const line2 = document.querySelector('.threshold-line[data-line="1"]');

    // 0.5s — Beacon already showing warm; entry content fades (CSS handles)
    await wait(reducedMotion ? 200 : 500);

    // 1.9s — page entry is now hidden, show threshold container
    beat.setAttribute('data-state', 'active');
    await wait(reducedMotion ? 200 : 1400);

    // 2.4s — first line reveals
    line1.classList.add('is-revealed');
    await wait(reducedMotion ? 1500 : 3000);

    // 5.4s — first line exits
    line1.classList.remove('is-revealed');
    line1.classList.add('is-exiting');
    await wait(reducedMotion ? 400 : 1800);

    // 7.2s — second line reveals
    line2.classList.add('is-revealed');
    await wait(reducedMotion ? 1500 : 3000);

    // 10.2s — second line exits + page fades back
    line2.classList.remove('is-revealed');
    line2.classList.add('is-exiting');
    await wait(reducedMotion ? 400 : 1400);

    // Real app: router.push('/onboarding/images')
    // Demo: reset and fade entry back in
    await wait(reducedMotion ? 300 : 1000);
    resetEntry();
  }

  function resetEntry() {
    const beat = document.querySelector('.threshold-beat');
    beat.setAttribute('data-state', 'hidden');

    document.querySelectorAll('.threshold-line').forEach((line) => {
      line.classList.remove('is-revealed', 'is-exiting');
    });

    document.body.removeAttribute('data-threshold');
    parallaxActive = true;

    // Fade entry back in (slowly, like waking up)
    const entry = document.querySelector('.entry');
    if (entry) {
      entry.style.transition = 'opacity 1.6s cubic-bezier(0.16, 1, 0.30, 1)';
      // CSS handles the opacity reset since data-threshold is removed
    }
  }

  // ---------------------------------------------------------
  // CTA HANDLING
  // ---------------------------------------------------------

  function setupCTA() {
    const beacon = document.querySelector('[data-action="start"]');
    if (!beacon) return;

    beacon.addEventListener('click', async (e) => {
      e.preventDefault();

      // Visual ack on beacon
      beacon.style.transition = 'all 0.5s ease';
      beacon.style.borderColor = 'rgba(176, 118, 114, 0.65)';
      beacon.style.background = 'rgba(176, 118, 114, 0.10)';

      // After brief warm, play threshold beat
      window.setTimeout(() => {
        playThresholdBeat();
      }, 500);
    });
  }

  // ---------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------

  function wait(ms) {
    return new Promise((r) => window.setTimeout(r, ms));
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    spawnDust();
    setupParallax();
    setupCTA();
    startEntry();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
