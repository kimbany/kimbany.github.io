/** OpenAI service layer — server-only. */
export { openai, MODELS, LATENT_DIM, SAFE_DEFAULTS } from "./client";
export { analyzeImageAtmosphere, readingToEmotionText } from "./vision";
export { embedEmotion, embedEmotions } from "./embeddings";
export { streamNarration, generateNarration, passesVoice } from "./narration";
