/* ==========================================================
   Taste OS — Daily Atmosphere
   "오늘 당신 안에는 이런 공기가 흐르고 있어요."
   Weather for the soul. Not a mood tracker.
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // ---------------------------------------------------------
  // TIME-OF-DAY
  // ---------------------------------------------------------

  const PERIOD_LABEL = {
    dawn:    '새벽의 공기',
    morning: '아침의 공기',
    day:     '낮의 공기',
    dusk:    '해질녘의 공기',
    night:   '깊은 밤의 공기',
  };

  function getPeriod() {
    const h = new Date().getHours();
    if (h >= 5  && h < 8)  return 'dawn';
    if (h >= 8  && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'day';
    if (h >= 17 && h < 21) return 'dusk';
    return 'night';
  }

  function getTimeTier(period) {
    if (period === 'dawn')               return 'time-dawn';
    if (period === 'morning' || period === 'day') return 'time-day';
    if (period === 'dusk')               return 'time-dusk';
    return 'time-night';
  }

  // ---------------------------------------------------------
  // TODAY'S ATMOSPHERE — choose based on day-of-month + period
  // ---------------------------------------------------------

  const ATMOSPHERES = [
    {
      ko: '조용한 따뜻함', en: 'Quiet Warmth',
      palette: ['#B07672', '#D9A66C', '#D8C7AC'],
      narrations: [
        '오늘은 평소보다 조금 더 따뜻한 장면들에<br />시선이 머물고 있어요.',
        '당신 안의 고요함이 평소보다<br />깊게 이어지고 있습니다.',
        '완벽함보다 인간적인 흔적 속에서<br />안정감을 느끼고 있어요.',
      ],
    },
    {
      ko: '느린 밤공기', en: 'Slow Night',
      palette: ['#2A1F28', '#B07672', '#9A8E81'],
      narrations: [
        '오늘은 소리가 천천히 가라앉는 시간이에요.<br />당신은 그 안에서 호흡을 고르고 있어요.',
        '말보다 공기에<br />더 오래 머무르는 하루입니다.',
        '어둠 속에서도 작은 빛에 시선이<br />길게 머무르고 있어요.',
      ],
    },
    {
      ko: '차가운 도시의 고독감', en: 'Urban Solitude',
      palette: ['#3A4555', '#8FA0AC', '#C8B69B'],
      narrations: [
        '오늘은 익숙한 거리에서도<br />혼자만의 결을 따라가고 있어요.',
        '차가움 속에서도 당신은<br />작은 온기를 놓치지 않고 있습니다.',
        '도시의 소음이 멀어지는 곳에서<br />당신 자신과 가까워지고 있어요.',
      ],
    },
    {
      ko: '아날로그 온기', en: 'Analog Warmth',
      palette: ['#5A3D25', '#D9A66C', '#D8C7AC'],
      narrations: [
        '오늘은 손때 묻은 결에<br />마음이 머무는 시간이에요.',
        '낡은 종이의 호흡 같은 무언가가<br />당신 안에 흐르고 있습니다.',
        '천천히 바래가는 색에서<br />당신은 가장 깊은 결을 보고 있어요.',
      ],
    },
    {
      ko: '잔잔한 미래감', en: 'Calm Futurism',
      palette: ['#3A4555', '#C8D2DC', '#D8C7AC'],
      narrations: [
        '오늘은 모서리가 부드러운 미래의 결이<br />당신 안에 천천히 번지고 있어요.',
        '차가움과 따뜻함이<br />가장 가까운 거리에 머무르고 있습니다.',
        '단정한 빛 안에서도<br />감정의 흔적을 잃지 않고 있어요.',
      ],
    },
    {
      ko: '인간적인 흔적', en: 'Human Traces',
      palette: ['#7A5040', '#C8B69B', '#D8C7AC'],
      narrations: [
        '오늘은 누군가가 머물고 떠난 자리에<br />당신의 시선이 머물고 있어요.',
        '완벽보다 결,<br />결보다 흔적에 끌리는 하루입니다.',
        '오래된 손의 온기를 닮은<br />무언가가 당신 옆에 머무르고 있어요.',
      ],
    },
  ];

  function chooseAtmosphere() {
    const d = new Date();
    const seed = d.getFullYear() * 366 + (d.getMonth() * 31) + d.getDate();
    return ATMOSPHERES[seed % ATMOSPHERES.length];
  }

  function applyAtmosphere(atm) {
    const nameEl  = $('[data-today-name]');
    const enEl    = $('[data-today-name-en]');
    const palette = $('[data-today-palette]');
    if (nameEl) nameEl.textContent = atm.ko;
    if (enEl)   enEl.textContent   = atm.en;
    if (palette) {
      const dots = $$('.palette-dot', palette);
      dots.forEach((dot, i) => {
        if (atm.palette[i]) dot.style.setProperty('--c', atm.palette[i]);
      });
    }

    // Apply narrations
    atm.narrations.forEach((line, i) => {
      const el = $(`[data-narration="${i}"]`);
      if (el) el.innerHTML = line;
    });
  }

  // ---------------------------------------------------------
  // DRIFT — mark today's current period
  // ---------------------------------------------------------

  function applyDriftCurrent(period) {
    const steps = $$('.drift-step');
    steps.forEach((s) => s.classList.remove('current'));
    const current = $(`.drift-step[data-period="${period}"]`);
    if (current) current.classList.add('current');

    const summary = $('[data-drift-summary]');
    const map = {
      dawn:    'silver mist',
      morning: '옅은 beige',
      day:     '짙은 beige',
      dusk:    '저녁의 ember',
      night:   '깊은 rose',
    };
    if (summary && map[period]) {
      summary.innerHTML = `지금은 — <span class="drift-now-tone">${map[period]}</span>가 가장 짙어요.`;
    }
  }

  // ---------------------------------------------------------
  // DATE TAG
  // ---------------------------------------------------------

  function setDateTag(period) {
    const dateLine = $('[data-date-line]');
    const periodEl = $('[data-date-period]');
    if (dateLine) {
      const d = new Date();
      const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
      const day = days[d.getDay()];
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dateLine.textContent = `${day} · ${mm}.${dd}`;
    }
    if (periodEl) periodEl.textContent = PERIOD_LABEL[period] || '';
  }

  // ---------------------------------------------------------
  // REVEALS
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
          const delay = reducedMotion ? Math.min(i * 80, 320) : i * 240;
          window.setTimeout(() => child.classList.add('is-revealed'), delay);
        });
        io.unobserve(list);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    containers.forEach((c) => io.observe(c));
  }

  // ---------------------------------------------------------
  // DUST + PARALLAX
  // ---------------------------------------------------------

  function spawnDust() {
    if (reducedMotion) return;
    const field = $('.dust-field');
    if (!field) return;

    const width = window.innerWidth;
    let count = 26;
    if (width < 768) count = 10;
    else if (width < 1280) count = 18;

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
  // CONTINUATION
  // ---------------------------------------------------------

  function setupContinue() {
    const cta = $('[data-action="continue"]');
    if (!cta) return;
    cta.addEventListener('click', () => {
      cta.style.opacity = '0.4';
      cta.style.pointerEvents = 'none';
      window.setTimeout(() => {
        window.location.href = '../evolution/';
      }, 600);
    });
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    const period = getPeriod();
    const tier = getTimeTier(period);

    // Replace default time-day class
    const body = document.body;
    ['time-dawn', 'time-day', 'time-dusk', 'time-night']
      .forEach((c) => body.classList.remove(c));
    body.classList.add(tier);

    applyAtmosphere(chooseAtmosphere());
    applyDriftCurrent(period);
    setDateTag(period);

    spawnDust();
    setupParallax();
    setupReveals();
    setupListReveals();
    setupContinue();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
