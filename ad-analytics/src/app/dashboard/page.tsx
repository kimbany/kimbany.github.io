"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Award, Bell, ShieldAlert } from "lucide-react";
import type { PlatformId } from "@/types/ad-data";
import { aggregateByDate, aggregateByPlatform, bestAndWorstChannel, countBySeverity, problemChannel, summarize } from "@/lib/analytics";
import { deltaOf } from "@/lib/analytics/compare";
import { PLATFORMS } from "@/lib/config/platforms";
import { formatRoas } from "@/lib/utils/format";
import { useAnalyticsScope, useInsights } from "@/hooks/use-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataGuard } from "@/components/common/data-guard";
import { ChangeIndicator } from "@/components/common/change-indicator";
import { PlatformBadge } from "@/components/common/platform-badge";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { SpendRevenueChart } from "@/components/charts/spend-revenue-chart";
import { ChannelShareChart } from "@/components/charts/channel-share-chart";
import { ChannelComparisonTable } from "@/components/tables/channel-comparison-table";
import { AlertList } from "@/components/alerts/alert-list";
import { InsightSummaryItem } from "@/components/insights/insight-card";

export default function DashboardPage() {
  const scope = useAnalyticsScope();
  const router = useRouter();
  const { current, previous, range, ready, hasAnyData, settings } = scope;
  const { alerts, ruleBased } = useInsights(scope);

  const data = useMemo(() => {
    const cur = summarize(current);
    const prev = summarize(previous);
    const platforms = aggregateByPlatform(current);
    const prevPlatforms = new Map(aggregateByPlatform(previous).map((r) => [r.key, r.metrics]));
    const daily = aggregateByDate(current, range);
    const { best } = bestAndWorstChannel(platforms, settings.alertThresholds.minDailySpendForEvaluation);
    return { cur, prev, platforms, prevPlatforms, daily, best };
  }, [current, previous, range, settings]);

  const problem = problemChannel(alerts);
  const counts = countBySeverity(alerts);
  const negativeAlerts = alerts.filter((a) => a.severity !== "positive");
  const keyAlerts = [...negativeAlerts.slice(0, 4), ...alerts.filter((a) => a.severity === "positive").slice(0, 1)];

  return (
    <DataGuard ready={ready} hasAnyData={hasAnyData} hasRangeData={current.length > 0}>
      <div className="space-y-5">
        <KpiGrid current={data.cur} baselines={[{ label: "vs 이전 기간", metrics: data.prev }]} />

        {/* 10초 요약: 가장 좋은 채널 / 문제 채널 / 핵심 Alert */}
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="px-4 py-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Award className="size-3.5 text-positive" /> 가장 성과 좋은 채널
            </div>
            {data.best ? (
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <PlatformBadge platform={data.best.platform as PlatformId} className="text-base font-semibold" />
                <div className="text-right">
                  <div className="text-lg font-semibold tabular">ROAS {formatRoas(data.best.metrics.roas)}</div>
                  <ChangeIndicator delta={deltaOf("roas", data.best.metrics.roas, data.prevPlatforms.get(data.best.key)?.roas ?? null)} />
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">-</p>
            )}
          </Card>
          <Card className="px-4 py-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ShieldAlert className="size-3.5 text-negative" /> 문제가 발생한 채널
            </div>
            {problem ? (
              <div className="mt-1.5">
                <PlatformBadge platform={problem.platform as PlatformId} className="text-base font-semibold" />
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{problem.top.message}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-positive">주요 채널에서 이상징후가 없습니다.</p>
            )}
          </Card>
          <Card className="px-4 py-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Bell className="size-3.5 text-warning" /> 오늘 확인해야 할 Alert
            </div>
            <div className="mt-1.5 flex items-baseline gap-3 tabular">
              <span className="text-lg font-semibold text-negative">Critical {counts.critical}</span>
              <span className="text-lg font-semibold text-warning">Warning {counts.warning}</span>
              <span className="text-sm font-medium text-positive">Positive {counts.positive}</span>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{negativeAlerts[0]?.message ?? "임계값을 넘는 이상징후가 없습니다."}</p>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>광고비 · 매출 추이</CardTitle>
                <CardDescription>막대: 광고비 / 선: 매출 · 마우스를 올리면 ROAS와 전환을 확인할 수 있습니다</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <SpendRevenueChart data={data.daily} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>선택 기간 기준 핵심 이슈와 다음 액션</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/insights">
                  전체 <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="px-3">
              {ruleBased.issues.length ? (
                <div className="divide-y">
                  {ruleBased.issues.slice(0, 5).map((i) => (
                    <InsightSummaryItem key={i.id} item={i} />
                  ))}
                </div>
              ) : (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">특이사항이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>채널별 성과 비교</CardTitle>
              <CardDescription>컬럼을 클릭하면 정렬됩니다 · 행을 클릭하면 Channel Analysis 로 이동 · 아래 작은 숫자는 이전 기간 대비 증감</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2">
            <ChannelComparisonTable rows={data.platforms} previous={data.prevPlatforms} onRowClick={() => router.push("/channels")} />
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Key Alerts</CardTitle>
                <CardDescription>시스템이 숫자로 탐지한 이상징후 (전일 · 최근 7일 평균 · 이전 기간 비교)</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/insights">
                  모든 Alert <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <AlertList alerts={keyAlerts} />
            </CardContent>
          </Card>
          <Card className="self-start">
            <CardHeader>
              <div>
                <CardTitle>채널 비중</CardTitle>
                <CardDescription>{data.platforms.map((p) => PLATFORMS[p.platform as PlatformId].shortLabel).join(" · ")}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ChannelShareChart rows={data.platforms} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DataGuard>
  );
}
