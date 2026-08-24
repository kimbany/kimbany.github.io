import { request } from '../core/http.js';
import { credentials } from '../config.js';
import { product, orderLine, STATUS, num } from '../core/normalize.js';
import { log } from '../core/log.js';

const HOST = 'https://api.commerce.naver.com/external';

/**
 * 커머스API 서명은 bcrypt 라 Node 기본 모듈로는 못 만든다.
 * 이 어댑터에서만 쓰는 유일한 외부 의존성 — 없으면 안내하고 멈춘다.
 */
async function sign(clientId, clientSecret, timestamp) {
  let bcrypt;
  try { bcrypt = (await import('bcryptjs')).default; }
  catch { throw new Error('bcryptjs 가 필요합니다 — channel-sync 에서 `npm install` 을 먼저 실행하세요.'); }
  const hashed = bcrypt.hashSync(`${clientId}_${timestamp}`, clientSecret);
  return Buffer.from(hashed, 'utf-8').toString('base64');
}

async function getToken({ clientId, clientSecret }) {
  const timestamp = Date.now();
  const body = new URLSearchParams({
    client_id: clientId,
    timestamp: String(timestamp),
    client_secret_sign: await sign(clientId, clientSecret, timestamp),
    grant_type: 'client_credentials',
    type: 'SELF',
  });
  const res = await request(`${HOST}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    channel: 'smartstore',
  });
  if (!res?.access_token) throw new Error(`토큰 발급 실패: ${JSON.stringify(res)}`);
  return res.access_token;
}

const api = (token, path, { method = 'GET', body } = {}) =>
  request(`${HOST}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    channel: 'smartstore',
    minIntervalMs: 300,
  });

const ORDER_STATUS = {
  PAYMENT_WAITING: STATUS.ORDERED,
  PAYED: STATUS.ORDERED,
  DELIVERING: STATUS.SHIPPING,
  DELIVERED: STATUS.DONE,
  PURCHASE_DECIDED: STATUS.DONE,
  CANCELED: STATUS.CANCELED,
  CANCELED_BY_NOPAYMENT: STATUS.CANCELED,
  RETURNED: STATUS.RETURNED,
  EXCHANGED: STATUS.RETURNED,
};

/** 변경상태 조회는 한 번에 24시간까지만 허용돼서 하루 단위로 끊어 부른다. */
function dayWindows(from, to) {
  const windows = [];
  for (let d = new Date(`${from}T00:00:00+09:00`); d <= new Date(`${to}T00:00:00+09:00`); d = new Date(d.getTime() + 86400_000)) {
    const start = new Date(d.getTime());
    const end = new Date(d.getTime() + 86399_000);
    windows.push([kst(start), kst(end)]);
  }
  return windows;
}
const kst = (d) => new Date(d.getTime() + 9 * 3600_000).toISOString().replace('Z', '+09:00');

export default {
  channel: 'smartstore',
  label: '스마트스토어',
  credentialKeys: ['SMARTSTORE_CLIENT_ID', 'SMARTSTORE_CLIENT_SECRET'],

  async collect({ from, to, withOptions = true, maxProducts = 500 }) {
    const { values } = credentials(this.credentialKeys);
    const token = await getToken({
      clientId: values.SMARTSTORE_CLIENT_ID,
      clientSecret: values.SMARTSTORE_CLIENT_SECRET,
    });

    // ── 상품 목록 (채널상품 단위)
    const listed = [];
    for (let page = 1; page <= 50; page++) {
      const res = await api(token, '/v1/products/search', { method: 'POST', body: { page, size: 100 } });
      const contents = res?.contents ?? [];
      listed.push(...contents);
      if (contents.length < 100) break;
    }

    const targets = listed.slice(0, maxProducts);
    if (listed.length > targets.length) {
      log.warn(`스마트스토어 상품 ${listed.length}건 중 ${targets.length}건만 옵션 조회 (maxProducts 상한)`);
    }

    const products = [];
    for (const group of targets) {
      const channelProduct = group.channelProducts?.[0] ?? {};
      let options = [];
      if (withOptions && group.originProductNo) {
        try {
          const detail = await api(token, `/v2/products/origin-products/${group.originProductNo}`);
          const combos = detail?.originProduct?.detailAttribute?.optionInfo?.optionCombinations ?? [];
          options = combos.map((c) => ({
            optionId: c.id,
            optionName: [c.optionName1, c.optionName2, c.optionName3].filter(Boolean).join(' / '),
            optionCode: c.sellerManagerCode ?? '',
            price: num(channelProduct.salePrice) + num(c.price),
            stock: c.stockQuantity ?? null,
            status: c.usable === false ? 'DISABLED' : '',
          }));
        } catch (err) {
          log.warn(`스마트스토어 옵션 조회 실패 (${group.originProductNo}): ${err.message.split('\n')[0]}`);
        }
      }
      // 단일 상품(옵션 없음)도 집계 단위를 맞추기 위해 옵션 1개로 채운다.
      if (options.length === 0) {
        options = [{
          optionId: String(channelProduct.channelProductNo ?? group.originProductNo),
          optionName: '(단일)',
          optionCode: channelProduct.sellerManagementCode ?? '',
          price: num(channelProduct.salePrice),
          stock: channelProduct.stockQuantity ?? null,
        }];
      }
      products.push(product({
        channel: 'smartstore',
        productId: channelProduct.channelProductNo ?? group.originProductNo,
        name: channelProduct.name ?? '',
        sellerProductCode: channelProduct.sellerManagementCode ?? '',
        status: channelProduct.statusType ?? '',
        options,
      }));
    }

    // ── 주문: 변경분 ID 를 모은 뒤 상세를 배치로 조회한다 (상품주문 = 옵션 단위).
    const ids = new Set();
    for (const [start, end] of dayWindows(from, to)) {
      const res = await api(token, `/v1/pay-order/seller/product-orders/last-changed-statuses?lastChangedFrom=${encodeURIComponent(start)}&lastChangedTo=${encodeURIComponent(end)}`);
      for (const c of res?.data?.lastChangeStatuses ?? []) ids.add(c.productOrderId);
    }

    const orders = [];
    const idList = [...ids];
    const detailed = [];
    for (let i = 0; i < idList.length; i += 300) {
      const res = await api(token, '/v1/pay-order/seller/product-orders/query', {
        method: 'POST', body: { productOrderIds: idList.slice(i, i + 300) },
      });
      detailed.push(...(res?.data ?? []));
    }

    for (const row of detailed) {
      const po = row.productOrder ?? {};
      const status = ORDER_STATUS[po.productOrderStatus] ?? STATUS.ORDERED;
      orders.push(orderLine({
        channel: 'smartstore',
        orderId: row.order?.orderId ?? po.productOrderId,
        lineId: po.productOrderId,
        orderedAt: row.order?.orderDate ?? po.orderDate,
        productId: po.productId ?? po.originalProductId,
        productName: po.productName,
        optionId: po.productOption ? `${po.productId}:${po.productOption}` : po.productId,
        optionName: po.productOption ?? '(단일)',
        optionCode: po.optionManageCode ?? po.sellerProductCode ?? '',
        quantity: num(po.quantity),
        amount: num(po.totalPaymentAmount),
        status,
      }));
    }

    return { products, orders, raw: { products: listed, orders: detailed } };
  },
};
