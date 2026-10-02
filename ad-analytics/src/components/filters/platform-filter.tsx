"use client";

import type { PlatformId } from "@/types/ad-data";
import { PLATFORM_LIST } from "@/lib/config/platforms";
import { useFilterStore } from "@/store/filter-store";
import { MultiSelect } from "@/components/common/multi-select";
import { PlatformDot } from "@/components/common/platform-badge";

export function PlatformFilter() {
  const platforms = useFilterStore((s) => s.platforms);
  const setPlatforms = useFilterStore((s) => s.setPlatforms);
  const options = PLATFORM_LIST.map((p) => ({ value: p.id, label: p.label, prefix: <PlatformDot platform={p.id} /> }));
  return <MultiSelect label="플랫폼" allLabel="전체" options={options} value={platforms} onChange={(v) => setPlatforms(v as PlatformId[])} />;
}
