import type { Alert, AlertSeverity } from "./alerts";
import type { DateRange, MetricComparison, MetricKey, MetricSummary } from "./analytics";
import type { PlatformId } from "./ad-data";

/** AI 에게 전달하는 '집계된' 분석 컨텍스트. 원본 레코드는 절대 포함하지 않는다. */
export interface PerformanceAnalysisContext {
  generatedAt: string;
  filters: { brands: string[]; platforms: string[]; campaigns: string[] };
  currentPeriod: DateRange;
  previousPeriod: DateRange;
  totals: { current: MetricSummary; previous: MetricSummary; changes: Record<MetricKey, number | null> };
  platforms: Array<{
    platform: PlatformId;
    label: string;
    current: MetricSummary;
    changes: Record<MetricKey, number | null>;
  }>;
  alerts: Array<Pick<Alert, "id" | "severity" | "title" | "message" | "metric" | "basis" | "current" | "baseline" | "changePct" | "detail" | "related"> & {
    scope: Alert["scope"];
    drivers: Record<MetricKey, number | null>;
  }>;
  topCampaigns: ContextEntity[];
  underperformingCampaigns: ContextEntity[];
  topProducts: ContextEntity[];
  wastefulProducts: ContextEntity[];
  wastefulKeywords: ContextEntity[];
  targetRoas: number;
}

export interface ContextEntity {
  name: string;
  platform?: string;
  brand?: string;
  spend: number;
  revenue: number;
  roas: number | null;
  conversions: number;
  cpa: number | null;
  ctr: number | null;
  cvr: number | null;
  cpc: number | null;
  flags?: string[];
}

export interface RecommendedAction {
  priority: number;
  action: string;
}

/** AI 결과 1건: 문제 → 가능한 원인 → 확인해야 할 사항 → 권장 액션 */
export interface InsightItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  problem: string;
  possibleCauses: string[];
  checks: string[];
  recommendedActions: RecommendedAction[];
  relatedAlertId?: string;
  platform?: string;
  campaign?: string;
}

export interface AIAnalysisResult {
  summary: string;
  issues: InsightItem[];
  /** 전체 기준 우선순위 액션 */
  recommendedActions: RecommendedAction[];
  source: "rule-based" | "anthropic";
  model?: string;
  generatedAt: string;
}
