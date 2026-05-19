/* ==========================================================
   Taste OS — Identity Dashboard / 집
   Time-aware copy + scroll reveals + reduced motion fallback.
   Vanilla JS, no dependencies.
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // TIME-AWARE COPY
  // ---------------------------------------------------------

  const PERIODS = {
    predawn: {
      timeLine: '동이 트기 전. 가장 조용한 시간이에요.',
      word: '머무름',
      phrase: '모든 것이 깨어나기 전, 한 순간이에요.',
    },
    morning: {
      timeLine: '아침이 시작되는 시간.',
      word: '맑음',
      phrase: '차분한 호숫가 같은 하루예요.',
    },
    noon: {
      timeLine: '햇빛이 가장 맑은 시간이에요.',
      word: '환함',
      phrase: '정원의 한낮 같은 시간이에요.',
    },
    afternoon: {
      timeLine: '오후 네 시 즈음. 북향의 빛이 도는 시간이에요.',
      word: '차분함',
      phrase: '조용한 호수의 표면 같은 하루예요.',
    },
    evening: {
      timeLine: '노을의 시간.',
      word: '따뜻함',
      phrase: '거실의 등불 같은 저녁이에요.',
    },
    night: {
      timeLine: '고요한 밤이에요.',
      word: '깊음',
      phrase: '깊은 호수 같은 밤이에요.',
    },
  };

  function getPeriod(h) {
    if (h < 6)  return 'predawn';
    if (h < 11) return 'morning';
    if (h < 15) return 'noon';
    if (h < 18) return 'afternoon';
    if (h < 22) return 'evening';
    return 'night';
  }

  function dayName(d) {
    return ['일', '월', '화', '수', '목', '금', '토'][d];
  }

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function applyTime() {
    const now = new Date();
    const period = getPeriod(now.getHours());
    const copy = PERIODS[period];

    const tl = document.querySelector('[data-time-line]');
    if (tl) tl.textContent = copy.timeLine;

    const ww = document.querySelector('[data-weather-word]');
    if (ww) ww.textContent = copy.word;

    const wp = document.querySelector('[data-weather-phrase]');
    if (wp) wp.textContent = copy.phrase;

    const day = document.querySelector('[data-day]');
    if (day) day.textContent = dayName(now.getDay());

    const clock = document.querySelector('[data-clock]');
    if (clock) {
      clock.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    }
  }

  function startTimeTicker() {
    applyTime();
    // update clock every minute, copy every hour
    let lastHour = new Date().getHours();
    setInterval(() => {
      const now = new Date();
      const h = now.getHours();
      const clock = document.querySelector('[data-clock]');
      if (clock) clock.textContent = `${pad2(h)}:${pad2(now.getMinutes())}`;
      if (h !== lastHour) {
        lastHour = h;
        applyTime();
      }
    }, 60000);
  }

  // ---------------------------------------------------------
  // SCROLL REVEALS
  // ---------------------------------------------------------

  function setupScrollReveals() {
    const sections = document.querySelectorAll('[data-section]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const section = entry.target;

          // reveal each data-reveal child with its own delay
          const els = section.querySelectorAll('[data-reveal]');
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
        rootMargin: '0px 0px -8% 0px',
      }
    );

    sections.forEach((s) => observer.observe(s));
  }

  // ---------------------------------------------------------
  // HERO REVEAL (Section 1 fires immediately on load)
  // ---------------------------------------------------------

  function revealHero() {
    const hero = document.querySelector('.section-now');
    if (!hero) return;
    const els = hero.querySelectorAll('[data-reveal]');
    els.forEach((el) => {
      const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      const t = reducedMotion ? Math.min(delay, 200) : 1400 + delay;
      window.setTimeout(() => el.classList.add('is-revealed'), t);
    });
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    startTimeTicker();
    revealHero();
    setupScrollReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
