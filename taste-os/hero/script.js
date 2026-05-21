/* ==========================================================
   Taste OS — Hero Section
   9-second entry sequence + damped mouse parallax + dust field
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // 1. ENTRY SEQUENCE — 9-second cinematic reveal
  // ---------------------------------------------------------

  const revealSchedule = [
    { selector: '[data-reveal="climax"]',  delay: 2000 },  // headline (2.0s)
    { selector: '[data-reveal="hairline"]', delay: 4400 }, // hairline draws
    { selector: '[data-reveal="sub"]',      delay: 5000 }, // sub headline
    { selector: '[data-reveal="beacon"]',   delay: 6600 }, // CTA appears
    { selector: '[data-reveal="wordmark"]', delay: 8200 }, // wordmark fades
  ];

  function startEntry() {
    revealSchedule.forEach((step) => {
      const el = document.querySelector(step.selector);
      if (!el) return;
      const delay = reducedMotion ? Math.min(step.delay, 400) : step.delay;
      window.setTimeout(() => el.classList.add('is-revealed'), delay);
    });
  }

  // Compress entry if user shows intent early
  function setupCompressEntry() {
    if (reducedMotion) return;

    const compress = () => {
      document.querySelectorAll('[data-reveal]')
        .forEach((el) => el.classList.add('is-revealed'));
    };

    const opts = { passive: true, once: true };
    window.addEventListener('scroll', compress, opts);
    window.addEventListener('wheel', compress, opts);
    window.addEventListener('keydown', compress, opts);
    window.addEventListener('click', compress, opts);
  }

  // ---------------------------------------------------------
  // 2. MOUSE PARALLAX — damped lerp at 0.05
  // ---------------------------------------------------------

  function setupParallax() {
    if (reducedMotion) return;
    if ('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches) {
      // Touch-only device — try device orientation instead
      setupDeviceOrientation();
      return;
    }

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let active = false;

    function onMove(e) {
      active = true;
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    function onLeave() {
      // gentle return to center when mouse leaves window
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

    // Also apply parallax to orbs via transform
    applyOrbParallax();
  }

  function applyOrbParallax() {
    const depths = { 'orb-1': 12, 'orb-2': 8, 'orb-3': 10, 'orb-4': 4 };

    Object.entries(depths).forEach(([name, depth]) => {
      const orb = document.querySelector(`.${name}`);
      if (!orb) return;
      orb.style.setProperty('--depth', `${depth}px`);
      orb.classList.add('parallax-on');
    });
  }

  function setupDeviceOrientation() {
    if (!('DeviceOrientationEvent' in window)) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    function onOrient(e) {
      if (e.gamma === null || e.beta === null) return;
      targetX = (e.gamma ?? 0) / 30;
      targetY = ((e.beta ?? 0) - 30) / 30;
    }

    function tick() {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      document.documentElement.style.setProperty('--parallax-x', currentX.toFixed(3));
      document.documentElement.style.setProperty('--parallax-y', currentY.toFixed(3));
      requestAnimationFrame(tick);
    }

    // iOS 13+ requires permission — only ask after user gesture
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // Don't auto-request; just register listener and hope user enables
      window.addEventListener('deviceorientation', onOrient);
    } else {
      window.addEventListener('deviceorientation', onOrient);
    }

    requestAnimationFrame(tick);
    applyOrbParallax();
  }

  // ---------------------------------------------------------
  // 3. DUST FIELD — 24 particles drifting upward
  // ---------------------------------------------------------

  function spawnDust() {
    if (reducedMotion) return;

    const field = document.querySelector('.dust-field');
    if (!field) return;

    const width = window.innerWidth;
    let count = 24;
    if (width < 768) count = 0;             // none on phones
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
  // 4. BEACON CLICK — preview-mode acknowledgment
  // ---------------------------------------------------------

  function setupBeacon() {
    const beacon = document.querySelector('.beacon');
    if (!beacon) return;

    beacon.addEventListener('click', (e) => {
      e.preventDefault();

      // In real Next.js: router.push('/onboarding')
      // Here: brief acknowledgment animation
      beacon.style.transition = 'all 0.5s ease';
      beacon.style.borderColor = 'rgba(176, 118, 114, 0.65)';
      beacon.style.background = 'rgba(176, 118, 114, 0.10)';

      window.setTimeout(() => {
        document.body.style.transition = 'opacity 1.4s ease';
        document.body.style.opacity = '0';

        window.setTimeout(() => {
          document.body.style.transition = 'opacity 1.0s ease';
          document.body.style.opacity = '1';
          beacon.style.borderColor = '';
          beacon.style.background = '';
        }, 1800);
      }, 600);
    });
  }

  // ---------------------------------------------------------
  // 5. INIT
  // ---------------------------------------------------------

  function init() {
    spawnDust();
    setupParallax();
    setupCompressEntry();
    setupBeacon();
    startEntry();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
