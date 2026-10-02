"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MetricKey } from "@/types/analytics";
import { formatAxisWon, formatMetric } from "@/lib/utils/format";
import { formatShortDate } from "@/lib/utils/date";
import { TooltipRow, TooltipShell, dateTick } from "./chart-tooltip";

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

interface Props {
  /** [{ date, [series.key]: number|null }] */
  data: Array<Record<string, string | number | null>>;
  series: TrendSeries[];
  metric: MetricKey;
  height?: number;
}

const MONEY: MetricKey[] = ["spend", "revenue", "cpc", "cpa", "cpm", "aov"];

/** 선택 지표의 날짜별 추이 (여러 시리즈 비교 가능, 단일 축) */
export function PerformanceTrendChart({ data, series, metric, height = 260 }: Props) {
  const axisFmt = (v: number) => (MONEY.includes(metric) ? formatAxisWon(v) : metric === "roas" ? `${Math.round(v)}%` : metric === "ctr" || metric === "cvr" ? `${v.toFixed(1)}%` : v.toLocaleString("ko-KR"));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="date" tickFormatter={dateTick} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} minTickGap={16} />
        <YAxis tickFormatter={axisFmt} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} width={52} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <TooltipShell title={formatShortDate(String(label), true)}>
                {series.map((s) => {
                  const row = payload[0].payload as Record<string, number | null>;
                  return <TooltipRow key={s.key} color={s.color} label={s.label} value={formatMetric(metric, row[s.key])} />;
                })}
              </TooltipShell>
            );
          }}
        />
        {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span className="text-muted-foreground">{v}</span>} />}
        {series.map((s) => (
          <Line key={s.key} dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} connectNulls activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
