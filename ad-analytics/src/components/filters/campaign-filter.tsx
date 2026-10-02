"use client";

import { useMemo } from "react";
import { applyDimensionFilters, campaignKeyOf } from "@/lib/analytics";
import { PLATFORMS } from "@/lib/config/platforms";
import { useAllRecords } from "@/hooks/use-analytics";
import { useFilterStore } from "@/store/filter-store";
import { MultiSelect } from "@/components/common/multi-select";
import { PlatformDot } from "@/components/common/platform-badge";

export function CampaignFilter() {
  const brands = useFilterStore((s) => s.brands);
  const platforms = useFilterStore((s) => s.platforms);
  const campaigns = useFilterStore((s) => s.campaigns);
  const setCampaigns = useFilterStore((s) => s.setCampaigns);
  const { records } = useAllRecords();
  const options = useMemo(() => {
    const seen = new Map<string, { value: string; label: string; hint: string; prefix: React.ReactNode }>();
    for (const r of applyDimensionFilters(records, { brands, platforms, campaigns: [] })) {
      if (!r.campaign) continue;
      const key = campaignKeyOf(r);
      if (!seen.has(key)) seen.set(key, { value: key, label: r.campaign, hint: `${PLATFORMS[r.platform].shortLabel} · ${r.brand}`, prefix: <PlatformDot platform={r.platform} /> });
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label, "ko"));
  }, [records, brands, platforms]);
  return <MultiSelect label="캠페인" allLabel="전체" options={options} value={campaigns} onChange={setCampaigns} searchable className="max-w-64" />;
}
