/**
 * 몽프루이 적립금 정책 — 회원등급별 구매 적립 + 리뷰 적립 (2026-10 현재, 카페24 회원등급 설정 기준).
 * 등급 정책이 바뀌면 여기만 고치면 된다 — 수집기와 points.html 이 같이 읽는다.
 *
 * rate: 구매 적립률 (0.015 = 1.5%), minOrder: 이 금액 이상 구매 시 적립
 * level: 1 이 최하위
 */
export const TIERS = [
  { level: 1, name: 'MonFruit', rate: 0, minOrder: 0 },
  { level: 2, name: 'SILVER', rate: 0.015, minOrder: 10_000 },
  { level: 3, name: 'GOLD', rate: 0.02, minOrder: 10_000 },
  { level: 4, name: 'DIAMOND', rate: 0.025, minOrder: 10_000 },
  { level: 5, name: 'VIP', rate: 0.03, minOrder: 10_000 },
];

/**
 * 리뷰 작성 적립 (자동지급, 등급과 무관).
 * 판매가 1,000원 미만 상품은 리뷰 적립 대상에서 제외.
 */
export const REVIEW_REWARDS = {
  text: 500,        // 텍스트 리뷰
  photoVideo: 1000, // 사진 · 동영상 리뷰
  minPrice: 1000,   // 이 판매가 미만이면 지급 제외
  auto: true,
};

/** 카페24 group_name 은 대소문자·공백이 섞여 올 수 있어 느슨하게 맞춘다. */
export function tierOf(groupName) {
  const key = String(groupName ?? '').replace(/\s+/g, '').toLowerCase();
  return TIERS.find((t) => t.name.toLowerCase() === key) ?? null;
}

/** 표시용: "1만원 이상 1.5%" / "적립 없음" */
export function tierRule(t) {
  if (!t) return '';
  if (!t.rate) return '적립 없음';
  return `${(t.minOrder / 10_000).toLocaleString('ko-KR')}만원 이상 ${(t.rate * 100).toFixed(1).replace(/\.0$/, '')}%`;
}
