import "server-only";
import { openai, MODELS, SAFE_DEFAULTS } from "./client";
import { voiceFor, MODE_PROMPTS, MODE_TEMPERATURE, renderEvidence, passesVoice } from "./prompts";
import type { RecallMode, NarrationEvidence } from "@/types/atmosphere";

export { passesVoice };

/** Stream a narration token-by-token (evidence-grounded, quiet voice). */
export async function* streamNarration(
  mode: RecallMode,
  evidence: NarrationEvidence,
  locale = "ko"
) {
  const stream = await openai.chat.completions.create({
    model: MODELS.narration,
    temperature: MODE_TEMPERATURE[mode],
    stream: true,
    ...SAFE_DEFAULTS,
    messages: [
      { role: "system", content: voiceFor(locale) },
      { role: "system", content: `mode: ${MODE_PROMPTS[mode]}` },
      { role: "user", content: renderEvidence(mode, evidence.facts, evidence.recent) },
    ],
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

/** Non-streaming variant with a single voice-guard retry (for persistence). */
export async function generateNarration(
  mode: RecallMode,
  evidence: NarrationEvidence,
  locale = "ko"
): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await openai.chat.completions.create({
      model: MODELS.narration,
      temperature: attempt === 0 ? MODE_TEMPERATURE[mode] : 0.6,
      ...SAFE_DEFAULTS,
      messages: [
        { role: "system", content: voiceFor(locale) },
        { role: "system", content: `mode: ${MODE_PROMPTS[mode]}` },
        { role: "user", content: renderEvidence(mode, evidence.facts, evidence.recent) },
      ],
    });
    const text = res.choices[0]?.message.content?.trim() ?? "";
    if (passesVoice(text)) return text;
  }
  return ""; // caller falls back to last known narration (graceful silence)
}
