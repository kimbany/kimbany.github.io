import type { PlatformId } from "@/types/ad-data";

export interface PlatformDefinition {
  id: PlatformId;
  label: string;
  shortLabel: string;
  /** 차트 식별 색상 (상태 색상 Green/Orange/Red 와 겹치지 않게 선택, CVD 검증 완료) */
  color: string;
  /** 이 플랫폼의 주 분석 단위 */
  primaryDimension: "campaign" | "product" | "keyword";
  description: string;
}

/**
 * 플랫폼 레지스트리. 신규 플랫폼(Google/Kakao/Coupang) 추가 시
 * 1) types/ad-data.ts PLATFORM_IDS 에 id 추가
 * 2) 여기 정의 추가
 * 3) lib/parsers/<platform>.ts 작성 후 lib/parsers/registry.ts 에 등록
 */
export const PLATFORMS: Record<PlatformId, PlatformDefinition> = {
  meta: {
    id: "meta",
    label: "Meta",
    shortLabel: "Meta",
    color: "#2a78d6",
    primaryDimension: "campaign",
    description: "Facebook / Instagram 광고",
  },
  naver_shopping: {
    id: "naver_shopping",
    label: "Naver Shopping",
    shortLabel: "N쇼핑",
    color: "#1baf7a",
    primaryDimension: "product",
    description: "네이버 쇼핑검색광고",
  },
  naver_powerlink: {
    id: "naver_powerlink",
    label: "Naver Powerlink",
    shortLabel: "파워링크",
    color: "#4a3aa7",
    primaryDimension: "keyword",
    description: "네이버 파워링크 (사이트검색광고)",
  },
};

export const PLATFORM_LIST = Object.values(PLATFORMS);

export function platformLabel(id: string | undefined): string {
  if (!id) return "";
  return PLATFORMS[id as PlatformId]?.label ?? id;
}
