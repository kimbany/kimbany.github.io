"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { uploadAsset, type AssetKind } from "@/lib/firebase/services/storage";

/**
 * Upload an image / asset / atmosphere visual with a quiet progress value.
 * Returns { path, url } for storing in a memory fragment.
 */
export function useUpload() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File, kind: AssetKind = "image") => {
      if (!user) throw new Error("no session");
      setUploading(true);
      setError(null);
      setProgress(0);
      try {
        const { promise } = uploadAsset(user.uid, file, kind, setProgress);
        const result = await promise;
        setProgress(1);
        return result;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setUploading(false);
      }
    },
    [user]
  );

  return { upload, progress, uploading, error };
}
