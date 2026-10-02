import { withAliases } from "./common-fields";
import type { PlatformParser } from "./types";

/** Meta 광고 관리자 보고서 (일별 breakdown 포함 내보내기) */
export const metaParser: PlatformParser = {
  platform: "meta",
  label: "Meta Ads",
  fields: withAliases({
    date: ["day", "date", "일", "날짜", "reporting starts", "보고 시작"],
    // Meta 의 '광고'는 소재 단위
    ad: ["ad name", "광고 이름", "광고"],
  }),
  requiredFields: ["date", "campaign", "spend", "impressions", "clicks"],
  recommendedFields: ["conversions", "revenue", "adGroup", "ad"],
  postProcess: (r) => ({ ...r, orders: r.orders ?? r.conversions, creative: r.creative || r.ad || undefined }),
  guide: "광고 관리자 → 보고서 → 분석 기준 '일'로 나눈 뒤 CSV/XLSX 로 내보내세요. (캠페인 이름, 지출 금액, 노출, 링크 클릭, 구매, 구매 전환값)",
};
