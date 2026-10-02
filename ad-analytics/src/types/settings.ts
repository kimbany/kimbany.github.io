import type { ComparisonBasis } from "./alerts";
import type { ComparisonMode, MetricKey } from "./analytics";

export interface Brand {
  id: string;
  name: string;
}

/** 지표 변화율 규칙: 예) ROAS 20% 이상 하락 → Warning, 40% 이상 하락 → Critical */
export interface MetricChangeRule {
  id: string;
  metric: MetricKey;
  direction: "increase" | "decrease";
  warningPct: number;
  /** null 이면 Critical 단계 없음 */
  criticalPct: number | null;
  enabled: boolean;
}

/** 성과 개선(Positive) 규칙 */
export interface PositiveRule {
  id: string;
  metric: MetricKey;
  direction: "increase" | "decrease";
  pct: number;
  enabled: boolean;
}

export interface AlertThresholds {
  metricRules: MetricChangeRule[];
  positiveRules: PositiveRule[];
  /** 광고비 X% 이상 증가 + 전환 증가율 Y% 미만 */
  spendSurge: { enabled: boolean; spendIncreasePct: number; maxConversionGrowthPct: number };
  /** 전환 0 + 일정 광고비 이상 지출 */
  zeroConversion: { enabled: boolean; minSpend: number };
  /** 전환은 증가했지만 CPA X% 이상 증가 */
  cpaSurgeWithConversionGrowth: { enabled: boolean; cpaIncreasePct: number };
  /** 노이즈 방지: 일 평균 광고비가 이 값 미만인 대상은 평가하지 않음 */
  minDailySpendForEvaluation: number;
  /** 비율 지표(CVR/CTR) 평가 최소 클릭/노출 */
  minClicksForRatio: number;
  bases: Record<ComparisonBasis, boolean>;
}

export interface AppSettings {
  brands: Brand[];
  comparisonMode: ComparisonMode;
  /** 목표 ROAS (%) — 상품/키워드 저효율 판정 기준 */
  targetRoas: number;
  alertThresholds: AlertThresholds;
  /** 샘플(mock) 데이터 포함 여부 */
  useSampleData: boolean;
}
