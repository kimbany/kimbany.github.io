import type { MetricDelta, MetricKey } from "@/types/analytics";
import { METRICS } from "@/lib/config/metrics";
import { formatMetric, formatWonCompact } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { ChangeIndicator } from "@/components/common/change-indicator";
import { cn } from "@/lib/utils/cn";

interface KpiCardProps {
  metric: MetricKey;
  value: number | null;
  comparisons: { label: string; delta: MetricDelta }[];
  highlight?: boolean;
  className?: string;
}

/** 현재값 + 비교 기준별 증감률 */
export function KpiCard({ metric, value, comparisons, highlight, className }: KpiCardProps) {
  const def = METRICS[metric];
  const isMoney = metric === "spend" || metric === "revenue";
  return (
    <Card className={cn("px-4 py-3.5 print-avoid-break", highlight && "border-primary/30", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground" title={def.description}>
          {def.label}
        </span>
      </div>
      <div className={cn("mt-1 font-semibold tracking-tight tabular", "whitespace-nowrap", highlight ? "text-[19px] sm:text-[22px] xl:text-[26px]" : "text-[18px] sm:text-[22px]")}>{formatMetric(metric, value)}</div>
      {isMoney && value != null && value >= 1_000_000 && <div className="-mt-0.5 text-[11px] text-muted-foreground">{formatWonCompact(value)}</div>}
      <div className="mt-1.5 space-y-0.5">
        {comparisons.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <ChangeIndicator delta={c.delta} />
            <span className="text-[11px] text-muted-foreground">{c.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
