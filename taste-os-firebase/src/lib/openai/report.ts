import "server-only";
import { openai, MODELS, SAFE_DEFAULTS } from "./client";
import { REPORT_SYSTEM } from "./prompts";
import type { GenomeEntry } from "@/lib/firebase/collections";
import type { Fusion } from "@/lib/ai/fusion";

/** The LLM-narrated parts of a report (the rest is fused from memory data). */
export interface GeneratedReport {
  genome: GenomeEntry[];
  narration: string[]; // 3 quiet cinematic lines
  atmosphereKo: string; // emotional atmosphere description
  evolutionKo: string; // atmosphere evolution line
  palette: string[];
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    genome: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          en: { type: "string" },
          ko: { type: "string" },
          weight: { type: "number" },
        },
        required: ["en", "ko", "weight"],
      },
    },
    narration: { type: "array", items: { type: "string" } },
    atmosphereKo: { type: "string" },
    evolutionKo: { type: "string" },
    palette: { type: "array", items: { type: "string" } },
  },
  required: ["genome", "narration", "atmosphereKo", "evolutionKo", "palette"],
} as const;

const FALLBACK: GeneratedReport = {
  genome: [
    { en: "Quiet Warmth", ko: "조용한 따뜻함", weight: 0.9 },
    { en: "Urban Nostalgia", ko: "도시의 향수", weight: 0.7 },
    { en: "Emotional Minimalism", ko: "감정의 미니멀리즘", weight: 0.6 },
    { en: "Warm Futurism", ko: "따뜻한 미래감", weight: 0.5 },
  ],
  narration: [
    "당신은 조용한 따뜻함 속에서 가장 오래 머무르는 사람입니다.",
    "완벽함보다 인간적인 흔적에 마음이 머물러요.",
    "차가운 공기 속에서도, 당신은 따뜻한 감정을 놓지 않고 있어요.",
  ],
  atmosphereKo: "당신 안에는 조용하고 따뜻한 공기가 오래 흐르고 있어요.",
  evolutionKo: "예전보다 조금 더 따뜻한 것들에 오래 시선이 머물고 있어요.",
  palette: ["rose", "ember", "beige"],
};

/**
 * Weave the fused emotional data into the narrated heart of a Taste Report:
 * a dynamic genome (en/ko/weight), three quiet lines, an atmosphere line, an
 * evolution line, and a palette. Falls back to a gentle portrait if needed.
 */
export async function generateFullReport(f: Fusion): Promise<GeneratedReport> {
  const warmthWord = f.warmth < 0.35 ? "차가운 쪽" : f.warmth < 0.6 ? "그 사이" : "따뜻한 쪽";
  const user = [
    `감정의 결 (${f.count}개에서):`,
    f.corpus.map((t) => `- ${t}`).join("\n") || "- 조용한 따뜻함",
    "",
    `반복되는 결: ${f.recurringThemes.join(", ") || "고요, 온기"}`,
    `함께 흐르는 대비: ${f.contrasts.map((c) => `${c.coolKo}↔${c.warmKo}`).join(", ") || "고독↔온기"}`,
    `전체 온도: ${warmthWord}`,
    "",
    "위를 바탕으로, 규정이 아니라 알아봄으로. genome 4개(weight 0~1), narration 3줄, atmosphereKo 1~2줄, evolutionKo 1줄, palette 3~5개.",
  ].join("\n");

  try {
    const res = await openai.chat.completions.create({
      model: MODELS.narration,
      temperature: 0.7,
      ...SAFE_DEFAULTS,
      messages: [
        { role: "system", content: REPORT_SYSTEM },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "report", strict: true, schema: SCHEMA },
      },
    });
    const parsed = JSON.parse(res.choices[0]!.message.content!) as GeneratedReport;
    if (!parsed.genome?.length || !parsed.narration?.length) return FALLBACK;
    return parsed;
  } catch {
    return FALLBACK;
  }
}
