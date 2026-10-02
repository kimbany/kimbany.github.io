"use client";

import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import type { ReportType } from "@/types/report";
import { buildReport, dataDateBounds, reportPeriod, REPORT_LABELS } from "@/lib/analytics";
import { useAnalyticsScope, useToday } from "@/hooks/use-analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataGuard } from "@/components/common/data-guard";
import { EmptyState } from "@/components/common/empty-state";
import { ReportSummary } from "@/components/reports/report-summary";

export default function ReportsPage() {
  const today = useToday();
  const scope = useAnalyticsScope();
  const { scoped, ready, hasAnyData, settings, filters } = scope;
  const [type, setType] = useState<ReportType>("weekly");
  const [anchor, setAnchor] = useState<string | null>(null);
  const bounds = useMemo(() => dataDateBounds(scoped), [scoped]);
  const date = anchor ?? (bounds && bounds.end < today ? bounds.end : today);

  const report = useMemo(() => {
    const { range, comparisonRange } = reportPeriod(type, date, today);
    return buildReport({ type, records: scoped, range, comparisonRange, settings, filters });
  }, [type, date, today, scoped, settings, filters]);

  return (
    <DataGuard ready={ready} hasAnyData={hasAnyData}>
      <div className="space-y-4">
        <div data-print-hide className="flex flex-wrap items-center gap-2">
          <Tabs value={type} onValueChange={(v) => setType(v as ReportType)}>
            <TabsList>
              {(["daily", "weekly", "monthly"] as const).map((t) => (
                <TabsTrigger key={t} value={t}>
                  {REPORT_LABELS[t]} Report
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {type === "monthly" ? (
            <Input type="month" value={date.slice(0, 7)} max={today.slice(0, 7)} onChange={(e) => e.target.value && setAnchor(`${e.target.value}-01`)} className="h-8 w-40 text-sm" />
          ) : (
            <Input type="date" value={date} max={today} onChange={(e) => e.target.value && setAnchor(e.target.value)} className="h-8 w-40 text-sm" />
          )}
          {type === "weekly" && <span className="text-xs text-muted-foreground">선택한 날짜가 포함된 주(월~일)</span>}
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => window.print()}>
            <Printer /> 인쇄 / PDF 저장
          </Button>
        </div>
        {report.totals.current.spend === 0 && report.totals.current.impressions === 0 ? (
          <EmptyState description="보고서 기간을 변경하거나 해당 기간 보고서를 업로드해주세요." />
        ) : (
          <ReportSummary report={report} />
        )}
      </div>
    </DataGuard>
  );
}
