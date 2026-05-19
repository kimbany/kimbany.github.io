/* ==========================================================
   Taste OS — Onboarding
   State machine + cinematic transitions + constellation.
   Vanilla JS, no dependencies.
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // DATA — the 16 gradient image cards, 9 sounds, 9 quotes, 9 spaces
  // ---------------------------------------------------------

  const IMAGES = [
    { name: '북향의 오후',     g: 'linear-gradient(135deg, #3A4555 0%, #5A6878 55%, #9A8E81 100%)' },
    { name: '잔잔한 도서관',   g: 'linear-gradient(135deg, #2A1F18 0%, #4A3D2C 55%, #7A5A40 100%)' },
    { name: '비 온 뒤 거리',   g: 'linear-gradient(135deg, #1A1F28 0%, #3A4555 50%, #5A6878 100%)' },
    { name: '모닥불 옆',       g: 'linear-gradient(135deg, #1A0F08 0%, #4A2818 50%, #B07672 100%)' },
    { name: '단 하나의 창',    g: 'linear-gradient(135deg, #1A1714 0%, #7A6F60 60%, #D8C7AC 100%)' },
    { name: '늦은 카페',       g: 'linear-gradient(135deg, #1A0F08 0%, #3A2620 50%, #D9A66C 100%)' },
    { name: '새벽의 길',       g: 'linear-gradient(135deg, #0E0C0B 0%, #2A2235 55%, #5A4570 100%)' },
    { name: '빈 공원 벤치',    g: 'linear-gradient(135deg, #1A2018 0%, #3A4530 55%, #7A8E70 100%)' },
    { name: '책상 위 램프',    g: 'linear-gradient(135deg, #1A1714 0%, #5A4525 50%, #D9A66C 100%)' },
    { name: '항구의 늦은 오후', g: 'linear-gradient(135deg, #2A1F28 0%, #7A4555 50%, #D9A66C 100%)' },
    { name: '눈 내린 골목',    g: 'linear-gradient(135deg, #1A1F28 0%, #7A8E9C 55%, #D8DDE5 100%)' },
    { name: '오래된 책방',     g: 'linear-gradient(135deg, #2A1F18 0%, #5A3D25 50%, #9A7060 100%)' },
    { name: '미술관의 흰 벽',  g: 'linear-gradient(135deg, #1A1714 0%, #7A6F60 55%, #E8DDC8 100%)' },
    { name: '늦은 지하철',     g: 'linear-gradient(135deg, #0F1620 0%, #3A4555 55%, #5A6878 100%)' },
    { name: '침실의 어둠',     g: 'linear-gradient(135deg, #0E0C0B 0%, #2A1F18 55%, #4A3D2C 100%)' },
    { name: '창가의 차 한 잔', g: 'linear-gradient(135deg, #2A1F18 0%, #7A5040 55%, #D8C7AC 100%)' },
  ];

  // SVG paths for each sound, drawn inline
  const SOUNDS = [
    {
      name: '첼로의 낮은 음',
      svg: `<svg width="56" height="40" viewBox="0 0 56 40" fill="none">
        <path d="M2 30 Q14 18 28 22 T54 14" stroke-width="0.8" fill="none"/>
        <path d="M2 36 Q14 26 28 30 T54 22" stroke-width="0.8" fill="none"/>
      </svg>`
    },
    {
      name: '펠트 피아노',
      svg: `<svg width="56" height="40" viewBox="0 0 56 40" fill="none">
        <circle cx="10" cy="20" r="2" fill="currentColor" stroke="none"/>
        <circle cx="22" cy="20" r="2.5" fill="currentColor" stroke="none"/>
        <circle cx="34" cy="20" r="2" fill="currentColor" stroke="none"/>
        <circle cx="46" cy="20" r="2.5" fill="currentColor" stroke="none"/>
      </svg>`
    },
    {
      name: '비 오는 소리',
      svg: `<svg width="56" height="40" viewBox="0 0 56 40" fill="none">
        <line x1="8"  y1="6"  x2="6"  y2="34" stroke-width="0.6"/>
        <line x1="20" y1="2"  x2="18" y2="30" stroke-width="0.6"/>
        <line x1="32" y1="8"  x2="30" y2="36" stroke-width="0.6"/>
        <line x1="44" y1="4"  x2="42" y2="32" stroke-width="0.6"/>
      </svg>`
    },
    {
      name: '새벽 라디오',
      svg: `<svg width="56" height="40" viewBox="0 0 56 40" fill="none">
        <line x1="2"  y1="20" x2="54" y2="20" stroke-width="0.8"/>
        <line x1="2"  y1="14" x2="54" y2="14" stroke-width="0.4"/>
        <line x1="2"  y1="26" x2="54" y2="26" stroke-width="0.4"/>
      </svg>`
    },
    {
      name: '카세트 테이프 소음',
      svg: `<svg width="56" height="40" viewBox="0 0 56 40" fill="none">
        <path d="M2 20 q3 -8 6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0" stroke-width="0.6" fill="none"/>
        <path d="M2 26 q3 -6 6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0" stroke-width="0.4" fill="none"/>
      </svg>`
    },
    {
      name: '도시의 소음',
      svg: `<svg width="56" height="40" viewBox="0 0 56 40" fill="none">
        <rect x="6"  y="14" width="6" height="14" stroke-width="0.6" fill="none"/>
        <rect x="18" y="10" width="6" height="22" stroke-width="0.6" fill="none"/>
        <rect x="30" y="16" width="6" height="10" stroke-width="0.6" fill="none"/>
        <rect x="42" y="6"  width="6" height="28" stroke-width="0.6" fill="none"/>
      </svg>`
    },
    {
      name: '카페의 웅성거림',
      svg: `<svg width="56" height="40" viewBox="0 0 56 40" fill="none">
        <circle cx="8"  cy="14" r="1.2" stroke-width="0.5" fill="none"/>
        <circle cx="18" cy="24" r="1.6" stroke-width="0.5" fill="none"/>
        <circle cx="28" cy="12" r="1.4" stroke-width="0.5" fill="none"/>
        <circle cx="38" cy="26" r="1.2" stroke-width="0.5" fill="none"/>
        <circle cx="46" cy="16" r="1.8" stroke-width="0.5" fill="none"/>
      </svg>`
    },
    {
      name: '발자국과 빗소리',
      svg: `<svg width="56" height="40" viewBox="0 0 56 40" fill="none">
        <line x1="8"  y1="8"  x2="6"  y2="22" stroke-width="0.5"/>
        <line x1="20" y1="4"  x2="18" y2="18" stroke-width="0.5"/>
        <line x1="32" y1="10" x2="30" y2="24" stroke-width="0.5"/>
        <circle cx="14" cy="32" r="2" stroke-width="0.6" fill="none"/>
        <circle cx="36" cy="32" r="2" stroke-width="0.6" fill="none"/>
      </svg>`
    },
    {
      name: '침묵',
      svg: `<svg width="56" height="40" viewBox="0 0 56 40" fill="none">
        <circle cx="28" cy="20" r="1.2" fill="currentColor" stroke="none"/>
      </svg>`
    },
  ];

  const QUOTES = [
    '사람의 마음은 사람의 마음으로만 닿는다.',
    '흔들리지 않고 피는 꽃이 어디 있으랴.',
    '어떤 것들은 한 번 보는 걸로 충분해요.',
    '조용한 것이 깊을 수 있다는 걸, 일찍부터 알았어요.',
    '변하는 것이 아니라, 자신에게 가까워지는 일.',
    '비어 있는 자리도 풍경의 일부다.',
    '내일도 다정할 수 있다고 믿어요.',
    '큰 빛보다 작은 빛이 오래 간다.',
    '잠시, 머물러도 좋아요.',
  ];

  const SPACES = [
    { name: '단 하나의 창이 있는 방',  g: 'linear-gradient(135deg, #1A1714 0%, #5A4D40 55%, #C8B69B 100%)' },
    { name: '오래된 호텔 로비',         g: 'linear-gradient(135deg, #2A1F18 0%, #5A3D25 55%, #C8B69B 100%)' },
    { name: '한적한 도서관 열람실',     g: 'linear-gradient(135deg, #2A1F18 0%, #7A5A40 55%, #D8C7AC 100%)' },
    { name: '미술관의 빈 전시실',       g: 'linear-gradient(135deg, #1A1714 0%, #7A6F60 60%, #E8DDC8 100%)' },
    { name: '작은 정원',                g: 'linear-gradient(135deg, #1A2018 0%, #3A4530 55%, #8E9E80 100%)' },
    { name: '비 오는 발코니',           g: 'linear-gradient(135deg, #1A1F28 0%, #3A4555 55%, #8FA0AC 100%)' },
    { name: '늦은 식당',                g: 'linear-gradient(135deg, #1A0F08 0%, #4A2818 50%, #D9A66C 100%)' },
    { name: '서점의 시집 코너',          g: 'linear-gradient(135deg, #1A1714 0%, #4A2A20 55%, #9A6055 100%)' },
    { name: '항구의 끝',                g: 'linear-gradient(135deg, #0F1620 0%, #5A4555 55%, #B07672 100%)' },
  ];

  const FEELING_POLES = [
    ['고독', '교감'],
    ['와비사비', '순결한 기하'],
    ['기억', '기대'],
    ['침묵', '울림'],
    ['흙', '대기'],
  ];

  const LISTENING_HOLD = reducedMotion ? 1000 : 8000; // per sentence
  const LISTENING_TOTAL = reducedMotion ? 3000 : 24000;

  // ---------------------------------------------------------
  // STATE
  // ---------------------------------------------------------

  const state = {
    step: 1,
    selectedImages: new Set(),
    selectedSounds: new Set(),
    selectedQuotes: new Set(),
    customQuote: '',
    selectedSpaces: new Set(),
    feeling: [],
    feelingIndex: 0,
  };

  // ---------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------

  function wait(ms) {
    return new Promise((r) => window.setTimeout(r, ms));
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // ---------------------------------------------------------
  // GRID POPULATION
  // ---------------------------------------------------------

  function buildImageGrid() {
    const grid = document.querySelector('[data-grid="images"]');
    if (!grid) return;
    grid.innerHTML = '';
    IMAGES.forEach((img, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'gradient-card';
      card.dataset.index = String(i);
      card.style.background = img.g;
      card.innerHTML = `<span class="label">${img.name}</span>`;
      card.addEventListener('click', () => toggleImage(i));
      grid.appendChild(card);
    });
  }

  function buildSoundGrid() {
    const grid = document.querySelector('[data-grid="sounds"]');
    if (!grid) return;
    grid.innerHTML = '';
    SOUNDS.forEach((s, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'sound-card';
      card.dataset.index = String(i);
      card.innerHTML = `
        <div class="visual">${s.svg}</div>
        <div class="name">${s.name}</div>
      `;
      card.addEventListener('click', () => toggleSound(i));
      grid.appendChild(card);
    });
  }

  function buildQuoteList() {
    const grid = document.querySelector('[data-grid="quotes"]');
    if (!grid) return;
    grid.innerHTML = '';
    QUOTES.forEach((q, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'quote-card';
      card.dataset.index = String(i);
      card.textContent = q;
      card.addEventListener('click', () => toggleQuote(i));
      grid.appendChild(card);
    });

    const input = document.querySelector('.quote-input');
    if (input) {
      input.addEventListener('input', (e) => {
        state.customQuote = e.target.value.trim();
        refreshCounters();
      });
    }
  }

  function buildSpaceGrid() {
    const grid = document.querySelector('[data-grid="spaces"]');
    if (!grid) return;
    grid.innerHTML = '';
    SPACES.forEach((sp, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'gradient-card';
      card.dataset.index = String(i);
      card.style.background = sp.g;
      card.innerHTML = `<span class="label">${sp.name}</span>`;
      card.addEventListener('click', () => toggleSpace(i));
      grid.appendChild(card);
    });
  }

  // ---------------------------------------------------------
  // SELECTION
  // ---------------------------------------------------------

  function toggleImage(i) {
    const card = document.querySelector(`[data-grid="images"] [data-index="${i}"]`);
    if (state.selectedImages.has(i)) {
      state.selectedImages.delete(i);
      card.classList.remove('is-selected');
    } else {
      if (state.selectedImages.size >= 12) return;
      state.selectedImages.add(i);
      card.classList.add('is-selected');
    }
    refreshCounters();
  }

  function toggleSound(i) {
    const card = document.querySelector(`[data-grid="sounds"] [data-index="${i}"]`);
    if (state.selectedSounds.has(i)) {
      state.selectedSounds.delete(i);
      card.classList.remove('is-selected');
    } else {
      if (state.selectedSounds.size >= 5) return;
      state.selectedSounds.add(i);
      card.classList.add('is-selected');
    }
    refreshCounters();
  }

  function toggleQuote(i) {
    const card = document.querySelector(`[data-grid="quotes"] [data-index="${i}"]`);
    if (state.selectedQuotes.has(i)) {
      state.selectedQuotes.delete(i);
      card.classList.remove('is-selected');
    } else {
      if (state.selectedQuotes.size >= 5) return;
      state.selectedQuotes.add(i);
      card.classList.add('is-selected');
    }
    refreshCounters();
  }

  function toggleSpace(i) {
    const card = document.querySelector(`[data-grid="spaces"] [data-index="${i}"]`);
    if (state.selectedSpaces.has(i)) {
      state.selectedSpaces.delete(i);
      card.classList.remove('is-selected');
    } else {
      if (state.selectedSpaces.size >= 5) return;
      state.selectedSpaces.add(i);
      card.classList.add('is-selected');
    }
    refreshCounters();
  }

  // ---------------------------------------------------------
  // COUNTER / BEACON STATE
  // ---------------------------------------------------------

  function refreshCounters() {
    // images
    const imgN = state.selectedImages.size;
    const imgCounter = document.querySelector('[data-counter="images"]');
    if (imgCounter) {
      if (imgN === 0) imgCounter.textContent = '고른 만큼만, 잠시 보세요.';
      else if (imgN < 6) imgCounter.textContent = `${imgN}장 골랐어요. 조금만 더.`;
      else imgCounter.textContent = `${imgN}장 골랐어요. 더 두어도 좋고요.`;
      imgCounter.classList.toggle('is-met', imgN >= 6);
    }
    setBeaconReady('images', imgN >= 6);

    // sounds
    const sndN = state.selectedSounds.size;
    const sndCounter = document.querySelector('[data-counter="sounds"]');
    if (sndCounter) {
      if (sndN === 0) sndCounter.textContent = '조용히 들리는 것이라도.';
      else if (sndN < 3) sndCounter.textContent = `${sndN}개. 조금만 더.`;
      else sndCounter.textContent = `${sndN}개 들었어요. 더 두어도 좋아요.`;
      sndCounter.classList.toggle('is-met', sndN >= 3);
    }
    setBeaconReady('sounds', sndN >= 3);

    // quotes (presets + custom)
    const qN = state.selectedQuotes.size + (state.customQuote ? 1 : 0);
    const qCounter = document.querySelector('[data-counter="quotes"]');
    if (qCounter) {
      if (qN === 0) qCounter.textContent = '마음이 멈춘 곳에.';
      else if (qN < 2) qCounter.textContent = `한 줄. 한 줄만 더.`;
      else qCounter.textContent = `${qN}개. 충분해요.`;
      qCounter.classList.toggle('is-met', qN >= 2);
    }
    setBeaconReady('quotes', qN >= 2);

    // spaces
    const spN = state.selectedSpaces.size;
    const spCounter = document.querySelector('[data-counter="spaces"]');
    if (spCounter) {
      if (spN === 0) spCounter.textContent = '들어가본 적 있는 것처럼.';
      else if (spN < 3) spCounter.textContent = `${spN}곳. 조금만 더.`;
      else spCounter.textContent = `${spN}곳에 머물렀어요.`;
      spCounter.classList.toggle('is-met', spN >= 3);
    }
    setBeaconReady('spaces', spN >= 3);
  }

  function setBeaconReady(grid, ready) {
    const section = document.querySelector(`[data-grid="${grid}"]`)?.closest('.screen');
    if (!section) return;
    const beacon = section.querySelector('.beacon[data-min]');
    if (!beacon) return;
    beacon.disabled = !ready;
  }

  // ---------------------------------------------------------
  // SCREEN TRANSITIONS
  // ---------------------------------------------------------

  async function goToScreen(targetStep) {
    if (targetStep === state.step) return;
    const current = document.querySelector('.screen.is-active');
    const next = document.querySelector(`.screen[data-step="${targetStep}"]`);
    if (!next) return;

    // exhale
    current.classList.remove('is-active');
    current.classList.add('is-exiting');
    await wait(reducedMotion ? 200 : 1400);
    current.classList.remove('is-exiting');

    // void pause
    await wait(reducedMotion ? 100 : 600);

    // inhale
    state.step = targetStep;
    next.classList.add('is-active');
    updateProgress();

    // per-screen entrance behavior
    runScreenReveals(next);

    if (targetStep === 6) startFeeling();
    if (targetStep === 7) startListening();
    if (targetStep === 8) /* nothing */ {}
  }

  function runScreenReveals(section) {
    const els = section.querySelectorAll('[data-reveal]');
    els.forEach((el) => {
      const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      const t = reducedMotion ? Math.min(delay, 200) : delay;
      window.setTimeout(() => el.classList.add('is-revealed'), t);
    });
  }

  function updateProgress() {
    const dots = document.querySelectorAll('.progress .dot');
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === state.step - 1);
      d.classList.toggle('is-past',   i < state.step - 1);
    });
  }

  // ---------------------------------------------------------
  // FEELING (Screen 6) — single slider, 5 questions in sequence
  // ---------------------------------------------------------

  let feelingDragging = false;

  function startFeeling() {
    state.feelingIndex = 0;
    state.feeling = [];
    renderFeelingStep();
  }

  function renderFeelingStep() {
    const idx = state.feelingIndex;
    const poleL = document.querySelector('.pole-left');
    const poleR = document.querySelector('.pole-right');
    const dot = document.querySelector('.slider-dot');
    const indexEl = document.querySelector('[data-slider-index]');

    if (!poleL || !poleR || !dot) return;

    poleL.textContent = FEELING_POLES[idx][0];
    poleR.textContent = FEELING_POLES[idx][1];
    indexEl.textContent = String(idx + 1);

    // reset position to center, with a small breath-in animation
    dot.style.transition = 'left 0.6s ease, transform 0.6s ease';
    dot.style.left = '50%';
    window.setTimeout(() => {
      dot.style.transition = '';
    }, 600);

    poleL.classList.remove('is-near');
    poleR.classList.remove('is-near');
  }

  function setupSlider() {
    const track = document.querySelector('.slider-track');
    const dot = document.querySelector('.slider-dot');
    if (!track || !dot) return;

    function pointerToValue(clientX) {
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      return x / rect.width;
    }

    function updateDot(value) {
      const pct = (value * 100).toFixed(2) + '%';
      dot.style.left = pct;
      const poleL = document.querySelector('.pole-left');
      const poleR = document.querySelector('.pole-right');
      poleL.classList.toggle('is-near', value < 0.32);
      poleR.classList.toggle('is-near', value > 0.68);
    }

    function onDown(e) {
      feelingDragging = true;
      dot.classList.add('is-grabbing');
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updateDot(pointerToValue(clientX));
      e.preventDefault();
    }

    function onMove(e) {
      if (!feelingDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updateDot(pointerToValue(clientX));
    }

    async function onUp(e) {
      if (!feelingDragging) return;
      feelingDragging = false;
      dot.classList.remove('is-grabbing');

      // record value
      const rect = track.getBoundingClientRect();
      const left = parseFloat(dot.style.left) / 100 || 0.5;
      state.feeling.push(left);

      // small breath, then advance
      await wait(800);

      if (state.feelingIndex < 4) {
        // exhale poles
        const poles = document.querySelector('.slider-poles');
        const dotEl = document.querySelector('.slider-dot');
        poles.style.transition = 'opacity 0.6s ease';
        dotEl.style.transition = 'opacity 0.6s ease';
        poles.style.opacity = '0';
        dotEl.style.opacity = '0';

        await wait(600);
        state.feelingIndex += 1;
        renderFeelingStep();

        // inhale poles
        await wait(40);
        poles.style.opacity = '';
        dotEl.style.opacity = '';
      } else {
        // all done, move to listening
        await wait(400);
        goToScreen(7);
      }
    }

    // touch + click events
    track.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    track.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);

    // click on track also sets value
    track.addEventListener('click', (e) => {
      if (feelingDragging) return;
      updateDot(pointerToValue(e.clientX));
      // mimic onUp
      feelingDragging = true;
      onUp(e);
    });
  }

  // ---------------------------------------------------------
  // LISTENING (Screen 7)
  // ---------------------------------------------------------

  function buildConstellation() {
    const c = document.querySelector('.constellation');
    if (!c) return;
    c.innerHTML = '';

    // 36 stars in a roughly circular distribution
    const stars = [];
    const N = 36;
    for (let i = 0; i < N; i++) {
      const angle = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const r = 80 + Math.random() * 60;
      const cx = 160 + Math.cos(angle) * r;
      const cy = 160 + Math.sin(angle) * r;
      const s = document.createElement('span');
      s.className = 'star';
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      s.style.animationDelay = (Math.random() * 2) + 's, ' + (Math.random() * 3) + 's';
      c.appendChild(s);
      stars.push({ el: s, x: cx, y: cy });
    }

    // overlay svg for lines (drawn later)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('lines');
    svg.setAttribute('viewBox', '0 0 320 320');
    c.appendChild(svg);

    return stars;
  }

  function clusterAndLine(stars) {
    if (!stars) return;
    // cluster: nudge each star toward one of 3 attractors
    const attractors = [
      { x: 120, y: 130 },
      { x: 200, y: 145 },
      { x: 160, y: 210 },
    ];
    stars.forEach((s, i) => {
      const a = attractors[i % 3];
      const nx = s.x + (a.x - s.x) * 0.35;
      const ny = s.y + (a.y - s.y) * 0.35;
      s.el.classList.add('is-clustering');
      s.el.style.left = nx + 'px';
      s.el.style.top = ny + 'px';
      s.targetX = nx;
      s.targetY = ny;
    });

    // 8s later, draw lines
    window.setTimeout(() => {
      const c = document.querySelector('.constellation');
      const svg = c.querySelector('svg.lines');
      if (!svg) return;
      // Draw lines between near-neighbors (~24 edges)
      const edges = [];
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].targetX - stars[j].targetX;
          const dy = stars[i].targetY - stars[j].targetY;
          const d = Math.hypot(dx, dy);
          if (d < 28) edges.push([i, j]);
        }
      }
      edges.slice(0, 32).forEach((e) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', stars[e[0]].targetX);
        line.setAttribute('y1', stars[e[0]].targetY);
        line.setAttribute('x2', stars[e[1]].targetX);
        line.setAttribute('y2', stars[e[1]].targetY);
        svg.appendChild(line);
      });
      window.setTimeout(() => c.classList.add('is-lined'), 80);
    }, 8000);
  }

  async function startListening() {
    const stars = buildConstellation();
    if (!reducedMotion) {
      window.setTimeout(() => clusterAndLine(stars), 4000);
    }

    const texts = $$('.listening-text');
    // play 3 sentences
    for (let i = 0; i < 3; i++) {
      const t = texts[i];
      if (!t) break;
      t.classList.add('is-revealed');
      await wait(LISTENING_HOLD - 1600);
      t.classList.remove('is-revealed');
      await wait(1600);
    }

    // hold any remaining time
    // total elapsed at this point = 3 * LISTENING_HOLD = 24000
    // gate is satisfied. Show Beacon.
    const beacon = $('.listening-beacon');
    if (beacon) beacon.setAttribute('data-state', 'visible');
  }

  // ---------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------

  function setupActions() {
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');

      if (action === 'next' && !btn.disabled) {
        // exception: from feeling screen we advance via slider auto-advance
        if (state.step < 7) goToScreen(state.step + 1);
      }

      if (action === 'skip') {
        if (state.step < 6) goToScreen(state.step + 1);
        else if (state.step === 6) goToScreen(7);
      }

      if (action === 'finish') {
        goToScreen(8);
      }

      if (action === 'restart') {
        window.location.reload();
      }
    });
  }

  // ---------------------------------------------------------
  // HERO REVEALS
  // ---------------------------------------------------------

  function revealHero() {
    const hero = document.querySelector('.screen.is-active');
    if (!hero) return;
    runScreenReveals(hero);
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    buildImageGrid();
    buildSoundGrid();
    buildQuoteList();
    buildSpaceGrid();
    setupSlider();
    setupActions();
    revealHero();
    refreshCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
