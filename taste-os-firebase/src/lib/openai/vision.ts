import "server-only";
import { openai, MODELS, SAFE_DEFAULTS } from "./client";
import { VISION_SYSTEM } from "./prompts";
import type { AtmosphereReading } from "@/types/atmosphere";

const VISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    atmosphere_ko: { type: "string", description: "한 줄로 압축한 공기" },
    color_temperature: { type: "string", enum: ["warm", "cool", "neutral", "mixed"] },
    warmth: { type: "number", description: "0(차가움)~1(따뜻함)" },
    light_mood_ko: { type: "string", description: "빛의 분위기" },
    texture_ko: { type: "string", description: "질감의 따뜻함" },
    cinematic_tone_ko: { type: "string", description: "영화 같은 톤" },
    composition_emotion_ko: { type: "string", description: "구도가 자아내는 감정" },
    palette_ko: { type: "array", items: { type: "string" }, description: "감정적 색 팔레트(이름)" },
    resonance_ko: { type: "string", description: "시각적 감정 공명 한 줄" },
    tone_words_ko: { type: "array", items: { type: "string" } },
  },
  required: [
    "atmosphere_ko",
    "color_temperature",
    "warmth",
    "light_mood_ko",
    "texture_ko",
    "cinematic_tone_ko",
    "composition_emotion_ko",
    "palette_ko",
    "resonance_ko",
    "tone_words_ko",
  ],
} as const;

/** Read the emotional atmosphere of an image — never the objects in it. */
export async function analyzeImageAtmosphere(imageUrl: string): Promise<AtmosphereReading> {
  const res = await openai.chat.completions.create({
    model: MODELS.vision,
    temperature: 0.4,
    ...SAFE_DEFAULTS,
    messages: [
      { role: "system", content: VISION_SYSTEM },
      {
        role: "user",
        content: [
          { type: "text", text: "이 이미지의 공기를 읽어주세요." },
          // detail:low — atmosphere doesn't need high resolution, and it saves cost
          { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "atmosphere", strict: true, schema: VISION_SCHEMA },
    },
  });
  return JSON.parse(res.choices[0]!.message.content!) as AtmosphereReading;
}

/** Condense a reading into the single emotional sentence we embed + remember. */
export function readingToEmotionText(r: AtmosphereReading): string {
  const words = r.tone_words_ko?.slice(0, 4).join(", ");
  return [r.atmosphere_ko, words].filter(Boolean).join(" · ");
}
