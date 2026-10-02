"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "@/types/analytics";
import { formatAxisWon, formatMetric, formatWon } from "@/lib/utils/format";
import { formatShortDate } from "@/lib/utils/date";
import { TooltipRow, TooltipShell, dateTick } from "./chart-tooltip";

const SPEND = "var(--chart-spend)";
const REVENUE = "var(--chart-revenue)";

interface Props {
  data: DailyPoint[];
  height?: number;
}

/** 날짜별 광고비(막대) · 매출(선). 두 값 모두 원 단위라 단일 축을 사용한다. ROAS · 전환은 Tooltip 에 표시 */
export function SpendRevenueChart({ data, height = 280 }: Props) {
  const rows = data.map((d) => ({ date: d.date, spend: d.metrics.spend, revenue: d.metrics.revenue, roas: d.metrics.roas, conversions: d.metrics.conversions }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="date" tickFormatter={dateTick} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} minTickGap={16} />
        <YAxis tickFormatter={formatAxisWon} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} width={48} />
        <Tooltip
          cursor={{ fill: "rgba(148,163,184,0.12)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as (typeof rows)[number];
            return (
              <TooltipShell title={formatShortDate(p.date, true)}>
                <TooltipRow color={SPEND} label="광고비" value={formatWon(p.spend)} />
                <TooltipRow color={REVENUE} label="매출" value={formatWon(p.revenue)} />
                <TooltipRow label="ROAS" value={formatMetric("roas", p.roas)} />
                <TooltipRow label="전환" value={formatMetric("conversions", p.conversions)} />
              </TooltipShell>
            );
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span className="text-muted-foreground">{v}</span>} />
        <Bar dataKey="spend" name="광고비" fill={SPEND} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Line dataKey="revenue" name="매출" stroke={REVENUE} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
