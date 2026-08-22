/*
 * 크레딧 내역.
 *
 * 서버 /credit-history 가 최근 300건을 준다(복합 색인을 피하려고 uid 단일 조건으로
 * 긁어서 메모리 정렬하는 구조라, 그 이상은 안 온다).
 *
 * 무료/유료 풀을 나눠 보여주는 게 중요하다. 차감은 무료부터, 환불은 역순이라
 * 사용자가 "내 충전 크레딧이 언제 없어지나"를 알아야 하기 때문이다.
 */

import { el } from '../ui/dom.js';
import * as api from '../lib/api.js';
import * as nav from '../lib/nav.js';

/* 서버 reason 코드 → 사람이 읽는 말 */
const REASON_LABEL = {
  signup: '가입 보너스',
  purchase: '크레딧 충전',
  iap: '크레딧 충전',
  coupon: '쿠폰 등록',
  referral: '친구 초대 보상',
  share: '공유 보상',
  song: '노래 생성',
  refund: '환불',
  admin: '운영자 지급',
  expire: '기간 만료 소멸',
};

function label(reason) {
  return REASON_LABEL[reason] || reason || '내역';
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '';
  }
}

function summary(data) {
  const row = (name, value, accent) =>
    el('div', { style: 'display:flex;justify-content:space-between;padding:6px 0' }, [
      el('span', { style: 'font-size:14px;color:var(--text-dim)', text: name }),
      el('span', {
        style: `font-size:14px;font-weight:700${accent ? ';color:var(--brand-strong)' : ''}`,
        text: `${value}p`,
      }),
    ]);

  return el('div', { class: 'card' }, [
    row('전체 잔액', data.credits ?? 0, true),
    el('div', { style: 'height:1px;background:var(--border);margin:6px 0' }),
    row('무료 크레딧', data.freeCredits ?? 0),
    row('충전 크레딧', data.paidCredits ?? 0),
    el('div', {
      class: 'hint',
      text: '노래를 만들면 무료 크레딧부터 차감돼요. 충전 크레딧은 결제일로부터 1년간 쓸 수 있어요.',
    }),
  ]);
}

export function render(root) {
  const back = el('button', { class: 'back-btn', type: 'button' }, ['← 뒤로']);
  back.addEventListener('click', () => {
    if (!nav.back()) nav.reset('input');
  });
  root.appendChild(back);
  root.appendChild(el('div', { class: 'section-title', text: '💎 크레딧 내역' }));

  const body = el('div', {});
  body.appendChild(el('div', { class: 'empty', text: '불러오는 중…' }));
  root.appendChild(body);

  api
    .creditHistory()
    .then((data) => {
      body.innerHTML = '';

      if (!data.enabled) {
        body.appendChild(el('div', { class: 'empty', text: '크레딧 기능이 꺼져 있어요.' }));
        return;
      }

      body.appendChild(summary(data));
      body.appendChild(el('div', { class: 'section-title', text: '사용 내역' }));

      const items = data.items || [];
      if (items.length === 0) {
        body.appendChild(el('div', { class: 'empty', text: '아직 내역이 없어요.' }));
        return;
      }

      const list = el('div', { class: 'history-list' });
      for (const item of items) {
        const amount = item.amount || 0;
        const plus = amount > 0;
        list.appendChild(
          el(
            'div',
            {
              class: 'history-item',
              style: 'display:flex;justify-content:space-between;align-items:center;gap:12px;cursor:default',
            },
            [
              el('div', {}, [
                el('div', { class: 'history-title', text: label(item.reason) }),
                el('div', {
                  class: 'history-meta',
                  text: [formatDate(item.at), item.type === 'paid' ? '충전' : '무료']
                    .filter(Boolean)
                    .join(' · '),
                }),
              ]),
              el('div', {
                style: `font-size:15px;font-weight:800;white-space:nowrap;color:${
                  plus ? 'var(--ok)' : 'var(--text-dim)'
                }`,
                text: `${plus ? '+' : ''}${amount}p`,
              }),
            ],
          ),
        );
      }
      body.appendChild(list);

      if (items.length >= 300) {
        body.appendChild(el('div', { class: 'hint', text: '최근 300건까지만 보여드려요.' }));
      }
    })
    .catch((e) => {
      body.innerHTML = '';
      body.appendChild(el('div', { class: 'empty', text: e.message || '내역을 불러오지 못했어요.' }));
    });
}
