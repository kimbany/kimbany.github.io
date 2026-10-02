"use client";

import { useMemo, useState } from "react";
import { Flame, Trash2 } from "lucide-react";
import type { KeywordFlag } from "@/types/analytics";
import { aggregateByKeyword, classifyKeywords, highPerformingKeywords, wastefulKeywords } from "@/lib/analytics";
import { KEYWORD_FLAG_LABELS } from "@/lib/analytics/segments";
import { formatMetric, formatWon } from "@/lib/utils/format";
import { useAnalyticsScope } from "@/hooks/use-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGuard } from "@/components/common/data-guard";
import { EmptyState } from "@/components/common/empty-state";
import { SegmentChips } from "@/components/common/segment-chips";
import { EntityRankCard } from "@/components/common/entity-rank-card";
import { KeywordTable } from "@/components/tables/keyword-table";

type Segment = "all" | KeywordFlag;
const SEGMENTS: Segment[] = ["all", "no_conversion", "high_cpc", "low_ctr", "low_roas", "high_roas", "high_cvr"];

export default function KeywordsPage() {
  const scope = useAnalyticsScope();
  const { current, previous, ready, hasAnyData, settings } = scope;
  const [segment, setSegment] = useState<Segment>("all");

  const d = useMemo(() => {
    const opt = { targetRoas: settings.targetRoas, minSpend: settings.alertThresholds.zeroConversion.minSpend, minClicks: settings.alertThresholds.minClicksForRatio };
    const rows = classifyKeywords(aggregateByKeyword(current), opt);
    const wasteful = wastefulKeywords(rows);
    return {
      rows,
      prev: new Map(aggregateByKeyword(previous).map((r) => [r.key, r.metrics])),
      high: highPerformingKeywords(rows),
      wasteful,
      wastedSpend: rows.filter((r) => r.flags.includes("no_conversion")).reduce((s, r) => s + r.metrics.spend, 0),
    };
  }, [current, previous, settings]);

  const filtered = segment === "all" ? d.rows : d.rows.filter((r) => r.flags.includes(segment));
  const options = SEGMENTS.map((s) => ({ id: s, label: s === "all" ? "전체" : KEYWORD_FLAG_LABELS[s], count: s === "all" ? d.rows.length : d.rows.filter((r) => r.flags.includes(s)).length }));

  return (
    <DataGuard ready={ready} hasAnyData={hasAnyData} hasRangeData={current.length > 0}>
      {d.rows.length === 0 ? (
        <EmptyState title="키워드 단위 데이터가 없습니다." description="네이버 파워링크 키워드 보고서를 업로드하거나 플랫폼 필터를 확인해주세요." />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-2">
            <EntityRankCard
              title="High Performing Keywords"
              description="ROAS 또는 전환율이 높은 키워드 — 입찰 강화 후보"
              rows={d.high}
              tone="positive"
              icon={<Flame className="size-4 text-positive" />}
              extra={(r) => `CVR ${formatMetric("cvr", r.metrics.cvr)}`}
            />
            <EntityRankCard
              title="Wasteful Keywords"
              description={`전환 없이 광고비가 발생했거나 ROAS 가 목표 미달인 키워드 · 전환 0 키워드 광고비 합계 ${formatWon(d.wastedSpend)}`}
              rows={d.wasteful}
              tone="negative"
              icon={<Trash2 className="size-4 text-negative" />}
              extra={(r) => `전환 ${formatMetric("conversions", r.metrics.conversions)}건 · CPC ${formatMetric("cpc", r.metrics.cpc)}`}
            />
          </div>
          <Card>
            <CardHeader className="flex-col items-stretch sm:flex-row sm:items-start">
              <div>
                <CardTitle>키워드 성과</CardTitle>
                <CardDescription>CPC 높음 / CTR 낮음은 전체 키워드 평균 대비 판정 · 작은 숫자는 이전 기간 대비</CardDescription>
              </div>
              <SegmentChips options={options} value={segment} onChange={setSegment} />
            </CardHeader>
            <CardContent className="px-2">
              <KeywordTable rows={filtered} previous={d.prev} />
            </CardContent>
          </Card>
        </div>
      )}
    </DataGuard>
  );
}
