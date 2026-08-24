import { createHmac } from 'node:crypto';
import { request, paginate } from '../core/http.js';
import { credentials } from '../config.js';
import { product, orderLine, STATUS, num } from '../core/normalize.js';
import { log } from '../core/log.js';

const HOST = 'https://api-gateway.coupang.com';
const PRODUCTS = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products';
const ORDERS = (vendorId) => `/v2/providers/openapi/apis/api/v4/vendors/${vendorId}/ordersheets`;

/** 쿠팡 CEA 서명: signed-date + METHOD + path + query 를 secret 으로 HMAC-SHA256. */
function authorize(method, path, query, { accessKey, secretKey }) {
  const signedDate = `${new Date().toISOString().slice(2, 19).replace(/[:-]/g, '')}Z`;
  const signature = createHmac('sha256', secretKey)
    .update(signedDate + method + path + query)
    .digest('hex');
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`;
}

function call(method, path, params, creds) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
  ).toString();
  return request(`${HOST}${path}${query ? `?${query}` : ''}`, {
    method,
    headers: { Authorization: authorize(method, path, query, creds), 'Content-Type': 'application/json;charset=UTF-8' },
    channel: 'coupang',
    minIntervalMs: 350,
  });
}

/** 쿠팡 주문 상태를 공통 5분류로 접는다. */
const ORDER_STATUS = {
  ACCEPT: STATUS.ORDERED,
  INSTRUCT: STATUS.ORDERED,
  DEPARTURE: STATUS.SHIPPING,
  DELIVERING: STATUS.SHIPPING,
  FINAL_DELIVERY: STATUS.DONE,
  NONE_TRACKING: STATUS.SHIPPING,
};

export default {
  channel: 'coupang',
  label: '쿠팡',
  credentialKeys: ['COUPANG_ACCESS_KEY', 'COUPANG_SECRET_KEY', 'COUPANG_VENDOR_ID'],

  async collect({ from, to, withOptions = true, maxProducts = 500 }) {
    const { values } = credentials(this.credentialKeys);
    const creds = { accessKey: values.COUPANG_ACCESS_KEY, secretKey: values.COUPANG_SECRET_KEY };
    const vendorId = values.COUPANG_VENDOR_ID;

    // ── 상품: 목록에는 옵션이 없어서 건별 상세를 한 번 더 부른다.
    const listed = await paginate(async (nextToken) => {
      const res = await call('GET', PRODUCTS, { vendorId, nextToken, maxPerPage: 50 }, creds);
      return { items: res?.data ?? [], next: res?.nextToken || null };
    });

    const targets = listed.slice(0, maxProducts);
    if (listed.length > targets.length) {
      log.warn(`쿠팡 상품 ${listed.length}건 중 ${targets.length}건만 옵션 조회 (maxProducts 상한)`);
    }

    const products = [];
    for (const item of targets) {
      let options = [];
      if (withOptions) {
        const detail = await call('GET', `${PRODUCTS}/${item.sellerProductId}`, {}, creds);
        options = (detail?.data?.items ?? []).map((it) => ({
          optionId: it.vendorItemId ?? it.sellerProductItemId,
          optionName: it.itemName,
          optionCode: it.externalVendorSku ?? '',
          price: num(it.salePrice),
          stock: it.maximumBuyCount ?? null,
          status: it.itemStatus ?? '',
        }));
      }
      products.push(product({
        channel: 'coupang',
        productId: item.sellerProductId,
        name: item.sellerProductName,
        sellerProductCode: item.externalVendorSkuCode ?? '',
        status: item.statusName ?? '',
        options,
      }));
    }

    // ── 주문: 옵션(vendorItem) 단위로 펼친다. 조회 구간은 31일 이내여야 한다.
    const sheets = await paginate(async (nextToken) => {
      const res = await call('GET', ORDERS(vendorId), {
        createdAtFrom: from, createdAtTo: to, maxPerPage: 50, nextToken,
      }, creds);
      return { items: res?.data ?? [], next: res?.nextToken || null };
    });

    const orders = [];
    for (const sheet of sheets) {
      for (const it of sheet.orderItems ?? []) {
        const unit = num(it.orderPrice) - num(it.discountPrice);
        const shipped = num(it.shippingCount) - num(it.cancelCount);
        const base = {
          channel: 'coupang',
          orderId: sheet.orderId,
          orderedAt: sheet.orderedAt,
          productId: it.sellerProductId,
          productName: it.sellerProductName,
          optionId: it.vendorItemId,
          optionName: it.sellerProductItemName ?? it.vendorItemName,
          optionCode: it.externalVendorSkuCode ?? '',
        };
        if (shipped > 0) {
          orders.push(orderLine({
            ...base,
            lineId: `${sheet.orderId}-${it.vendorItemId}`,
            quantity: shipped,
            amount: unit * shipped,
            status: ORDER_STATUS[sheet.status] ?? STATUS.ORDERED,
          }));
        }
        if (num(it.cancelCount) > 0) {
          orders.push(orderLine({
            ...base,
            lineId: `${sheet.orderId}-${it.vendorItemId}-C`,
            quantity: num(it.cancelCount),
            amount: unit * num(it.cancelCount),
            status: STATUS.CANCELED,
          }));
        }
      }
    }

    return { products, orders, raw: { products: listed, orders: sheets } };
  },
};
