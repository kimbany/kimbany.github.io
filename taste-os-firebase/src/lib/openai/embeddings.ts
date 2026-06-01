import "server-only";
import { openai, MODELS, LATENT_DIM } from "./client";

/**
 * Embed emotional language into the shared latent space.
 * Note: every modality is first translated to emotional Korean text
 * (see vision.ts / music interpretation) BEFORE embedding, so images,
 * quotes and music all land in one space.
 */
export async function embedEmotion(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: MODELS.embedding,
    input: text,
    dimensions: LATENT_DIM,
  });
  return res.data[0]!.embedding;
}

/** batch variant (dedup upstream to save cost) */
export async function embedEmotions(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await openai.embeddings.create({
    model: MODELS.embedding,
    input: texts,
    dimensions: LATENT_DIM,
  });
  return res.data.map((d) => d.embedding);
}
