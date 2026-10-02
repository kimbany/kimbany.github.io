"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AggregatedRow } from "@/types/analytics";
import { PLATFORMS } from "@/lib/config/platforms";
import { safeDivide } from "@/lib/analytics/metrics";
import { formatPercent, formatWon, formatWonCompact } from "@/lib/utils/format";
import type { PlatformId } from "@/types/ad-data";
import { TooltipRow, TooltipShell } from "./chart-tooltip";

function Donut({ rows, field, title }: { rows: AggregatedRow[]; field: "spend" | "revenue"; title: string }) {
  const total = rows.reduce((s, r) => s + r.metrics[field], 0);
  const data = rows.map((r) => ({
    platform: r.platform as PlatformId,
    name: PLATFORMS[r.platform as PlatformId]?.label ?? r.label,
    value: r.metrics[field],
    share: safeDivide(r.metrics[field], total, 100),
  }));
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div className="relative h-36 w-36">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="95%" paddingAngle={1.5} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.platform} fill={PLATFORMS[d.platform]?.color ?? "#9ca3af"} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <TooltipShell title={d.name}>
                    <TooltipRow label={title} value={formatWon(d.value)} />
                    <TooltipRow label="비중" value={formatPercent(d.share, 1)} />
                  </TooltipShell>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-muted-foreground">합계</span>
          <span className="text-xs font-semibold tabular">{formatWonCompact(total)}</span>
        </div>
      </div>
      <ul className="mt-1 w-full space-y-1">
        {data.map((d) => (
          <li key={d.platform} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full" style={{ background: PLATFORMS[d.platform]?.color }} />
              {PLATFORMS[d.platform]?.shortLabel}
            </span>
            <span className="font-medium tabular">{formatPercent(d.share, 1)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 채널별 광고비 비중 / 매출 비중 */
export function ChannelShareChart({ rows }: { rows: AggregatedRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Donut rows={rows} field="spend" title="광고비 비중" />
      <Donut rows={rows} field="revenue" title="매출 비중" />
    </div>
  );
}
