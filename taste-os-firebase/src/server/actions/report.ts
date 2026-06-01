"use server";

import { requireUid } from "@/lib/server/guard";
import { buildTasteReport } from "@/lib/ai/reportPipeline";
import type { GenomeEntry } from "@/lib/firebase/collections";

/**
 * Generate (or regenerate) the Taste Report from the user's emotional
 * memories. Token-gated; runs the whole multimodal weave server-side.
 * Each call evolves the report (version++), refreshes the current atmosphere
 * identity, and drops a timeline marker — so the report grows with the user.
 */
export async function generateTasteReport(input: { idToken: string }): Promise<{
  reportId: string;
  version: number;
  genome: GenomeEntry[];
  narration: string[];
  palette: string[];
}> {
  const uid = await requireUid(input.idToken);
  const r = await buildTasteReport(uid);
  return {
    reportId: r.reportId,
    version: r.version,
    genome: r.genome,
    narration: r.narration,
    palette: r.palette,
  };
}
