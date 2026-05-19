/* ==========================================================
   Taste OS — Sharing Studio
   Card expansion + send simulation + export toasts.
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function wait(ms) { return new Promise((r) => window.setTimeout(r, ms)); }

  // ---------------------------------------------------------
  // SCROLL REVEALS
  // ---------------------------------------------------------

  function setupScrollReveals() {
    const sections = $$('[data-section]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const section = entry.target;

          const els = $$('[data-reveal]', section);
          els.forEach((el) => {
            const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
            const t = reducedMotion ? Math.min(delay, 200) : delay;
            window.setTimeout(() => el.classList.add('is-revealed'), t);
          });

          observer.unobserve(section);
        });
      },
      {
        threshold: 0.22,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    sections.forEach((s) => observer.observe(s));
  }

  // also reveal the hero immediately on load
  function revealHero() {
    const hero = $('.hero');
    if (!hero) return;
    const els = $$('[data-reveal]', hero);
    els.forEach((el) => {
      const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      const t = reducedMotion ? Math.min(delay, 200) : 1000 + delay;
      window.setTimeout(() => el.classList.add('is-revealed'), t);
    });
  }

  // ---------------------------------------------------------
  // CARD EXPANSION
  // ---------------------------------------------------------

  let currentCardId = null;

  function setupCardExpansion() {
    const cards = $$('.taste-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.card;
        expandCard(card, id);
      });
    });

    // close handlers
    $('[data-expanded-scrim]').addEventListener('click', closeExpanded);
    $('[data-action="close"]').addEventListener('click', closeExpanded);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && currentCardId) closeExpanded();
    });

    // send handler
    $('[data-action="send"]').addEventListener('click', simulateSend);

    // export handlers
    $$('[data-export]').forEach((btn) => {
      btn.addEventListener('click', () => showExportToast(btn.dataset.export));
    });

    // room CTA
    $('[data-action="room-card"]').addEventListener('click', showRoomCta);
  }

  function expandCard(originalCard, id) {
    currentCardId = id;

    // clone the card content into the expanded view
    const stage = $('[data-expanded-card]');
    stage.innerHTML = '';

    const clone = originalCard.cloneNode(true);
    // strip animation, reset tilt
    clone.style.animation = 'none';
    clone.style.transform = 'none';
    clone.style.cursor = 'default';
    // make sure it fills the parent
    clone.style.width = '100%';
    clone.style.maxWidth = '100%';
    clone.style.height = '100%';

    stage.appendChild(clone);

    // open overlay
    $('[data-expanded]').setAttribute('data-state', 'visible');
    document.body.style.overflow = 'hidden';
  }

  function closeExpanded() {
    if (!currentCardId) return;
    currentCardId = null;
    $('[data-expanded]').setAttribute('data-state', 'hidden');
    document.body.style.overflow = '';

    // reset send overlay if visible
    const sendOverlay = $('[data-send-overlay]');
    if (sendOverlay) sendOverlay.setAttribute('data-state', 'hidden');
  }

  // ---------------------------------------------------------
  // SEND SIMULATION
  // ---------------------------------------------------------

  async function simulateSend() {
    if (!currentCardId) return;
    const sendOverlay = $('[data-send-overlay]');
    const sendMsg = $('[data-send-message]');
    if (!sendOverlay || !sendMsg) return;

    const stage = $('[data-expanded-card]');
    const meta = $('[data-expanded-meta]');
    const exports = $('.expanded-exports');
    const actions = $('.expanded-actions');

    // 1) Beacon (the send button) warms briefly
    const beacon = $('[data-action="send"]');
    if (beacon) {
      beacon.style.borderColor = 'rgba(176, 118, 114, 0.7)';
      beacon.style.background = 'rgba(176, 118, 114, 0.10)';
    }
    await wait(reducedMotion ? 200 : 500);

    // 2) fade the card and surrounding chrome
    [stage, meta, exports, actions].forEach((el) => {
      if (el) {
        el.style.transition = 'opacity 1.2s ease';
        el.style.opacity = '0';
      }
    });
    await wait(reducedMotion ? 200 : 800);

    // 3) show "잘 갔어요."
    sendMsg.textContent = '잘 갔어요.';
    sendOverlay.setAttribute('data-state', 'visible');
    await wait(reducedMotion ? 600 : 1800);

    // 4) change to second message
    sendMsg.style.transition = 'opacity 1.0s ease';
    sendMsg.style.opacity = '0';
    await wait(reducedMotion ? 200 : 600);
    sendMsg.textContent = '다른 사람의 자리에 도착했어요.';
    sendMsg.style.opacity = '1';
    await wait(reducedMotion ? 600 : 2200);

    // 5) fade everything out
    sendOverlay.style.transition = 'opacity 1.4s ease';
    sendOverlay.style.opacity = '0';
    await wait(reducedMotion ? 400 : 1400);

    // 6) close and reset
    closeExpanded();
    setTimeout(() => {
      // reset states
      if (sendOverlay) {
        sendOverlay.removeAttribute('style');
        sendOverlay.setAttribute('data-state', 'hidden');
        sendMsg.removeAttribute('style');
      }
      [stage, meta, exports, actions].forEach((el) => {
        if (el) el.removeAttribute('style');
      });
      if (beacon) {
        beacon.style.borderColor = '';
        beacon.style.background = '';
      }
    }, 600);
  }

  // ---------------------------------------------------------
  // EXPORT TOASTS
  // ---------------------------------------------------------

  const EXPORT_MESSAGES = {
    image: '이미지로 만들고 있어요…',
    film:  '24초짜리 짧은 영상으로 천천히 만들고 있어요…',
    print: '인쇄용 종이로 준비하고 있어요.',
  };

  async function showExportToast(kind) {
    const toast = $('[data-export-toast]');
    if (!toast) return;

    toast.textContent = EXPORT_MESSAGES[kind] || '준비하고 있어요…';
    toast.setAttribute('data-state', 'visible');

    await wait(reducedMotion ? 1200 : 3000);
    toast.setAttribute('data-state', 'hidden');
  }

  // ---------------------------------------------------------
  // ROOM CTA
  // ---------------------------------------------------------

  async function showRoomCta() {
    const toast = $('[data-export-toast]');
    if (!toast) return;

    toast.textContent = '여기, 카드 한 장 두고 갈게요.';
    toast.setAttribute('data-state', 'visible');

    await wait(reducedMotion ? 1200 : 2400);
    toast.setAttribute('data-state', 'hidden');
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    revealHero();
    setupScrollReveals();
    setupCardExpansion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
