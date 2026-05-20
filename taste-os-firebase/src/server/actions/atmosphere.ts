import "server-only";
import { recentNarrations } from "@/lib/firebase/memory";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { NarrationEvidence, RecallMode } from "@/types/atmosphere";

/**
 * Build evidence for a narration from Firestore (the memory engine).
 * Structured facts only — the LLM expresses them in the quiet voice
 * but never invents them. All queries scope to the owning uid.
 */
export async function buildEvidence(uid: string, mode: RecallMode): Promise<NarrationEvidence> {
  const recent = await recentNarrations(uid, 5);

  switch (mode) {
    case "evolving": {
      const snap = await adminDb
        .collection(COLLECTIONS.atmosphere)
        .where("uid", "==", uid)
        .orderBy("periodStart", "asc")
        .get();
      const seq = snap.docs.map((d) => d.data() as { labelKo: string; warmth: number });
      const from = seq[0]?.labelKo ?? "";
      const to = seq[seq.length - 1]?.labelKo ?? "";
      const delta = (seq[seq.length - 1]?.warmth ?? 0) - (seq[0]?.warmth ?? 0);
      return {
        facts: `분위기가 '${from}'에서 '${to}'로 천천히 이동. 따뜻함은 ${delta > 0.05 ? "조금 늘었음" : "비슷함"}.`,
        recent,
      };
    }
    case "contradictory": {
      const snap = await adminDb
        .collection(COLLECTIONS.timelines)
        .where("uid", "==", uid)
        .where("kind", "==", "atmosphere_shift")
        .limit(1)
        .get();
      const ev = snap.docs[0]?.data() as { fromLabel?: string; toLabel?: string } | undefined;
      return {
        facts: ev
          ? `'${ev.fromLabel ?? "차가운 고독감"}'와 '${ev.toLabel ?? "따뜻한 온기"}'가 같은 사람 안에 함께 흐름.`
          : "차가움과 따뜻함이 함께 흐름.",
        recent,
      };
    }
    default: {
      // resonant / daily / nostalgic — anchor on the current atmosphere
      const snap = await adminDb
        .collection(COLLECTIONS.atmosphere)
        .where("uid", "==", uid)
        .where("current", "==", true)
        .limit(1)
        .get();
      const cur = snap.docs[0]?.data() as { labelKo?: string } | undefined;
      return { facts: `지속 분위기: ${cur?.labelKo ?? "조용한 따뜻함"}.`, recent };
    }
  }
}
