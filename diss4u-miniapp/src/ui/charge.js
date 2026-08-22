/*
 * 크레딧 충전 시트.
 *
 * 웹의 PortOne 결제 모달을 대체한다. 상품 목록은 콘솔에 등록되고 노출 ON 인 것만
 * IAP.getProductItemList() 로 내려오므로, 그 목록을 정답으로 삼고 config 의
 * CREDIT_PACKS 는 정렬·설명 문구를 붙이는 용도로만 쓴다.
 *
 * 결제 중 음악 일시정지는 iap.purchase() 안에서 처리한다(체크리스트 필수).
 */

import { el } from './dom.js';
import { open as openModal, close as closeModal } from './modal.js';
import { toast } from './toast.js';
import { CREDIT_PACKS } from '../config.js';
import * as iap from '../lib/iap.js';
import * as api from '../lib/api.js';
import { setCredits } from '../state.js';

function meta(sku) {
  return CREDIT_PACKS.find((p) => p.sku === sku) || null;
}

function formatPrice(product) {
  // SDK 가 표시용 문자열을 주면 그대로 쓰고, 없으면 숫자를 원화로 찍는다.
  if (product.displayPrice) return product.displayPrice;
  const amount = product.price ?? product.amount;
  if (typeof amount !== 'number') return '';
  try {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  } catch {
    return `${amount.toLocaleString('ko-KR')}원`;
  }
}

async function refreshCredits() {
  try {
    setCredits(await api.fetchMe());
  } catch {
    /* 잔액 갱신 실패는 결제 결과를 바꾸지 않는다. */
  }
}

export function openChargeSheet() {
  const body = el('div', {});
  body.appendChild(el('div', { class: 'empty', text: '상품을 불러오는 중…' }));

  const sheet = openModal({
    title: '크레딧 충전',
    subtitle: '노래 한 곡에 10크레딧이 들어요.',
    body,
  });

  if (!iap.isSupported()) {
    body.innerHTML = '';
    body.appendChild(
      el('div', {
        class: 'empty',
        html: '이 환경에서는 결제를 할 수 없어요.<br>토스 앱에서 열어주세요.',
      }),
    );
    return sheet;
  }

  iap
    .listProducts()
    .then((products) => {
      body.innerHTML = '';
      if (!products.length) {
        body.appendChild(
          el('div', {
            class: 'empty',
            html: '지금은 충전 상품이 없어요.<br>잠시 후 다시 시도해주세요.',
          }),
        );
        return;
      }

      // config 에 적어둔 순서를 따르고, 목록에만 있는 상품은 뒤에 붙인다.
      const order = new Map(CREDIT_PACKS.map((p, i) => [p.sku, i]));
      const sorted = [...products].sort(
        (a, b) => (order.get(a.sku) ?? 999) - (order.get(b.sku) ?? 999),
      );

      for (const product of sorted) {
        const info = meta(product.sku);
        const name = info ? `${info.label} 팩` : product.displayName || product.sku;

        const btn = el('button', { class: 'pack', type: 'button' }, [
          el('div', {}, [
            el('div', { class: 'pack-name' }, [
              name,
              info?.best ? el('span', { class: 'pack-badge', text: 'BEST' }) : null,
            ]),
            el('div', {
              class: 'pack-desc',
              text: info ? `${info.credits}크레딧 · ${info.note}` : product.description || '',
            }),
          ]),
          el('div', { class: 'pack-price', text: formatPrice(product) }),
        ]);

        btn.addEventListener('click', async () => {
          body.querySelectorAll('.pack').forEach((p) => {
            p.disabled = true;
          });
          try {
            const result = await iap.purchase(product.sku);
            if (result.status === 'granted') {
              await refreshCredits();
              closeModal();
              toast('충전이 완료됐어요! 🎉');
              return;
            }
            if (result.status === 'pending') {
              await refreshCredits();
              closeModal();
              toast('결제는 됐어요. 크레딧 반영이 조금 늦어질 수 있어요.', 3200);
              return;
            }
            // 사용자가 결제창을 닫은 경우. 조용히 시트만 되살린다.
          } catch (e) {
            toast(e.message || '결제하지 못했어요.');
          } finally {
            body.querySelectorAll('.pack').forEach((p) => {
              p.disabled = false;
            });
          }
        });

        body.appendChild(btn);
      }

      body.appendChild(
        el('div', {
          class: 'hint',
          style: 'margin-top:14px;text-align:center',
          text: '결제는 토스 인앱결제로 진행돼요. 환불은 토스 결제내역에서 신청할 수 있어요.',
        }),
      );
    })
    .catch(() => {
      body.innerHTML = '';
      body.appendChild(el('div', { class: 'empty', text: '상품을 불러오지 못했어요.' }));
    });

  return sheet;
}
