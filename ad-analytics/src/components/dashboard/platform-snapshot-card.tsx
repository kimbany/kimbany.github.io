import type { MetricKey, MetricSummary } from "@/types/analytics";
import type { PlatformId } from "@/types/ad-data";
import { METRICS } from "@/lib/config/metrics";
import { deltaOf } from "@/lib/analytics/compare";
import { formatMetric } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { ChangeIndicator } from "@/components/common/change-indicator";
import { PlatformBadge } from "@/components/common/platform-badge";

const ROWS: MetricKey[] = ["spend", "revenue", "roas", "conversions", "ctr", "cpc", "cvr", "cpa"];

/** 플랫폼 1개의 지표 스냅샷 + 비교 기준별 증감 */
export function PlatformSnapshotCard({
  platform,
  current,
  baselines,
}: {
  platform: PlatformId;
  current: MetricSummary;
  baselines: { label: string; metrics: MetricSummary }[];
}) {
  return (
    <Card className="px-4 py-3.5">
      <PlatformBadge platform={platform} className="text-sm font-semibold" />
      <table className="mt-2 w-full text-xs tabular">
        <thead>
          <tr className="text-[10px] text-muted-foreground">
            <th className="py-1 text-left font-normal">지표</th>
            <th className="py-1 text-right font-normal">값</th>
            {baselines.map((b) => (
              <th key={b.label} className="py-1 text-right font-normal">
                {b.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((m) => (
            <tr key={m} className="border-t">
              <td className="py-1.5 text-muted-foreground">{METRICS[m].label}</td>
              <td className="py-1.5 text-right font-medium">{formatMetric(m, current[m])}</td>
              {baselines.map((b) => (
                <td key={b.label} className="py-1.5 text-right">
                  <ChangeIndicator delta={deltaOf(m, current[m], b.metrics[m])} size="xs" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
