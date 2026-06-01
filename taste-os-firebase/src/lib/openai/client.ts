import "server-only";
import OpenAI from "openai";

/** Server-only OpenAI client. The key never reaches the browser. */
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** model map — see taste-os/ai-integration.md */
export const MODELS = {
  vision: "gpt-4o",
  narration: "gpt-4.1",
  caption: "gpt-4o-mini",
  embedding: "text-embedding-3-large",
} as const;

/** shared latent dimensionality across all modalities */
export const LATENT_DIM = 1024;

/** never let OpenAI store/train on emotional data */
export const SAFE_DEFAULTS = { store: false } as const;
