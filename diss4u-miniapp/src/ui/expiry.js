/*
 * 충전 크레딧 소멸 임박 안내.
 *
 * 서버 /me 가 expiringSoon 을 준다: { amount, expireAt(ISO), days } 또는 null.
 * 충전 크레딧은 결제일로부터 1년이고, 소멸 30일 전부터 알린다.
 *
 * 매번 띄우면 잔소리가 되므로 같은 만료 건에 대해 하루 한 번만 보여준다.
 * 웹은 localStorage 로 눌러뒀는데, 미니앱은 Storage API 래퍼를 쓴다.
 */

import { el } from './dom.js';
import { open as openModal, close as closeModal } from './modal.js';
import * as storage from '../lib/storage.js';
import * as nav from '../lib/nav.js';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * 필요하면 안내를 띄운다.
 * @returns {Promise<boolean>} 띄웠으면 true
 */
export async function maybeShow(expiringSoon, uid) {
  if (!expiringSoon?.amount || !uid) return false;

  const day = String(expiringSoon.expireAt || '').slice(0, 10);
  const key = `diss4u_expWarn_${uid}_${day}`;

  // 같은 만료 건은 하루 한 번만.
  if ((await storage.get(key)) === today()) return false;
  await storage.set(key, today());

  const close = el('button', { class: 'btn-secondary', type: 'button' }, ['알겠어요']);
  close.addEventListener('click', () => closeModal());

  const go = el('button', { class: 'btn-primary', type: 'button' }, ['내역 보기']);
  go.addEventListener('click', () => {
    closeModal();
    nav.push('credits');
  });

  openModal({
    title: '충전 크레딧이 곧 사라져요',
    subtitle:
      `${formatDate(expiringSoon.expireAt)}에 ${expiringSoon.amount}크레딧이 소멸돼요.` +
      (expiringSoon.days ? ` (${expiringSoon.days}일 남음)` : ''),
    body: [
      el('div', {
        class: 'hint',
        text: '충전 크레딧은 결제일로부터 1년간 쓸 수 있어요. 소멸된 크레딧은 복구되지 않아요.',
      }),
      el('div', { class: 'modal-actions' }, [close, go]),
    ],
  });

  return true;
}
