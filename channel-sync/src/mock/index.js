import { product, orderLine, STATUS } from '../core/normalize.js';

/**
 * 키 없이 파이프라인(정규화 → 집계 → 뷰어)을 끝까지 돌려보기 위한 가짜 응답.
 * 실제 채널 응답을 흉내 내는 게 아니라, 어댑터가 돌려줘야 하는 '정규화된 결과'를 만든다.
 */
const CATALOG = [
  { name: '한라봉 선물세트', code: 'HAL', options: ['3kg (9~12과)', '5kg (15~18과)', '10kg (30~35과)'] },
  { name: '제주 감귤 가정용', code: 'GAM', options: ['3kg', '5kg', '10kg'] },
  { name: '천혜향 실속형', code: 'CHN', options: ['2kg (6~8과)', '4kg (12~16과)'] },
  { name: '레드향 프리미엄', code: 'RED', options: ['3kg', '5kg'] },
];

// 채널마다 물량이 다르게 보이도록 고정 배수를 준다 (실행마다 값이 흔들리면 눈으로 검증하기 어렵다).
const WEIGHT = { coupang: 7, smartstore: 5, elevenst: 3, cafe24: 2, esm: 4, toss: 1 };

export function mockCollect(channel, { from, to }) {
  const weight = WEIGHT[channel] ?? 2;

  const products = CATALOG.map((c, pi) => product({
    channel,
    productId: `${channel}-${c.code}`,
    name: c.name,
    sellerProductCode: c.code,
    status: '판매중',
    options: c.options.map((label, oi) => ({
      optionId: `${channel}-${c.code}-${oi}`,
      optionName: label,
      optionCode: `${c.code}-${oi}`,
      price: 19_000 + oi * 11_000 + pi * 2_000,
      stock: 40 + oi * 13,
    })),
  }));

  const orders = [];
  let seq = 0;
  for (const p of products) {
    for (const o of p.options) {
      const qty = ((seq * 3 + weight) % 5) + 1;
      seq++;
      orders.push(orderLine({
        channel,
        orderId: `${channel}-ORD-${1000 + seq}`,
        lineId: `${channel}-ORD-${1000 + seq}-1`,
        orderedAt: `${to}T10:${String(seq * 7 % 60).padStart(2, '0')}:00+09:00`,
        productId: p.productId,
        productName: p.name,
        optionId: o.optionId,
        optionName: o.optionName,
        optionCode: o.optionCode,
        quantity: qty,
        amount: o.price * qty,
        status: seq % 4 === 0 ? STATUS.DONE : STATUS.ORDERED,
      }));
      // 열 건에 한 번쯤 취소가 섞이는 상황도 집계에서 확인할 수 있어야 한다.
      if (seq % 9 === 0) {
        orders.push(orderLine({
          channel,
          orderId: `${channel}-ORD-${1000 + seq}`,
          lineId: `${channel}-ORD-${1000 + seq}-C`,
          orderedAt: `${from}T14:00:00+09:00`,
          productId: p.productId,
          productName: p.name,
          optionId: o.optionId,
          optionName: o.optionName,
          optionCode: o.optionCode,
          quantity: 1,
          amount: o.price,
          status: STATUS.CANCELED,
        }));
      }
    }
  }

  return { products, orders, raw: { mock: true } };
}
