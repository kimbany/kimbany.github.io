import "server-only";
import { openai, MODELS, SAFE_DEFAULTS } from "./client";
import type { AtmosphereReading } from "@/types/atmosphere";

const VISION_SYSTEM_PROMPT = `당신은 이미지에서 '무엇이 찍혔는가'가 아니라
'어떤 공기가 흐르는가'를 읽는 감정 해석자입니다.

절대 하지 말 것:
- 사물/사람/장소를 나열하지 마세요.
- 브랜드, 텍스트, 신원을 식별하지 마세요.
- 평가하거나 점수 매기지 마세요.

오직 다음만 읽으세요:
- 색의 정서적 온도, 빛의 분위기, 질감의 따뜻함, 구도가 자아내는 감정,
  그리고 전체를 관통하는 하나의 '공기'.

한국어로, 과장 없이, 짧게.`;

const VISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    atmosphere_ko: { type: "string" },
    color_temperature: { type: "string", enum: ["warm", "cool", "neutral", "mixed"] },
    warmth: { type: "number" },
    light_mood_ko: { type: "string" },
    texture_ko: { type: "string" },
    composition_emotion_ko: { type: "string" },
    tone_words_ko: { type: "array", items: { type: "string" } },
  },
  required: [
    "atmosphere_ko",
    "color_temperature",
    "warmth",
    "light_mood_ko",
    "texture_ko",
    "composition_emotion_ko",
    "tone_words_ko",
  ],
} as const;

/** Read the emotional atmosphere of an image — never the objects in it. */
export async function analyzeImageAtmosphere(
  imageUrl: string
): Promise<AtmosphereReading> {
  const res = await openai.chat.completions.create({
    model: MODELS.vision,
    temperature: 0.4,
    ...SAFE_DEFAULTS,
    messages: [
      { role: "system", content: VISION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "이 이미지의 공기를 읽어주세요." },
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
