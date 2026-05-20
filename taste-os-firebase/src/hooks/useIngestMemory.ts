"use client";

import { useCallback, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { useUpload } from "./useUpload";
import { ingestImageMemory, ingestTextMemory } from "@/server/actions/memory";

/**
 * Ingest a memory the cinematic way:
 *  - an image → upload to private Storage → server reads its atmosphere
 *    (Vision) → embeds the feeling → stores the fragment
 *  - text (a quote / reflection / atmosphere) → scrub → embed → store
 * All privileged work is server-side and token-gated.
 */
export function useIngestMemory() {
  const { upload, progress, uploading } = useUpload();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function token() {
    const t = await auth.currentUser?.getIdToken();
    if (!t) throw new Error("no session");
    return t;
  }

  const ingestImage = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const { path, url } = await upload(file, "image");
        setWorking(true);
        return await ingestImageMemory({ idToken: await token(), storagePath: path, downloadUrl: url });
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setWorking(false);
      }
    },
    [upload]
  );

  const ingestText = useCallback(
    async (text: string, modality: "quote" | "reflection" | "writing" | "atmosphere" | "music") => {
      setError(null);
      setWorking(true);
      try {
        return await ingestTextMemory({ idToken: await token(), modality, text });
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setWorking(false);
      }
    },
    []
  );

  return { ingestImage, ingestText, progress, busy: uploading || working, error };
}
