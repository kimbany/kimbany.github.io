/*
 * 인앱결제.
 *
 * 웹의 PortOne(카드/PayPal/카카오페이)을 전부 대체한다. 앱인토스는 외부 결제창으로
 * 내보내는 걸 금지하므로 IAP 말고는 선택지가 없다.
 *
 * 지급 규칙에서 주의할 점 두 가지.
 *
 * 1) processProductGrant 는 30초 안에 true 를 돌려줘야 한다. 늦으면 사용자에게
 *    환불 안내가 뜬다. 서버 검증(mTLS 주문조회)이 그 안에 끝나야 하므로
 *    타임아웃을 걸고, 시간을 넘기면 false 를 돌려 토스가 환불 흐름을 타게 둔다.
 *    false 를 돌려도 결제 자체가 살아 있으면 getPendingOrders() 로 다음 실행 때 복구된다.
 *
 * 2) 크레딧은 무료/유료 풀이 나뉘어 있다(freeCredits/paidCredits). 차감은 무료 먼저,
 *    환불은 역순이라는 규칙을 깨면 안 된다. 그래서 적립을 클라이언트에서 하지 않고
 *    서버 /toss/iap/verify 한 곳에서만 한다. 클라는 orderId 를 넘길 뿐이다.
 */

import { IAP } from '@apps-in-toss/web-framework';
import { verifyIapOrder } from './api.js';
import * as audio from './audio.js';

/** processProductGrant 예산. 토스 제한(30초)보다 짧게 잡아 여유를 남긴다. */
const GRANT_TIMEOUT_MS = 25_000;

export function isSupported() {
  try {
    return (
      typeof IAP?.createOneTimePurchaseOrder?.isSupported === 'function' &&
      IAP.createOneTimePurchaseOrder.isSupported()
    );
  } catch {
    return false;
  }
}

/** 콘솔에 등록되고 노출 ON 인 상품만 돌아온다. */
export async function listProducts() {
  const res = await IAP.getProductItemList();
  return res?.products ?? [];
}

function withTimeout(promise, ms) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, reason: 'timeout' });
    }, ms);
    promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ ok: true, value });
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ ok: false, reason: 'error', error });
      },
    );
  });
}

/**
 * 결제를 시작한다.
 *
 * 결제창이 뜨는 동안 재생 중인 노래를 멈춘다(체크리스트 필수 항목). 결제가 끝나면
 * 원래 재생 중이었던 경우에만 다시 튼다.
 *
 * @returns {Promise<{status:'granted'|'pending'|'cancelled', orderId?:string}>}
 */
export function purchase(sku) {
  return new Promise((resolve, reject) => {
    const releaseAudio = audio.suspend();
    let cleanup = () => {};
    let outcome = null;
    let finished = false;

    const finish = (fn, arg) => {
      if (finished) return;
      finished = true;
      releaseAudio();
      try {
        cleanup();
      } catch {
        /* cleanup 이 두 번 불려도 문제 없도록 삼킨다. */
      }
      fn(arg);
    };

    try {
      cleanup = IAP.createOneTimePurchaseOrder({
        options: {
          sku,
          processProductGrant: async ({ orderId }) => {
            // 서버가 토스 주문조회로 결제를 확인하고 크레딧을 적립한다.
            const result = await withTimeout(verifyIapOrder(orderId, sku), GRANT_TIMEOUT_MS);
            if (result.ok) {
              outcome = { status: 'granted', orderId };
              return true;
            }
            // 시간 초과·서버 오류. 다음 실행 때 getPendingOrders 로 복구한다.
            outcome = { status: 'pending', orderId };
            return false;
          },
        },
        onEvent: (event) => {
          if (event?.type === 'success') {
            finish(resolve, outcome ?? { status: 'pending' });
            return;
          }
          finish(resolve, outcome ?? { status: 'cancelled' });
        },
        onError: (error) => {
          finish(reject, error instanceof Error ? error : new Error(String(error)));
        },
      });
    } catch (e) {
      finish(reject, e instanceof Error ? e : new Error(String(e)));
    }
  });
}

/**
 * 앱 재실행 시 미지급 주문을 복구한다.
 *
 * 지급에 성공한 주문만 completeProductGrant 로 닫는다. 서버 검증이 실패한 주문을
 * 닫아버리면 결제는 됐는데 크레딧은 없는 상태로 영영 남는다.
 *
 * @returns {Promise<{recovered:number, failed:number}>}
 */
export async function restorePendingOrders() {
  let orders = [];
  try {
    const res = await IAP.getPendingOrders();
    orders = res?.orders ?? [];
  } catch {
    return { recovered: 0, failed: 0 };
  }

  let recovered = 0;
  let failed = 0;
  for (const order of orders) {
    try {
      await verifyIapOrder(order.orderId, order.sku);
      await IAP.completeProductGrant({ params: { orderId: order.orderId } });
      recovered += 1;
    } catch {
      // 다음 실행에서 다시 시도한다. 주문은 열어둔 채로 남긴다.
      failed += 1;
    }
  }
  return { recovered, failed };
}
