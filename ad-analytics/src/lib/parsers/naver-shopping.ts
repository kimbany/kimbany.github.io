import { withAliases } from "./common-fields";
import type { PlatformParser } from "./types";

/** 네이버 검색광고 > 쇼핑검색광고 보고서 (상품/소재 단위) */
export const naverShoppingParser: PlatformParser = {
  platform: "naver_shopping",
  label: "Naver Shopping Search Ads",
  fields: withAliases({
    // 쇼핑검색광고의 '소재'는 상품이다
    product: ["상품명", "상품", "쇼핑상품명", "소재명", "소재", "광고소재", "product", "product name"],
    ad: ["소재 id", "광고 id", "ad id"],
    conversions: ["구매완료 전환수", "구매완료수", "전환수", "총 전환수", "conversions"],
    revenue: ["구매완료 전환매출액(원)", "구매완료 전환매출액", "전환매출액(원)", "총 전환매출액(원)", "전환매출액", "매출", "revenue"],
    orders: ["구매완료 전환수", "구매완료수", "주문수", "orders"],
  }),
  requiredFields: ["date", "spend", "impressions", "clicks"],
  recommendedFields: ["product", "campaign", "conversions", "revenue"],
  postProcess: (r) => ({ ...r, product: r.product || r.ad, orders: r.orders ?? r.conversions }),
  guide: "네이버 검색광고 → 보고서 → 다차원 보고서에서 '일별 + 캠페인 + 광고그룹 + 소재(상품)' 기준으로 다운로드하세요.",
};
