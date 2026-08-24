/**
 * 채널마다 응답 모양이 다 다르므로, 어댑터는 반드시 아래 두 형태로만 값을 돌려준다.
 * 집계·대시보드는 이 스키마만 알면 되고 채널 사정은 어댑터 안에 갇힌다.
 *
 * Product = 채널에 올라간 상품 1건, options[] 가 실제 판매 최소 단위
 * OrderLine = 주문의 옵션 1줄  (= 스마트스토어 '상품주문', 쿠팡 'orderItem')
 */

/** 채널 상태값이 제각각이라 5개로 접는다. */
export const STATUS = {
  ORDERED: 'ordered',     // 결제완료 · 신규주문
  SHIPPING: 'shipping',   // 발송처리 · 배송중
  DONE: 'done',           // 배송완료 · 구매확정
  CANCELED: 'canceled',   // 취소
  RETURNED: 'returned',   // 반품 · 교환
};

export const isNegative = (s) => s === STATUS.CANCELED || s === STATUS.RETURNED;

export function product({
  channel, productId, name, sellerProductCode = '', status = '', url = '', options = [],
}) {
  return {
    channel,
    productId: String(productId),
    name: String(name ?? '').trim(),
    sellerProductCode: String(sellerProductCode ?? ''),
    status: String(status ?? ''),
    url,
    options: options.map(option),
    optionCount: options.length,
  };
}

export function option({ optionId, optionName = '', optionCode = '', price = 0, stock = null, status = '' }) {
  return {
    optionId: String(optionId),
    optionName: String(optionName ?? '').trim(),
    optionCode: String(optionCode ?? ''),
    price: num(price),
    stock: stock === null || stock === undefined ? null : num(stock),
    status: String(status ?? ''),
    spec: extractSpec(optionName),
  };
}

export function orderLine({
  channel, orderId, lineId, orderedAt, productId, productName,
  optionId = '', optionName = '', optionCode = '',
  quantity = 0, amount = 0, status,
}) {
  return {
    channel,
    orderId: String(orderId),
    lineId: String(lineId),
    orderedAt: toIso(orderedAt),
    date: toIso(orderedAt).slice(0, 10),
    productId: String(productId ?? ''),
    productName: String(productName ?? '').trim(),
    optionId: String(optionId ?? ''),
    optionName: String(optionName ?? '').trim(),
    optionCode: String(optionCode ?? ''),
    quantity: num(quantity),
    amount: num(amount),
    status,
    negative: isNegative(status),
  };
}

/** 옵션명에서 수량·단위를 뽑는다. sales-report 의 매칭 규칙과 같은 정규식을 쓴다. */
const SPEC_RE = /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|개입|개|입|과|봉|팩|미)/i;
export function extractSpec(name) {
  const m = SPEC_RE.exec(String(name ?? ''));
  return m ? { value: Number(m[1]), unit: m[2].toLowerCase() } : null;
}

export const num = (v) => {
  const n = Number(String(v ?? 0).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** 채널이 KST 로컬 문자열('2026-08-24 09:00:00')을 주는 경우가 많아 KST 로 해석한다. */
export function toIso(v) {
  if (!v) return new Date().toISOString();
  if (v instanceof Date) return v.toISOString();
  const s = String(v).trim();
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(s)) return new Date(s).toISOString();
  const d = s.replace(' ', 'T');
  const withSec = /T\d{2}:\d{2}$/.test(d) ? `${d}:00` : d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(withSec)) return new Date(`${withSec}T00:00:00+09:00`).toISOString();
  if (/^\d{14}$/.test(s)) {
    const p = [s.slice(0, 4), s.slice(4, 6), s.slice(6, 8), s.slice(8, 10), s.slice(10, 12), s.slice(12, 14)];
    return new Date(`${p[0]}-${p[1]}-${p[2]}T${p[3]}:${p[4]}:${p[5]}+09:00`).toISOString();
  }
  const parsed = new Date(`${withSec}+09:00`);
  return Number.isNaN(parsed.getTime()) ? new Date(s).toISOString() : parsed.toISOString();
}

/** 오늘(KST) 기준 YYYY-MM-DD */
export function kstToday(offsetDays = 0) {
  const now = new Date(Date.now() + 9 * 3600_000 + offsetDays * 86400_000);
  return now.toISOString().slice(0, 10);
}
