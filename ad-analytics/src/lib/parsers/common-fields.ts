import type { CanonicalField } from "@/types/ad-data";
import type { FieldDefinition } from "./types";

/** 모든 플랫폼 공통 alias. 플랫폼 parser 에서 override / 확장한다. */
export const COMMON_FIELDS: FieldDefinition[] = [
  { field: "date", label: "날짜", type: "date", aliases: ["date", "day", "일", "일자", "날짜", "일별", "보고 시작", "reporting starts", "기간"] },
  { field: "campaign", label: "캠페인", type: "string", aliases: ["campaign name", "campaign", "캠페인 이름", "캠페인명", "캠페인"] },
  { field: "adGroup", label: "광고그룹", type: "string", aliases: ["ad set name", "ad set", "ad group", "광고 세트 이름", "광고 세트", "광고그룹명", "광고그룹", "광고 그룹"] },
  { field: "ad", label: "광고", type: "string", aliases: ["ad name", "ad", "광고 이름", "광고명", "소재명", "소재", "광고소재"] },
  { field: "product", label: "상품", type: "string", aliases: ["product", "product name", "상품명", "상품", "상품 이름", "쇼핑상품명"] },
  { field: "keyword", label: "키워드", type: "string", aliases: ["keyword", "키워드", "키워드명"] },
  { field: "spend", label: "광고비", type: "number", aliases: ["amount spent (krw)", "amount spent", "spend", "cost", "지출 금액 (krw)", "지출 금액", "총비용(vat포함,원)", "총비용(vat포함)", "총비용(원)", "총비용", "광고비", "비용"] },
  { field: "impressions", label: "노출수", type: "number", aliases: ["impressions", "노출수", "노출"] },
  { field: "clicks", label: "클릭수", type: "number", aliases: ["link clicks", "clicks (all)", "clicks", "링크 클릭", "클릭수", "클릭"] },
  { field: "conversions", label: "전환수", type: "number", aliases: ["purchases", "website purchases", "conversions", "구매", "구매완료 전환수", "구매완료수", "전환수", "총 전환수"] },
  { field: "revenue", label: "매출", type: "number", aliases: ["purchase conversion value", "purchases conversion value", "website purchases conversion value", "conversion value", "revenue", "구매 전환값", "구매완료 전환매출액(원)", "전환매출액(원)", "총 전환매출액(원)", "전환매출액", "매출"] },
  { field: "reach", label: "도달", type: "number", aliases: ["reach", "도달"] },
  { field: "frequency", label: "빈도", type: "number", aliases: ["frequency", "빈도"] },
  { field: "videoViews", label: "동영상 조회", type: "number", aliases: ["3-second video plays", "video plays", "동영상 3초 이상 재생", "동영상 재생"] },
  { field: "addToCart", label: "장바구니", type: "number", aliases: ["adds to cart", "add to cart", "장바구니에 담기", "장바구니 담기 수", "장바구니담기 전환수"] },
  { field: "landingPageViews", label: "랜딩페이지 조회", type: "number", aliases: ["landing page views", "랜딩 페이지 조회"] },
  { field: "orders", label: "주문수", type: "number", aliases: ["orders", "주문수", "구매건수"] },
  { field: "device", label: "기기", type: "string", aliases: ["device", "device platform", "기기", "디바이스", "pc/모바일 매체"] },
  { field: "placement", label: "노출 위치", type: "string", aliases: ["placement", "노출 위치", "광고 노출 위치", "매체"] },
  { field: "creative", label: "소재", type: "string", aliases: ["creative", "크리에이티브"] },
];

/** 공통 필드를 복사하면서 특정 필드의 alias 를 교체 */
export function withAliases(overrides: Partial<Record<CanonicalField, string[]>>): FieldDefinition[] {
  return COMMON_FIELDS.map((f) => (overrides[f.field] ? { ...f, aliases: overrides[f.field]! } : f));
}

export const FIELD_LABELS: Record<CanonicalField, string> = Object.fromEntries(
  COMMON_FIELDS.map((f) => [f.field, f.label]),
) as Record<CanonicalField, string>;
