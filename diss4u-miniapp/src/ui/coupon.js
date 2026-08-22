/*
 * 쿠폰 등록.
 *
 * 서버가 코드를 대문자로 정규화하고 [A-Z2-9-] 만 허용한다(0/O/1/I 를 뺀 문자셋).
 * 같은 규칙을 입력창에서도 적용해, 서버까지 갔다가 형식 오류로 튕기는 걸 줄인다.
 */

import { el } from './dom.js';
import { open as openModal, close as closeModal } from './modal.js';
import { toast } from './toast.js';
import * as api from '../lib/api.js';
import { setCredits } from '../state.js';

/** 서버와 같은 문자셋. 혼동되는 0/O/1/I 는 애초에 발급되지 않는다. */
const ALLOWED = /[^A-Z2-9-]/g;

export function openCouponSheet(onDone) {
  const input = el('input', {
    class: 'input',
    type: 'text',
    placeholder: '예: ABCD-2345',
    maxlength: '32',
    autocapitalize: 'characters',
    autocomplete: 'off',
    spellcheck: 'false',
  });
  input.style.textAlign = 'center';
  input.style.letterSpacing = '2px';
  input.addEventListener('input', () => {
    const cleaned = input.value.toUpperCase().replace(ALLOWED, '');
    if (cleaned !== input.value) input.value = cleaned;
  });

  const error = el('div', {});
  const submit = el('button', { class: 'btn-primary', type: 'button' }, ['등록하기']);

  const showError = (msg) => {
    error.innerHTML = '';
    error.appendChild(el('div', { class: 'error-box', text: msg }));
  };

  submit.addEventListener('click', async () => {
    const code = input.value.trim();
    error.innerHTML = '';
    if (!code) {
      showError('쿠폰 시리얼을 입력해주세요.');
      return;
    }

    submit.disabled = true;
    submit.textContent = '확인 중…';
    try {
      const res = await api.redeemCoupon(code);
      // 서버가 적립 후 잔액을 그대로 돌려준다. 다시 /me 를 부를 필요가 없다.
      setCredits({
        enabled: true,
        credits: res.credits,
        freeCredits: res.freeCredits,
        paidCredits: res.paidCredits,
      });
      closeModal();
      toast(`쿠폰 등록 완료! +${res.granted}크레딧 🎁`);
      onDone?.();
    } catch (e) {
      showError(e.message || '쿠폰을 등록하지 못했어요.');
      submit.disabled = false;
      submit.textContent = '등록하기';
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit.click();
  });

  const sheet = openModal({
    title: '쿠폰 등록',
    subtitle: '받으신 쿠폰 시리얼을 입력하면 무료 크레딧으로 적립돼요.',
    body: [input, error, el('div', { style: 'margin-top:16px' }, [submit])],
  });

  setTimeout(() => input.focus(), 250);
  return sheet;
}
