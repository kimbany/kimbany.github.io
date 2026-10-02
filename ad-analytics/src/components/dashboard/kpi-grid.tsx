import type { MetricKey, MetricSummary } from "@/types/analytics";
import { KPI_METRICS } from "@/lib/config/metrics";
import { deltaOf } from "@/lib/analytics/compare";
import { KpiCard } from "./kpi-card";
import { cn } from "@/lib/utils/cn";

interface KpiGridProps {
  current: MetricSummary;
  baselines: { label: string; metrics: MetricSummary }[];
  metrics?: MetricKey[];
  highlight?: MetricKey[];
  className?: string;
}

export function KpiGrid({ current, baselines, metrics = KPI_METRICS, highlight = ["spend", "revenue", "roas", "conversions"], className }: KpiGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-4", className)}>
      {metrics.map((m) => (
        <KpiCard
          key={m}
          metric={m}
          value={current[m]}
          highlight={highlight.includes(m)}
          comparisons={baselines.map((b) => ({ label: b.label, delta: deltaOf(m, current[m], b.metrics[m]) }))}
        />
      ))}
    </div>
  );
}
