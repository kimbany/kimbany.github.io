import "server-only";
import { analyzeImageAtmosphere, readingToEmotionText } from "@/lib/openai/vision";
import type { AtmosphereReading } from "@/types/atmosphere";

/**
 * Vision pipeline: a stored image → its emotional atmosphere → the single
 * emotional sentence the rest of the system remembers. The raw image is read
 * once and not retained server-side; only the feeling continues.
 *
 * Resilient by design: one retry, then a quiet fallback atmosphere so the
 * flow is never broken by a transient model hiccup.
 */
export interface VisionResult {
  reading: AtmosphereReading;
  emotionText: string;
  warmth: number;
  tone: AtmosphereReading["color_temperature"];
  degraded: boolean; // true when we fell back
}

const FALLBACK: AtmosphereReading = {
  atmosphere_ko: "조용한 공기가 흐르는 한 장면",
  color_temperature: "neutral",
  warmth: 0.5,
  light_mood_ko: "은은한 빛",
  texture_ko: "부드러운 결",
  cinematic_tone_ko: "잔잔한 톤",
  composition_emotion_ko: "여백이 있는 고요",
  palette_ko: ["mist", "beige"],
  resonance_ko: "말로 다 담기 어려운, 익숙한 고요",
  tone_words_ko: ["고요", "은은함"],
};

export async function runVision(imageUrl: string): Promise<VisionResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const reading = await analyzeImageAtmosphere(imageUrl);
      return {
        reading,
        emotionText: readingToEmotionText(reading),
        warmth: reading.warmth,
        tone: reading.color_temperature,
        degraded: false,
      };
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
    }
  }
  // graceful fallback emotional state
  return {
    reading: FALLBACK,
    emotionText: readingToEmotionText(FALLBACK),
    warmth: FALLBACK.warmth,
    tone: FALLBACK.color_temperature,
    degraded: true,
  };
}
