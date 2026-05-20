import "server-only";
import { recentNarrations, dormantClusters } from "@/lib/firebase/memory";
import { adminDb } from "@/lib/firebase/admin";
import type { NarrationEvidence, RecallMode } from "@/types/atmosphere";

/**
 * Build evidence for a narration from Firestore (the memory engine).
 * Returns structured facts only — the LLM expresses them in the quiet
 * voice but never invents them.
 */
export async function buildEvidence(uid: string, mode: RecallMode): Promise<NarrationEvidence> {
  const recent = await recentNarrations(uid, 5);
  const userRef = adminDb.collection("users").doc(uid);

  switch (mode) {
    case "evolving": {
      const snap = await userRef.collection("snapshots").orderBy("periodStart", "asc").get();
      const seq = snap.docs.map((d) => d.data() as { labelKo: string; warmth: number });
      const from = seq[0]?.labelKo ?? "";
      const to = seq[seq.length - 1]?.labelKo ?? "";
      const delta = (seq[seq.length - 1]?.warmth ?? 0) - (seq[0]?.warmth ?? 0);
      return {
        facts: `분위기가 '${from}'에서 '${to}'로 천천히 이동. 따뜻함은 ${delta > 0.05 ? "조금 늘었음" : "비슷함"}.`,
        recent,
      };
    }
    case "nostalgic": {
      const dormant = await dormantClusters(uid, 21, 1);
      const theme = (dormant[0] as { themeKo?: string } | undefined)?.themeKo;
      return {
        facts: theme
          ? `한동안 나타나지 않던 결 '${theme}'이(가) 다시 돌아오고 있음.`
          : "잊고 있던 결이 다시 떠오름.",
        recent,
      };
    }
    case "contradictory": {
      const snap = await userRef.collection("clusters").orderBy("recurrence", "desc").limit(4).get();
      const themes = snap.docs.map((d) => d.data() as { themeKo: string; tone?: string });
      const cool = themes.find((t) => t.tone === "cool")?.themeKo ?? "차가운 고독감";
      const warm = themes.find((t) => t.tone === "warm")?.themeKo ?? "따뜻한 온기";
      return { facts: `'${cool}'와 '${warm}'가 같은 사람 안에 함께 강하게 흐름.`, recent };
    }
    default: {
      const snap = await userRef.collection("clusters").orderBy("recurrence", "desc").limit(3).get();
      const themes = snap.docs.map((d) => (d.data().themeKo as string) ?? "");
      return {
        facts: `지속 분위기: ${themes[0] ?? "조용한 따뜻함"}. 보조 결: ${themes.slice(1).join(", ")}.`,
        recent,
      };
    }
  }
}
