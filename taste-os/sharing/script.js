/* ==========================================================
   Taste OS — Sharing Studio
   "당신의 분위기는 말보다 더 많은 것을 전하고 있습니다."
   Signatures:
     A) Living Taste Card (3D tilt + breath + inner drift)
     B) Atmosphere morph (gradient + text cross-fade)
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // ---------------------------------------------------------
  // CARD DATA
  // ---------------------------------------------------------

  const CARDS = {
    'quiet-warmth': {
      en: 'Quiet Warmth',
      ko: '조용한 따뜻함',
      narration: '완벽함보다 인간적인 흔적에<br />마음이 머무는 사람.',
      narrationPlain: '완벽함보다 인간적인 흔적에 마음이 머무는 사람.',
      atmosphere: 'rose · ember · 한 줄기 beige',
      palette: ['#B07672', '#D9A66C', '#D8C7AC'],
      gradient: 'linear-gradient(155deg, #2A1F18 0%, #4A2620 38%, #7A4030 68%, #B07672 100%)',
      canvasStops: [[0, '#2A1F18'], [0.38, '#4A2620'], [0.68, '#7A4030'], [1, '#B07672']],
    },
    'urban-nostalgia': {
      en: 'Urban Nostalgia',
      ko: '도시의 향수',
      narration: '차가운 거리에서도<br />따뜻한 장면을 모으는 사람.',
      narrationPlain: '차가운 거리에서도 따뜻한 장면을 모으는 사람.',
      atmosphere: 'silver-blue · sand · 한 점 rose',
      palette: ['#8FA0AC', '#C8B69B', '#B07672'],
      gradient: 'linear-gradient(170deg, #0F1620 0%, #2A3540 38%, #5A6878 68%, #8FA0AC 100%)',
      canvasStops: [[0, '#0F1620'], [0.38, '#2A3540'], [0.68, '#5A6878'], [1, '#8FA0AC']],
    },
    'emotional-minimalism': {
      en: 'Emotional Minimalism',
      ko: '감정의 미니멀리즘',
      narration: '적은 것 안에서<br />가장 깊은 결을 보는 사람.',
      narrationPlain: '적은 것 안에서 가장 깊은 결을 보는 사람.',
      atmosphere: 'bone · mist · beige',
      palette: ['#443E37', '#9A8E81', '#D8C7AC'],
      gradient: 'linear-gradient(165deg, #14110F 0%, #2A2620 40%, #5A5248 72%, #9A8E81 100%)',
      canvasStops: [[0, '#14110F'], [0.40, '#2A2620'], [0.72, '#5A5248'], [1, '#9A8E81']],
    },
    'warm-futurism': {
      en: 'Warm Futurism',
      ko: '따뜻한 미래감',
      narration: '단정한 빛 속에도<br />감정을 잃지 않는 사람.',
      narrationPlain: '단정한 빛 속에도 감정을 잃지 않는 사람.',
      atmosphere: 'silver-blue · beige · ember',
      palette: ['#8FA0AC', '#D8C7AC', '#D9A66C'],
      gradient: 'linear-gradient(160deg, #0E1418 0%, #2A3038 38%, #6A6258 68%, #D9A66C 100%)',
      canvasStops: [[0, '#0E1418'], [0.38, '#2A3038'], [0.68, '#6A6258'], [1, '#D9A66C']],
    },
  };

  let activeId = 'quiet-warmth';

  // ---------------------------------------------------------
  // CARD MORPH (Signature B)
  // ---------------------------------------------------------

  function applyCard(id, animate) {
    const card = CARDS[id];
    if (!card) return;
    activeId = id;

    const root = document.documentElement;
    const body = document.body;
    const swap = $('[data-card-swap]');
    const bg = $('[data-card-bg]');

    // Page ambient
    Object.keys(CARDS).forEach((k) => body.classList.remove('card-' + k));
    body.classList.add('card-' + id);

    // Card gradient
    root.style.setProperty('--card-gradient', card.gradient);
    if (bg) bg.style.background = card.gradient;

    function fillContent() {
      $('[data-card-en]').textContent = card.en;
      $('[data-card-ko]').textContent = card.ko;
      $('[data-card-narration]').innerHTML = card.narration;
      $('[data-card-atmosphere]').textContent = card.atmosphere;
      const dots = $$('.palette-dot', $('[data-card-palette]'));
      dots.forEach((dot, i) => {
        if (card.palette[i]) dot.style.setProperty('--c', card.palette[i]);
      });
    }

    if (animate && swap && !reducedMotion) {
      swap.classList.add('is-swapping');
      window.setTimeout(() => {
        fillContent();
        swap.classList.remove('is-swapping');
      }, 700);
    } else {
      fillContent();
    }

    // Update picker active state
    $$('.style-option').forEach((opt) => {
      opt.classList.toggle('is-active', opt.dataset.cardId === id);
    });
  }

  function setupPicker() {
    $$('.style-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        const id = opt.dataset.cardId;
        if (id && id !== activeId) applyCard(id, true);
      });
    });
  }

  // ---------------------------------------------------------
  // SIGNATURE A — 3D tilt + specular
  // ---------------------------------------------------------

  function setupTilt() {
    const card = $('[data-taste-card]');
    if (!card) return;
    if (reducedMotion) return;
    if ('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches) return;

    const root = document.documentElement;
    let raf = 0;

    function onMove(e) {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;   // 0..1
      const py = (e.clientY - rect.top) / rect.height;   // 0..1
      const clampedX = Math.max(0, Math.min(1, px));
      const clampedY = Math.max(0, Math.min(1, py));

      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const tiltY = (clampedX - 0.5) * 16;   // rotateY
        const tiltX = (0.5 - clampedY) * 16;   // rotateX
        root.style.setProperty('--tilt-x', tiltX.toFixed(2) + 'deg');
        root.style.setProperty('--tilt-y', tiltY.toFixed(2) + 'deg');
        root.style.setProperty('--spec-x', (clampedX * 100).toFixed(1) + '%');
        root.style.setProperty('--spec-y', (clampedY * 100).toFixed(1) + '%');
      });
    }

    function reset() {
      root.style.setProperty('--tilt-x', '0deg');
      root.style.setProperty('--tilt-y', '0deg');
      root.style.setProperty('--spec-x', '50%');
      root.style.setProperty('--spec-y', '30%');
    }

    // Track within the card stage for a wider, gentler field
    const stage = $('[data-card-stage]');
    (stage || card).addEventListener('mousemove', onMove);
    (stage || card).addEventListener('mouseleave', reset);
  }

  // ---------------------------------------------------------
  // EXPORT — real canvas PNG + clipboard link + motion toggle
  // ---------------------------------------------------------

  function showConfirm(text) {
    const el = $('[data-export-confirm]');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('is-visible');
    // reflow to restart transition
    void el.offsetWidth;
    el.classList.add('is-visible');
    window.clearTimeout(el._hideTimer);
    el._hideTimer = window.setTimeout(() => {
      el.classList.remove('is-visible');
    }, 4200);
  }

  function exportImage() {
    const card = CARDS[activeId];
    if (!card) return;

    const W = 800, H = 1000;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) { showConfirm('이미지를 만들 수 없었어요.'); return; }

    // Gradient background
    const grad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, H);
    card.canvasStops.forEach(([stop, color]) => grad.addColorStop(stop, color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Soft light blob
    const blob = ctx.createRadialGradient(W * 0.42, H * 0.4, 0, W * 0.42, H * 0.4, W * 0.6);
    blob.addColorStop(0, 'rgba(255,255,255,0.14)');
    blob.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, W, H);

    // Vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    const beige = 'rgba(216,199,172,';

    // Genome EN
    ctx.fillStyle = beige + '0.96)';
    ctx.font = 'italic 600 64px Georgia, "Cormorant Garamond", serif';
    ctx.fillText(card.en, W / 2, H * 0.44);

    // Genome KO
    ctx.fillStyle = beige + '0.78)';
    ctx.font = '300 30px "Noto Serif KR", serif';
    ctx.fillText(card.ko, W / 2, H * 0.50);

    // Narration
    ctx.fillStyle = beige + '0.9)';
    ctx.font = 'italic 300 30px "Noto Serif KR", Georgia, serif';
    ctx.fillText(card.narrationPlain, W / 2, H * 0.60);

    // Atmosphere
    ctx.fillStyle = beige + '0.7)';
    ctx.font = 'italic 300 24px Georgia, serif';
    ctx.fillText(card.atmosphere, W / 2, H * 0.86);

    // Palette dots
    const dotY = H * 0.90;
    const dotGap = 30;
    const startX = W / 2 - dotGap;
    card.palette.forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(startX + i * dotGap, dotY, 7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Wordmark
    ctx.fillStyle = beige + '0.55)';
    ctx.font = '500 18px Helvetica, Arial, sans-serif';
    ctx.fillText('T A S T E   O S', W / 2, H * 0.95);

    // Sigil arc (top-left)
    ctx.strokeStyle = beige + '0.5)';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(70, 70, 18, Math.PI * 0.15, Math.PI * 1.7);
    ctx.stroke();

    try {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `taste-os-${activeId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showConfirm('당신의 카드를 담았어요.');
    } catch (err) {
      showConfirm('이미지를 저장할 수 없었어요.');
    }
  }

  function copyLink() {
    const url = window.location.href.split('#')[0] + '#' + activeId;
    const done = () => showConfirm('분위기 링크를 복사했어요.');
    const fail = () => showConfirm('링크 복사가 어려웠어요. 주소창을 사용해 주세요.');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(fail);
    } else {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      } catch (e) { fail(); }
    }
  }

  function toggleMotion(btn) {
    const on = document.body.getAttribute('data-card-motion') === 'on';
    if (on) {
      document.body.removeAttribute('data-card-motion');
      btn.setAttribute('data-state', 'off');
      showConfirm('카드가 잔잔해졌어요.');
    } else {
      document.body.setAttribute('data-card-motion', 'on');
      btn.setAttribute('data-state', 'on');
      showConfirm('카드가 천천히 살아 움직여요.');
    }
  }

  function setupExport() {
    $$('[data-export]').forEach((btn) => {
      const kind = btn.dataset.export;
      btn.addEventListener('click', () => {
        if (kind === 'image') exportImage();
        else if (kind === 'link') copyLink();
        else if (kind === 'motion') toggleMotion(btn);
      });
    });
  }

  // ---------------------------------------------------------
  // REVEALS
  // ---------------------------------------------------------

  function setupReveals() {
    const items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-revealed'));
      const card = $('[data-taste-card]');
      if (card) card.classList.add('is-revealed');
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

    // Card reveal
    const card = $('[data-taste-card]');
    if (card) {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          window.setTimeout(() => card.classList.add('is-revealed'), 200);
          cio.unobserve(card);
        });
      }, { threshold: 0.25 });
      cio.observe(card);
    }
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
  // DUST + PARALLAX
  // ---------------------------------------------------------

  function spawnDust() {
    if (reducedMotion) return;
    const field = $('.dust-field');
    if (!field) return;

    const width = window.innerWidth;
    let count = 22;
    if (width < 768) count = 9;
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
        window.location.href = '../home/';
      }, 600);
    });
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    // Honor a #card-id from a shared link
    const hash = (window.location.hash || '').replace('#', '');
    const startId = CARDS[hash] ? hash : 'quiet-warmth';

    applyCard(startId, false);
    setupPicker();
    setupTilt();
    setupExport();
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
