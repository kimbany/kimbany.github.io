import type { AdRecord, PlatformId } from "@/types/ad-data";
import type { DateRange } from "@/types/analytics";

export interface DimensionFilters {
  brands: string[];
  platforms: PlatformId[];
  /** campaignKey (platform::brand::campaign) 목록 */
  campaigns: string[];
}

export function campaignKeyOf(r: Pick<AdRecord, "platform" | "brand" | "campaign">): string {
  return `${r.platform}::${r.brand}::${r.campaign}`;
}

/** 브랜드/플랫폼/캠페인 필터. 빈 배열 = 전체 */
export function applyDimensionFilters(records: AdRecord[], f: DimensionFilters): AdRecord[] {
  const brands = f.brands.length ? new Set(f.brands) : null;
  const platforms = f.platforms.length ? new Set<string>(f.platforms) : null;
  const campaigns = f.campaigns.length ? new Set(f.campaigns) : null;
  if (!brands && !platforms && !campaigns) return records;
  return records.filter(
    (r) =>
      (!brands || brands.has(r.brand)) &&
      (!platforms || platforms.has(r.platform)) &&
      (!campaigns || campaigns.has(campaignKeyOf(r))),
  );
}

export function filterByRange(records: AdRecord[], range: DateRange): AdRecord[] {
  return records.filter((r) => r.date >= range.start && r.date <= range.end);
}

export function dataDateBounds(records: AdRecord[]): DateRange | null {
  if (!records.length) return null;
  let start = records[0].date;
  let end = records[0].date;
  for (const r of records) {
    if (r.date < start) start = r.date;
    if (r.date > end) end = r.date;
  }
  return { start, end };
}
