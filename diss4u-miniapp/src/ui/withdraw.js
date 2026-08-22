/*
 * 회원 탈퇴.
 *
 * 서버가 계정을 비활성화하고 남은 크레딧을 소멸시킨다(forfeited 로 몇 포인트가
 * 날아갔는지 알려준다). 어뷰징 방지로 같은 계정 재가입이 막히므로, 되돌릴 수 없다는
 * 걸 확실히 알리고 한 번 더 확인받는다.
 */

import { el } from './dom.js';
import { open as openModal, close as closeModal } from './modal.js';
import { toast } from './toast.js';
import * as api from '../lib/api.js';
import * as auth from '../lib/auth.js';
import { state } from '../state.js';

export function openWithdrawSheet() {
  const remaining = state.credits;
  const paid = state.paidCredits;

  const warnings = [
    '만든 노래와 계정 정보가 모두 삭제돼요.',
    remaining ? `남아 있는 ${remaining}크레딧이 소멸되고 복구할 수 없어요.` : null,
    paid ? '충전하신 크레딧이 남아 있다면 탈퇴 전에 환불을 신청해주세요.' : null,
    '어뷰징 방지를 위해 같은 계정으로 다시 가입할 수 없어요.',
  ].filter(Boolean);

  const list = el('ul', { style: 'padding-left:18px;margin:4px 0' });
  for (const line of warnings) {
    list.appendChild(
      el('li', {
        style: 'font-size:13px;line-height:1.8;color:var(--text-dim);margin:4px 0',
        text: line,
      }),
    );
  }

  const confirmBox = el('input', { type: 'checkbox' });
  const confirmLine = el('label', { class: 'checkline' }, [
    confirmBox,
    el('span', { text: '위 내용을 확인했고, 탈퇴에 동의합니다.' }),
  ]);

  const cancel = el('button', { class: 'btn-secondary', type: 'button' }, ['취소']);
  cancel.addEventListener('click', () => closeModal());

  const submit = el('button', { class: 'btn-secondary btn-danger', type: 'button' }, ['탈퇴하기']);
  submit.disabled = true;
  confirmBox.addEventListener('change', () => {
    submit.disabled = !confirmBox.checked;
  });

  submit.addEventListener('click', async () => {
    submit.disabled = true;
    cancel.disabled = true;
    submit.textContent = '처리 중…';
    try {
      const res = await api.deleteAccount();
      // 탈퇴 후에는 로그인 상태를 반드시 끊는다. 안 그러면 죽은 토큰으로 계속 호출한다.
      await auth.logout();
      closeModal();
      toast(
        res.forfeited ? `탈퇴 처리됐어요. ${res.forfeited}크레딧이 소멸됐어요.` : '탈퇴 처리됐어요.',
        3200,
      );
    } catch (e) {
      toast(e.message || '탈퇴 처리에 실패했어요.');
      submit.disabled = false;
      cancel.disabled = false;
      submit.textContent = '탈퇴하기';
    }
  });

  return openModal({
    title: '정말 탈퇴하시겠어요?',
    subtitle: '이 작업은 되돌릴 수 없어요.',
    body: [
      list,
      confirmLine,
      el('div', { class: 'modal-actions' }, [cancel, submit]),
    ],
  });
}
