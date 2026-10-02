"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { MetricKey } from "@/types/analytics";
import type { PlatformId } from "@/types/ad-data";
import {
  aggregateByAd,
  aggregateByAdGroup,
  aggregateByDate,
  aggregateByKeyword,
  aggregateByProduct,
  campaignKeyOf,
  detectAnomalies,
  filterByRange,
  summarize,
} from "@/lib/analytics";
import { METRICS } from "@/lib/config/metrics";
import { PLATFORMS } from "@/lib/config/platforms";
import { stableHash } from "@/lib/utils/id";
import { useAllRecords, useDateRange } from "@/hooks/use-analytics";
import { useSettingsStore } from "@/store/settings-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { PlatformBadge } from "@/components/common/platform-badge";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { PerformanceTrendChart } from "@/components/charts/performance-trend-chart";
import { SpendRevenueChart } from "@/components/charts/spend-revenue-chart";
import { DataTable, type Column } from "@/components/tables/data-table";
import { metricColumns } from "@/components/tables/metric-columns";
import { AlertList } from "@/components/alerts/alert-list";
import type { AggregatedRow } from "@/types/analytics";

const TREND: MetricKey[] = ["roas", "spend", "revenue", "conversions", "ctr", "cpc", "cvr", "cpa"];

export function CampaignDetail({ id }: { id: string }) {
  const { ready, records } = useAllRecords();
  const { range, comparisonRange } = useDateRange();
  const thresholds = useSettingsStore((s) => s.settings.alertThresholds);
  const [metric, setMetric] = useState<MetricKey>("roas");

  const campaignRecords = useMemo(() => records.filter((r) => stableHash(campaignKeyOf(r)) === id), [records, id]);
  const info = campaignRecords[0];

  const d = useMemo(() => {
    const cur = filterByRange(campaignRecords, range);
    const prev = filterByRange(campaignRecords, comparisonRange);
    const prevGroups = new Map(aggregateByAdGroup(prev).map((r) => [r.key, r.metrics]));
    const sub = info?.platform === "naver_powerlink" ? aggregateByKeyword(cur) : info?.platform === "naver_shopping" ? aggregateByProduct(cur) : aggregateByAd(cur);
    const prevSub = new Map(
      (info?.platform === "naver_powerlink" ? aggregateByKeyword(prev) : info?.platform === "naver_shopping" ? aggregateByProduct(prev) : aggregateByAd(prev)).map((r) => [r.key, r.metrics]),
    );
    return {
      cur,
      total: summarize(cur),
      prevTotal: summarize(prev),
      daily: aggregateByDate(cur, range),
      groups: aggregateByAdGroup(cur),
      prevGroups,
      sub,
      prevSub,
      alerts: detectAnomalies({ records: campaignRecords, range, comparisonRange, thresholds }).filter((a) => a.scope.type !== "total" && a.scope.type !== "platform"),
    };
  }, [campaignRecords, range, comparisonRange, thresholds, info]);

  if (!ready) return <LoadingState />;
  if (!info) return <EmptyState title="캠페인을 찾을 수 없습니다." description="데이터가 삭제되었거나 잘못된 주소입니다." showUpload={false} />;

  const subLabel = info.platform === "naver_powerlink" ? "키워드" : info.platform === "naver_shopping" ? "상품" : "광고(소재)";
  const nameCol = (header: string): Column<AggregatedRow> => ({
    key: "name",
    header,
    sortValue: (r) => r.label,
    render: (r) => <span className="font-medium">{r.label}</span>,
  });
  const metricCols = ["spend", "impressions", "clicks", "ctr", "cpc", "conversions", "cvr", "revenue", "roas", "cpa"] as MetricKey[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/campaigns">
            <ArrowLeft /> 캠페인 목록
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{info.campaign}</h2>
            <PlatformBadge platform={info.platform as PlatformId} />
          </div>
          <p className="text-xs text-muted-foreground">
            {info.brand} · {PLATFORMS[info.platform].description} · 상단 기간 필터 기준
          </p>
        </div>
      </div>

      {d.cur.length === 0 ? (
        <EmptyState description="선택한 기간에 이 캠페인의 데이터가 없습니다. 기간 필터를 변경해주세요." showUpload={false} />
      ) : (
        <>
          <KpiGrid current={d.total} baselines={[{ label: "vs 이전 기간", metrics: d.prevTotal }]} />
          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>날짜별 광고비 · 매출</CardTitle>
                  <CardDescription>Tooltip 에서 ROAS · 전환 확인</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <SpendRevenueChart data={d.daily} height={250} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>날짜별 {METRICS[metric].label}</CardTitle>
                  <CardDescription>지표 선택</CardDescription>
                </div>
                <NativeSelect value={metric} onChange={(e) => setMetric(e.target.value as MetricKey)} className="w-32">
                  {TREND.map((m) => (
                    <option key={m} value={m}>
                      {METRICS[m].label}
                    </option>
                  ))}
                </NativeSelect>
              </CardHeader>
              <CardContent>
                <PerformanceTrendChart
                  data={d.daily.map((p) => ({ date: p.date, v: p.metrics[metric] }))}
                  series={[{ key: "v", label: METRICS[metric].label, color: PLATFORMS[info.platform].color }]}
                  metric={metric}
                  height={250}
                />
              </CardContent>
            </Card>
          </div>

          {d.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>이 캠페인의 Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertList alerts={d.alerts} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>광고그룹별 성과</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <DataTable columns={[nameCol("광고그룹"), ...metricColumns<AggregatedRow>(metricCols, (r) => d.prevGroups.get(r.key))]} rows={d.groups} rowKey={(r) => r.key} defaultSort={{ key: "spend", dir: "desc" }} />
            </CardContent>
          </Card>
          {d.sub.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{subLabel}별 성과</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <DataTable columns={[nameCol(subLabel), ...metricColumns<AggregatedRow>(metricCols, (r) => d.prevSub.get(r.key))]} rows={d.sub} rowKey={(r) => r.key} defaultSort={{ key: "spend", dir: "desc" }} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
