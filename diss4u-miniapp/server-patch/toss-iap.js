/*
 * 인앱결제 주문 검증 → 크레딧 적립.
 *
 * 클라이언트의 processProductGrant 가 이 엔드포인트를 부르고, 200 을 받아야
 * true 를 돌려준다. 토스가 30초 안에 결과를 요구하므로 여기서 오래 끌면 안 된다.
 *
 * 적립은 기존 /verify-payment 와 같은 함수(creditPaymentOnce)를 쓴다. 크레딧 풀이
 * 무료/유료로 나뉘어 있고 차감은 무료 먼저·환불은 역순이라는 규칙이 그 안에 있어서,
 * 여기서 따로 더하면 규칙이 깨진다. orderId 를 결제 식별자로 넘겨 중복 적립도 막는다.
 *
 * 필요한 환경변수
 *   TOSS_IAP_CERT_PATH   mTLS 클라이언트 인증서 (PEM). 콘솔에서 발급.
 *   TOSS_IAP_KEY_PATH    mTLS 클라이언트 키 (PEM)
 *   TOSS_IAP_CA_PATH     (선택) CA 체인
 */

import fs from 'node:fs';
import https from 'node:https';

const ORDER_STATUS_URL =
  'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/order/get-order-status';

/** 결제가 끝나 지급해도 되는 상태. */
const GRANTABLE = new Set(['PURCHASED', 'PAYMENT_COMPLETED']);

let agent = null;

function mtlsAgent() {
  if (agent) return agent;
  const certPath = process.env.TOSS_IAP_CERT_PATH;
  const keyPath = process.env.TOSS_IAP_KEY_PATH;
  if (!certPath || !keyPath) return null;

  agent = new https.Agent({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    ca: process.env.TOSS_IAP_CA_PATH ? fs.readFileSync(process.env.TOSS_IAP_CA_PATH) : undefined,
    keepAlive: true,
  });
  return agent;
}

/**
 * 주문 상태를 조회한다. mTLS 필수.
 * Node 의 fetch(undici)는 dispatcher 를 쓰므로, 여기서는 https 모듈로 직접 요청한다.
 */
export function getOrderStatus(orderId, userKey) {
  const ag = mtlsAgent();
  if (!ag) return Promise.reject(new Error('mTLS 인증서가 설정되지 않았어요'));

  const payload = JSON.stringify({ orderId });
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  };
  if (userKey) headers['x-toss-user-key'] = String(userKey);

  return new Promise((resolve, reject) => {
    const req = https.request(
      ORDER_STATUS_URL,
      { method: 'POST', headers, agent: ag, timeout: 10_000 },
      (res) => {
        let text = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          text += chunk;
        });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`주문 조회 실패 (${res.statusCode}): ${text.slice(0, 200)}`));
            return;
          }
          try {
            const json = JSON.parse(text);
            resolve(json.success || json.result || json);
          } catch (e) {
            reject(new Error(`주문 조회 응답 파싱 실패: ${e.message}`));
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('주문 조회 시간 초과')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * @param {object} deps
 * @param {(res:any, status:number, body:object)=>void} deps.send
 * @param {(req:any)=>Promise<object>} deps.readBody
 * @param {(req:any)=>Promise<string|null>} deps.verifyAuth
 * @param {(uid:string, paymentId:string, credits:number, amount:number)=>Promise<any>} deps.creditPaymentOnce
 * @param {(uid:string, amount:number, pool:string, reason:string)=>Promise<any>} deps.logCredit
 * @param {(uid:string, amount:number, reason:string)=>Promise<any>} deps.markLastGrant
 * @param {()=>boolean} deps.creditsEnabled
 * @param {Record<string, {credits:number, price:number}>} deps.skuTable SKU → 지급 크레딧
 */
export function createTossIapVerifyHandler({
  send,
  readBody,
  verifyAuth,
  creditPaymentOnce,
  logCredit,
  markLastGrant,
  creditsEnabled,
  skuTable,
}) {
  return async function handleTossIapVerify(req, res) {
    if (!creditsEnabled()) {
      return send(res, 400, { error: 'credits_disabled', message: '크레딧 시스템이 꺼져 있어요' });
    }

    const uid = await verifyAuth(req);
    if (!uid) return send(res, 401, { error: 'auth_required', message: '로그인이 필요해요' });

    const body = await readBody(req);
    const orderId = body?.orderId && String(body.orderId);
    if (!orderId) return send(res, 400, { error: 'no_order_id', message: '주문 정보가 없어요' });

    let order;
    try {
      order = await getOrderStatus(orderId);
    } catch (e) {
      return send(res, 502, { error: 'verify_failed', message: '결제 확인에 실패했어요', detail: e.message });
    }

    const status = String(order?.status || '').toUpperCase();

    if (status === 'ORDER_IN_PROGRESS') {
      // 아직 진행 중. 클라가 재시도하거나 getPendingOrders 로 복구한다.
      return send(res, 202, { error: 'pending', message: '결제 승인 대기 중이에요', status });
    }
    if (!GRANTABLE.has(status)) {
      return send(res, 402, {
        error: 'not_paid',
        message: '결제가 완료되지 않았어요',
        status,
        reason: order?.reason || null,
      });
    }

    // 주문에 적힌 SKU 를 믿는다. 클라가 보낸 sku 는 참고만 하고 지급 기준으로 쓰지 않는다.
    const sku = order?.sku || body?.sku;
    const pack = skuTable[sku];
    if (!pack) {
      return send(res, 400, { error: 'unknown_sku', message: '알 수 없는 상품이에요', sku });
    }

    // orderId 를 결제 식별자로 넘겨 중복 적립을 막는다(웹의 paymentId 자리와 같은 역할).
    const result = await creditPaymentOnce(uid, `toss_iap:${orderId}`, pack.credits, pack.price);
    if (!result.already) {
      await logCredit(uid, pack.credits, 'paid', 'iap');
      await markLastGrant(uid, pack.credits, 'iap');
    }

    return send(res, 200, {
      ok: true,
      credited: result.already ? 0 : pack.credits,
      already: result.already,
      credits: result.credits,
      sku,
      orderId,
    });
  };
}
