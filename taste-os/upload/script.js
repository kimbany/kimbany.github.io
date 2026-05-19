/* ==========================================================
   Taste OS — Upload / 두기
   Drag-drop, multi-mode input, atmosphere chips, expansion.
   Vanilla JS, no dependencies.
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // ATMOSPHERE CHIPS — 12 curated
  // ---------------------------------------------------------

  const CHIPS = [
    '새벽', '아침', '오후', '황혼',
    '정적', '친밀', '멀리', '혼자',
    '따뜻', '차가움', '오래된', '단일 광원',
  ];

  // ---------------------------------------------------------
  // STATE
  // ---------------------------------------------------------

  const state = {
    items: [],          // UploadItem[]
    pendingRelease: null, // { item, timeoutId }
    panelMode: null,    // 'music' | 'quote' | 'atmosphere' | null
    expanded: null,     // currently expanded item id
  };

  const PANEL_HINTS = {
    music:      '곡 이름이나 링크. 무엇이든.',
    quote:      '기억에 남은 한 줄.',
    atmosphere: '어떤 분위기가 머물고 있어요?',
  };

  const PANEL_PLACEHOLDERS = {
    music:      'Sigur Rós · Glósóli',
    quote:      '어떤 것들은 한 번 보는 걸로 충분해요.',
    atmosphere: '비 온 일요일 오후의 정적',
  };

  // ---------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function wait(ms) { return new Promise((r) => window.setTimeout(r, ms)); }

  function ulid() {
    return 'i-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function randomTilt() { return (Math.random() * 4 - 2).toFixed(2); }
  function randomDriftDelay() { return (Math.random() * 8).toFixed(1); }

  // ---------------------------------------------------------
  // CARD RENDERING
  // ---------------------------------------------------------

  function renderCard(item) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = item.id;
    card.style.setProperty('--tilt', `${item.rotation}deg`);
    card.style.setProperty('--drift-delay', `${item.driftDelay}s`);

    if (item.type === 'image') {
      card.classList.add('card-image');
      if (item.content.dataUrl) {
        card.innerHTML = `<div class="img-frame" style="background-image:url('${cssEscape(item.content.dataUrl)}')"></div>`;
      } else {
        card.innerHTML = `<div class="img-placeholder"></div>`;
      }
    }

    if (item.type === 'music') {
      card.classList.add('card-music');
      const { display, sub } = parseMusic(item.content.value);
      card.innerHTML = `
        <div class="disc" aria-hidden="true"></div>
        <div class="music-meta">
          <div class="title">${escapeHtml(display)}</div>
          <div class="sub">${escapeHtml(sub)}</div>
        </div>
      `;
    }

    if (item.type === 'quote') {
      card.classList.add('card-quote');
      card.innerHTML = `<div class="quote-text">${escapeHtml(item.content.text)}</div>`;
    }

    if (item.type === 'atmosphere') {
      card.classList.add('card-atmosphere');
      card.innerHTML = `<div class="atm-text">${escapeHtml(item.content.text)}</div>`;
    }

    // chips
    const chipsEl = document.createElement('div');
    chipsEl.className = 'card-chips';
    CHIPS.forEach((chipText) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = chipText;
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleChip(item.id, chipText);
      });
      chipsEl.appendChild(chip);
    });
    card.appendChild(chipsEl);

    // updates the chips state visually
    syncChipsForItem(card, item);

    // hover chip indication
    if (item.atmosphere.size > 0) card.classList.add('has-chips');

    // click → expand
    card.addEventListener('click', () => expandItem(item.id));

    return card;
  }

  function parseMusic(value) {
    const v = String(value || '').trim();
    if (/^https?:\/\//.test(v)) {
      try {
        const url = new URL(v);
        const host = url.host.replace(/^www\./, '');
        return { display: v.replace(/^https?:\/\//, ''), sub: host };
      } catch {
        return { display: v, sub: 'link' };
      }
    }
    // typed track — split on " — " or " - "
    const parts = v.split(/\s+[—–-]\s+/);
    if (parts.length >= 2) {
      return { display: parts.slice(1).join(' — '), sub: parts[0] };
    }
    return { display: v, sub: 'track' };
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function cssEscape(s) {
    // safe for url('...')
    return String(s).replace(/'/g, "%27");
  }

  function syncChipsForItem(cardEl, item) {
    const chips = cardEl.querySelectorAll('.chip');
    chips.forEach((chip) => {
      chip.classList.toggle('is-selected', item.atmosphere.has(chip.textContent));
    });
    cardEl.classList.toggle('has-chips', item.atmosphere.size > 0);
  }

  // ---------------------------------------------------------
  // CANVAS MANAGEMENT
  // ---------------------------------------------------------

  function getCanvasInner() {
    const canvas = $('[data-canvas]');
    let inner = canvas.querySelector('.canvas-inner');
    if (!inner) {
      inner = document.createElement('div');
      inner.className = 'canvas-inner';
      canvas.appendChild(inner);
    }
    return inner;
  }

  async function placeItem(item) {
    state.items.push(item);
    document.body.classList.add('has-items');

    const isFirst = state.items.length === 1;

    const inner = getCanvasInner();
    const card = renderCard(item);
    card.classList.add('is-fresh');
    inner.appendChild(card);

    // settle physics: trigger after a paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.add('is-placed');
      });
    });

    // remove fresh glow after a beat
    window.setTimeout(() => card.classList.remove('is-fresh'), reducedMotion ? 200 : 900);

    updateCounter();
    revealHeader();

    if (isFirst) {
      // "잘 두었어요" toast for first item only
      showPlacedToast();
    }
  }

  function updateCounter() {
    const el = $('[data-count]');
    if (el) el.textContent = String(state.items.length);
  }

  function showPlacedToast() {
    const toast = $('[data-toast]');
    if (!toast) return;
    toast.classList.add('is-visible');
    window.setTimeout(() => toast.classList.remove('is-visible'), reducedMotion ? 1500 : 4000);
  }

  function revealHeader() {
    const header = $('.page-header');
    if (header) header.classList.add('is-visible');
  }

  // ---------------------------------------------------------
  // ATMOSPHERE CHIPS — toggling
  // ---------------------------------------------------------

  function toggleChip(itemId, chipText) {
    const item = state.items.find((it) => it.id === itemId);
    if (!item) return;

    if (item.atmosphere.has(chipText)) {
      item.atmosphere.delete(chipText);
    } else {
      if (item.atmosphere.size >= 5) return;
      item.atmosphere.add(chipText);
    }
    const cardEl = $(`.card[data-id="${item.id}"]`);
    if (cardEl) syncChipsForItem(cardEl, item);
  }

  // ---------------------------------------------------------
  // IMAGE UPLOAD (drag-drop + file picker + paste)
  // ---------------------------------------------------------

  function setupImageUpload() {
    const fileInput = $('[data-file]');

    // file picker
    $('[data-mode="image"]').addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      handleImageFiles(files);
      fileInput.value = '';
    });

    // drag-drop on whole page
    let dragCounter = 0;

    function isDraggingFiles(e) {
      if (!e.dataTransfer) return false;
      const types = e.dataTransfer.types;
      return types && Array.from(types).indexOf('Files') !== -1;
    }

    window.addEventListener('dragenter', (e) => {
      if (!isDraggingFiles(e)) return;
      e.preventDefault();
      dragCounter++;
      document.body.classList.add('is-dragging');
    });

    window.addEventListener('dragover', (e) => {
      if (!isDraggingFiles(e)) return;
      e.preventDefault();
    });

    window.addEventListener('dragleave', (e) => {
      if (!isDraggingFiles(e)) return;
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        document.body.classList.remove('is-dragging');
      }
    });

    window.addEventListener('drop', (e) => {
      if (!isDraggingFiles(e)) return;
      e.preventDefault();
      dragCounter = 0;
      document.body.classList.remove('is-dragging');
      const files = Array.from(e.dataTransfer.files || []);
      handleImageFiles(files);
    });

    // paste
    window.addEventListener('paste', (e) => {
      const items = (e.clipboardData || {}).items;
      if (!items) return;
      const images = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image') === 0) {
          const f = items[i].getAsFile();
          if (f) images.push(f);
        }
      }
      if (images.length) handleImageFiles(images);
    });
  }

  async function handleImageFiles(files) {
    const images = files.filter((f) => /^image\//.test(f.type));
    for (let i = 0; i < images.length; i++) {
      const f = images[i];

      // stagger drops 200ms each (one paper at a time)
      if (i > 0 && !reducedMotion) await wait(200);

      const item = makeItem('image');
      item.content = { type: 'image', dataUrl: '', name: f.name };
      placeItem(item);

      // read async
      try {
        const dataUrl = await readAsDataUrl(f);
        item.content.dataUrl = dataUrl;
        const cardEl = $(`.card[data-id="${item.id}"]`);
        if (cardEl) {
          const frame = cardEl.querySelector('.img-frame, .img-placeholder');
          if (frame) {
            const next = document.createElement('div');
            next.className = 'img-frame';
            next.style.backgroundImage = `url('${cssEscape(dataUrl)}')`;
            next.style.opacity = '0';
            next.style.filter = 'blur(14px)';
            next.style.transition = 'opacity 1.6s ease, filter 1.6s ease';
            frame.replaceWith(next);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                next.style.opacity = '1';
                next.style.filter = 'blur(0)';
              });
            });
          }
        }
      } catch (err) {
        // remove failed card silently
        const cardEl = $(`.card[data-id="${item.id}"]`);
        if (cardEl) cardEl.remove();
        state.items = state.items.filter((it) => it.id !== item.id);
        updateCounter();
      }
    }
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function makeItem(type) {
    return {
      id: ulid(),
      type,
      content: null,
      atmosphere: new Set(),
      rotation: randomTilt(),
      driftDelay: randomDriftDelay(),
      addedAt: new Date(),
    };
  }

  // ---------------------------------------------------------
  // PANEL INPUT (music / quote / atmosphere)
  // ---------------------------------------------------------

  function setupModeSwitcher() {
    $$('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode === 'image') return; // handled by setupImageUpload
        openPanel(mode);
      });
    });

    $('[data-action="place"]').addEventListener('click', placeFromPanel);
    $('[data-action="cancel"]').addEventListener('click', closePanel);
    $('[data-scrim]').addEventListener('click', closePanel);

    const input = $('[data-input]');
    input.addEventListener('input', () => {
      const trimmed = input.value.trim();
      $('[data-action="place"]').disabled = trimmed.length === 0;
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (input.value.trim().length > 0) placeFromPanel();
      }
      if (e.key === 'Escape') closePanel();
    });
  }

  function openPanel(mode) {
    state.panelMode = mode;
    $('[data-hint]').textContent = PANEL_HINTS[mode];
    const input = $('[data-input]');
    input.placeholder = PANEL_PLACEHOLDERS[mode];
    input.value = '';
    $('[data-action="place"]').disabled = true;

    $('[data-scrim]').classList.add('is-visible');
    $('[data-panel]').setAttribute('data-state', 'visible');
    window.setTimeout(() => input.focus(), 600);
  }

  function closePanel() {
    state.panelMode = null;
    $('[data-scrim]').classList.remove('is-visible');
    $('[data-panel]').setAttribute('data-state', 'hidden');
  }

  function placeFromPanel() {
    const input = $('[data-input]');
    const value = input.value.trim();
    if (!value) return;

    const item = makeItem(state.panelMode);
    if (state.panelMode === 'music') {
      const isUrl = /^https?:\/\//.test(value);
      item.content = { type: 'music', value, source: isUrl ? 'url' : 'text' };
    } else if (state.panelMode === 'quote') {
      item.content = { type: 'quote', text: value };
    } else if (state.panelMode === 'atmosphere') {
      item.content = { type: 'atmosphere', text: value };
    }

    placeItem(item);
    closePanel();
  }

  // ---------------------------------------------------------
  // EXPANDED VIEW
  // ---------------------------------------------------------

  function setupExpanded() {
    $('[data-expanded-scrim]').addEventListener('click', closeExpanded);
    $('[data-action="close"]').addEventListener('click', closeExpanded);
    $('[data-action="release"]').addEventListener('click', releaseExpanded);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.expanded) closeExpanded();
    });
  }

  function expandItem(itemId) {
    const item = state.items.find((it) => it.id === itemId);
    if (!item) return;
    state.expanded = itemId;

    const stage = $('[data-expanded-stage]');
    stage.innerHTML = '';
    const card = renderCard(item);
    // disable click + tilt + chips in expanded view
    card.style.setProperty('--tilt', '0deg');
    card.classList.add('is-placed');
    const chips = card.querySelector('.card-chips');
    if (chips) chips.remove();
    stage.appendChild(card);

    // meta
    $('[data-when]').textContent = formatWhen(item.addedAt);
    const atm = Array.from(item.atmosphere);
    $('[data-atmosphere-meta]').textContent = atm.length
      ? `분위기: ${atm.join(' · ')}`
      : '';

    $('[data-expanded]').setAttribute('data-state', 'visible');
  }

  function closeExpanded() {
    state.expanded = null;
    $('[data-expanded]').setAttribute('data-state', 'hidden');
  }

  function releaseExpanded() {
    if (!state.expanded) return;
    const id = state.expanded;
    closeExpanded();
    window.setTimeout(() => releaseItem(id), 200);
  }

  function formatWhen(date) {
    if (!date) return '';
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return '방금 두었어요.';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전에 두었어요.`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전에 두었어요.`;
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = date.getHours();
    return `${m}월 ${d}일 ${h}시에 두었어요.`;
  }

  // ---------------------------------------------------------
  // RELEASE / UNDO
  // ---------------------------------------------------------

  function releaseItem(itemId) {
    const item = state.items.find((it) => it.id === itemId);
    if (!item) return;
    const cardEl = $(`.card[data-id="${itemId}"]`);
    if (cardEl) cardEl.classList.add('is-releasing');

    const toast = $('[data-undo]');
    toast.setAttribute('data-state', 'visible');

    const timeoutId = window.setTimeout(() => {
      // permanent removal
      state.items = state.items.filter((it) => it.id !== itemId);
      if (cardEl) cardEl.remove();
      toast.setAttribute('data-state', 'hidden');
      state.pendingRelease = null;
      updateCounter();
      if (state.items.length === 0) {
        document.body.classList.remove('has-items');
        $('.page-header').classList.remove('is-visible');
      }
    }, reducedMotion ? 1500 : 7000);

    state.pendingRelease = { item, timeoutId, cardEl };

    const undoBtn = toast.querySelector('[data-action="undo"]');
    undoBtn.onclick = undoRelease;
  }

  function undoRelease() {
    if (!state.pendingRelease) return;
    const { cardEl, timeoutId } = state.pendingRelease;
    clearTimeout(timeoutId);
    if (cardEl) cardEl.classList.remove('is-releasing');
    $('[data-undo]').setAttribute('data-state', 'hidden');
    state.pendingRelease = null;
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    setupImageUpload();
    setupModeSwitcher();
    setupExpanded();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
