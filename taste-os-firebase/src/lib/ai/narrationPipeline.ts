import "server-only";
import { streamNarration } from "@/lib/openai/narration";
import { buildEvidence } from "@/server/actions/atmosphere";
import { saveNarration } from "@/lib/firebase/memory";
import type { RecallMode } from "@/types/atmosphere";

/**
 * Narration pipeline: gather evidence from the memory engine → stream the
 * quiet voice → (after the stream) persist the finished line with its evidence
 * so the voice never repeats itself. Generation is fast; the *reveal* is slow
 * (the client paces it like breath).
 */
export async function* streamNarrationFor(opts: {
  uid: string;
  mode: RecallMode;
  surface: string;
  locale?: string;
}) {
  const { uid, mode, surface, locale = "ko" } = opts;
  const evidence = await buildEvidence(uid, mode);

  let full = "";
  for await (const token of streamNarration(mode, evidence, locale)) {
    full += token;
    yield token;
  }

  const text = full.trim();
  if (text) {
    // fire-and-forget persistence (dedup handled by leading-text key)
    void saveNarration({ uid, mode, text, surface, evidence: evidence.fragmentIds ?? [] });
  }
}
