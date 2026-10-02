import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { AIAnalysisResult, PerformanceAnalysisContext } from "@/types/ai";
import { AIOutputSchema } from "../schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompt";

export const DEFAULT_MODEL = "claude-opus-5-5";

/** 서버 전용. ANTHROPIC_API_KEY 는 환경변수에서만 읽는다 (클라이언트 번들에 포함되지 않음) */
export async function analyzeWithAnthropic(ctx: PerformanceAnalysisContext): Promise<AIAnalysisResult> {
  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.parse({
    model,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: { effort: "medium", format: zodOutputFormat(AIOutputSchema) },
    messages: [{ role: "user", content: buildUserPrompt(ctx) }],
  });
  if (response.stop_reason === "refusal") throw new Error("AI 가 요청을 처리하지 않았습니다 (refusal).");
  const parsed = response.parsed_output;
  if (!parsed) throw new Error("AI 응답을 해석할 수 없습니다.");
  return { ...parsed, source: "anthropic", model, generatedAt: new Date().toISOString() };
}
