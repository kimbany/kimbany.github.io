import type { AdRecord } from "@/types/ad-data";
import type { DateRange } from "@/types/analytics";
import type { ReportData, ReportType } from "@/types/report";
import type { AppSettings } from "@/types/settings";
import { analyzeWithRules } from "@/lib/ai/rule-based-analyzer";
import { addDays, endOfMonth, startOfMonth, startOfWeek } from "@/lib/utils/date";
import { aggregateByCampaign, aggregateByDate, aggregateByKeyword, aggregateByPlatform, aggregateByProduct } from "./aggregate";
import { detectAnomalies } from "./anomalies";
import { filterByRange, type DimensionFilters } from "./filters";
import { generateInsightContext } from "./insight-context";
import { summarize } from "./metrics";
import { getComparisonRange } from "./period";
import { classifyKeywords, classifyProducts, topCampaigns, topProducts, underperformingCampaigns, wastefulKeywords } from "./segments";

export const REPORT_LABELS: Record<ReportType, string> = { daily: "일간", weekly: "주간", monthly: "월간" };

/** 보고서 기간 계산. anchor 는 일간=해당일, 주간=주에 포함된 날짜, 월간=월에 포함된 날짜 */
export function reportPeriod(type: ReportType, anchor: string, today: string): { range: DateRange; comparisonRange: DateRange } {
  if (type === "daily") {
    const range = { start: anchor, end: anchor };
    return { range, comparisonRange: getComparisonRange(range, "previous") };
  }
  if (type === "weekly") {
    const start = startOfWeek(anchor);
    const end = addDays(start, 6);
    const range = { start, end: end > today ? today : end };
    return { range, comparisonRange: { start: addDays(start, -7), end: addDays(range.end, -7) } };
  }
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  const range = { start, end: end > today ? today : end };
  return { range, comparisonRange: getComparisonRange(range, "previousMonthSameDays") };
}

export function buildReport(input: {
  type: ReportType;
  records: AdRecord[];
  range: DateRange;
  comparisonRange: DateRange;
  settings: AppSettings;
  filters: DimensionFilters;
}): ReportData {
  const { type, records, range, comparisonRange, settings, filters } = input;
  const cur = filterByRange(records, range);
  const prev = filterByRange(records, comparisonRange);
  const opt = { targetRoas: settings.targetRoas, minSpend: settings.alertThresholds.zeroConversion.minSpend };
  const campaigns = aggregateByCampaign(cur);
  const thresholds =
    type === "daily"
      ? settings.alertThresholds
      : { ...settings.alertThresholds, bases: { ...settings.alertThresholds.bases, prevDay: false, avg7d: false } };
  const alerts = detectAnomalies({ records, range, comparisonRange, thresholds });
  const context = generateInsightContext({ records, range, comparisonRange, alerts, settings, filters });
  const brandNames = filters.brands.length ? filters.brands : [...new Set(cur.map((r) => r.brand))];
  const toRecord = (rows: ReturnType<typeof aggregateByPlatform>) => Object.fromEntries(rows.map((r) => [r.key, r.metrics]));

  return {
    type,
    title: `${brandNames.join(" · ") || "전체 브랜드"} 광고 성과 ${REPORT_LABELS[type]} 보고서`,
    range,
    comparisonRange,
    brands: brandNames,
    generatedAt: new Date().toISOString(),
    totals: { current: summarize(cur), previous: summarize(prev) },
    platforms: aggregateByPlatform(cur),
    previousPlatforms: toRecord(aggregateByPlatform(prev)),
    campaigns,
    previousCampaigns: toRecord(aggregateByCampaign(prev)),
    topCampaigns: topCampaigns(campaigns, opt, 5),
    underperformingCampaigns: underperformingCampaigns(campaigns, opt, 5),
    topProducts: topProducts(classifyProducts(aggregateByProduct(cur), opt), 5),
    wastefulKeywords: wastefulKeywords(classifyKeywords(aggregateByKeyword(cur), opt), 5),
    daily: aggregateByDate(cur, range),
    alerts,
    analysis: analyzeWithRules(context),
  };
}
