import type { AIAnalysisResult } from "./ai";
import type { Alert } from "./alerts";
import type { AggregatedRow, DailyPoint, DateRange, FlaggedRow, KeywordFlag, MetricSummary, ProductFlag } from "./analytics";

export type ReportType = "daily" | "weekly" | "monthly";

/** 보고서 데이터 (화면 렌더링 / 추후 PDF · 이메일 export 공통 입력) */
export interface ReportData {
  type: ReportType;
  title: string;
  range: DateRange;
  comparisonRange: DateRange;
  brands: string[];
  generatedAt: string;
  totals: { current: MetricSummary; previous: MetricSummary };
  platforms: AggregatedRow[];
  previousPlatforms: Record<string, MetricSummary>;
  campaigns: AggregatedRow[];
  previousCampaigns: Record<string, MetricSummary>;
  topCampaigns: AggregatedRow[];
  underperformingCampaigns: AggregatedRow[];
  topProducts: FlaggedRow<ProductFlag>[];
  wastefulKeywords: FlaggedRow<KeywordFlag>[];
  daily: DailyPoint[];
  alerts: Alert[];
  analysis: AIAnalysisResult;
}
