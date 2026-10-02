import type { PlatformId } from "./ad-data";
import type { MetricKey, MetricSummary } from "./analytics";

export type AlertSeverity = "critical" | "warning" | "positive";

/** 이상징후 비교 기준 */
export type ComparisonBasis =
  | "previousPeriod"
  | "prevDay"
  | "avg7d"
  | "prevWeek"
  | "prevMonth";

export type AlertScopeType = "total" | "platform" | "campaign" | "product" | "keyword";

export interface AlertScope {
  type: AlertScopeType;
  label: string;
  platform?: PlatformId;
  brand?: string;
  campaign?: string;
  entity?: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: AlertSeverity;
  scope: AlertScope;
  metric: MetricKey;
  basis: ComparisonBasis;
  /** 비교 대상 기간 설명 (예: "2026-10-01") */
  currentLabel: string;
  baselineLabel: string;
  current: number | null;
  baseline: number | null;
  changePct: number | null;
  title: string;
  message: string;
  /** 보조 설명 (연관 지표 변화 등) */
  detail?: string;
  /** 같은 대상에서 함께 발생한 연관 Alert (중복 표시 방지를 위해 대표 Alert 에 묶음) */
  related?: Array<{ ruleId: string; title: string; metric: MetricKey; changePct: number | null; severity: AlertSeverity }>;
  /** 원인 분석용 스냅샷 (AI 입력에 사용) */
  currentMetrics: MetricSummary;
  baselineMetrics: MetricSummary;
}
