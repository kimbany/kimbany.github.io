import { request } from '../core/http.js';
import { credentials, env } from '../config.js';
import { parseXml, asArray } from '../core/xml.js';
import { product, orderLine, STATUS, num } from '../core/normalize.js';

const HOST = 'https://api.11st.co.kr/rest';

/**
 * 11번가 셀러 API 는 개발가이드가 셀러오피스 로그인 뒤에만 열려서
 * 경로를 코드에 박지 않고 여기에 모아 두고 .env 로 덮어쓸 수 있게 했다.
 * 최초 연동 시 셀러오피스 > 오픈API 개발가이드의 실제 경로로 한 번 맞춰야 한다.
 */
const ENDPOINTS = {
  productList: env('ELEVENST_PRODUCT_PATH', '/prodservices/prodmarket'),
  productDetail: env('ELEVENST_PRODUCT_DETAIL_PATH', '/prodservices/product'),
  orderList: env('ELEVENST_ORDER_PATH', '/ordservices/complete'),
};

const call = (path, params, apiKey) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
  ).toString();
  return request(`${HOST}${path}${query ? `?${query}` : ''}`, {
    headers: { openapikey: apiKey, Accept: 'application/xml' },
    as: 'text',
    channel: 'elevenst',
    minIntervalMs: 400,
  });
};

/** XML 필드명이 API 버전마다 흔들려서 후보를 순서대로 훑는다. */
const pick = (obj, ...keys) => {
  for (const k of keys) if (obj?.[k] !== undefined && obj[k] !== '') return obj[k];
  return '';
};

/** 11번가 주문상태코드 상위 분류. 취소/반품은 코드 앞자리로 갈린다. */
function foldStatus(code = '') {
  const s = String(code);
  if (/^2/.test(s)) return STATUS.CANCELED;   // 201~ 취소
  if (/^3/.test(s)) return STATUS.RETURNED;   // 301~ 반품/교환
  if (s === '103' || s === '104') return STATUS.DONE;
  if (s === '102') return STATUS.SHIPPING;
  return STATUS.ORDERED;
}

const yyyymmdd = (d) => d.replace(/-/g, '');

export default {
  channel: 'elevenst',
  label: '11번가',
  credentialKeys: ['ELEVENST_API_KEY'],

  async collect({ from, to }) {
    const { values } = credentials(this.credentialKeys);
    const apiKey = values.ELEVENST_API_KEY;

    // ── 상품
    const productXml = await call(ENDPOINTS.productList, { }, apiKey);
    const productRoot = parseXml(productXml);
    const productNodes = asArray(
      productRoot?.Products?.Product ?? productRoot?.products?.product ?? productRoot?.ProductSearch?.Product,
    );

    const products = productNodes.map((p) => {
      const options = asArray(
        p?.ProductOptions?.ProductOption ?? p?.prdOptions?.prdOption ?? p?.options?.option,
      ).map((o) => ({
        optionId: pick(o, 'optCd', 'stckNo', 'optNo'),
        optionName: pick(o, 'colOptNm', 'optNm', 'optValNm'),
        optionCode: pick(o, 'sellerOptCd', 'optCd'),
        price: num(pick(o, 'optPrc', 'selPrc')),
        stock: num(pick(o, 'optStockQty', 'stockQty')) || null,
      }));
      return product({
        channel: 'elevenst',
        productId: pick(p, 'prdNo', 'productNo'),
        name: pick(p, 'prdNm', 'productName'),
        sellerProductCode: pick(p, 'sellerPrdCd', 'selPrdClfCd'),
        status: pick(p, 'selStat', 'prdStat'),
        options,
      });
    });

    // ── 주문 (11번가는 발주서 단위로 내려주고, 한 줄이 이미 옵션 단위다)
    const orderXml = await call(ENDPOINTS.orderList, {
      dateFrom: yyyymmdd(from), dateTo: yyyymmdd(to),
      startTime: `${yyyymmdd(from)}000000`, endTime: `${yyyymmdd(to)}235959`,
    }, apiKey);
    const orderRoot = parseXml(orderXml);
    const orderNodes = asArray(orderRoot?.Orders?.Order ?? orderRoot?.orders?.order ?? orderRoot?.ordersDetail?.order);

    const orders = orderNodes.map((o) => {
      const qty = num(pick(o, 'ordQty', 'orderQty'));
      const unit = num(pick(o, 'selPrc', 'ordPrc', 'sellPrice'));
      return orderLine({
        channel: 'elevenst',
        orderId: pick(o, 'ordNo', 'orderNo'),
        lineId: `${pick(o, 'ordNo', 'orderNo')}-${pick(o, 'ordPrdSeq', 'ordLineSeq') || '1'}`,
        orderedAt: pick(o, 'ordDt', 'orderDate', 'ordPrdDt'),
        productId: pick(o, 'prdNo', 'productNo'),
        productName: pick(o, 'prdNm', 'productName'),
        optionId: pick(o, 'optCd', 'stckNo'),
        optionName: pick(o, 'ordOptNm', 'optNm', 'orderOption') || '(단일)',
        optionCode: pick(o, 'sellerOptCd', 'sellerPrdCd'),
        quantity: qty,
        amount: num(pick(o, 'ordAmt', 'ordPrdAmt')) || unit * qty,
        status: foldStatus(pick(o, 'ordPrdStat', 'ordStat')),
      });
    });

    return { products, orders, raw: { products: productRoot, orders: orderRoot } };
  },
};
