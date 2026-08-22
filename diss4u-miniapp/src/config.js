/* 미니앱 전역 설정. 값은 웹(diss4u.com)과 같은 백엔드를 가리킨다. */

export const PROXY_URL = 'https://chinolsong-proxy.onrender.com';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAD2galkT_bYbtmOG6TSVIBdlLtByVbXZU',
  authDomain: 'chinolsong.firebaseapp.com',
  projectId: 'chinolsong',
  storageBucket: 'chinolsong.firebasestorage.app',
  messagingSenderId: '167000575928',
  appId: '1:167000575928:web:b030d86b87f15ae2c9894d',
};

/** 곡 1개에 필요한 크레딧. 서버 /me 가 알려주는 값이 우선이고 이건 폴백. */
export const COST_PER_SONG = 10;

/*
 * 인앱 상품 SKU.
 *
 * ⚠️ 콘솔에 인앱 상품을 아직 등록하지 않았다. 등록 후 여기 sku 를 실제 값으로 맞춰야 한다.
 * IAP.getProductItemList() 가 돌려주는 목록이 정답이고, 아래 표는 목록에 없는 상품을
 * 숨기고 정렬·문구를 붙이기 위한 로컬 메타데이터일 뿐이다.
 *
 * 가격은 웹과 다르게 가져간다. 앱인토스 정산율이 79.5%(앱마켓 15% + 토스 5% + 부가세 0.5%)
 * 라서 웹 기준(PortOne 영세 ~1%)으로 잡은 팩 구성을 그대로 옮기면 곡당 순이익이 무너진다.
 * 앱마켓 수수료가 30%로 오르면 한 번 더 조정해야 한다.
 */
export const CREDIT_PACKS = [
  { sku: 'diss4u_credit_10', credits: 10, label: '1곡', note: '가볍게 한 곡' },
  { sku: 'diss4u_credit_60', credits: 60, label: '6곡', note: '가장 많이 골라요', best: true },
  { sku: 'diss4u_credit_150', credits: 150, label: '15곡', note: '제일 저렴하게' },
];

/*
 * 전면 광고 그룹 ID.
 * ⚠️ 콘솔에서 광고 지면을 만든 뒤 채워야 한다. 비어 있으면 광고 기능을 끈 채로 동작한다.
 */
export const AD_GROUP_ID = '';
