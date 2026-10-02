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
}

export function ChannelComparisonTable({ rows, previous, onRowClick }: Props) {
  const columns: Column<AggregatedRow>[] = [
    {
      key: "platform",
      header: "Platform",
      sortValue: (r) => PLATFORMS[r.platform as PlatformId]?.label ?? r.label,
      render: (r) => <PlatformBadge platform={r.platform as PlatformId} className="font-medium" />,
    },
    ...metricColumns<AggregatedRow>(
      ["spend", "revenue", "roas", "impressions", "clicks", "ctr", "cpc", "conversions", "cvr", "cpa"],
      previous ? (r) => previous.get(r.key) : undefined,
    ),
  ];
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.key} defaultSort={{ key: "spend", dir: "desc" }} onRowClick={onRowClick} />;
}
