/**
 * AI 분석 클라이언트 엔트리.
 * 서버 API Route(/api/ai/analyze)로 '집계된 컨텍스트'만 전송한다.
 * 서버에 API Key 가 없거나 호출이 실패하면 규칙 기반 분석 결과로 대체한다.
 */
import type { AIAnalysisResult, PerformanceAnalysisContext } from "@/types/ai";
import { analyzeWithRules } from "./rule-based-analyzer";

export interface AnalyzeOutcome {
  result: AIAnalysisResult;
  /** 서버 호출 실패 등으로 대체된 경우 사유 */
  fallbackReason?: string;
}

export async function analyzePerformance(ctx: PerformanceAnalysisContext): Promise<AnalyzeOutcome> {
  try {
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: ctx }),
    });
    const body = (await res.json()) as { result?: AIAnalysisResult; error?: string; fallbackReason?: string };
    if (!res.ok || !body.result) throw new Error(body.error || `HTTP ${res.status}`);
    return { result: body.result, fallbackReason: body.fallbackReason };
  } catch (e) {
    return { result: analyzeWithRules(ctx), fallbackReason: `AI 서버 호출 실패: ${(e as Error).message}` };
  }
}

export { analyzeWithRules };
