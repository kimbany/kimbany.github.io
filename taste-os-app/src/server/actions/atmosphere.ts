"use server";

import { supabaseServer, getUser } from "@/lib/supabase/server";
import type { NarrationEvidence, RecallMode } from "@/types/atmosphere";

/**
 * Build the evidence for a narration by querying the memory engine
 * (pgvector RPCs from backend.md). Returns structured facts only —
 * the LLM turns these into the quiet voice, it does not invent them.
 */
export async function buildEvidence(mode: RecallMode): Promise<NarrationEvidence> {
  const supabase = await supabaseServer();
  const user = await getUser();
  if (!user) return { facts: "(no session)" };

  // recent narrations — injected so the voice never repeats itself
  const { data: recent } = await supabase
    .from("ai_narrations")
    .select("text")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const recentTexts = (recent ?? []).map((r) => r.text as string);

  switch (mode) {
    case "evolving": {
      const { data } = await supabase.rpc("atmosphere_trajectory");
      const seq = (data ?? []) as Array<{ label_ko: string; warmth: number }>;
      const from = seq[0]?.label_ko ?? "";
      const to = seq[seq.length - 1]?.label_ko ?? "";
      const warmthDelta =
        (seq[seq.length - 1]?.warmth ?? 0) - (seq[0]?.warmth ?? 0);
      return {
        facts: `분위기가 '${from}'에서 '${to}'로 천천히 이동. 따뜻함은 ${
          warmthDelta > 0.05 ? "조금 늘었음" : "비슷함"
        }.`,
        recent: recentTexts,
      };
    }
    case "contradictory": {
      const { data } = await supabase.rpc("strongest_contrast");
      const pair = (data ?? [])[0] as
        | { cool_theme: string; warm_theme: string }
        | undefined;
      return {
        facts: pair
          ? `'${pair.cool_theme}'와 '${pair.warm_theme}'가 같은 사람 안에 함께 강하게 흐름.`
          : "차가움과 따뜻함이 함께 흐름.",
        recent: recentTexts,
      };
    }
    case "nostalgic": {
      const { data } = await supabase.rpc("dormant_clusters", {
        reawaken_days: 21,
      });
      const theme = (data ?? [])[0] as { theme_ko: string } | undefined;
      return {
        facts: theme
          ? `한동안 나타나지 않던 결 '${theme.theme_ko}'이(가) 다시 돌아오고 있음.`
          : "잊고 있던 결이 다시 떠오름.",
        recent: recentTexts,
      };
    }
    default: {
      // resonant / daily — nearest fragments to the current identity
      const { data } = await supabase
        .from("emotional_clusters")
        .select("theme_ko")
        .eq("user_id", user.id)
        .order("recurrence", { ascending: false })
        .limit(3);
      const themes = (data ?? []).map((c) => c.theme_ko as string);
      return {
        facts: `지속 분위기: ${themes[0] ?? "조용한 따뜻함"}. 보조 결: ${themes
          .slice(1)
          .join(", ")}.`,
        recent: recentTexts,
      };
    }
  }
}

/** Persist a finished narration with its evidence (dedup upstream). */
export async function saveNarration(opts: {
  mode: RecallMode;
  text: string;
  surface: string;
  evidence: string[];
}) {
  const supabase = await supabaseServer();
  const user = await getUser();
  if (!user) return;
  await supabase.from("ai_narrations").insert({
    user_id: user.id,
    mode: opts.mode,
    text: opts.text,
    surface: opts.surface,
    evidence: opts.evidence,
    dedup_key: opts.text.slice(0, 40),
  });
}
