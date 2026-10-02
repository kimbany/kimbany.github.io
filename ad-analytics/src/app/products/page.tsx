"use client";

import { useMemo, useState } from "react";
import { TrendingDown, Trophy } from "lucide-react";
import type { ProductFlag } from "@/types/analytics";
import { aggregateByProduct, classifyProducts, topProducts, underperformingProducts } from "@/lib/analytics";
import { PRODUCT_FLAG_LABELS } from "@/lib/analytics/segments";
import { formatMetric } from "@/lib/utils/format";
import { useAnalyticsScope } from "@/hooks/use-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGuard } from "@/components/common/data-guard";
import { EmptyState } from "@/components/common/empty-state";
import { SegmentChips } from "@/components/common/segment-chips";
import { EntityRankCard } from "@/components/common/entity-rank-card";
import { EntityBarChart } from "@/components/charts/entity-bar-chart";
import { ProductTable } from "@/components/tables/product-table";

type Segment = "all" | ProductFlag;
const SEGMENTS: Segment[] = ["all", "high_spend", "high_revenue", "high_roas", "high_spend_low_revenue", "no_conversion"];

export default function ProductsPage() {
  const scope = useAnalyticsScope();
  const { current, previous, ready, hasAnyData, settings } = scope;
  const [segment, setSegment] = useState<Segment>("all");

  const d = useMemo(() => {
    const opt = { targetRoas: settings.targetRoas, minSpend: settings.alertThresholds.zeroConversion.minSpend };
    const rows = classifyProducts(aggregateByProduct(current), opt);
    return {
      rows,
      prev: new Map(aggregateByProduct(previous).map((r) => [r.key, r.metrics])),
      top: topProducts(rows),
      under: underperformingProducts(rows),
    };
  }, [current, previous, settings]);

  const filtered = segment === "all" ? d.rows : d.rows.filter((r) => r.flags.includes(segment));
  const options = SEGMENTS.map((s) => ({ id: s, label: s === "all" ? "전체" : PRODUCT_FLAG_LABELS[s], count: s === "all" ? d.rows.length : d.rows.filter((r) => r.flags.includes(s)).length }));

  return (
    <DataGuard ready={ready} hasAnyData={hasAnyData} hasRangeData={current.length > 0}>
      {d.rows.length === 0 ? (
        <EmptyState title="상품 단위 데이터가 없습니다." description="네이버 쇼핑검색광고 보고서(상품/소재 포함)를 업로드하거나 플랫폼 필터를 확인해주세요." />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-2">
            <EntityRankCard title="Top Products" description="매출 기준 상위 상품" rows={d.top} tone="positive" icon={<Trophy className="size-4 text-positive" />} />
            <EntityRankCard
              title="Underperforming Products"
              description={`광고비가 높지만 목표 ROAS(${settings.targetRoas}%) 미달이거나 전환이 없는 상품`}
              rows={d.under}
              tone="negative"
              icon={<TrendingDown className="size-4 text-negative" />}
              extra={(r) => `전환 ${formatMetric("conversions", r.metrics.conversions)}건`}
            />
          </div>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>상품별 광고비 vs 매출</CardTitle>
                <CardDescription>광고비 상위 10개 상품</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <EntityBarChart rows={d.rows} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-col items-stretch sm:flex-row sm:items-start">
              <div>
                <CardTitle>상품 성과</CardTitle>
                <CardDescription>칩을 눌러 조건에 맞는 상품만 보기 · 작은 숫자는 이전 기간 대비</CardDescription>
              </div>
              <SegmentChips options={options} value={segment} onChange={setSegment} />
            </CardHeader>
            <CardContent className="px-2">
              <ProductTable rows={filtered} previous={d.prev} />
            </CardContent>
          </Card>
        </div>
      )}
    </DataGuard>
  );
}
