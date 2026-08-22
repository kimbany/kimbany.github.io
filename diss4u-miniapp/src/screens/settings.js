/*
 * 설정.
 *
 * 웹은 settingsModal 안에 전부 욱여넣었는데, 미니앱에서는 화면으로 뺐다.
 * 바텀시트 안에서 또 바텀시트를 여는 구조가 되면(모달은 한 번에 하나만 뜬다)
 * 뒤로 가기가 꼬인다.
 *
 * 웹의 settingsModal 에 있던 워커 URL 직접 입력 칸은 뺐다. 미니앱에서는
 * 사용자가 서버 주소를 바꿀 이유가 없고, 심사에서 불필요한 입력으로 지적될 여지가 있다.
 */

import { el } from '../ui/dom.js';
import { state } from '../state.js';
import * as nav from '../lib/nav.js';
import * as auth from '../lib/auth.js';
import * as env from '../lib/env.js';
import { toast } from '../ui/toast.js';
import { open as openModal, close as closeModal } from '../ui/modal.js';
import { openChargeSheet } from '../ui/charge.js';
import { openCouponSheet } from '../ui/coupon.js';
import { openWithdrawSheet } from '../ui/withdraw.js';

function row(icon, title, desc, onClick, opts = {}) {
  const node = el(
    'button',
    {
      class: 'pack',
      type: 'button',
      style: opts.danger ? 'color:var(--danger)' : undefined,
    },
    [
      el('div', { style: 'display:flex;align-items:center;gap:12px' }, [
        el('span', { style: 'font-size:19px', text: icon }),
        el('div', {}, [
          el('div', { class: 'pack-name', text: title }),
          desc ? el('div', { class: 'pack-desc', text: desc }) : null,
        ]),
      ]),
      el('span', { style: 'color:var(--text-dimmer)', text: '›' }),
    ],
  );
  node.addEventListener('click', onClick);
  return node;
}

function confirmLogout() {
  const cancel = el('button', { class: 'btn-secondary', type: 'button' }, ['취소']);
  cancel.addEventListener('click', () => closeModal());

  const confirm = el('button', { class: 'btn-secondary btn-danger', type: 'button' }, ['로그아웃']);
  confirm.addEventListener('click', async () => {
    confirm.disabled = true;
    await auth.logout();
    closeModal();
    toast('로그아웃했어요.');
  });

  openModal({
    title: '로그아웃할까요?',
    subtitle: '만든 곡은 다시 로그인하면 그대로 보여요.',
    body: [el('div', { class: 'modal-actions' }, [cancel, confirm])],
  });
}

export function render(root) {
  root.appendChild(el('div', { class: 'section-title', text: '⚙️ 설정' }));

  /* 계정 요약 */
  const user = state.user;
  root.appendChild(
    el('div', { class: 'card' }, [
      el('div', { style: 'font-size:15px;font-weight:700', text: user?.displayName || '내 계정' }),
      user?.email ? el('div', { class: 'pack-desc', text: user.email }) : null,
      el('div', {
        style: 'margin-top:10px;font-size:14px',
        html: `보유 크레딧 <b style="color:var(--brand-strong)">${
          state.credits == null ? '-' : state.credits
        }p</b>`,
      }),
    ]),
  );

  root.appendChild(el('div', { class: 'section-title', text: '크레딧' }));
  root.appendChild(
    el('div', {}, [
      row('💎', '크레딧 충전', '노래 한 곡에 10크레딧', () => openChargeSheet()),
      row('🧾', '크레딧 내역', '충전·사용 기록 보기', () => nav.push('credits')),
      row('🎟️', '쿠폰 등록', '받은 시리얼로 크레딧 받기', () => openCouponSheet()),
      row('👯', '친구 초대', '친구가 첫 곡을 만들면 +10크레딧', () => nav.push('invite')),
    ]),
  );

  root.appendChild(el('div', { class: 'section-title', text: '약관' }));
  root.appendChild(
    el('div', {}, [
      row('📄', '이용약관', null, () => nav.push('legal', { doc: 'terms' })),
      row('🔒', '개인정보처리방침', null, () => nav.push('legal', { doc: 'privacy' })),
      row('💳', '환불 및 청약철회 정책', null, () => nav.push('legal', { doc: 'refund' })),
    ]),
  );

  root.appendChild(el('div', { class: 'section-title', text: '계정' }));
  root.appendChild(
    el('div', {}, [
      row('🚪', '로그아웃', null, confirmLogout),
      row('⚠️', '회원 탈퇴', '크레딧이 소멸되고 되돌릴 수 없어요', () => openWithdrawSheet(), {
        danger: true,
      }),
    ]),
  );

  /* 문의처는 앱 안에서 완결되어야 해서 링크 대신 텍스트로 둔다. */
  const info = env.describe();
  root.appendChild(
    el('div', { class: 'hint', style: 'text-align:center;margin-top:24px' }, [
      el('div', { text: '문의 diss4u.official@gmail.com' }),
      el('div', { text: `${info.platform} · ${info.operational}` }),
    ]),
  );
}
