/*
 * 바텀시트 모달.
 *
 * 열 때 콜백으로 본문을 그리고, 닫으면 DOM 에서 지운다. 열려 있는 모달은 하나뿐이다.
 * 결제 모달처럼 음악을 멈춰야 하는 건 모달이 아니라 결제 호출부(iap.purchase)가
 * 책임진다 — 모달을 여는 것 자체는 음악을 멈출 이유가 아니기 때문.
 */

import { el } from './dom.js';

let openOverlay = null;

export function close() {
  if (!openOverlay) return;
  const overlay = openOverlay;
  openOverlay = null;
  overlay.classList.remove('active');
  setTimeout(() => overlay.remove(), 220);
}

/**
 * @param {{title?:string, subtitle?:string, body?:Node|Node[], dismissible?:boolean}} opts
 */
export function open(opts = {}) {
  close();

  const sheet = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, [
    opts.title ? el('div', { class: 'modal-title', text: opts.title }) : null,
    opts.subtitle ? el('div', { class: 'modal-sub', text: opts.subtitle }) : null,
  ]);
  for (const child of [].concat(opts.body || [])) {
    if (child) sheet.appendChild(child);
  }

  const overlay = el('div', { class: 'modal-overlay' }, [sheet]);
  if (opts.dismissible !== false) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  document.getElementById('modals').appendChild(overlay);
  openOverlay = overlay;
  // 다음 프레임에 켜야 transition 이 먹는다.
  requestAnimationFrame(() => overlay.classList.add('active'));

  return { overlay, sheet, close };
}

export function isOpen() {
  return !!openOverlay;
}
