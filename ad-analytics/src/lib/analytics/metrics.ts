import type { AdRecord, BaseMetrics } from "@/types/ad-data";
import type { MetricKey, MetricSummary } from "@/types/analytics";

/** 0 나눗셈 / NaN / Infinity 를 null 로 처리하는 안전한 나눗셈 */
export function safeDivide(numerator: number, denominator: number, multiplier = 1): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  const v = (numerator / denominator) * multiplier;
  return Number.isFinite(v) ? v : null;
}

export interface Accumulator extends BaseMetrics {
  orders: number;
}

export function emptyAccumulator(): Accumulator {
  return { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, orders: 0 };
}

export function accumulate(acc: Accumulator, r: BaseMetrics & { orders?: number }): Accumulator {
  acc.spend += r.spend || 0;
  acc.impressions += r.impressions || 0;
  acc.clicks += r.clicks || 0;
  acc.conversions += r.conversions || 0;
  acc.revenue += r.revenue || 0;
  acc.orders += r.orders ?? r.conversions ?? 0;
  return acc;
}

/** 기본 지표 → 파생 지표 계산 (CTR, CPC, CVR, CPA, ROAS, CPM, 객단가) */
export function calculateMetrics(base: BaseMetrics & { orders?: number }): MetricSummary {
  return {
    spend: base.spend,
    impressions: base.impressions,
    clicks: base.clicks,
    conversions: base.conversions,
    revenue: base.revenue,
    orders: base.orders ?? base.conversions,
    ctr: safeDivide(base.clicks, base.impressions, 100),
    cpc: safeDivide(base.spend, base.clicks),
    cvr: safeDivide(base.conversions, base.clicks, 100),
    cpa: safeDivide(base.spend, base.conversions),
    roas: safeDivide(base.revenue, base.spend, 100),
    cpm: safeDivide(base.spend, base.impressions, 1000),
    aov: safeDivide(base.revenue, base.conversions),
  };
}

export function summarize(records: AdRecord[]): MetricSummary {
  const acc = emptyAccumulator();
  for (const r of records) accumulate(acc, r);
  return calculateMetrics(acc);
}

/** 기본 지표를 n 으로 나눈 평균 (예: 최근 7일 일평균) */
export function averageMetrics(base: Accumulator, n: number): MetricSummary {
  if (n <= 0) return calculateMetrics(emptyAccumulator());
  return calculateMetrics({
    spend: base.spend / n,
    impressions: base.impressions / n,
    clicks: base.clicks / n,
    conversions: base.conversions / n,
    revenue: base.revenue / n,
    orders: base.orders / n,
  });
}

export function getMetric(m: MetricSummary, key: MetricKey): number | null {
  return m[key];
}

export const EMPTY_SUMMARY: MetricSummary = calculateMetrics(emptyAccumulator());

/** records 합계를 days 로 나눈 일평균 지표 */
export function summarizeDailyAverage(records: AdRecord[], days: number): MetricSummary {
  const acc = emptyAccumulator();
  for (const r of records) accumulate(acc, r);
  return averageMetrics(acc, days);
}
