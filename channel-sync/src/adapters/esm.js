import { credentials } from '../config.js';

/**
 * 옥션 / 지마켓 = ESM Trading API (etapi.gmarket.com).
 * 마스터ID 생성 + API 이용신청이 끝나야 인증키가 나와서, 키가 들어오면 채우는 자리만 잡아 둔다.
 * 응답 스키마 확인 후 coupang.js 와 같은 모양(products/orders)으로 돌려주면 나머지는 그대로 붙는다.
 */
export default {
  channel: 'esm',
  label: '옥션 & 지마켓',
  credentialKeys: ['ESM_API_KEY', 'ESM_MASTER_ID'],
  pending: 'ESM+ 마스터ID 생성 후 API 이용신청 → 인증키 발급 필요',

  async collect() {
    const { missing } = credentials(this.credentialKeys);
    throw new Error(`ESM 어댑터 미구현 — 인증키(${missing.join(', ')}) 확보 후 작성`);
  },
};
