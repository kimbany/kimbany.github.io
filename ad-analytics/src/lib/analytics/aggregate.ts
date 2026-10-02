import type { AdRecord, PlatformId } from "@/types/ad-data";
import type { AggregatedRow, DailyPoint, DateRange } from "@/types/analytics";
import { PLATFORM_LIST } from "@/lib/config/platforms";
import { listDates } from "@/lib/utils/date";
import { campaignKeyOf } from "./filters";
import { accumulate, calculateMetrics, emptyAccumulator, type Accumulator } from "./metrics";

interface GroupMeta {
  label: string;
  platform?: PlatformId;
  brand?: string;
  campaign?: string;
}

/** 범용 group-by 집계 */
export function aggregateBy(
  records: AdRecord[],
  keyFn: (r: AdRecord) => string | null,
  metaFn: (r: AdRecord) => GroupMeta,
): AggregatedRow[] {
  const groups = new Map<string, { meta: GroupMeta; acc: Accumulator }>();
  for (const r of records) {
    const key = keyFn(r);
    if (key == null) continue;
    let g = groups.get(key);
    if (!g) {
      g = { meta: metaFn(r), acc: emptyAccumulator() };
      groups.set(key, g);
    }
    accumulate(g.acc, r);
  }
  return [...groups.entries()]
    .map(([key, g]) => ({ key, ...g.meta, metrics: calculateMetrics(g.acc) }))
    .sort((a, b) => b.metrics.spend - a.metrics.spend);
}

/** 날짜별 집계. range 가 주어지면 데이터 없는 날짜를 0 으로 채운다 */
export function aggregateByDate(records: AdRecord[], range?: DateRange): DailyPoint[] {
  const byDate = new Map<string, Accumulator>();
  for (const r of records) {
    let acc = byDate.get(r.date);
    if (!acc) byDate.set(r.date, (acc = emptyAccumulator()));
    accumulate(acc, r);
  }
  const dates = range ? listDates(range.start, range.end) : [...byDate.keys()].sort();
  return dates.map((date) => ({ date, metrics: calculateMetrics(byDate.get(date) ?? emptyAccumulator()) }));
}

/** 날짜 × 플랫폼 시계열 (채널별 추이 차트용) */
export function aggregateByDateAndPlatform(records: AdRecord[], range: DateRange) {
  const map = new Map<string, Accumulator>();
  for (const r of records) {
    const k = `${r.date}|${r.platform}`;
    let acc = map.get(k);
    if (!acc) map.set(k, (acc = emptyAccumulator()));
    accumulate(acc, r);
  }
  return listDates(range.start, range.end).map((date) => {
    const row: { date: string } & Partial<Record<PlatformId, ReturnType<typeof calculateMetrics>>> = { date };
    for (const p of PLATFORM_LIST) row[p.id] = calculateMetrics(map.get(`${date}|${p.id}`) ?? emptyAccumulator());
    return row;
  });
}

export function aggregateByPlatform(records: AdRecord[]): AggregatedRow[] {
  return aggregateBy(
    records,
    (r) => r.platform,
    (r) => ({ label: r.platform, platform: r.platform }),
  );
}

export function aggregateByBrand(records: AdRecord[]): AggregatedRow[] {
  return aggregateBy(records, (r) => r.brand, (r) => ({ label: r.brand, brand: r.brand }));
}

export function aggregateByCampaign(records: AdRecord[]): AggregatedRow[] {
  return aggregateBy(
    records,
    (r) => campaignKeyOf(r),
    (r) => ({ label: r.campaign || "(캠페인 없음)", platform: r.platform, brand: r.brand, campaign: r.campaign }),
  );
}

export function aggregateByAdGroup(records: AdRecord[]): AggregatedRow[] {
  return aggregateBy(
    records,
    (r) => `${campaignKeyOf(r)}::${r.adGroup}`,
    (r) => ({ label: r.adGroup || "(광고그룹 없음)", platform: r.platform, brand: r.brand, campaign: r.campaign }),
  );
}

export function aggregateByAd(records: AdRecord[]): AggregatedRow[] {
  return aggregateBy(
    records,
    (r) => (r.ad ? `${campaignKeyOf(r)}::${r.adGroup}::${r.ad}` : null),
    (r) => ({ label: r.ad, platform: r.platform, brand: r.brand, campaign: r.campaign }),
  );
}

/** 상품별 (주로 네이버 쇼핑검색광고). 상품 정보가 없는 레코드는 제외 */
export function aggregateByProduct(records: AdRecord[]): AggregatedRow[] {
  return aggregateBy(
    records,
    (r) => (r.product ? `${r.platform}::${r.brand}::${r.product}` : null),
    (r) => ({ label: r.product, platform: r.platform, brand: r.brand, campaign: r.campaign }),
  );
}

/** 키워드별 (주로 네이버 파워링크). 같은 키워드라도 캠페인이 다르면 별도 행 */
export function aggregateByKeyword(records: AdRecord[]): AggregatedRow[] {
  return aggregateBy(
    records,
    (r) => (r.keyword ? `${campaignKeyOf(r)}::${r.keyword}` : null),
    (r) => ({ label: r.keyword, platform: r.platform, brand: r.brand, campaign: r.campaign }),
  );
}
