import type { ReportData } from "@/types/report";
import type { AggregatedRow, MetricKey } from "@/types/analytics";
import type { PlatformId } from "@/types/ad-data";
import { KPI_METRICS, METRICS } from "@/lib/config/metrics";
import { deltaOf } from "@/lib/analytics/compare";
import { describeRange } from "@/lib/analytics/period";
import { formatMetric, formatRoas, formatWon } from "@/lib/utils/format";
import { ChangeIndicator } from "@/components/common/change-indicator";
import { PlatformBadge } from "@/components/common/platform-badge";
import { SeverityBadge } from "@/components/alerts/severity";
import { SpendRevenueChart } from "@/components/charts/spend-revenue-chart";

/** 경영진 보고용 단정한 레이아웃 (Print / PDF 저장 대응) */
export function ReportSummary({ report }: { report: ReportData }) {
  const { totals } = report;
  return (
    <article className="mx-auto max-w-[960px] rounded-xl border bg-white px-8 py-8 print:rounded-none print:border-0 print:px-0 print:py-0">
      <header className="border-b pb-5">
        <div className="text-xs font-medium text-primary">AD PERFORMANCE REPORT</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{report.title}</h1>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span>기간 {describeRange(report.range)}</span>
          <span>비교 {describeRange(report.comparisonRange)}</span>
          <span>작성 {new Date(report.generatedAt).toLocaleString("ko-KR")}</span>
        </div>
      </header>

      <Section title="핵심 요약">
        <p className="text-sm leading-relaxed">{report.analysis.summary}</p>
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
          {KPI_METRICS.map((m) => (
            <div key={m} className="bg-white px-4 py-3">
              <div className="text-[11px] text-muted-foreground">{METRICS[m].label}</div>
              <div className="mt-0.5 text-lg font-semibold tabular">{formatMetric(m, totals.current[m])}</div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ChangeIndicator delta={deltaOf(m, totals.current[m], totals.previous[m])} size="xs" />
                <span>이전 {formatMetric(m, totals.previous[m])}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {report.type !== "daily" && report.daily.length > 1 && (
        <Section title="일별 광고비 · 매출 추이">
          <SpendRevenueChart data={report.daily} height={220} />
        </Section>
      )}

      <Section title="플랫폼별 성과 (이전 기간 대비)">
        <SimpleTable
          rows={report.platforms}
          name={(r) => <PlatformBadge platform={r.platform as PlatformId} />}
          metrics={["spend", "revenue", "roas", "conversions", "ctr", "cpc", "cvr", "cpa"]}
          previous={(r) => report.previousPlatforms[r.key]}
        />
      </Section>

      <Section title="캠페인별 성과 (광고비 상위 10)">
        <SimpleTable
          rows={report.campaigns.slice(0, 10)}
          name={(r) => (
            <span>
              {r.label} <span className="text-[11px] text-muted-foreground">{r.brand}</span>
            </span>
          )}
          metrics={["spend", "revenue", "roas", "conversions", "cpa"]}
          previous={(r) => report.previousCampaigns[r.key]}
        />
      </Section>

      <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
        <Section title="Top Campaigns">
          <RankList rows={report.topCampaigns} tone="positive" />
        </Section>
        <Section title="Underperforming Campaigns">
          <RankList rows={report.underperformingCampaigns} tone="negative" />
        </Section>
        <Section title="Top Products">
          <RankList rows={report.topProducts} tone="positive" />
        </Section>
        <Section title="Wasteful Keywords">
          <RankList rows={report.wastefulKeywords} tone="negative" showConv />
        </Section>
      </div>

      <Section title="Key Alerts" className="print-break-before">
        {report.alerts.length ? (
          <ul className="divide-y rounded-lg border">
            {report.alerts.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-2.5 text-sm print-avoid-break">
                <SeverityBadge severity={a.severity} />
                <span className="leading-relaxed">{a.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">임계값을 넘는 이상징후가 없습니다.</p>
        )}
      </Section>

      <Section title="AI Insights">
        <div className="space-y-3">
          {report.analysis.issues.slice(0, 5).map((i) => (
            <div key={i.id} className="rounded-lg border px-4 py-3 print-avoid-break">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={i.severity} />
                <span className="text-sm font-semibold">{i.title}</span>
              </div>
              <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-[88px_1fr]">
                <dt className="text-muted-foreground">문제</dt>
                <dd>{i.problem}</dd>
                <dt className="text-muted-foreground">가능한 원인</dt>
                <dd>{i.possibleCauses.join(" ")}</dd>
                <dt className="text-muted-foreground">확인 사항</dt>
                <dd>{i.checks.slice(0, 6).join(", ")}</dd>
                <dt className="text-muted-foreground">권장 액션</dt>
                <dd>{i.recommendedActions.map((a) => `${a.priority}순위 ${a.action}`).join(" / ")}</dd>
              </dl>
            </div>
          ))}
          {!report.analysis.issues.length && <p className="text-sm text-muted-foreground">특이 이슈가 없습니다.</p>}
        </div>
      </Section>

      <Section title="Recommended Actions">
        <ol className="space-y-1.5 text-sm">
          {report.analysis.recommendedActions.map((a) => (
            <li key={a.priority} className="flex gap-2">
              <span className="font-semibold text-primary tabular">{a.priority}.</span>
              {a.action}
            </li>
          ))}
        </ol>
      </Section>
    </article>
  );
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`mt-7 ${className ?? ""}`}>
      <h2 className="mb-3 text-sm font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function SimpleTable({
  rows,
  name,
  metrics,
  previous,
}: {
  rows: AggregatedRow[];
  name: (r: AggregatedRow) => React.ReactNode;
  metrics: MetricKey[];
  previous: (r: AggregatedRow) => AggregatedRow["metrics"] | undefined;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs tabular">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="py-2 pr-3 text-left font-medium">구분</th>
            {metrics.map((m) => (
              <th key={m} className="px-2 py-2 text-right font-medium">
                {METRICS[m].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const p = previous(r);
            return (
              <tr key={r.key} className="border-b last:border-0">
                <td className="py-2 pr-3 font-medium">{name(r)}</td>
                {metrics.map((m) => (
                  <td key={m} className="px-2 py-2 text-right">
                    <div>{formatMetric(m, r.metrics[m])}</div>
                    {p && <ChangeIndicator delta={deltaOf(m, r.metrics[m], p[m])} size="xs" />}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RankList({ rows, tone, showConv }: { rows: AggregatedRow[]; tone: "positive" | "negative"; showConv?: boolean }) {
  if (!rows.length) return <p className="text-xs text-muted-foreground">해당 항목이 없습니다.</p>;
  return (
    <ol className="space-y-1.5 text-xs">
      {rows.map((r, i) => (
        <li key={r.key} className="flex items-center justify-between gap-2">
          <span className="truncate">
            <span className="mr-1.5 text-muted-foreground">{i + 1}</span>
            {r.label} <span className="text-muted-foreground">{r.brand}</span>
          </span>
          <span className="shrink-0 tabular">
            <span className={tone === "positive" ? "font-semibold text-positive" : "font-semibold text-negative"}>{formatRoas(r.metrics.roas)}</span>
            <span className="ml-2 text-muted-foreground">
              {formatWon(r.metrics.spend)}
              {showConv && ` · 전환 ${formatMetric("conversions", r.metrics.conversions)}`}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
