"use client";

import { useMemo } from "react";
import { useAllRecords } from "@/hooks/use-analytics";
import { useFilterStore } from "@/store/filter-store";
import { useSettingsStore } from "@/store/settings-store";
import { MultiSelect } from "@/components/common/multi-select";

export function BrandFilter() {
  const brands = useFilterStore((s) => s.brands);
  const setBrands = useFilterStore((s) => s.setBrands);
  const configured = useSettingsStore((s) => s.settings.brands);
  const { records } = useAllRecords();
  const options = useMemo(() => {
    const names = new Set(configured.map((b) => b.name));
    for (const r of records) names.add(r.brand);
    return [...names].map((n) => ({ value: n, label: n }));
  }, [configured, records]);
  return <MultiSelect label="브랜드" allLabel="전체" options={options} value={brands} onChange={setBrands} />;
}
