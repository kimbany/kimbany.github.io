"use client";

import { useMemo, useState } from "react";
import type { PlatformId } from "@/types/ad-data";
import type { MetricKey } from "@/types/analytics";
import { aggregateByDateAndPlatform, aggregateByPlatform, summarize } from "@/lib/analytics";
import { METRICS } from "@/lib/config/metrics";
import { PLATFORMS, PLATFORM_LIST } from "@/lib/config/platforms";
import { useAnalyticsScope } from "@/hooks/use-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { DataGuard } from "@/components/common/data-guard";
import { ChannelComparisonTable } from "@/components/tables/channel-comparison-table";
import { ChannelShareChart } from "@/components/charts/channel-share-chart";
import { PerformanceTrendChart } from "@/components/charts/performance-trend-chart";
import { PlatformSnapshotCard } from "@/components/dashboard/platform-snapshot-card";

const TREND_METRICS: MetricKey[] = ["roas", "spend", "revenue", "conversions", "ctr", "cpc", "cvr", "cpa"];

export default function ChannelsPage() {
  const scope = useAnalyticsScope();
  const { current, previous, range, ready, hasAnyData } = scope;
  const [metric, setMetric] = useState<MetricKey>("roas");

  const d = useMemo(() => {
    const platforms = aggregateByPlatform(current);
    const prev = new Map(aggregateByPlatform(previous).map((r) => [r.key, r.metrics]));
    const series = aggregateByDateAndPlatform(current, range);
    return { platforms, prev, series };
  }, [current, previous, range]);

  const present = PLATFORM_LIST.filter((p) => d.platforms.some((r) => r.platform === p.id));
  const chartData = d.series.map((row) => {
    const out: Record<string, string | number | null> = { date: row.date };
    for (const p of present) out[p.id] = row[p.id]?.[metric] ?? null;
    return out;
  });

  return (
    <DataGuard ready={ready} hasAnyData={hasAnyData} hasRangeData={current.length > 0}>
      <div className="space-y-5">
        <div className="grid gap-3 lg:grid-cols-3">
          {d.platforms.map((p) => (
            <PlatformSnapshotCard key={p.key} platform={p.platform as PlatformId} current={p.metrics} baselines={[{ label: "vs 이전 기간", metrics: d.prev.get(p.key) ?? summarize([]) }]} />
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>채널별 {METRICS[metric].label} 추이</CardTitle>
                <CardDescription>지표를 바꿔 채널 간 흐름을 비교하세요</CardDescription>
              </div>
              <NativeSelect value={metric} onChange={(e) => setMetric(e.target.value as MetricKey)} className="w-36">
                {TREND_METRICS.map((m) => (
                  <option key={m} value={m}>
                    {METRICS[m].label}
                  </option>
                ))}
              </NativeSelect>
            </CardHeader>
            <CardContent>
              <PerformanceTrendChart data={chartData} metric={metric} series={present.map((p) => ({ key: p.id, label: p.label, color: PLATFORMS[p.id].color }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Spend / Revenue 비중</CardTitle>
            </CardHeader>
            <CardContent>
              <ChannelShareChart rows={d.platforms} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>채널 성과 비교표</CardTitle>
              <CardDescription>모든 컬럼 정렬 가능 · 작은 숫자는 이전 기간 대비</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2">
            <ChannelComparisonTable rows={d.platforms} previous={d.prev} />
          </CardContent>
        </Card>
      </div>
    </DataGuard>
  );
}
