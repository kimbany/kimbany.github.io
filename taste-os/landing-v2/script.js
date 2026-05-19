/* ==========================================================
   Taste OS — Landing v2
   Reveal choreography, dust particles, door parallax.
   Vanilla JS, no dependencies.
   ========================================================== */

(function () {
  'use strict';

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // 1. Dust particles — spawn 24 staggered
  // ---------------------------------------------------------

  function spawnDust() {
    if (prefersReducedMotion) return;

    const field = document.querySelector('.dust-field');
    if (!field) return;

    const count = 24;
    const colors = ['dust-rose', 'dust-silver'];

    for (let i = 0; i < count; i++) {
      const d = document.createElement('span');
      d.className = 'dust ' + (i % 4 === 0 ? 'dust-silver' : 'dust-rose');

      // random horizontal position
      d.style.left = (Math.random() * 100).toFixed(2) + '%';

      // varied durations so they aren't synchronized
      const dur = 12 + Math.random() * 6;
      d.style.animationDuration = `${dur}s, ${dur}s`;

      // staggered start so the field fills gradually
      const delay = (i * 0.5) - 6;
      d.style.animationDelay = `${delay}s, ${delay}s`;

      // very subtle size variance
      const size = 1.5 + Math.random() * 1.5;
      d.style.width = `${size}px`;
      d.style.height = `${size}px`;

      field.appendChild(d);
    }
  }

  // ---------------------------------------------------------
  // 2. Hero — initial sequenced reveals
  // ---------------------------------------------------------

  function revealHero() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const els = hero.querySelectorAll('[data-reveal]');
    els.forEach((el) => {
      const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      const t = prefersReducedMotion ? Math.min(delay, 400) : delay;
      window.setTimeout(() => el.classList.add('is-revealed'), t);
    });
  }

  // ---------------------------------------------------------
  // 3. Scroll-triggered reveals via IntersectionObserver
  // ---------------------------------------------------------

  function setupScrollReveals() {
    const sections = document.querySelectorAll(
      '[data-section]:not([data-section="hero"])'
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const section = entry.target;
          section.classList.add('is-in-view');

          // reveal child [data-reveal] elements with their own delays
          const children = section.querySelectorAll('[data-reveal]');
          children.forEach((el) => {
            const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
            const t = prefersReducedMotion ? Math.min(delay, 200) : delay;
            window.setTimeout(() => el.classList.add('is-revealed'), t);
          });

          // taste cards — staggered diagonal sweep
          const tasteCards = section.querySelectorAll('.taste-card');
          tasteCards.forEach((card, i) => {
            const t = prefersReducedMotion ? 0 : i * 220;
            window.setTimeout(() => card.classList.add('is-in-view'), t);
          });

          // share cards — staggered
          const shareCards = section.querySelectorAll('.share-card');
          shareCards.forEach((card, i) => {
            const t = prefersReducedMotion ? 0 : i * 240;
            window.setTimeout(() => card.classList.add('is-in-view'), t);
          });

          observer.unobserve(section);
        });
      },
      {
        threshold: 0.28,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  // ---------------------------------------------------------
  // 4. Scroll hint — fade on first scroll input
  // ---------------------------------------------------------

  function setupScrollHint() {
    const hint = document.querySelector('.scroll-hint');
    if (!hint) return;

    const hide = () => {
      hint.style.transition = 'opacity 1.0s ease';
      hint.style.opacity = '0';
    };

    const opts = { passive: true, once: true };
    window.addEventListener('scroll', hide, opts);
    window.addEventListener('wheel', hide, opts);
    window.addEventListener('touchmove', hide, opts);
  }

  // ---------------------------------------------------------
  // 5. Beacon — preview-mode acknowledgment
  // ---------------------------------------------------------

  function setupBeacons() {
    const beacons = document.querySelectorAll('.beacon');
    beacons.forEach((beacon) => {
      beacon.addEventListener('click', (e) => {
        e.preventDefault();

        // visual acknowledgment
        beacon.style.transition = 'all 0.5s ease';
        beacon.style.borderColor = 'rgba(176, 118, 114, 0.65)';
        beacon.style.background = 'rgba(176, 118, 114, 0.10)';

        // threshold beat — page fades briefly, then returns
        window.setTimeout(() => {
          document.body.style.transition = 'opacity 1.6s ease';
          document.body.style.opacity = '0';

          window.setTimeout(() => {
            document.body.style.transition = 'opacity 1.0s ease';
            document.body.style.opacity = '1';
            beacon.style.borderColor = '';
            beacon.style.background = '';
          }, 2000);
        }, 700);
      });
    });
  }

  // ---------------------------------------------------------
  // 6. Door parallax on cursor in final section
  // ---------------------------------------------------------

  function setupDoorParallax() {
    if (prefersReducedMotion) return;
    const door = document.querySelector('.door');
    const finalSection = document.querySelector('.final');
    if (!door || !finalSection) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    finalSection.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;
    });

    finalSection.addEventListener('mousemove', (e) => {
      const rect = finalSection.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = ((e.clientX - cx) / rect.width) * 14;
      targetY = ((e.clientY - cy) / rect.height) * 10;
    });

    function tick() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      door.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------
  // 7. Taste cards — subtle warm color shift on hover
  //    (CSS handles most of it; this just adds a class for cursor proximity)
  // ---------------------------------------------------------

  function setupTasteCards() {
    if (prefersReducedMotion) return;
    const cards = document.querySelectorAll('.taste-card');
    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => card.classList.add('is-warm'));
      card.addEventListener('mouseleave', () => card.classList.remove('is-warm'));
    });
  }

  // ---------------------------------------------------------
  // 8. Init
  // ---------------------------------------------------------

  function init() {
    spawnDust();
    revealHero();
    setupScrollReveals();
    setupScrollHint();
    setupBeacons();
    setupDoorParallax();
    setupTasteCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
