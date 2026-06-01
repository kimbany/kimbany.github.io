"use client";

import { useCallback, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { updateConsent } from "@/lib/firebase/services/users";
import { optimizeImage } from "@/lib/image/optimize";
import { useUpload } from "./useUpload";
import { ingestImageMemory, ingestTextMemory } from "@/server/actions/memory";

/**
 * Ingest a memory the cinematic way:
 *  - an image → optimize → upload to private Storage → server reads its
 *    atmosphere (Vision) → embeds the feeling → stores the fragment
 *  - text (quote / reflection / atmosphere) → scrub → embed → store
 * All privileged work is server-side and token-gated.
 */
export function useIngestMemory() {
  const { upload, progress, uploading } = useUpload();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function tokenAndUid() {
    const user = auth.currentUser;
    const t = await user?.getIdToken();
    if (!user || !t) throw new Error("no session");
    return { uid: user.uid, idToken: t };
  }

  const ingestImage = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const optimized = await optimizeImage(file);
        const { path, url } = await upload(optimized, "image");
        setWorking(true);
        const { uid, idToken } = await tokenAndUid();
        // uploading an image to be read IS the consent — record it explicitly
        await updateConsent(uid, { rememberImages: true, useAiVision: true });
        return await ingestImageMemory({ idToken, storagePath: path, downloadUrl: url });
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
        const { idToken } = await tokenAndUid();
        return await ingestTextMemory({ idToken, modality, text });
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
