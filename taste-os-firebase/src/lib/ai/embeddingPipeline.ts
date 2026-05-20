import "server-only";
import { embedEmotion } from "@/lib/openai/embeddings";
import { scrub } from "./scrub";

/**
 * Embedding pipeline: scrub PII → embed into the shared 1024-dim latent.
 * Returns null when the input is empty after scrubbing, or when the caller
 * marks the memory local-only (the embedding then never leaves the device).
 */
export async function embedForMemory(
  rawText: string,
  opts: { localOnly?: boolean } = {}
): Promise<number[] | null> {
  if (opts.localOnly) return null;
  const text = scrub(rawText);
  if (!text) return null;
  return embedEmotion(text);
}
