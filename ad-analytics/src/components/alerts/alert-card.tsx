import type { Alert } from "@/types/alerts";
import { METRICS } from "@/lib/config/metrics";
import { BASIS_LABELS } from "@/lib/analytics/anomalies";
import { formatChange, formatMetric } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { PlatformBadge } from "@/components/common/platform-badge";
import { Badge } from "@/components/ui/badge";
import { SEVERITY_META, SeverityBadge } from "./severity";

/** Alert 카드: 플랫폼 · 캠페인 · 지표 · 현재값 · 비교값 · 증감률 · 설명 */
export function AlertCard({ alert, compact, className }: { alert: Alert; compact?: boolean; className?: string }) {
  const m = SEVERITY_META[alert.severity];
  const metric = METRICS[alert.metric];
  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-card print-avoid-break", className)}>
      <div className={cn("absolute inset-y-0 left-0 w-1", m.bar)} />
      <div className={cn("pl-4 pr-4", compact ? "py-3" : "py-3.5")}>
        <div className="flex flex-wrap items-center gap-1.5">
          <SeverityBadge severity={alert.severity} />
          <span className="text-sm font-semibold">{alert.title}</span>
          <span className="ml-auto text-[11px] text-muted-foreground">{BASIS_LABELS[alert.basis]}</span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed">{alert.message}</p>
        {!compact && (
          <>
            <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-muted/60 px-3 py-2 text-xs sm:grid-cols-4">
              <Field label="플랫폼">{alert.scope.platform ? <PlatformBadge platform={alert.scope.platform} short /> : "전체"}</Field>
              <Field label="캠페인">{alert.scope.campaign ?? (alert.scope.entity ? alert.scope.entity : "-")}</Field>
              <Field label={`${metric.label} 현재`}>{formatMetric(alert.metric, alert.current)}</Field>
              <Field label="비교값 / 증감">
                {formatMetric(alert.metric, alert.baseline)}{" "}
                <span className={cn("font-semibold", alert.changePct != null && m.text)}>{alert.changePct != null ? formatChange(alert.changePct) : ""}</span>
              </Field>
            </div>
            {alert.detail && <p className="mt-2 text-xs text-muted-foreground">{alert.detail}</p>}
            {!!alert.related?.length && (
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="text-[11px] text-muted-foreground">함께 감지:</span>
                {alert.related.map((r) => (
                  <Badge key={r.ruleId} variant="outline">
                    {r.title} {r.changePct != null && formatChange(r.changePct)}
                  </Badge>
                ))}
              </div>
            )}
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              현재 {alert.currentLabel} · 비교 {alert.baselineLabel}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="truncate font-medium tabular">{children}</div>
    </div>
  );
}
