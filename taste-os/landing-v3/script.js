/* ==========================================================
   Taste OS — Landing v3
   7-act cinematic scroll + global mouse parallax + dust field
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const HERO_ENTRY_SCHEDULE = [
    { selector: '[data-reveal="hero-headline"]',  delay: 2000 },
    { selector: '[data-reveal="hero-hairline"]', delay: 4400 },
    { selector: '[data-reveal="hero-sub"]',      delay: 5000 },
    { selector: '[data-reveal="hero-cta"]',      delay: 6600 },
    { selector: '[data-reveal="hero-wordmark"]', delay: 8200 },
    { selector: '[data-reveal="hero-hint"]',     delay: 8600 },
  ];

  // ---------------------------------------------------------
  // 1. HERO ENTRY
  // ---------------------------------------------------------

  function startHeroEntry() {
    HERO_ENTRY_SCHEDULE.forEach((step) => {
      const el = document.querySelector(step.selector);
      if (!el) return;
      const delay = reducedMotion ? Math.min(step.delay, 400) : step.delay;
      window.setTimeout(() => el.classList.add('is-revealed'), delay);
    });
  }

  function setupHeroShortcircuit() {
    if (reducedMotion) return;

    const compress = () => {
      // Reveal all hero-* elements immediately
      HERO_ENTRY_SCHEDULE.forEach((step) => {
        const el = document.querySelector(step.selector);
        if (el) el.classList.add('is-revealed');
      });
    };

    const opts = { passive: true, once: true };
    window.addEventListener('scroll', compress, opts);
    window.addEventListener('keydown', compress, opts);
  }

  // ---------------------------------------------------------
  // 2. GLOBAL MOUSE PARALLAX (entire page)
  // ---------------------------------------------------------

  let parallaxRafId = null;

  function setupGlobalParallax() {
    if (reducedMotion) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    function onMove(e) {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    function onLeave() {
      targetX = 0;
      targetY = 0;
    }

    function tick() {
      // Slower lerp for full page (scrolling content)
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      document.documentElement.style.setProperty('--parallax-x', currentX.toFixed(3));
      document.documentElement.style.setProperty('--parallax-y', currentY.toFixed(3));
      parallaxRafId = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    parallaxRafId = requestAnimationFrame(tick);
  }

  // Apply parallax depth to each orb
  function applyOrbParallax() {
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach((orb) => {
      const dx = orb.style.getPropertyValue('--depth-x') || '8px';
      const dy = orb.style.getPropertyValue('--depth-y') || '6px';
      // Use computed style — depths are already set via CSS custom properties
    });
  }

  // ---------------------------------------------------------
  // 3. DOOR PARALLAX (final CTA section — stronger follow)
  // ---------------------------------------------------------

  function setupDoorParallax() {
    if (reducedMotion) return;

    const door = document.querySelector('.door');
    const finalSection = document.querySelector('.final');
    if (!door || !finalSection) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    function onMove(e) {
      const rect = finalSection.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        targetX = 0;
        targetY = 0;
        return;
      }
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = ((e.clientX - cx) / rect.width) * 14;
      targetY = ((e.clientY - cy) / rect.height) * 10;
    }

    function tick() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      door.style.setProperty('--door-x', currentX.toFixed(2));
      door.style.setProperty('--door-y', currentY.toFixed(2));
      requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove);
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------
  // 4. DUST FIELD
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
  // 5. SCROLL-TRIGGERED REVEALS
  // ---------------------------------------------------------

  function setupScrollReveals() {
    // Sections except hero (which fires on load)
    const sections = document.querySelectorAll(
      '[data-section]:not([data-section="hero"])'
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const section = entry.target;
          section.classList.add('is-in-view');

          // Reveal children with their own delays
          const els = section.querySelectorAll('[data-reveal]');
          els.forEach((el) => {
            const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
            const t = reducedMotion ? Math.min(delay, 200) : delay;
            window.setTimeout(() => el.classList.add('is-revealed'), t);
          });

          // Genome cards (4 of them, staggered)
          const gCards = section.querySelectorAll('.g-card');
          gCards.forEach((card, i) => {
            const t = reducedMotion ? 0 : i * 220;
            window.setTimeout(() => card.classList.add('is-in-view'), t);
          });

          // Share cards
          const sCards = section.querySelectorAll('.share-card');
          sCards.forEach((card, i) => {
            const t = reducedMotion ? 0 : i * 240;
            window.setTimeout(() => card.classList.add('is-in-view'), t);
          });

          observer.unobserve(section);
        });
      },
      {
        threshold: 0.22,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    sections.forEach((s) => observer.observe(s));
  }

  // ---------------------------------------------------------
  // 6. CTA BEACONS — preview-mode acknowledgment
  // ---------------------------------------------------------

  function setupBeacons() {
    const beacons = document.querySelectorAll('[data-action="cta"]');
    beacons.forEach((beacon) => {
      beacon.addEventListener('click', (e) => {
        e.preventDefault();

        beacon.style.transition = 'all 0.5s ease';
        beacon.style.borderColor = 'rgba(176, 118, 114, 0.65)';
        beacon.style.background = 'rgba(176, 118, 114, 0.10)';

        window.setTimeout(() => {
          document.body.style.transition = 'opacity 1.4s ease';
          document.body.style.opacity = '0';
          window.setTimeout(() => {
            window.location.href = '../onboarding/';
          }, 1400);
        }, 600);
      });
    });
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    spawnDust();
    setupGlobalParallax();
    applyOrbParallax();
    setupDoorParallax();
    setupHeroShortcircuit();
    setupScrollReveals();
    setupBeacons();
    startHeroEntry();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
