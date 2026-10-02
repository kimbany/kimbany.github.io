/**
 * 상품 / 키워드 / 캠페인 성과 분류 (Top, Underperforming, Wasteful 등).
 * 모든 판단 기준은 숫자로 계산되며 settings(targetRoas, minSpend)로 조정한다.
 */
import type { AggregatedRow, FlaggedRow, KeywordFlag, ProductFlag } from "@/types/analytics";
import { accumulate, calculateMetrics, emptyAccumulator } from "./metrics";

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * q)));
  return sorted[idx];
}

function totalOf(rows: AggregatedRow[]) {
  const acc = emptyAccumulator();
  for (const r of rows) accumulate(acc, r.metrics);
  return calculateMetrics(acc);
}

export interface SegmentOptions {
  targetRoas: number;
  minSpend: number;
  minClicks?: number;
}

export const PRODUCT_FLAG_LABELS: Record<ProductFlag, string> = {
  high_spend: "광고비 높음",
  high_revenue: "매출 높음",
  high_roas: "ROAS 높음",
  high_spend_low_revenue: "광고비↑ 매출↓",
  no_conversion: "전환 없음",
};

export const KEYWORD_FLAG_LABELS: Record<KeywordFlag, string> = {
  no_conversion: "광고비 발생 + 전환 0",
  high_cpc: "CPC 높음",
  low_ctr: "CTR 낮음",
  low_roas: "ROAS 낮음",
  high_roas: "ROAS 높음",
  high_cvr: "전환율 높음",
};

export function classifyProducts(rows: AggregatedRow[], opt: SegmentOptions): FlaggedRow<ProductFlag>[] {
  const spends = rows.map((r) => r.metrics.spend).sort((a, b) => a - b);
  const revenues = rows.map((r) => r.metrics.revenue).sort((a, b) => a - b);
  const spendP80 = quantile(spends, 0.8);
  const spendP50 = quantile(spends, 0.5);
  const revenueP80 = quantile(revenues, 0.8);
  return rows.map((r) => {
    const m = r.metrics;
    const flags: ProductFlag[] = [];
    if (m.spend > 0 && m.spend >= spendP80) flags.push("high_spend");
    if (m.revenue > 0 && m.revenue >= revenueP80) flags.push("high_revenue");
    if (m.roas != null && m.roas >= opt.targetRoas * 1.5 && m.spend >= opt.minSpend) flags.push("high_roas");
    if (m.spend >= Math.max(spendP50, opt.minSpend) && (m.roas ?? 0) < opt.targetRoas) flags.push("high_spend_low_revenue");
    if (m.spend >= opt.minSpend && m.conversions === 0) flags.push("no_conversion");
    return { ...r, flags };
  });
}

export function topProducts(rows: FlaggedRow<ProductFlag>[], limit = 5) {
  return rows
    .filter((r) => r.metrics.revenue > 0)
    .sort((a, b) => b.metrics.revenue - a.metrics.revenue)
    .slice(0, limit);
}

export function underperformingProducts(rows: FlaggedRow<ProductFlag>[], limit = 5) {
  return rows
    .filter((r) => r.flags.includes("no_conversion") || r.flags.includes("high_spend_low_revenue"))
    .sort((a, b) => Number(b.flags.includes("no_conversion")) - Number(a.flags.includes("no_conversion")) || b.metrics.spend - a.metrics.spend)
    .slice(0, limit);
}

export function classifyKeywords(rows: AggregatedRow[], opt: SegmentOptions): FlaggedRow<KeywordFlag>[] {
  const total = totalOf(rows);
  const minClicks = opt.minClicks ?? 30;
  return rows.map((r) => {
    const m = r.metrics;
    const flags: KeywordFlag[] = [];
    if (m.spend >= opt.minSpend && m.conversions === 0) flags.push("no_conversion");
    if (m.cpc != null && total.cpc != null && m.clicks >= 10 && m.cpc >= total.cpc * 1.4) flags.push("high_cpc");
    if (m.ctr != null && total.ctr != null && m.impressions >= 1000 && m.ctr <= total.ctr * 0.6) flags.push("low_ctr");
    if (m.conversions > 0 && m.roas != null && m.roas < opt.targetRoas && m.spend >= opt.minSpend / 2) flags.push("low_roas");
    if (m.roas != null && m.roas >= opt.targetRoas * 1.5 && m.conversions >= 2) flags.push("high_roas");
    if (m.cvr != null && total.cvr != null && m.clicks >= minClicks / 2 && m.cvr >= total.cvr * 1.4) flags.push("high_cvr");
    return { ...r, flags };
  });
}

export function highPerformingKeywords(rows: FlaggedRow<KeywordFlag>[], limit = 5) {
  return rows
    .filter((r) => r.flags.includes("high_roas") || r.flags.includes("high_cvr"))
    .sort((a, b) => (b.metrics.roas ?? 0) - (a.metrics.roas ?? 0))
    .slice(0, limit);
}

export function wastefulKeywords(rows: FlaggedRow<KeywordFlag>[], limit = 5) {
  return rows
    .filter((r) => r.flags.includes("no_conversion") || r.flags.includes("low_roas"))
    .sort((a, b) => Number(b.flags.includes("no_conversion")) - Number(a.flags.includes("no_conversion")) || b.metrics.spend - a.metrics.spend)
    .slice(0, limit);
}

export function topCampaigns(rows: AggregatedRow[], opt: SegmentOptions, limit = 5) {
  return rows
    .filter((r) => r.metrics.spend >= opt.minSpend && r.metrics.roas != null)
    .sort((a, b) => (b.metrics.roas ?? 0) - (a.metrics.roas ?? 0))
    .slice(0, limit);
}

export function underperformingCampaigns(rows: AggregatedRow[], opt: SegmentOptions, limit = 5) {
  return rows
    .filter((r) => r.metrics.spend >= opt.minSpend && (r.metrics.roas ?? 0) < opt.targetRoas)
    .sort((a, b) => (a.metrics.roas ?? 0) - (b.metrics.roas ?? 0))
    .slice(0, limit);
}

/** ROAS 기준 최고 / 최저 채널 */
export function bestAndWorstChannel(rows: AggregatedRow[], minSpend: number) {
  const eligible = rows.filter((r) => r.metrics.spend >= minSpend && r.metrics.roas != null);
  if (!eligible.length) return { best: null, worst: null };
  const sorted = [...eligible].sort((a, b) => (b.metrics.roas ?? 0) - (a.metrics.roas ?? 0));
  return { best: sorted[0], worst: sorted.length > 1 ? sorted[sorted.length - 1] : null };
}

/** 문제가 발생한 채널: Alert 가중치(Critical 3, Warning 1)가 가장 큰 플랫폼 */
export function problemChannel(alerts: import("@/types/alerts").Alert[]) {
  const score = new Map<string, { score: number; top: import("@/types/alerts").Alert }>();
  for (const a of alerts) {
    if (a.severity === "positive" || !a.scope.platform) continue;
    const w = a.severity === "critical" ? 3 : 1;
    const cur = score.get(a.scope.platform);
    if (!cur) score.set(a.scope.platform, { score: w, top: a });
    else cur.score += w;
  }
  const sorted = [...score.entries()].sort((a, b) => b[1].score - a[1].score);
  return sorted.length ? { platform: sorted[0][0], ...sorted[0][1] } : null;
}
