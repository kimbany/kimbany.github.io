"use client";

import { useMemo, useState } from "react";
import type { AdRecord } from "@/types/ad-data";
import type { DateRange } from "@/types/analytics";
import {
  applyDimensionFilters,
  detectAnomalies,
  filterByRange,
  generateInsightContext,
  getComparisonRange,
  resolveDateRange,
  type DimensionFilters,
} from "@/lib/analytics";
import { analyzeWithRules } from "@/lib/ai/rule-based-analyzer";
import { todayLocal } from "@/lib/utils/date";
import { useDataStore } from "@/store/data-store";
import { useFilterStore } from "@/store/filter-store";
import { useSettingsStore } from "@/store/settings-store";

export function useToday(): string {
  const [today] = useState(todayLocal);
  return today;
}

/** 샘플 + 업로드 데이터 (설정에 따라) */
export function useAllRecords(): { ready: boolean; records: AdRecord[] } {
  const status = useDataStore((s) => s.status);
  const records = useDataStore((s) => s.records);
  const sample = useDataStore((s) => s.sampleRecords);
  const useSample = useSettingsStore((s) => s.settings.useSampleData);
  const loaded = useSettingsStore((s) => s.loaded);
  const all = useMemo(() => (useSample ? [...sample, ...records] : records), [useSample, sample, records]);
  return { ready: status === "ready" && loaded, records: all };
}

export function useDimensionFilters(): DimensionFilters {
  const brands = useFilterStore((s) => s.brands);
  const platforms = useFilterStore((s) => s.platforms);
  const campaigns = useFilterStore((s) => s.campaigns);
  return useMemo(() => ({ brands, platforms, campaigns }), [brands, platforms, campaigns]);
}

export function useDateRange(): { range: DateRange; comparisonRange: DateRange } {
  const today = useToday();
  const preset = useFilterStore((s) => s.preset);
  const custom = useFilterStore((s) => s.customRange);
  const mode = useSettingsStore((s) => s.settings.comparisonMode);
  return useMemo(() => {
    const range = resolveDateRange(preset, today, custom);
    return { range, comparisonRange: getComparisonRange(range, mode) };
  }, [preset, today, custom, mode]);
}

/**
 * 분석 페이지 공통 훅.
 * scoped   : 브랜드/플랫폼/캠페인 필터 적용 (전체 기간)
 * current  : scoped ∩ 선택 기간
 * previous : scoped ∩ 비교 기간
 */
export function useAnalyticsScope(rangeOverride?: { range: DateRange; comparisonRange: DateRange }) {
  const { ready, records } = useAllRecords();
  const filters = useDimensionFilters();
  const globalRange = useDateRange();
  const { range, comparisonRange } = rangeOverride ?? globalRange;
  const settings = useSettingsStore((s) => s.settings);

  const scoped = useMemo(() => applyDimensionFilters(records, filters), [records, filters]);
  const current = useMemo(() => filterByRange(scoped, range), [scoped, range]);
  const previous = useMemo(() => filterByRange(scoped, comparisonRange), [scoped, comparisonRange]);

  return { ready, allRecords: records, scoped, current, previous, range, comparisonRange, filters, settings, hasAnyData: records.length > 0 };
}

export type AnalyticsScope = ReturnType<typeof useAnalyticsScope>;

export function useAlerts(scope: AnalyticsScope) {
  const { scoped, range, comparisonRange, settings } = scope;
  return useMemo(
    () => detectAnomalies({ records: scoped, range, comparisonRange, thresholds: settings.alertThresholds }),
    [scoped, range, comparisonRange, settings.alertThresholds],
  );
}

export function useInsights(scope: AnalyticsScope) {
  const alerts = useAlerts(scope);
  const { scoped, range, comparisonRange, settings, filters } = scope;
  const context = useMemo(
    () => generateInsightContext({ records: scoped, range, comparisonRange, alerts, settings, filters }),
    [scoped, range, comparisonRange, alerts, settings, filters],
  );
  const ruleBased = useMemo(() => analyzeWithRules(context), [context]);
  return { alerts, context, ruleBased };
}
