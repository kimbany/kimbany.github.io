/**
 * AI 분석 입력(PerformanceAnalysisContext) 생성.
 * 원본 레코드가 아닌, 시스템이 미리 계산한 집계값·변화율·Alert 만 담는다.
 */
import type { AdRecord } from "@/types/ad-data";
import type { Alert } from "@/types/alerts";
import type { AggregatedRow, DateRange } from "@/types/analytics";
import type { ContextEntity, PerformanceAnalysisContext } from "@/types/ai";
import type { AppSettings } from "@/types/settings";
import { platformLabel } from "@/lib/config/platforms";
import { aggregateByCampaign, aggregateByKeyword, aggregateByPlatform, aggregateByProduct } from "./aggregate";
import { changeMap } from "./compare";
import { filterByRange, type DimensionFilters } from "./filters";
import { summarize } from "./metrics";
import {
  classifyKeywords,
  classifyProducts,
  topCampaigns,
  topProducts,
  underperformingCampaigns,
  underperformingProducts,
  wastefulKeywords,
} from "./segments";

function toEntity(r: AggregatedRow & { flags?: string[] }): ContextEntity {
  const m = r.metrics;
  const round = (v: number | null, d = 1) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);
  return {
    name: r.label,
    platform: r.platform ? platformLabel(r.platform) : undefined,
    brand: r.brand,
    spend: Math.round(m.spend),
    revenue: Math.round(m.revenue),
    roas: round(m.roas, 0),
    conversions: round(m.conversions, 1) ?? 0,
    cpa: round(m.cpa, 0),
    ctr: round(m.ctr, 2),
    cvr: round(m.cvr, 2),
    cpc: round(m.cpc, 0),
    flags: r.flags,
  };
}

export interface InsightContextInput {
  /** 차원 필터가 적용된 레코드 (날짜 무관) */
  records: AdRecord[];
  range: DateRange;
  comparisonRange: DateRange;
  alerts: Alert[];
  settings: AppSettings;
  filters: DimensionFilters;
}

export function generateInsightContext(input: InsightContextInput): PerformanceAnalysisContext {
  const { records, range, comparisonRange, alerts, settings, filters } = input;
  const cur = filterByRange(records, range);
  const prev = filterByRange(records, comparisonRange);
  const curTotal = summarize(cur);
  const prevTotal = summarize(prev);
  const prevByPlatform = new Map(aggregateByPlatform(prev).map((r) => [r.key, r.metrics]));
  const opt = { targetRoas: settings.targetRoas, minSpend: settings.alertThresholds.zeroConversion.minSpend };

  const campaigns = aggregateByCampaign(cur);
  const products = classifyProducts(aggregateByProduct(cur), opt);
  const keywords = classifyKeywords(aggregateByKeyword(cur), opt);

  return {
    generatedAt: new Date().toISOString(),
    filters: { brands: filters.brands, platforms: filters.platforms.map(platformLabel), campaigns: filters.campaigns.map((c) => c.split("::")[2] ?? c) },
    currentPeriod: range,
    previousPeriod: comparisonRange,
    totals: { current: curTotal, previous: prevTotal, changes: changeMap(curTotal, prevTotal) },
    platforms: aggregateByPlatform(cur).map((r) => ({
      platform: r.platform!,
      label: platformLabel(r.platform),
      current: r.metrics,
      changes: changeMap(r.metrics, prevByPlatform.get(r.key) ?? summarize([])),
    })),
    alerts: alerts.slice(0, 15).map((a) => ({
      id: a.id,
      severity: a.severity,
      title: a.title,
      message: a.message,
      metric: a.metric,
      basis: a.basis,
      current: a.current,
      baseline: a.baseline,
      changePct: a.changePct == null ? null : Math.round(a.changePct * 10) / 10,
      detail: a.detail,
      related: a.related,
      scope: a.scope,
      drivers: changeMap(a.currentMetrics, a.baselineMetrics),
    })),
    topCampaigns: topCampaigns(campaigns, opt).map(toEntity),
    underperformingCampaigns: underperformingCampaigns(campaigns, opt).map(toEntity),
    topProducts: topProducts(products).map(toEntity),
    wastefulProducts: underperformingProducts(products).map(toEntity),
    wastefulKeywords: wastefulKeywords(keywords).map(toEntity),
    targetRoas: settings.targetRoas,
  };
}
