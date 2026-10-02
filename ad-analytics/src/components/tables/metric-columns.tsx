import type { AggregatedRow, MetricKey, MetricSummary } from "@/types/analytics";
import { METRICS } from "@/lib/config/metrics";
import { formatMetric } from "@/lib/utils/format";
import { deltaOf } from "@/lib/analytics/compare";
import { ChangeIndicator } from "@/components/common/change-indicator";
import type { Column } from "./data-table";

/** 지표 컬럼 생성기. previous 를 주면 증감률을 함께 표시 */
export function metricColumn<T extends { metrics: MetricSummary }>(
  metric: MetricKey,
  opts: { previous?: (row: T) => MetricSummary | undefined; header?: string; emphasize?: boolean } = {},
): Column<T> {
  return {
    key: metric,
    header: opts.header ?? METRICS[metric].label,
    align: "right",
    sortValue: (r) => r.metrics[metric],
    render: (r) => {
      const prev = opts.previous?.(r);
      return (
        <div className="flex flex-col items-end leading-tight">
          <span className={opts.emphasize ? "font-semibold" : undefined}>{formatMetric(metric, r.metrics[metric])}</span>
          {prev && <ChangeIndicator delta={deltaOf(metric, r.metrics[metric], prev[metric])} size="xs" />}
        </div>
      );
    },
  };
}

export function metricColumns<T extends AggregatedRow>(metrics: MetricKey[], previous?: (row: T) => MetricSummary | undefined, emphasize: MetricKey[] = ["roas"]): Column<T>[] {
  return metrics.map((m) => metricColumn<T>(m, { previous, emphasize: emphasize.includes(m) }));
}
