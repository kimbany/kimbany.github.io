import { NextResponse } from "next/server";
import type { PerformanceAnalysisContext } from "@/types/ai";
import { analyzeWithRules } from "@/lib/ai/rule-based-analyzer";
import { analyzeWithAnthropic } from "@/lib/ai/providers/anthropic";

export const runtime = "nodejs";

const MAX_BODY = 200_000;

export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: "요청이 너무 큽니다. 집계 데이터만 전송해야 합니다." }, { status: 413 });
  }
  let ctx: PerformanceAnalysisContext;
  try {
    ctx = (JSON.parse(text) as { context: PerformanceAnalysisContext }).context;
    if (!ctx?.totals || !Array.isArray(ctx.alerts)) throw new Error("invalid");
  } catch {
    return NextResponse.json({ error: "잘못된 분석 컨텍스트입니다." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      result: analyzeWithRules(ctx),
      fallbackReason: "ANTHROPIC_API_KEY 가 설정되지 않아 규칙 기반 분석을 사용했습니다.",
    });
  }
  try {
    return NextResponse.json({ result: await analyzeWithAnthropic(ctx) });
  } catch (e) {
    console.error("[ai/analyze]", e);
    return NextResponse.json({
      result: analyzeWithRules(ctx),
      fallbackReason: `AI 호출 실패로 규칙 기반 분석을 사용했습니다: ${(e as Error).message}`,
    });
  }
}
