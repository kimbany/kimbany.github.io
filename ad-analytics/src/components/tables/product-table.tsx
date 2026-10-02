"use client";

import type { FlaggedRow, MetricSummary, ProductFlag } from "@/types/analytics";
import { PRODUCT_FLAG_LABELS } from "@/lib/analytics/segments";
import { DataTable, type Column } from "./data-table";
import { metricColumn, metricColumns } from "./metric-columns";
import { FlagBadges } from "./flag-badges";

type Row = FlaggedRow<ProductFlag>;

export function ProductTable({ rows, previous }: { rows: Row[]; previous?: Map<string, MetricSummary> }) {
  const prev = previous ? (r: Row) => previous.get(r.key) : undefined;
  const columns: Column<Row>[] = [
    {
      key: "product",
      header: "Product",
      sortValue: (r) => r.label,
      render: (r) => (
        <div className="max-w-56">
          <div className="truncate font-medium">{r.label}</div>
          <div className="text-[11px] text-muted-foreground">
            {r.brand} · {r.campaign}
          </div>
        </div>
      ),
    },
    ...metricColumns<Row>(["spend", "impressions", "clicks", "ctr", "cpc"], prev),
    metricColumn<Row>("conversions", { previous: prev, header: "Orders" }),
    ...metricColumns<Row>(["revenue", "roas", "cvr", "cpa"], prev),
    { key: "flags", header: "진단", render: (r) => <FlagBadges flags={r.flags} labels={PRODUCT_FLAG_LABELS} /> },
  ];
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.key} defaultSort={{ key: "spend", dir: "desc" }} rowClassName={(r) => (r.flags.includes("no_conversion") ? "bg-negative-soft/40" : undefined)} />;
}
