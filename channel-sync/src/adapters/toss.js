import { credentials } from '../config.js';

/**
 * 토스쇼핑 셀러 직연동 API.
 * 셀러센터 '내 연동 키' 에서 키를 받은 뒤, 개발 가이드(shopping-docs.toss.im/dev)의
 * 상품목록 / 주문조회 스펙에 맞춰 채우면 된다.
 */
export default {
  channel: 'toss',
  label: '토스쇼핑',
  credentialKeys: ['TOSS_SHOPPING_API_KEY'],
  pending: '토스쇼핑 셀러센터에서 연동 키 발급 필요',

  async collect() {
    const { missing } = credentials(this.credentialKeys);
    throw new Error(`토스쇼핑 어댑터 미구현 — 연동 키(${missing.join(', ')}) 확보 후 작성`);
  },
};
