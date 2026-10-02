import type { MetricComparison, MetricDelta, MetricKey, MetricSummary, Sentiment } from "@/types/analytics";
import { METRICS } from "@/lib/config/metrics";

const ALL_KEYS = Object.keys(METRICS) as MetricKey[];

/** (current - previous) / previous * 100. previous 가 0 또는 없으면 null */
export function pctChange(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current == null || previous == null) return null;
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function sentimentOf(metric: MetricKey, changePct: number | null, neutralBand = 0.5): Sentiment {
  if (changePct == null || Math.abs(changePct) < neutralBand) return "neutral";
  const polarity = METRICS[metric].polarity;
  if (polarity === "neutral") return "neutral";
  const up = changePct > 0;
  return (polarity === "higher") === up ? "positive" : "negative";
}

export function deltaOf(metric: MetricKey, current: number | null, previous: number | null): MetricDelta {
  const changePct = pctChange(current, previous);
  return {
    current,
    previous,
    changePct,
    isNew: (previous == null || previous === 0) && current != null && current > 0,
    sentiment: sentimentOf(metric, changePct),
  };
}

/** 두 기간 지표 비교 */
export function comparePeriods(current: MetricSummary, previous: MetricSummary): MetricComparison {
  const out = {} as MetricComparison;
  for (const key of ALL_KEYS) out[key] = deltaOf(key, current[key], previous[key]);
  return out;
}

export function changeMap(current: MetricSummary, previous: MetricSummary): Record<MetricKey, number | null> {
  const out = {} as Record<MetricKey, number | null>;
  for (const key of ALL_KEYS) {
    const c = pctChange(current[key], previous[key]);
    out[key] = c == null ? null : Math.round(c * 10) / 10;
  }
  return out;
}
