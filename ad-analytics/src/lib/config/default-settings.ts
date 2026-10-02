import type { AppSettings } from "@/types/settings";

/** 초기 Alert 기준. Settings 페이지에서 변경 가능하며 저장소에 보관된다. */
export const DEFAULT_SETTINGS: AppSettings = {
  brands: [
    { id: "brand_mongfrui", name: "몽프루이" },
    { id: "brand_gyultamin", name: "귤타민" },
  ],
  comparisonMode: "previous",
  targetRoas: 300,
  useSampleData: true,
  alertThresholds: {
    metricRules: [
      { id: "roas_drop", metric: "roas", direction: "decrease", warningPct: 20, criticalPct: 40, enabled: true },
      { id: "cpc_rise", metric: "cpc", direction: "increase", warningPct: 20, criticalPct: 50, enabled: true },
      { id: "cvr_drop", metric: "cvr", direction: "decrease", warningPct: 20, criticalPct: 40, enabled: true },
      { id: "ctr_drop", metric: "ctr", direction: "decrease", warningPct: 25, criticalPct: 50, enabled: true },
      { id: "revenue_drop", metric: "revenue", direction: "decrease", warningPct: 30, criticalPct: 50, enabled: true },
      { id: "cpa_rise", metric: "cpa", direction: "increase", warningPct: 30, criticalPct: 60, enabled: true },
      { id: "spend_rise", metric: "spend", direction: "increase", warningPct: 50, criticalPct: null, enabled: true },
      { id: "conversions_drop", metric: "conversions", direction: "decrease", warningPct: 30, criticalPct: 50, enabled: true },
    ],
    positiveRules: [
      { id: "roas_up", metric: "roas", direction: "increase", pct: 20, enabled: true },
      { id: "cvr_up", metric: "cvr", direction: "increase", pct: 25, enabled: true },
      { id: "cpa_down", metric: "cpa", direction: "decrease", pct: 20, enabled: true },
    ],
    spendSurge: { enabled: true, spendIncreasePct: 30, maxConversionGrowthPct: 10 },
    zeroConversion: { enabled: true, minSpend: 50_000 },
    cpaSurgeWithConversionGrowth: { enabled: true, cpaIncreasePct: 30 },
    minDailySpendForEvaluation: 30_000,
    minClicksForRatio: 50,
    bases: { previousPeriod: true, prevDay: true, avg7d: true, prevWeek: true, prevMonth: false },
  },
};
