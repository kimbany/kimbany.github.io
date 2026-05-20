import "server-only";
import { analyzeImageAtmosphere, readingToEmotionText } from "@/lib/openai/vision";
import type { AtmosphereReading } from "@/types/atmosphere";

/**
 * Vision pipeline: a stored image → its emotional atmosphere → the single
 * emotional sentence the rest of the system remembers. The raw image is read
 * once and not retained server-side; only the feeling continues.
 */
export interface VisionResult {
  reading: AtmosphereReading;
  emotionText: string; // embedding + memory input
  warmth: number;
  tone: AtmosphereReading["color_temperature"];
}

export async function runVision(imageUrl: string): Promise<VisionResult> {
  const reading = await analyzeImageAtmosphere(imageUrl);
  return {
    reading,
    emotionText: readingToEmotionText(reading),
    warmth: reading.warmth,
    tone: reading.color_temperature,
  };
}
