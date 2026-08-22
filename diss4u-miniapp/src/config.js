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
 * ⚠️ 콘솔에 인앱 상품을 아직 등록하지 않았다. 등록 후 sku 가 다르면 여기를 맞춰야 한다.
 * IAP.getProductItemList() 가 돌려주는 목록이 정답이고, 아래 표는 목록에 없는 상품을
 * 숨기고 정렬·문구를 붙이기 위한 로컬 메타데이터다.
 *
 * 가격은 웹(proxy/server.js 의 CREDIT_PACKS)과 같게 맞췄다. 곡당 단가가
 * 1,000 → 817 → 742원으로 내려가서 사다리는 정상이다.
 *
 * 다만 정산율이 다르다. 웹은 PortOne 영세라 99%를 받는데 앱인토스는 79.5%(iOS) /
 * 80.9%(Android)다. 같은 값에 팔면 순이익이 팩당 24~26% 줄어든다.
 *   ₩1,000 1곡  → 순이익 820원(웹) / 625원(미니앱)
 *   ₩4,900 6곡  → 3,831원 / 2,876원
 *   ₩8,900 12곡 → 6,771원 / 5,036원
 * 앱마켓 수수료가 30%로 오르면 각각 475 / 2,141 / 3,701원까지 떨어진다.
 * 미니앱 가격을 웹보다 올릴지는 아직 정하지 않았다.
 */
export const CREDIT_PACKS = [
  { sku: 'diss4u_credit_10', credits: 10, songs: 1, price: 1000, label: '1곡', note: '가볍게 한 곡' },
  {
    sku: 'diss4u_credit_60',
    credits: 60,
    songs: 6,
    price: 4900,
    label: '6곡',
    note: '5곡 + 보너스 1곡',
    best: true,
  },
  {
    sku: 'diss4u_credit_120',
    credits: 120,
    songs: 12,
    price: 8900,
    label: '12곡',
    note: '10곡 + 보너스 2곡',
  },
];

/*
 * 전면 광고 그룹 ID.
 * ⚠️ 콘솔에서 광고 지면을 만든 뒤 채워야 한다. 비어 있으면 광고 기능을 끈 채로 동작한다.
 */
export const AD_GROUP_ID = '';
