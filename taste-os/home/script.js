/* ==========================================================
   Taste OS — Identity Home
   "조용한 감정의 방"
   Signatures:
     A) Time-aware atmosphere (dawn / day / dusk / night)
     B) Living atmosphere orb (handled in CSS — breathing)
     + Floating memory fragments with visual echo on click
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // ---------------------------------------------------------
  // SIGNATURE A — Time-aware atmosphere
  // ---------------------------------------------------------

  const TIME_LABEL = {
    dawn:  '새벽의 공기',
    day:   '낮의 공기',
    dusk:  '해질녘의 공기',
    night: '깊은 밤의 공기',
  };

  function getTimeOfDay() {
    const h = new Date().getHours();
    if (h >= 5  && h < 10) return 'dawn';
    if (h >= 10 && h < 17) return 'day';
    if (h >= 17 && h < 21) return 'dusk';
    return 'night';
  }

  function applyTimeOfDay() {
    const tod = getTimeOfDay();
    const body = document.body;
    ['time-dawn', 'time-day', 'time-dusk', 'time-night']
      .forEach((c) => body.classList.remove(c));
    body.classList.add(`time-${tod}`);

    const label = $('[data-time-label]');
    if (label) label.textContent = TIME_LABEL[tod];

    // Adjust the secondary daily line based on time
    const dailyPrimary = $('[data-daily-primary]');
    const dailySecondary = $('[data-daily-secondary]');
    if (dailyPrimary && dailySecondary) {
      const copy = DAILY_COPY[tod];
      dailyPrimary.innerHTML = copy.primary;
      dailySecondary.innerHTML = copy.secondary;
    }
  }

  const DAILY_COPY = {
    dawn: {
      primary:   '새벽의 silver-blue 가<br />당신에게 조용히 머무는 시간이에요.',
      secondary: '아직 풀리지 않은 공기 속에서<br />당신은 깊은 곳을 바라보고 있어요.',
    },
    day: {
      primary:   '오늘은 조용한 따뜻함이<br />오래 머무르고 있어요.',
      secondary: '최근 당신은 차가운 고독감보다<br />인간적인 온기에 더 끌리고 있어요.',
    },
    dusk: {
      primary:   '해질녘의 ember 가<br />당신 안에 천천히 번지고 있어요.',
      secondary: '하루의 결이 무뎌지는 이 시간을<br />당신은 가장 오래 바라봅니다.',
    },
    night: {
      primary:   '밤의 rose 가<br />당신 곁에 깊게 머무르고 있어요.',
      secondary: '소리 없는 공기 속에서<br />당신은 자기 자신에게 가까워지고 있어요.',
    },
  };

  // ---------------------------------------------------------
  // LAST VISIT — friendly relative time
  // ---------------------------------------------------------

  function setLastVisitLabel() {
    const el = $('[data-last-visit-text]');
    if (!el) return;

    const stored = window.localStorage.getItem('taste-os-last-visit');
    const now = Date.now();
    let label;

    if (!stored) {
      label = '오늘 처음 방문하셨네요.';
    } else {
      const last = parseInt(stored, 10);
      const diff = now - last;
      const hours = Math.floor(diff / 36e5);
      const days = Math.floor(diff / 864e5);

      if (diff < 5 * 60 * 1000) {
        label = '방금 전에도 머무셨어요.';
      } else if (hours < 1) {
        const m = Math.max(1, Math.floor(diff / 6e4));
        label = `${m}분 전에 머무셨어요.`;
      } else if (hours < 24) {
        label = `${hours}시간 전에 머무셨어요.`;
      } else if (days < 2) {
        const d = new Date(last);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        label = `어제 ${hh}:${mm}에 다녀가셨어요.`;
      } else {
        label = `${days}일 전에 다녀가셨어요.`;
      }
    }

    el.textContent = label;
    window.localStorage.setItem('taste-os-last-visit', String(now));
  }

  // ---------------------------------------------------------
  // MEMORY FRAGMENTS
  // ---------------------------------------------------------

  const FRAGMENTS = [
    { kind: 'image',      tone: 'rose',   x: 12, y: 18, caption: '오래 머문 빛' },
    { kind: 'image',      tone: 'ember',  x: 72, y: 14, caption: '저녁의 결' },
    { kind: 'image',      tone: 'silver', x: 18, y: 64, caption: '차가운 새벽' },
    { kind: 'image',      tone: 'beige',  x: 78, y: 58, caption: '낡은 종이' },
    { kind: 'texture',    tone: 'beige',  x: 42, y: 22, caption: '손의 흔적' },
    { kind: 'texture',    tone: 'beige',  x: 56, y: 68, caption: '필름의 결' },
    { kind: 'atmosphere', tone: 'rose',   x: 32, y: 40, caption: '조용한 따뜻함' },
    { kind: 'atmosphere', tone: 'ember',  x: 62, y: 38, caption: '해질녘' },
    { kind: 'atmosphere', tone: 'silver', x: 88, y: 80, caption: '차가운 침묵' },
    { kind: 'atmosphere', tone: 'beige',  x: 8,  y: 40, caption: 'mist' },
  ];

  function buildFragments() {
    const field = $('[data-memory-field]');
    if (!field) return;

    FRAGMENTS.forEach((f, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className =
        'memory-fragment kind-' + f.kind +
        (f.tone ? ' tone-' + f.tone : '');
      el.style.left = f.x + '%';
      el.style.top  = f.y + '%';
      el.setAttribute('aria-label', f.caption);

      const inner = document.createElement('div');
      inner.className = 'frag-visual';
      if (f.kind === 'texture') {
        const span = document.createElement('span');
        inner.appendChild(span);
      }
      el.appendChild(inner);

      const caption = document.createElement('span');
      caption.className = 'frag-caption';
      caption.textContent = f.caption;
      el.appendChild(caption);

      // Slight rotation for image fragments
      if (f.kind === 'image') {
        const rot = (Math.random() - 0.5) * 10;
        inner.style.transform = `rotate(${rot.toFixed(1)}deg)`;
      }

      field.appendChild(el);

      // Drift animation via custom keyframe per-fragment
      if (!reducedMotion) {
        const dur = 10 + Math.random() * 8;
        const dx = (Math.random() - 0.5) * 60;
        const dy = (Math.random() - 0.5) * 40;
        const anim = el.animate(
          [
            { transform: 'translate(0, 0)' },
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0, 0)' },
          ],
          {
            duration: dur * 1000,
            iterations: Infinity,
            easing: 'ease-in-out',
            delay: i * 350,
          }
        );
        el._driftAnim = anim;
      }

      // Reveal stagger
      const delay = reducedMotion ? Math.min(i * 60, 240) : 220 + i * 180;
      window.setTimeout(() => el.classList.add('is-revealed'), delay);

      // Click → visual echo
      el.addEventListener('click', () => playEcho(f));
    });
  }

  function playEcho(f) {
    const overlay = $('[data-echo-overlay]');
    if (!overlay) return;

    let bg;
    switch (f.tone) {
      case 'rose':   bg = 'radial-gradient(circle at 50% 50%, rgba(176, 118, 114, 0.55), transparent 70%)'; break;
      case 'ember':  bg = 'radial-gradient(circle at 50% 50%, rgba(217, 166, 108, 0.50), transparent 70%)'; break;
      case 'silver': bg = 'radial-gradient(circle at 50% 50%, rgba(143, 160, 172, 0.45), transparent 70%)'; break;
      case 'beige':  bg = 'radial-gradient(circle at 50% 50%, rgba(216, 199, 172, 0.40), transparent 70%)'; break;
      default:       bg = 'radial-gradient(circle at 50% 50%, rgba(216, 199, 172, 0.30), transparent 70%)';
    }

    overlay.style.setProperty('--echo-bg', bg);
    overlay.classList.add('is-active');

    window.setTimeout(() => {
      overlay.classList.remove('is-active');
    }, reducedMotion ? 600 : 1800);
  }

  // ---------------------------------------------------------
  // REVEALS — IntersectionObserver
  // ---------------------------------------------------------

  function setupReveals() {
    const items = $$('[data-reveal]');

    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseInt(el.dataset.revealDelay || '0', 10);
        const scaled = reducedMotion ? Math.min(delay, 200) : delay;
        window.setTimeout(() => el.classList.add('is-revealed'), scaled);
        io.unobserve(el);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    items.forEach((el) => io.observe(el));
  }

  function setupListReveals() {
    const containers = $$('[data-reveal-list]');
    if (!containers.length) return;

    if (!('IntersectionObserver' in window)) {
      containers.forEach((c) => {
        c.classList.add('is-revealed');
        Array.from(c.children).forEach((ch) => ch.classList.add('is-revealed'));
      });
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const list = entry.target;
        list.classList.add('is-revealed');
        Array.from(list.children).forEach((child, i) => {
          const delay = reducedMotion ? Math.min(i * 80, 320) : i * 280;
          window.setTimeout(() => child.classList.add('is-revealed'), delay);
        });
        io.unobserve(list);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    containers.forEach((c) => io.observe(c));
  }

  // ---------------------------------------------------------
  // DUST
  // ---------------------------------------------------------

  function spawnDust() {
    if (reducedMotion) return;
    const field = $('.dust-field');
    if (!field) return;

    const width = window.innerWidth;
    let count = 24;
    if (width < 768) count = 10;
    else if (width < 1280) count = 16;

    const tones = ['dust-rose', 'dust-silver', 'dust-ember'];
    for (let i = 0; i < count; i++) {
      const dust = document.createElement('span');
      dust.className = 'dust ' + tones[i % tones.length];
      const size = 1.5 + Math.random() * 1.8;
      dust.style.left = `${Math.random() * 100}%`;
      dust.style.width = `${size}px`;
      dust.style.height = `${size}px`;
      const dur = 16 + Math.random() * 8;
      const delay = (i * 0.55) - 8;
      dust.style.animation =
        `dust-rise ${dur}s linear infinite, ` +
        `dust-fade ${dur}s ease-in-out infinite`;
      dust.style.animationDelay = `${delay}s, ${delay}s`;
      field.appendChild(dust);
    }
  }

  // ---------------------------------------------------------
  // PARALLAX (subtle, hero only)
  // ---------------------------------------------------------

  function setupParallax() {
    if (reducedMotion) return;
    if ('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    window.addEventListener('mousemove', (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function tick() {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      document.documentElement.style.setProperty('--parallax-x', currentX.toFixed(3));
      document.documentElement.style.setProperty('--parallax-y', currentY.toFixed(3));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------
  // CONTINUATION CTA
  // ---------------------------------------------------------

  function setupContinue() {
    const cta = $('[data-action="continue"]');
    if (!cta) return;
    cta.addEventListener('click', () => {
      cta.style.opacity = '0.4';
      cta.style.pointerEvents = 'none';
      // In product, this would route to /timeline.
      // For static preview, attempt to open ../timeline/ if it exists.
      window.setTimeout(() => {
        window.location.href = '../timeline/';
      }, 600);
    });
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    applyTimeOfDay();
    setLastVisitLabel();
    spawnDust();
    setupParallax();
    setupReveals();
    setupListReveals();
    buildFragments();
    setupContinue();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
