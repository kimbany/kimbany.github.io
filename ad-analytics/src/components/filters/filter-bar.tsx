"use client";

import { RotateCcw } from "lucide-react";
import { COMPARISON_MODE_LABELS, describeRange } from "@/lib/analytics/period";
import { useDateRange } from "@/hooks/use-analytics";
import { useFilterStore } from "@/store/filter-store";
import { useSettingsStore } from "@/store/settings-store";
import { DateRangeSelector } from "./date-range-selector";
import { BrandFilter } from "./brand-filter";
import { PlatformFilter } from "./platform-filter";
import { CampaignFilter } from "./campaign-filter";

export function FilterBar({ showDateRange = true }: { showDateRange?: boolean }) {
  const { comparisonRange } = useDateRange();
  const mode = useSettingsStore((s) => s.settings.comparisonMode);
  const reset = useFilterStore((s) => s.reset);
  const dirty = useFilterStore((s) => s.brands.length + s.platforms.length + s.campaigns.length > 0 || s.preset !== "last7");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showDateRange && <DateRangeSelector />}
      <BrandFilter />
      <PlatformFilter />
      <CampaignFilter />
      {dirty && (
        <button onClick={reset} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
          <RotateCcw className="size-3.5" /> 초기화
        </button>
      )}
      {showDateRange && (
        <span className="ml-auto hidden text-[11px] text-muted-foreground md:inline">
          비교 기간 ({COMPARISON_MODE_LABELS[mode]}): {describeRange(comparisonRange)}
        </span>
      )}
    </div>
  );
}
