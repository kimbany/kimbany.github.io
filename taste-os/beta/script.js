/* ==========================================================
   Taste OS — Private Beta gate
   Quiet invitation + waitlist. No countdowns, no "X spots left".
   (Static preview: invite codes validated client-side; waitlist
    held in localStorage. In production these call Supabase.)
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // ---------------------------------------------------------
  // INVITE CODES (demo set — production checks Supabase)
  // Case-insensitive; spaces/dashes ignored.
  // ---------------------------------------------------------
  const VALID_CODES = new Set([
    'QUIETWARMTH', 'LATENIGHT', 'ATMOSPHERE', 'TASTEOS', '머무름',
  ]);

  function normalize(s) {
    return (s || '').trim().toUpperCase().replace(/[\s-]/g, '');
  }

  // ---------------------------------------------------------
  // INVITE FORM → opens the door
  // ---------------------------------------------------------
  function setupInvite() {
    const form = $('[data-invite-form]');
    const input = $('[data-invite-input]');
    const note = $('[data-invite-note]');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = normalize(input.value);
      if (!code) { showNote(note, '코드를 가만히 적어 주세요.', true); return; }

      if (VALID_CODES.has(code)) {
        showNote(note, '문이 열려요. 들어오세요.', false);
        await openDoor('당신을 위한 자리가, 준비되어 있었어요.');
        window.location.href = '../hero/';
      } else {
        showNote(note, '아직 닿지 않은 코드예요. 괜찮아요, 자리를 맡아둘게요.', true);
      }
    });
  }

  // ---------------------------------------------------------
  // WAITLIST FORM → quiet promise
  // ---------------------------------------------------------
  function setupWaitlist() {
    const form = $('[data-waitlist-form]');
    const input = $('[data-waitlist-input]');
    const note = $('[data-waitlist-note]');
    if (!form) return;

    // already joined?
    try {
      if (localStorage.getItem('taste-os-waitlist')) {
        showNote(note, '이미 자리를 맡아두셨어요. 조용히 기다릴게요.', false);
      }
    } catch (e) {}

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (input.value || '').trim();
      if (!isEmail(email)) {
        showNote(note, '닿을 수 있는 곳을 적어 주세요.', true);
        return;
      }
      try { localStorage.setItem('taste-os-waitlist', email); } catch (e) {}
      input.value = '';
      input.setAttribute('placeholder', '맡아두었어요');
      showNote(note, '자리를 맡아두었어요. 가장 조용한 시간에 닿을게요.', false);
    });
  }

  function isEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function showNote(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('is-error', !!isError);
    el.classList.remove('is-shown');
    void el.offsetWidth;
    el.classList.add('is-shown');
  }

  // ---------------------------------------------------------
  // DOOR-OPENING VEIL
  // ---------------------------------------------------------
  async function openDoor(line) {
    const veil = $('[data-door-veil]');
    const lineEl = $('[data-door-line]');
    if (!veil || !lineEl) { await wait(400); return; }
    lineEl.textContent = line;
    veil.classList.add('is-open');
    await wait(reducedMotion ? 200 : 600);
    lineEl.classList.add('is-shown');
    await wait(reducedMotion ? 600 : 2600);
  }

  // ---------------------------------------------------------
  // REVEALS / DUST / PARALLAX
  // ---------------------------------------------------------
  function setupReveals() {
    $$('[data-reveal]').forEach((el) => {
      const delay = parseInt(el.dataset.revealDelay || '0', 10);
      const scaled = reducedMotion ? Math.min(delay, 200) : delay;
      setTimeout(() => el.classList.add('is-revealed'), 400 + scaled);
    });
  }

  function spawnDust() {
    if (reducedMotion) return;
    const field = $('.dust-field');
    if (!field) return;
    const width = window.innerWidth;
    let count = 20;
    if (width < 768) count = 8;
    else if (width < 1280) count = 14;
    const tones = ['dust-rose', 'dust-silver', 'dust-ember'];
    for (let i = 0; i < count; i++) {
      const d = document.createElement('span');
      d.className = 'dust ' + tones[i % tones.length];
      const size = 1.5 + Math.random() * 1.8;
      d.style.left = `${Math.random() * 100}%`;
      d.style.width = `${size}px`;
      d.style.height = `${size}px`;
      const dur = 16 + Math.random() * 8;
      const delay = (i * 0.6) - 8;
      d.style.animation = `dust-rise ${dur}s linear infinite, dust-fade ${dur}s ease-in-out infinite`;
      d.style.animationDelay = `${delay}s, ${delay}s`;
      field.appendChild(d);
    }
  }

  function setupParallax() {
    if (reducedMotion) return;
    if ('ontouchstart' in window && !window.matchMedia('(hover: hover)').matches) return;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    function tick() {
      cx += (tx - cx) * 0.04;
      cy += (ty - cy) * 0.04;
      document.documentElement.style.setProperty('--parallax-x', cx.toFixed(3));
      document.documentElement.style.setProperty('--parallax-y', cy.toFixed(3));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function init() {
    setupInvite();
    setupWaitlist();
    setupReveals();
    spawnDust();
    setupParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
