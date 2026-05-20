/* ==========================================================
   Taste OS — Emotional Memory (visualization)
   A living memory constellation: fragments (nodes) + resonance (edges).
   This is a tangible picture of the Emotional Memory Engine,
   not the engine itself (see ../memory-engine.md).
   ========================================================== */

(function () {
  'use strict';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // ---------------------------------------------------------
  // MEMORY CONSTELLATION — nodes (fragments) + edges (resonance)
  // positions are % within the graph frame; tones map to emotion
  // ---------------------------------------------------------

  const NODES = [
    { id: 'core',   x: 50, y: 50, tone: 'beige', size: 18, core: true,  label: '지금의 나' },
    { id: 'light',  x: 24, y: 26, tone: 'warm',  size: 13, label: '오래 머무는 빛' },
    { id: 'paper',  x: 40, y: 16, tone: 'beige', size: 11, label: '낡은 종이의 결' },
    { id: 'dawn',   x: 74, y: 22, tone: 'cool',  size: 12, label: '차가운 새벽' },
    { id: 'music',  x: 82, y: 48, tone: 'warm',  size: 11, label: '혼자의 음악' },
    { id: 'hands',  x: 70, y: 74, tone: 'rose',  size: 12, label: '느린 손길' },
    { id: 'dusk',   x: 46, y: 82, tone: 'warm',  size: 13, label: '저녁 6시의 빛' },
    { id: 'solitude', x: 20, y: 70, tone: 'cool', size: 12, label: '도시의 고독' },
    { id: 'trace',  x: 14, y: 48, tone: 'rose',  size: 11, label: '누군가의 흔적' },
  ];

  // relation: 'resonates' (close) or 'contrasts' (warm <-> cool, but coexisting)
  const EDGES = [
    { a: 'core', b: 'light',    rel: 'resonates' },
    { a: 'core', b: 'hands',    rel: 'resonates' },
    { a: 'core', b: 'dusk',     rel: 'resonates' },
    { a: 'core', b: 'trace',    rel: 'resonates' },
    { a: 'light', b: 'paper',   rel: 'resonates' },
    { a: 'light', b: 'music',   rel: 'resonates' },
    { a: 'hands', b: 'dusk',    rel: 'resonates' },
    { a: 'hands', b: 'trace',   rel: 'resonates' },
    { a: 'dawn', b: 'solitude', rel: 'resonates' },
    { a: 'paper', b: 'dawn',    rel: 'resonates' },
    // contradictions that coexist within the same person
    { a: 'solitude', b: 'hands', rel: 'contrasts' },
    { a: 'dawn', b: 'dusk',      rel: 'contrasts' },
  ];

  function buildGraph() {
    const frame = $('[data-graph-frame]');
    const svg = $('[data-graph-edges]');
    const nodesLayer = $('[data-graph-nodes]');
    if (!frame || !svg || !nodesLayer) return;

    // viewBox in 0..1000 x 0..(1000 * aspect) — use 1000 x 687 (16/11)
    const VW = 1000, VH = 687;
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

    const nodeById = {};
    NODES.forEach((n) => { nodeById[n.id] = n; });

    // Edges
    const edgeEls = {};
    EDGES.forEach((e, i) => {
      const a = nodeById[e.a], b = nodeById[e.b];
      if (!a || !b) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', (a.x / 100 * VW).toFixed(1));
      line.setAttribute('y1', (a.y / 100 * VH).toFixed(1));
      line.setAttribute('x2', (b.x / 100 * VW).toFixed(1));
      line.setAttribute('y2', (b.y / 100 * VH).toFixed(1));
      line.setAttribute('class', 'edge-' + e.rel);
      line.dataset.a = e.a;
      line.dataset.b = e.b;
      svg.appendChild(line);
      edgeEls[e.a + '|' + e.b] = line;
    });

    // Nodes
    NODES.forEach((n, i) => {
      const el = document.createElement('div');
      el.className = 'mem-node tone-' + n.tone + (n.core ? ' is-core' : '');
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.dataset.nodeId = n.id;

      const dot = document.createElement('span');
      dot.className = 'node-dot';
      dot.style.setProperty('--size', n.size + 'px');
      dot.style.animationDelay = (i * 0.4).toFixed(1) + 's';

      const label = document.createElement('span');
      label.className = 'node-label';
      label.textContent = n.label;

      el.appendChild(dot);
      el.appendChild(label);
      nodesLayer.appendChild(el);

      // Reveal stagger
      const delay = reducedMotion ? Math.min(i * 80, 320) : 200 + i * 160;
      window.setTimeout(() => el.classList.add('is-revealed'), delay);

      // Hover focus: light linked nodes + edges
      el.addEventListener('mouseenter', () => focusNode(n.id, frame, edgeEls));
      el.addEventListener('mouseleave', () => unfocus(frame, edgeEls));
    });

    // Draw edges when the frame scrolls in
    if (!('IntersectionObserver' in window)) {
      frame.classList.add('is-drawn');
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        window.setTimeout(() => frame.classList.add('is-drawn'), 600);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.3 });
    io.observe(frame);
  }

  function focusNode(id, frame, edgeEls) {
    frame.classList.add('is-focusing');
    const linked = new Set();

    $$('.graph-edges line').forEach((line) => {
      const touches = line.dataset.a === id || line.dataset.b === id;
      line.classList.toggle('is-lit', touches);
      if (touches) {
        linked.add(line.dataset.a);
        linked.add(line.dataset.b);
      }
    });

    $$('.mem-node').forEach((node) => {
      const nid = node.dataset.nodeId;
      node.classList.toggle('is-focus', nid === id);
      node.classList.toggle('is-linked', linked.has(nid));
    });
  }

  function unfocus(frame) {
    frame.classList.remove('is-focusing');
    $$('.graph-edges line').forEach((l) => l.classList.remove('is-lit'));
    $$('.mem-node').forEach((n) => n.classList.remove('is-focus', 'is-linked'));
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
        `dust-rise ${dur}s linear infinite, dust-fade ${dur}s ease-in-out infinite`;
      dust.style.animationDelay = `${delay}s, ${delay}s`;
      field.appendChild(dust);
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

  // ---------------------------------------------------------
  // CONTINUATION
  // ---------------------------------------------------------

  function setupContinue() {
    const cta = $('[data-action="continue"]');
    if (!cta) return;
    cta.addEventListener('click', () => {
      cta.style.opacity = '0.4';
      cta.style.pointerEvents = 'none';
      window.setTimeout(() => { window.location.href = '../home/'; }, 600);
    });
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  function init() {
    buildGraph();
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
