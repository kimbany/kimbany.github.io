import { withAliases } from "./common-fields";
import type { PlatformParser } from "./types";

/** 네이버 검색광고 > 파워링크 (사이트검색광고) 키워드 보고서 */
export const naverPowerlinkParser: PlatformParser = {
  platform: "naver_powerlink",
  label: "Naver Powerlink",
  fields: withAliases({
    keyword: ["키워드", "키워드명", "keyword", "검색어"],
    conversions: ["구매완료 전환수", "전환수", "총 전환수", "conversions"],
    revenue: ["구매완료 전환매출액(원)", "전환매출액(원)", "총 전환매출액(원)", "전환매출액", "매출", "revenue"],
  }),
  requiredFields: ["date", "keyword", "spend", "impressions", "clicks"],
  recommendedFields: ["campaign", "adGroup", "conversions", "revenue"],
  postProcess: (r) => ({ ...r, orders: r.orders ?? r.conversions }),
  guide: "네이버 검색광고 → 보고서 → 다차원 보고서에서 '일별 + 캠페인 + 광고그룹 + 키워드' 기준으로 다운로드하세요.",
};
