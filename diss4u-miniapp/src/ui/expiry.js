/*
 * 충전 크레딧 소멸 임박 안내.
 *
 * 서버 /me 가 expiringSoon 을 준다: { amount, expireAt(ISO), days } 또는 null.
 * 충전 크레딧은 결제일로부터 1년이고, 소멸 30일 전부터 알린다.
 *
 * 처음엔 바텀시트로 만들었는데 체크리스트에 걸린다.
 *   "미니앱에 들어오자마자 바텀시트가 자동으로 열리지 않아요."
 *   "특정 화면 전환 시 바텀시트로 사용자의 행동을 강제로 유도하지 않아요."
 * 그래서 홈 화면 위에 얹는 띠(배너)로 바꿨다. 읽고 닫을 수 있고, 아무것도 막지 않는다.
 *
 * 같은 만료 건은 하루 한 번만 보여준다. 웹은 localStorage 로 눌렀는데
 * 미니앱은 Storage API 래퍼를 쓴다.
 */

import { el } from './dom.js';
import * as storage from '../lib/storage.js';
import * as nav from '../lib/nav.js';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(uid, expireAt) {
  return `diss4u_expWarn_${uid}_${String(expireAt || '').slice(0, 10)}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso || '').slice(0, 10);
  try {
    return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(d);
  } catch {
    return String(iso).slice(0, 10);
  }
}

/**
 * 오늘 이 만료 건을 이미 보여줬는지.
 * 홈 화면이 그릴 때마다 배너가 다시 뜨면 닫아도 소용없기 때문에 필요하다.
 */
export async function shouldShow(expiringSoon, uid) {
  if (!expiringSoon?.amount || !uid) return false;
  return (await storage.get(storageKey(uid, expiringSoon.expireAt))) !== today();
}

/** 오늘은 그만 보여준다고 기록한다. */
export async function markShown(expiringSoon, uid) {
  if (!expiringSoon?.expireAt || !uid) return;
  await storage.set(storageKey(uid, expiringSoon.expireAt), today());
}

/**
 * 홈 화면에 얹을 배너를 만든다.
 * @param {() => void} onClose 닫혔을 때 호출 — 호출부가 DOM 에서 지운다.
 */
export function banner(expiringSoon, onClose) {
  const days = expiringSoon.days;
  const close = el('button', {
    class: 'notice-banner-close',
    type: 'button',
    'aria-label': '닫기',
    text: '×',
  });
  close.addEventListener('click', (e) => {
    e.stopPropagation();
    onClose?.();
  });

  const node = el('div', { class: 'notice-banner' }, [
    el('span', { style: 'font-size:18px', text: '⏳' }),
    el('div', { class: 'notice-banner-body' }, [
      el('div', {
        class: 'notice-banner-title',
        text: `충전 크레딧 ${expiringSoon.amount}p가 곧 사라져요`,
      }),
      el('div', {
        class: 'notice-banner-desc',
        text:
          `${formatDate(expiringSoon.expireAt)}에 소멸돼요` +
          (days ? ` · ${days}일 남음` : '') +
          ' · 눌러서 내역 보기',
      }),
    ]),
    close,
  ]);

  node.style.cursor = 'pointer';
  node.addEventListener('click', () => nav.push('credits'));
  return node;
}
