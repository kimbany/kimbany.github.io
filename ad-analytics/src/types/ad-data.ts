/**
 * 공통 광고 데이터 모델.
 * 모든 플랫폼의 원본 리포트는 parser 를 거쳐 AdRecord 로 정규화된다.
 * DB(Supabase/PostgreSQL)로 이전할 때 이 interface 가 테이블 스키마의 기준이 된다.
 */

/** 1차 지원 플랫폼. 신규 플랫폼은 여기에 id 를 추가하고 lib/config/platforms.ts, lib/parsers 에 등록한다. */
export const PLATFORM_IDS = ["meta", "naver_shopping", "naver_powerlink"] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];
// 확장 예정: "google_ads" | "kakao_ads" | "coupang_ads"

/** 합산 가능한 기본 성과 지표 (모든 플랫폼 필수) */
export interface BaseMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

/** 합산 가능한 선택 지표 (플랫폼별로 존재 여부가 다름) */
export interface OptionalMetrics {
  reach?: number;
  frequency?: number;
  videoViews?: number;
  addToCart?: number;
  landingPageViews?: number;
  orders?: number;
}

/** 분석 차원 (필수). 값이 없으면 빈 문자열 "" 로 저장한다. */
export interface RecordDimensions {
  /** YYYY-MM-DD */
  date: string;
  platform: PlatformId;
  brand: string;
  campaign: string;
  adGroup: string;
  ad: string;
  product: string;
  keyword: string;
}

/** 선택 차원 */
export interface OptionalDimensions {
  device?: string;
  placement?: string;
  creative?: string;
}

export interface AdRecord
  extends RecordDimensions,
    OptionalDimensions,
    BaseMetrics,
    OptionalMetrics {
  /** 레코드 고유 id */
  id: string;
  /** 이 레코드를 등록한 업로드 파일 id. mock 데이터는 "mock" */
  sourceFileId: string;
  /** 공통 모델에 아직 정의되지 않은 원본 필드 (향후 필드 추가 시 마이그레이션 없이 보관) */
  extra?: Record<string, string | number>;
}

/** 공통 모델에서 매핑 가능한 필드 이름 */
export type CanonicalField =
  | keyof Omit<RecordDimensions, "platform" | "brand">
  | keyof OptionalDimensions
  | keyof BaseMetrics
  | keyof OptionalMetrics;

export const SAMPLE_SOURCE_ID = "mock";
