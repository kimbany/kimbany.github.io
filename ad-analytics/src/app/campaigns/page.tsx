"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { aggregateByCampaign, topCampaigns, underperformingCampaigns } from "@/lib/analytics";
import { formatRoas, formatWon } from "@/lib/utils/format";
import { stableHash } from "@/lib/utils/id";
import { useAnalyticsScope } from "@/hooks/use-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataGuard } from "@/components/common/data-guard";
import { PlatformBadge } from "@/components/common/platform-badge";
import { CampaignTable } from "@/components/tables/campaign-table";
import type { AggregatedRow } from "@/types/analytics";
import type { PlatformId } from "@/types/ad-data";

export default function CampaignsPage() {
  const router = useRouter();
  const scope = useAnalyticsScope();
  const { current, previous, ready, hasAnyData, settings } = scope;
  const [q, setQ] = useState("");

  const d = useMemo(() => {
    const rows = aggregateByCampaign(current);
    const opt = { targetRoas: settings.targetRoas, minSpend: settings.alertThresholds.zeroConversion.minSpend };
    return {
      rows,
      prev: new Map(aggregateByCampaign(previous).map((r) => [r.key, r.metrics])),
      top: topCampaigns(rows, opt, 3),
      under: underperformingCampaigns(rows, opt, 3),
    };
  }, [current, previous, settings]);

  const filtered = q ? d.rows.filter((r) => `${r.label} ${r.brand} ${r.platform}`.toLowerCase().includes(q.toLowerCase())) : d.rows;
  const open = (r: AggregatedRow) => router.push(`/campaigns/${stableHash(r.key)}`);

  return (
    <DataGuard ready={ready} hasAnyData={hasAnyData} hasRangeData={current.length > 0}>
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <MiniList title="ROAS 상위 캠페인" tone="positive" rows={d.top} onClick={open} />
          <MiniList title={`목표 ROAS(${settings.targetRoas}%) 미달 캠페인`} tone="negative" rows={d.under} onClick={open} />
        </div>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>캠페인 성과</CardTitle>
              <CardDescription>
                {filtered.length}개 캠페인 · 모든 컬럼 정렬 가능 · 행을 클릭하면 상세 페이지로 이동
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="캠페인 검색" className="h-8 pl-8 text-sm" />
            </div>
          </CardHeader>
          <CardContent className="px-2">
            <CampaignTable rows={filtered} previous={d.prev} onRowClick={open} />
          </CardContent>
        </Card>
      </div>
    </DataGuard>
  );
}

function MiniList({ title, rows, tone, onClick }: { title: string; rows: AggregatedRow[]; tone: "positive" | "negative"; onClick: (r: AggregatedRow) => void }) {
  return (
    <Card className="px-4 py-3.5">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <ul className="mt-2 space-y-1">
        {rows.map((r) => (
          <li key={r.key}>
            <button onClick={() => onClick(r)} className="flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left text-sm hover:bg-muted">
              <span className="flex min-w-0 items-center gap-2">
                <PlatformBadge platform={r.platform as PlatformId} short className="text-[11px] text-muted-foreground" />
                <span className="truncate font-medium">{r.label}</span>
                <span className="text-[11px] text-muted-foreground">{r.brand}</span>
              </span>
              <span className="shrink-0 tabular text-xs">
                <span className={tone === "positive" ? "font-semibold text-positive" : "font-semibold text-negative"}>{formatRoas(r.metrics.roas)}</span>
                <span className="ml-2 text-muted-foreground">{formatWon(r.metrics.spend)}</span>
              </span>
            </button>
          </li>
        ))}
        {!rows.length && <li className="py-2 text-xs text-muted-foreground">해당 캠페인이 없습니다.</li>}
      </ul>
    </Card>
  );
}
