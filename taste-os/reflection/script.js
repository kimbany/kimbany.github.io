/* ==========================================================
   Taste OS — Reflection / 마음의 결을 묻다
   3-state: Intro → 6 Questions Canvas → Forward Threshold Beat
   Signatures:
     1) Progressive atmosphere deepening (q-1 → q-6)
     2) Focus pull (typing dims question; pause restores)
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // QUESTION DATA
  // ---------------------------------------------------------

  const QUESTIONS = [
    {
      tier: 1,
      text: '당신은 어떤 순간에 가장 자기다워지나요?',
      placeholder: '잠시 떠오르는 장면을 적어보세요…',
    },
    {
      tier: 2,
      text: '최근 오래 마음에 남았던 장면이 있나요?',
      placeholder: '아무도 모르는, 당신만의 장면이어도 좋아요…',
    },
    {
      tier: 3,
      text: '사람들에게 쉽게 설명할 수 없는 감정이 있나요?',
      placeholder: '정확한 단어가 아니어도 괜찮아요…',
    },
    {
      tier: 4,
      text: '당신은 어떤 공기 속에서 편안함을 느끼나요?',
      placeholder: '온도, 빛, 소리 무엇이든 좋아요…',
    },
    {
      tier: 5,
      text: '예전보다 달라졌다고 느끼는 감정이 있나요?',
      placeholder: '아주 작은 변화여도 괜찮아요…',
    },
    {
      tier: 6,
      text: '지금 당신이 가장 그리워하는 분위기는 무엇인가요?',
      placeholder: '그곳의 결을 천천히 떠올려 보세요…',
    },
  ];

  // ---------------------------------------------------------
  // STATE
  // ---------------------------------------------------------

  const state = {
    phase: 'intro',
    index: 0,
    answers: new Array(QUESTIONS.length).fill(''),
    typingTimer: null,
  };

  // ---------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function wait(ms) { return new Promise((r) => window.setTimeout(r, ms)); }

  // ---------------------------------------------------------
  // ATMOSPHERE TIER — SIGNATURE 1
  // ---------------------------------------------------------

  function applyTier(tier) {
    const body = document.body;
    for (let i = 1; i <= 6; i++) body.classList.remove(`q-${i}`);
    body.classList.add(`q-${tier}`);
  }

  // ---------------------------------------------------------
  // BUILD QUESTION CARD
  // ---------------------------------------------------------

  function buildQuestionCard(index) {
    const stage = $('[data-question-stage]');
    if (!stage) return;

    const q = QUESTIONS[index];
    if (!q) return;

    // Clear stage
    stage.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'question-card';
    card.dataset.questionIndex = String(index);

    // Step marks — a single hairline row, NOT a progress bar
    const marksHtml = QUESTIONS.map((_, i) => {
      let cls = 'mark';
      if (i < index) cls += ' is-past';
      else if (i === index) cls += ' is-current';
      return `<span class="${cls}"></span>`;
    }).join('');

    card.innerHTML = `
      <p class="question-text">${q.text}</p>
      <textarea class="reflection-field"
        rows="4"
        placeholder="${q.placeholder}"
        aria-label="${q.text}">${state.answers[index] || ''}</textarea>
      <div class="step-marks" aria-hidden="true">${marksHtml}</div>
      <div class="question-nav" data-question-nav>
        <button type="button" class="next-beacon" data-action="next-question">
          <span class="dash">─</span>
          <span>${index === QUESTIONS.length - 1 ? '마지막 답을 두고 갈게요' : '다음으로 가볼게요'}</span>
          <span class="dash">─</span>
        </button>
      </div>
    `;

    stage.appendChild(card);

    // Apply tier for this question (deepens atmosphere)
    applyTier(q.tier);

    // Reveal next frame
    requestAnimationFrame(() => {
      card.classList.add('is-revealed');
    });

    // Wire textarea
    const textarea = card.querySelector('.reflection-field');
    const nav = card.querySelector('[data-question-nav]');

    textarea.addEventListener('input', () => {
      state.answers[index] = textarea.value;

      // Focus pull: dim the question while typing
      card.classList.add('is-typing');
      window.clearTimeout(state.typingTimer);
      state.typingTimer = window.setTimeout(() => {
        card.classList.remove('is-typing');
      }, reducedMotion ? 800 : 3000);

      // Show advance affordance once any text is entered
      if (textarea.value.trim().length > 0) {
        nav.classList.add('is-visible');
      } else {
        nav.classList.remove('is-visible');
      }
    });

    textarea.addEventListener('blur', () => {
      card.classList.remove('is-typing');
    });

    // Auto-focus after the reveal settles
    window.setTimeout(() => {
      textarea.focus({ preventScroll: true });
    }, reducedMotion ? 200 : 1100);
  }

  async function advanceQuestion() {
    const stage = $('[data-question-stage]');
    const card = stage && stage.querySelector('.question-card');
    if (card) {
      card.classList.add('is-exiting');
      card.classList.remove('is-revealed');
    }

    window.clearTimeout(state.typingTimer);

    await wait(reducedMotion ? 200 : 800);

    state.index += 1;

    if (state.index >= QUESTIONS.length) {
      // All questions answered (or stepped past) — surface the forward CTA
      showForwardCTA();
      return;
    }

    buildQuestionCard(state.index);
  }

  function showForwardCTA() {
    const stage = $('[data-question-stage]');
    if (stage) {
      stage.innerHTML = `
        <div class="question-card is-revealed">
          <p class="question-text">여기까지 머물러 주셔서 고마워요.</p>
        </div>
      `;
    }
    const cta = $('.cta-forward');
    if (cta) cta.setAttribute('data-state', 'visible');
  }

  // ---------------------------------------------------------
  // INTRO REVEAL SCHEDULE
  // ---------------------------------------------------------

  const introSchedule = [
    { selector: '[data-reveal="headline"]', delay: 1500 },
    { selector: '[data-reveal="hairline"]', delay: 3800 },
    { selector: '[data-reveal="sub-1"]',    delay: 4400 },
    { selector: '[data-reveal="cta"]',      delay: 6400 },
  ];

  function startIntro() {
    introSchedule.forEach((step) => {
      const el = $(step.selector);
      if (!el) return;
      const delay = reducedMotion ? Math.min(step.delay, 400) : step.delay;
      window.setTimeout(() => el.classList.add('is-revealed'), delay);
    });
  }

  async function exitIntro() {
    const intro = $('.intro');
    intro.setAttribute('data-phase', 'exiting');
    await wait(reducedMotion ? 200 : 1400);
    intro.setAttribute('data-phase', 'hidden');

    const canvas = $('.canvas-state');
    canvas.setAttribute('data-phase', 'active');
    state.phase = 'canvas';

    // Start at first question
    state.index = 0;
    buildQuestionCard(0);
  }

  // ---------------------------------------------------------
  // SKIP — quietly advance
  // ---------------------------------------------------------

  async function handleSkip() {
    // Skip moves forward without saving current input
    await advanceQuestion();
  }

  // ---------------------------------------------------------
  // FORWARD THRESHOLD BEAT
  // ---------------------------------------------------------

  async function playForwardBeat() {
    state.phase = 'forward';
    document.body.setAttribute('data-threshold', 'active');

    const canvas = $('.canvas-state');
    canvas.setAttribute('data-phase', 'exiting');

    await wait(reducedMotion ? 200 : 1400);

    const beat = $('.forward-beat');
    beat.setAttribute('data-phase', 'active');

    await wait(reducedMotion ? 200 : 400);

    const line1 = $('.beat-line[data-line="0"]');
    const line2 = $('.beat-line[data-line="1"]');

    line1.classList.add('is-revealed');
    await wait(reducedMotion ? 1500 : 3000);

    line1.classList.remove('is-revealed');
    line1.classList.add('is-exiting');
    await wait(reducedMotion ? 400 : 1400);

    await wait(reducedMotion ? 200 : 400);

    line2.classList.add('is-revealed');
    await wait(reducedMotion ? 1500 : 2400);

    line2.classList.remove('is-revealed');
    line2.classList.add('is-exiting');
    await wait(reducedMotion ? 400 : 1400);

    await wait(reducedMotion ? 300 : 800);
    resetToIntro();
  }

  function resetToIntro() {
    const beat = $('.forward-beat');
    beat.setAttribute('data-phase', 'hidden');

    const line1 = $('.beat-line[data-line="0"]');
    const line2 = $('.beat-line[data-line="1"]');
    line1.classList.remove('is-revealed', 'is-exiting');
    line2.classList.remove('is-revealed', 'is-exiting');

    document.body.removeAttribute('data-threshold');
    for (let i = 1; i <= 6; i++) document.body.classList.remove(`q-${i}`);

    state.index = 0;
    state.answers = new Array(QUESTIONS.length).fill('');
    window.clearTimeout(state.typingTimer);

    const stage = $('[data-question-stage]');
    if (stage) stage.innerHTML = '';

    const cta = $('.cta-forward');
    if (cta) cta.setAttribute('data-state', 'hidden');

    const canvas = $('.canvas-state');
    canvas.setAttribute('data-phase', 'hidden');

    const intro = $('.intro');
    intro.setAttribute('data-phase', 'active');

    introSchedule.forEach((step) => {
      const el = $(step.selector);
      if (el) el.classList.remove('is-revealed');
    });

    state.phase = 'intro';
    startIntro();
  }

  // ---------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------

  function setupActions() {
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');

      if (action === 'start') {
        exitIntro();
      } else if (action === 'next-question') {
        advanceQuestion();
      } else if (action === 'skip') {
        handleSkip();
      } else if (action === 'forward') {
        playForwardBeat();
      }
    });

    // Enter (without Shift) inside textarea advances
    document.body.addEventListener('keydown', (e) => {
      if (state.phase !== 'canvas') return;
      if (!(e.target instanceof HTMLTextAreaElement)) return;
      if (e.key !== 'Enter' || e.shiftKey) return;
      const text = e.target.value.trim();
      if (text.length === 0) return;
      e.preventDefault();
      advanceQuestion();
    });
  }

  // ---------------------------------------------------------
  // DUST
  // ---------------------------------------------------------

  function spawnDust() {
    if (reducedMotion) return;
    const field = $('.dust-field');
    if (!field) return;

    const width = window.innerWidth;
    let count = 22;
    if (width < 768) count = 0;
    else if (width < 1280) count = 16;

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
  // PARALLAX (intro only)
  // ---------------------------------------------------------

  function setupParallax() {
    if (reducedMotion) return;
    if ('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    function onMove(e) {
      if (state.phase === 'forward') return;
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    function tick() {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      document.documentElement.style.setProperty('--parallax-x', currentX.toFixed(3));
      document.documentElement.style.setProperty('--parallax-y', currentY.toFixed(3));
      requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove);
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    spawnDust();
    setupParallax();
    setupActions();
    startIntro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
