"use server";

import { requireUid } from "@/lib/server/guard";
import { buildTasteReport } from "@/lib/ai/reportPipeline";

/**
 * Generate (or regenerate) the Taste Report from the user's emotional
 * memories. Token-gated; runs the whole weave server-side. The result
 * also updates the current atmosphere identity that home/ and the
 * dashboard reflect.
 */
export async function generateTasteReport(input: { idToken: string }): Promise<{
  reportId: string;
  genome: string[];
  narration: string[];
  palette: string[];
}> {
  const uid = await requireUid(input.idToken);
  return buildTasteReport(uid);
}
