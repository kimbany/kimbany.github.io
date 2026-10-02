"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AggregatedRow } from "@/types/analytics";
import { formatAxisWon, formatMetric, formatWon } from "@/lib/utils/format";
import { TooltipRow, TooltipShell } from "./chart-tooltip";

/** 항목별 광고비 vs 매출 (가로 막대, 단일 축) */
export function EntityBarChart({ rows, limit = 10 }: { rows: AggregatedRow[]; limit?: number }) {
  const data = rows.slice(0, limit).map((r) => ({ name: r.label, spend: r.metrics.spend, revenue: r.metrics.revenue, roas: r.metrics.roas }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barGap={2} barCategoryGap="24%">
        <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
        <XAxis type="number" tickFormatter={formatAxisWon} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#374151" }} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(148,163,184,0.12)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as (typeof data)[number];
            return (
              <TooltipShell title={p.name}>
                <TooltipRow color="var(--chart-spend)" label="광고비" value={formatWon(p.spend)} />
                <TooltipRow color="var(--chart-revenue)" label="매출" value={formatWon(p.revenue)} />
                <TooltipRow label="ROAS" value={formatMetric("roas", p.roas)} />
              </TooltipShell>
            );
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span className="text-muted-foreground">{v}</span>} />
        <Bar dataKey="spend" name="광고비" fill="var(--chart-spend)" radius={[0, 4, 4, 0]} maxBarSize={12} />
        <Bar dataKey="revenue" name="매출" fill="var(--chart-revenue)" radius={[0, 4, 4, 0]} maxBarSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}
