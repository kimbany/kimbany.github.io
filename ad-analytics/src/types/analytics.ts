import type { BaseMetrics, PlatformId } from "./ad-data";

/** 자동 계산 지표. 계산 불가(분모 0)인 경우 null */
export interface DerivedMetrics {
  /** clicks / impressions * 100 */
  ctr: number | null;
  /** spend / clicks */
  cpc: number | null;
  /** conversions / clicks * 100 */
  cvr: number | null;
  /** spend / conversions */
  cpa: number | null;
  /** revenue / spend * 100 */
  roas: number | null;
  /** spend / impressions * 1000 */
  cpm: number | null;
  /** revenue / conversions (객단가) */
  aov: number | null;
}

export interface MetricSummary extends BaseMetrics, DerivedMetrics {
  orders: number;
}

export type MetricKey =
  | "spend"
  | "revenue"
  | "roas"
  | "conversions"
  | "impressions"
  | "clicks"
  | "ctr"
  | "cpc"
  | "cvr"
  | "cpa"
  | "cpm"
  | "aov";

export type Sentiment = "positive" | "negative" | "neutral";

export interface MetricDelta {
  current: number | null;
  previous: number | null;
  /** (current - previous) / previous * 100. previous 가 0/null 이면 null */
  changePct: number | null;
  /** previous 가 0 이고 current > 0 인 신규 발생 */
  isNew: boolean;
  sentiment: Sentiment;
}

export type MetricComparison = Record<MetricKey, MetricDelta>;

export interface DateRange {
  /** YYYY-MM-DD (포함) */
  start: string;
  /** YYYY-MM-DD (포함) */
  end: string;
}

export type DatePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "custom";

/** 이전 기간 비교 방식 */
export type ComparisonMode =
  /** 바로 이전 동일 길이 기간 (기본) */
  | "previous"
  /** 전월 동일 날짜 구간 */
  | "previousMonthSameDays"
  /** 지난달 전체 */
  | "previousMonthFull";

export interface AggregatedRow {
  key: string;
  label: string;
  platform?: PlatformId;
  brand?: string;
  campaign?: string;
  metrics: MetricSummary;
}

export interface DailyPoint {
  date: string;
  metrics: MetricSummary;
}

export type ProductFlag =
  | "high_spend"
  | "high_revenue"
  | "high_roas"
  | "high_spend_low_revenue"
  | "no_conversion";

export type KeywordFlag =
  | "no_conversion"
  | "high_cpc"
  | "low_ctr"
  | "low_roas"
  | "high_roas"
  | "high_cvr";

export interface FlaggedRow<F extends string> extends AggregatedRow {
  flags: F[];
}
