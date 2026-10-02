"use client";

import type { FlaggedRow, KeywordFlag, MetricSummary } from "@/types/analytics";
import { KEYWORD_FLAG_LABELS } from "@/lib/analytics/segments";
import { DataTable, type Column } from "./data-table";
import { metricColumns } from "./metric-columns";
import { FlagBadges } from "./flag-badges";

type Row = FlaggedRow<KeywordFlag>;

export function KeywordTable({ rows, previous }: { rows: Row[]; previous?: Map<string, MetricSummary> }) {
  const prev = previous ? (r: Row) => previous.get(r.key) : undefined;
  const columns: Column<Row>[] = [
    {
      key: "keyword",
      header: "Keyword",
      sortValue: (r) => r.label,
      render: (r) => (
        <div className="max-w-48">
          <div className="truncate font-medium">{r.label}</div>
          <div className="text-[11px] text-muted-foreground">{r.brand}</div>
        </div>
      ),
    },
    { key: "campaign", header: "Campaign", sortValue: (r) => r.campaign ?? "", render: (r) => <span className="text-xs">{r.campaign}</span> },
    ...metricColumns<Row>(["impressions", "clicks", "ctr", "cpc", "spend", "conversions", "revenue", "roas", "cpa"], prev),
    { key: "flags", header: "진단", render: (r) => <FlagBadges flags={r.flags} labels={KEYWORD_FLAG_LABELS} /> },
  ];
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.key} defaultSort={{ key: "spend", dir: "desc" }} rowClassName={(r) => (r.flags.includes("no_conversion") ? "bg-negative-soft/40" : undefined)} />;
}
