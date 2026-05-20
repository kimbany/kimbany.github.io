import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type Tone, type TasteReportDoc } from "@/lib/firebase/collections";
import { generateFullReport } from "@/lib/openai/report";
import { fuse, type MemoryLite } from "./fusion";

/**
 * The full Taste Report pipeline:
 *   collect memories → multimodal fusion → narrate (genome + sections) →
 *   persist a versioned report → update the live atmosphere → drop a timeline
 *   marker. This is the seam that connects everything: an uploaded image's
 *   feeling flows into the genome, the dashboard, the timeline, and sharing.
 */
export async function buildTasteReport(uid: string) {
  // 1) collect emotional memory data
  const snap = await adminDb
    .collection(COLLECTIONS.memories)
    .where("uid", "==", uid)
    .where("released", "==", false)
    .orderBy("createdAt", "desc")
    .limit(40)
    .get();

  const memories: MemoryLite[] = snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      modality: String(x.modality ?? "reflection"),
      emotionText: String(x.emotionText ?? ""),
      caption: (x.caption as string) ?? null,
      tone: (x.tone as Tone) ?? null,
      warmth: typeof x.warmth === "number" ? x.warmth : null,
      atmosphereTags: (x.atmosphereTags as string[]) ?? null,
      palette: (x.palette as string[]) ?? null,
      narrationFragment: (x.narrationFragment as string) ?? null,
    };
  });

  // 2) multimodal fusion
  const fusion = fuse(memories);

  // 3) narrate (genome + atmosphere + evolution + lines + palette)
  const gen = await generateFullReport(fusion);

  // 4) assemble the sectioned report
  const sections: TasteReportDoc["sections"] = {
    atmosphereKo: gen.atmosphereKo,
    recurringThemes: fusion.recurringThemes,
    contrasts: fusion.contrasts,
    evolutionKo: gen.evolutionKo,
    resonance: fusion.resonance,
    echoes: fusion.echoes,
  };

  // 5) version: evolve over time
  const prev = await adminDb
    .collection(COLLECTIONS.reports)
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();
  const prevVersion = (prev.docs[0]?.data()?.version as number) ?? 0;
  const prevLabel = (prev.docs[0]?.data()?.genome?.[0]?.en as string) ?? null;
  const version = prevVersion + 1;

  const report: Omit<TasteReportDoc, "createdAt"> = {
    uid,
    version,
    genome: gen.genome,
    sections,
    narration: gen.narration,
    palette: gen.palette.length ? gen.palette : fusion.palette,
    warmth: fusion.warmth,
    dominantTone: fusion.dominantTone,
    memoryLinks: fusion.memoryLinks,
  };

  // 6) persist + connect
  const ref = await adminDb
    .collection(COLLECTIONS.reports)
    .add({ ...report, createdAt: FieldValue.serverTimestamp() });

  await upsertCurrentAtmosphere(uid, {
    labelEn: gen.genome[0]?.en ?? "Quiet Warmth",
    labelKo: gen.genome[0]?.ko ?? "조용한 따뜻함",
    warmth: fusion.warmth,
    dominantTone: fusion.dominantTone,
  });

  // 7) timeline link — a marker the evolution/ screen reads
  await adminDb.collection(COLLECTIONS.timelines).add({
    uid,
    kind: prevLabel && prevLabel !== gen.genome[0]?.en ? "atmosphere_shift" : "season_marker",
    labelKo: gen.genome[0]?.ko ?? "조용한 따뜻함",
    fromLabel: prevLabel,
    toLabel: gen.genome[0]?.en ?? null,
    warmth: fusion.warmth,
    occurredAt: FieldValue.serverTimestamp(),
  });

  return { reportId: ref.id, version, ...report };
}

async function upsertCurrentAtmosphere(
  uid: string,
  a: { labelEn: string; labelKo: string; warmth: number; dominantTone: Tone }
) {
  const col = adminDb.collection(COLLECTIONS.atmosphere);
  const cur = await col.where("uid", "==", uid).where("current", "==", true).get();
  const batch = adminDb.batch();
  cur.docs.forEach((d) => batch.update(d.ref, { current: false }));
  const fresh = col.doc();
  batch.set(fresh, {
    uid,
    periodStart: new Date().toISOString().slice(0, 10),
    labelKo: a.labelKo,
    labelEn: a.labelEn,
    dominantTone: a.dominantTone,
    warmth: a.warmth,
    centroid: null,
    current: true,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
}
