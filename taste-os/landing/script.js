/* ============================================================
   Taste OS — Landing Page
   Reveal choreography & ambient interactions.
   Vanilla JS, no dependencies.
   ============================================================ */

(function () {
  'use strict';

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // 1. Hero choreography — initial reveals on load
  // ---------------------------------------------------------
  //
  // Elements with [data-reveal] inside the .hero section fire
  // their reveal on load (with optional [data-delay] in ms).
  // All other [data-reveal] elements fire when they intersect
  // the viewport (handled by IntersectionObserver below).

  function revealHero() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const heroRevealEls = hero.querySelectorAll('[data-reveal]');
    heroRevealEls.forEach((el) => {
      const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      const t = prefersReducedMotion ? Math.min(delay, 400) : delay;
      window.setTimeout(() => el.classList.add('is-revealed'), t);
    });
  }

  // ---------------------------------------------------------
  // 2. Scroll-triggered reveals
  // ---------------------------------------------------------
  //
  // Sections fade in as they cross 30% viewport threshold.
  // Inside each section, [data-reveal] children fade in with
  // their own optional delay.

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

          // mark the section itself as in-view (used by Cards in §5)
          section.classList.add('is-in-view');

          // reveal children
          const children = section.querySelectorAll('[data-reveal]');
          children.forEach((el) => {
            const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
            const t = prefersReducedMotion ? Math.min(delay, 200) : delay;
            window.setTimeout(() => el.classList.add('is-revealed'), t);
          });

          // also reveal Cards (which use their own .is-in-view)
          const cards = section.querySelectorAll('.card');
          cards.forEach((card, i) => {
            const t = prefersReducedMotion ? 0 : i * 200;
            window.setTimeout(() => card.classList.add('is-in-view'), t);
          });

          // unobserve — reveal happens once
          observer.unobserve(section);
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  // ---------------------------------------------------------
  // 3. Scroll hint — fade out on first scroll input
  // ---------------------------------------------------------

  function setupScrollHint() {
    const hint = document.querySelector('.scroll-hint');
    if (!hint) return;

    const hideHint = () => {
      hint.style.transition = 'opacity 0.8s ease';
      hint.style.opacity = '0';
      window.removeEventListener('scroll', hideHint);
      window.removeEventListener('wheel', hideHint);
      window.removeEventListener('touchmove', hideHint);
    };

    window.addEventListener('scroll', hideHint, { passive: true, once: true });
    window.addEventListener('wheel', hideHint, { passive: true, once: true });
    window.addEventListener('touchmove', hideHint, { passive: true, once: true });
  }

  // ---------------------------------------------------------
  // 4. Beacon click — navigates to onboarding (placeholder)
  // ---------------------------------------------------------

  function setupBeacons() {
    const beacons = document.querySelectorAll('.beacon');
    beacons.forEach((beacon) => {
      beacon.addEventListener('click', (e) => {
        e.preventDefault();
        // In a real Next.js app, this would route to /onboarding.
        // Here in the static preview, we play a small acknowledgment
        // and then briefly fade the page — communicating the threshold
        // without actually navigating away.
        beacon.style.transition = 'all 0.4s ease';
        beacon.style.borderColor = 'rgba(217, 166, 108, 0.72)';
        beacon.style.background = 'rgba(217, 166, 108, 0.08)';

        window.setTimeout(() => {
          document.body.style.transition = 'opacity 1.4s ease';
          document.body.style.opacity = '0.0';

          window.setTimeout(() => {
            // bring it back — this is a preview, not a real flow
            document.body.style.transition = 'opacity 0.9s ease';
            document.body.style.opacity = '1';
            beacon.style.borderColor = '';
            beacon.style.background = '';
          }, 1800);
        }, 600);
      });
    });
  }

  // ---------------------------------------------------------
  // 5. Subtle cursor-follow shift on the Door (final CTA)
  // ---------------------------------------------------------
  //
  // The door's warmth temperature shifts slightly with cursor
  // position — as if the room beyond is warm and aware.

  function setupDoorParallax() {
    if (prefersReducedMotion) return;
    const door = document.querySelector('.door');
    if (!door) return;

    const finalSection = document.querySelector('.final');
    if (!finalSection) return;

    let isHovering = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    finalSection.addEventListener('mouseenter', () => { isHovering = true; });
    finalSection.addEventListener('mouseleave', () => {
      isHovering = false;
      targetX = 0;
      targetY = 0;
    });

    finalSection.addEventListener('mousemove', (e) => {
      const rect = finalSection.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = (e.clientX - cx) / rect.width * 12;
      targetY = (e.clientY - cy) / rect.height * 8;
    });

    function tick() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      door.style.transform = `translate(${currentX}px, ${currentY}px)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------
  // 6. Initialize
  // ---------------------------------------------------------

  function init() {
    revealHero();
    setupScrollReveals();
    setupScrollHint();
    setupBeacons();
    setupDoorParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
