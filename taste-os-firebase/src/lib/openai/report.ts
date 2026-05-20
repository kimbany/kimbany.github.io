import "server-only";
import { openai, MODELS, SAFE_DEFAULTS } from "./client";
import { REPORT_SYSTEM } from "./prompts";

export interface GeneratedReport {
  genome: string[];
  narration: string[];
  palette: string[];
}

const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    genome: { type: "array", items: { type: "string" } },
    narration: { type: "array", items: { type: "string" } },
    palette: { type: "array", items: { type: "string" } },
  },
  required: ["genome", "narration", "palette"],
} as const;

/**
 * Weave a person's emotional fragments into one Taste Report — genome
 * constellation, three quiet narration lines, and a palette. Falls back to a
 * gentle default portrait if the model is unavailable.
 */
export async function generateReport(emotionTexts: string[]): Promise<GeneratedReport> {
  const corpus = emotionTexts.slice(0, 40).map((t) => `- ${t}`).join("\n");
  try {
    const res = await openai.chat.completions.create({
      model: MODELS.narration,
      temperature: 0.7,
      ...SAFE_DEFAULTS,
      messages: [
        { role: "system", content: REPORT_SYSTEM },
        { role: "user", content: `감정의 결:\n${corpus || "- 조용한 따뜻함"}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "report", strict: true, schema: REPORT_SCHEMA },
      },
    });
    return JSON.parse(res.choices[0]!.message.content!) as GeneratedReport;
  } catch {
    return {
      genome: ["Quiet Warmth", "Urban Nostalgia", "Emotional Minimalism", "Warm Futurism"],
      narration: [
        "당신은 조용한 따뜻함 속에서 가장 오래 머무르는 사람입니다.",
        "완벽함보다 인간적인 흔적에 마음이 머물러요.",
        "차가운 공기 속에서도, 당신은 따뜻한 감정을 놓지 않고 있어요.",
      ],
      palette: ["rose", "ember", "beige"],
    };
  }
}
