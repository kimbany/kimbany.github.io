"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PlatformId } from "@/types/ad-data";
import {
  aggregateByCampaign,
  aggregateByDate,
  aggregateByPlatform,
  dataDateBounds,
  detectAnomalies,
  filterByRange,
  summarize,
  summarizeDailyAverage,
} from "@/lib/analytics";
import { addDays, formatRange, weekdayKo } from "@/lib/utils/date";
import { stableHash } from "@/lib/utils/id";
import { useAnalyticsScope, useToday } from "@/hooks/use-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataGuard } from "@/components/common/data-guard";
import { EmptyState } from "@/components/common/empty-state";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { PlatformSnapshotCard } from "@/components/dashboard/platform-snapshot-card";
import { SpendRevenueChart } from "@/components/charts/spend-revenue-chart";
import { CampaignTable } from "@/components/tables/campaign-table";
import { AlertList } from "@/components/alerts/alert-list";

export default function DailyPage() {
  const today = useToday();
  const router = useRouter();
  const scope = useAnalyticsScope();
  const { scoped, ready, hasAnyData, settings } = scope;
  const bounds = useMemo(() => dataDateBounds(scoped), [scoped]);
  const [picked, setPicked] = useState<string | null>(null);
  const date = picked ?? (bounds && bounds.end < today ? bounds.end : today);

  const d = useMemo(() => {
    const dayRange = { start: date, end: date };
    const prevDay = addDays(date, -1);
    const avgRange = { start: addDays(date, -7), end: addDays(date, -1) };
    const cur = filterByRange(scoped, dayRange);
    const prev = filterByRange(scoped, { start: prevDay, end: prevDay });
    const last7 = filterByRange(scoped, avgRange);
    const byPlatform = (rs: typeof cur) => new Map(aggregateByPlatform(rs).map((r) => [r.key, r.metrics]));
    const prevPlatform = byPlatform(prev);
    const avgPlatform = new Map(
      aggregateByPlatform(last7).map((r) => [r.key, summarizeDailyAverage(last7.filter((x) => x.platform === r.key), 7)]),
    );
    const alerts = detectAnomalies({
      records: scoped,
      range: dayRange,
      comparisonRange: { start: prevDay, end: prevDay },
      thresholds: { ...settings.alertThresholds, bases: { ...settings.alertThresholds.bases, prevWeek: false, prevMonth: false } },
    });
    return {
      cur,
      total: summarize(cur),
      prevTotal: summarize(prev),
      avgTotal: summarizeDailyAverage(last7, 7),
      platforms: aggregateByPlatform(cur),
      prevPlatform,
      avgPlatform,
      campaigns: aggregateByCampaign(cur),
      prevCampaigns: new Map(aggregateByCampaign(prev).map((r) => [r.key, r.metrics])),
      trend: aggregateByDate(scoped, { start: addDays(date, -13), end: date }),
      alerts,
      avgLabel: formatRange(avgRange.start, avgRange.end),
    };
  }, [scoped, date, settings.alertThresholds]);

  return (
    <DataGuard ready={ready} hasAnyData={hasAnyData}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => setPicked(addDays(date, -1))} aria-label="이전 날짜">
            <ChevronLeft />
          </Button>
          <Input type="date" value={date} max={today} onChange={(e) => e.target.value && setPicked(e.target.value)} className="h-8 w-40 text-sm" />
          <Button variant="outline" size="icon-sm" onClick={() => setPicked(addDays(date, 1))} disabled={date >= today} aria-label="다음 날짜">
            <ChevronRight />
          </Button>
          <span className="text-sm font-medium">
            {date} ({weekdayKo(date)})
          </span>
          <span className="text-xs text-muted-foreground">· 비교: 전일 {addDays(date, -1)} / 최근 7일 평균 {d.avgLabel}</span>
        </div>

        {d.cur.length === 0 ? (
          <EmptyState title={`${date} 에 광고 데이터가 없습니다.`} description="다른 날짜를 선택하거나 Data Management 에서 해당 날짜 보고서를 업로드해주세요." />
        ) : (
          <>
            <KpiGrid
              current={d.total}
              baselines={[
                { label: "vs 전일", metrics: d.prevTotal },
                { label: "vs 최근 7일 평균", metrics: d.avgTotal },
              ]}
            />

            <div>
              <h2 className="mb-3 text-[15px] font-semibold">광고 플랫폼별 성과</h2>
              <div className="grid gap-3 lg:grid-cols-3">
                {d.platforms.map((p) => (
                  <PlatformSnapshotCard
                    key={p.key}
                    platform={p.platform as PlatformId}
                    current={p.metrics}
                    baselines={[
                      { label: "전일", metrics: d.prevPlatform.get(p.key) ?? summarize([]) },
                      { label: "7일평균", metrics: d.avgPlatform.get(p.key) ?? summarize([]) },
                    ]}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-5">
              <Card className="xl:col-span-3">
                <CardHeader>
                  <div>
                    <CardTitle>최근 14일 흐름</CardTitle>
                    <CardDescription>선택한 날짜까지의 광고비 · 매출 추이</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <SpendRevenueChart data={d.trend} height={240} />
                </CardContent>
              </Card>
              <Card className="xl:col-span-2">
                <CardHeader>
                  <div>
                    <CardTitle>이 날의 Alert</CardTitle>
                    <CardDescription>전일 · 최근 7일 평균 대비</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="max-h-[340px] overflow-y-auto">
                  <AlertList alerts={d.alerts} compact />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>캠페인별 성과</CardTitle>
                  <CardDescription>작은 숫자는 전일 대비 증감 · 행을 클릭하면 캠페인 상세로 이동</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-2">
                <CampaignTable rows={d.campaigns} previous={d.prevCampaigns} onRowClick={(r) => router.push(`/campaigns/${stableHash(r.key)}`)} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DataGuard>
  );
}
