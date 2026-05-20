import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type Tone } from "@/lib/firebase/collections";
import { generateReport } from "@/lib/openai/report";

/**
 * Report pipeline: gather the user's emotional memories → weave them into a
 * Taste Report (genome + narration + palette) → persist it AND update the
 * current atmosphere state. This is the seam where uploaded images directly
 * shape the Taste Genome, the atmosphere identity, and the dashboard.
 */
export async function buildTasteReport(uid: string) {
  const memCol = adminDb.collection(COLLECTIONS.memories);
  const snap = await memCol
    .where("uid", "==", uid)
    .where("released", "==", false)
    .orderBy("createdAt", "desc")
    .limit(40)
    .get();

  const docs = snap.docs.map((d) => d.data() as Record<string, unknown>);
  const emotionTexts = docs.map((d) => String(d.emotionText ?? "")).filter(Boolean);

  // average warmth + dominant tone across remembered feelings
  const warmths = docs.map((d) => Number(d.warmth)).filter((n) => !Number.isNaN(n));
  const warmth = warmths.length ? warmths.reduce((a, b) => a + b, 0) / warmths.length : 0.5;
  const dominantTone = pickDominantTone(docs.map((d) => d.tone as Tone | null));

  const report = await generateReport(emotionTexts);

  // persist the report
  const reportRef = await adminDb.collection(COLLECTIONS.reports).add({
    uid,
    genome: report.genome,
    narration: report.narration,
    palette: report.palette,
    createdAt: FieldValue.serverTimestamp(),
  });

  // update the live atmosphere identity (drives home/ + dashboard reflections)
  await upsertCurrentAtmosphere(uid, {
    labelEn: report.genome[0] ?? "Quiet Warmth",
    labelKo: report.narration[0]?.slice(0, 12) ?? "조용한 따뜻함",
    warmth,
    dominantTone,
  });

  return { reportId: reportRef.id, ...report };
}

function pickDominantTone(tones: Array<Tone | null>): Tone {
  const counts: Record<string, number> = {};
  for (const t of tones) if (t) counts[t] = (counts[t] ?? 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return (top?.[0] as Tone) ?? "mixed";
}

async function upsertCurrentAtmosphere(
  uid: string,
  a: { labelEn: string; labelKo: string; warmth: number; dominantTone: Tone }
) {
  const col = adminDb.collection(COLLECTIONS.atmosphere);
  // demote any existing current state
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
