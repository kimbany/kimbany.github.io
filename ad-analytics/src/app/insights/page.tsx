"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, ChevronDown, Info, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import type { AIAnalysisResult } from "@/types/ai";
import { analyzePerformance } from "@/lib/ai/analyzePerformance";
import { countBySeverity } from "@/lib/analytics";
import { describeRange } from "@/lib/analytics/period";
import { useAnalyticsScope, useInsights } from "@/hooks/use-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataGuard } from "@/components/common/data-guard";
import { InsightCard } from "@/components/insights/insight-card";
import { AlertList } from "@/components/alerts/alert-list";

export default function InsightsPage() {
  const scope = useAnalyticsScope();
  const { ready, hasAnyData, current, range, comparisonRange } = scope;
  const { alerts, context, ruleBased } = useInsights(scope);
  const contextKey = useMemo(() => JSON.stringify({ ...context, generatedAt: "" }), [context]);
  const [ai, setAi] = useState<{ key: string; result: AIAnalysisResult; note?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);

  const result = ai && ai.key === contextKey ? ai.result : ruleBased;
  const counts = countBySeverity(alerts);

  // Dashboard 에서 특정 Insight 를 클릭해 들어온 경우 해당 카드로 스크롤
  useEffect(() => {
    if (!ready || typeof window === "undefined" || !window.location.hash) return;
    const el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("ring-2", "ring-primary/40");
      const t = setTimeout(() => el.classList.remove("ring-2", "ring-primary/40"), 2500);
      return () => clearTimeout(t);
    }
  }, [ready, result]);

  const run = async () => {
    setLoading(true);
    const key = contextKey;
    const out = await analyzePerformance(context);
    setAi({ key, result: out.result, note: out.fallbackReason });
    setLoading(false);
  };

  return (
    <DataGuard ready={ready} hasAnyData={hasAnyData} hasRangeData={current.length > 0}>
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>분석 요약</CardTitle>
                {result.source === "anthropic" ? (
                  <Badge variant="blue">
                    <Bot /> AI 분석 · {result.model}
                  </Badge>
                ) : (
                  <Badge variant="outline">규칙 기반 분석</Badge>
                )}
              </div>
              <CardDescription>
                {describeRange(range)} (비교 {describeRange(comparisonRange)}) · Critical {counts.critical} · Warning {counts.warning} · Positive {counts.positive}
              </CardDescription>
            </div>
            <Button onClick={run} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              AI 분석 실행
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{result.summary}</p>
            {ai?.note && ai.key === contextKey && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
                <Info className="size-3.5" /> {ai.note}
              </p>
            )}
            {result.recommendedActions.length > 0 && (
              <div className="mt-4 rounded-lg bg-muted/60 px-4 py-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">오늘의 우선순위 액션</div>
                <ol className="grid gap-1.5 text-sm md:grid-cols-2">
                  {result.recommendedActions.map((a) => (
                    <li key={a.priority} className="flex gap-2">
                      <span className="font-semibold tabular text-primary">{a.priority}.</span>
                      {a.action}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <button onClick={() => setShowContext((v) => !v)} className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ShieldCheck className="size-3.5" /> AI 에 전달되는 집계 데이터 보기 ({(contextKey.length / 1024).toFixed(1)}KB · 원본 데이터 미포함)
              <ChevronDown className={showContext ? "size-3.5 rotate-180" : "size-3.5"} />
            </button>
            {showContext && <pre className="mt-2 max-h-80 overflow-auto rounded-lg border bg-muted/40 p-3 text-[11px] leading-relaxed">{JSON.stringify(context, null, 2)}</pre>}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-[15px] font-semibold">문제 → 원인 → 확인 → 액션</h2>
          {result.issues.length ? (
            result.issues.map((item) => <InsightCard key={item.id} item={item} />)
          ) : (
            <Card className="px-5 py-8 text-center text-sm text-muted-foreground">임계값을 넘는 이슈가 없습니다. 현재 운영 기조를 유지하세요.</Card>
          )}
          <p className="text-[11px] text-muted-foreground">
            ※ 원인은 집계 지표(CTR · CPC · CVR · 객단가)의 변화로 추정한 &lsquo;가능성&rsquo;이며, 실제 원인은 운영 이력 확인이 필요합니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>전체 Alert</CardTitle>
              <CardDescription>Settings 의 Alert 기준으로 시스템이 자동 탐지한 결과</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AlertList alerts={alerts} filterable />
          </CardContent>
        </Card>
      </div>
    </DataGuard>
  );
}
