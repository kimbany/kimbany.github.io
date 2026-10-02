"use client";

import type { AggregatedRow, MetricSummary } from "@/types/analytics";
import type { PlatformId } from "@/types/ad-data";
import { PLATFORMS } from "@/lib/config/platforms";
import { DataTable, type Column } from "./data-table";
import { metricColumns } from "./metric-columns";
import { PlatformBadge } from "@/components/common/platform-badge";

interface Props {
  rows: AggregatedRow[];
  previous?: Map<string, MetricSummary>;
  onRowClick?: (row: AggregatedRow) => void;
  maxRows?: number;
}

export function CampaignTable({ rows, previous, onRowClick, maxRows }: Props) {
  const columns: Column<AggregatedRow>[] = [
    {
      key: "campaign",
      header: "Campaign",
      sortValue: (r) => r.label,
      render: (r) => (
        <div className="max-w-64">
          <div className="truncate font-medium text-foreground">{r.label}</div>
          <div className="text-[11px] text-muted-foreground">{r.brand}</div>
        </div>
      ),
    },
    {
      key: "platform",
      header: "Platform",
      sortValue: (r) => PLATFORMS[r.platform as PlatformId]?.label ?? "",
      render: (r) => <PlatformBadge platform={r.platform as PlatformId} short />,
    },
    ...metricColumns<AggregatedRow>(
      ["spend", "impressions", "clicks", "ctr", "cpc", "conversions", "cvr", "revenue", "roas", "cpa"],
      previous ? (r) => previous.get(r.key) : undefined,
    ),
  ];
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.key} defaultSort={{ key: "spend", dir: "desc" }} onRowClick={onRowClick} maxRows={maxRows} />;
}
