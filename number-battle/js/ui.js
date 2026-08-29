/* 화면 공통 위젯 — 오버레이, 모달, 카운트다운, 토스트, 색종이 */
import { sleep, escapeHtml } from './util.js';

const layer = () => document.getElementById('overlay-root');

export function toast(message, ms = 2400) {
  const prev = document.querySelector('.toast');
  if (prev) prev.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/** 확인 팝업. 실수 방지용으로 위험한 동작 앞에 반드시 붙인다. */
export function confirmDialog({ title, message, confirmLabel = '확인', cancelLabel = '취소', danger = false }) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'overlay';
    wrap.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <div class="btn-row">
          <button class="btn btn-ghost" data-act="cancel" type="button">${escapeHtml(cancelLabel)}</button>
          <button class="btn ${danger ? 'btn-danger' : ''}" data-act="ok" type="button">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>`;
    function close(result) { wrap.remove(); resolve(result); }
    wrap.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'ok') close(true);
      else if (act === 'cancel' || e.target === wrap) close(false);
    });
    layer().appendChild(wrap);
    wrap.querySelector('[data-act="ok"]').focus();
  });
}

/** 비밀번호(진행자 PIN) 입력 */
export function promptPin({ title = '진행자 확인', message = 'PIN을 입력하세요.' } = {}) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'overlay';
    wrap.innerHTML = `
      <div class="modal">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <input type="password" inputmode="numeric" maxlength="8" autocomplete="off" />
        <div class="btn-row" style="margin-top:14px">
          <button class="btn btn-ghost" data-act="cancel" type="button">취소</button>
          <button class="btn" data-act="ok" type="button">확인</button>
        </div>
      </div>`;
    const input = wrap.querySelector('input');
    function close(v) { wrap.remove(); resolve(v); }
    wrap.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'ok') close(input.value);
      else if (act === 'cancel' || e.target === wrap) close(null);
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(input.value); });
    layer().appendChild(wrap);
    setTimeout(() => input.focus(), 40);
  });
}

/** 3 · 2 · 1 카운트다운. fast 모드면 짧게 지나간다. */
export async function countdown({ from = 3, go = null, fast = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  layer().appendChild(wrap);
  const step = fast ? 260 : 800;
  for (let i = from; i >= 1; i -= 1) {
    wrap.innerHTML = `<div class="countdown">${i}</div>`;
    await sleep(step);
  }
  if (go) {
    wrap.innerHTML = `<div class="countdown go">${escapeHtml(go)}</div>`;
    await sleep(fast ? 320 : 750);
  }
  wrap.remove();
}

/** 최종 결과 축하 효과 */
export function confetti({ duration = 3200 } = {}) {
  const canvas = document.getElementById('confetti');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const colors = ['#ff2e88', '#22e6ff', '#ffd93d', '#7cff6b', '#a86bff', '#ff8a3d'];
  const pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * w,
    y: -20 - Math.random() * h * 0.6,
    vx: (Math.random() - 0.5) * 2.4,
    vy: 2 + Math.random() * 3.6,
    size: 5 + Math.random() * 8,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.24,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  const started = performance.now();
  let raf = null;
  function frame(now) {
    ctx.clearRect(0, 0, w, h);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > h + 30) { p.y = -20; p.x = Math.random() * w; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (now - started < duration) raf = requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, w, h);
  }
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);
}

/** 자주 쓰는 HTML 조각 */
export function nameTag(name, cls = '') {
  return `<span class="name-tag ${cls}">${escapeHtml(name)}</span>`;
}

export function numberGrid(numbers, { selected = null, disabled = [], dense = false, owners = {} } = {}) {
  return `<div class="num-grid${dense ? ' dense' : ''}">${numbers.map((n) => {
    const isDisabled = disabled.includes(n);
    const cls = ['num'];
    if (selected === n) cls.push('is-selected');
    if (isDisabled) cls.push('is-locked');
    return `<button class="${cls.join(' ')}" type="button" data-number="${n}" ${isDisabled ? 'disabled' : ''}>
      ${n}${owners[n] ? `<span class="num-owner">${escapeHtml(owners[n])}</span>` : ''}
    </button>`;
  }).join('')}</div>`;
}
