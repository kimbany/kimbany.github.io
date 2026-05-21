"use client";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "../client";

/**
 * Upload service for images / emotional assets / atmosphere visuals.
 * Originals live under the user's private folder (memories/{uid}/...);
 * only the owner can read them (storage.rules). The path is what we keep
 * in Firestore — never the pixels themselves once analyzed.
 */

export type AssetKind = "image" | "asset" | "atmosphere";

function makePath(uid: string, kind: AssetKind, name: string) {
  const safe = name.replace(/[^\w.\-]/g, "_");
  const stamp = Date.now().toString(36);
  return `memories/${uid}/${kind}/${stamp}-${safe}`;
}

export interface UploadHandle {
  promise: Promise<{ path: string; url: string }>;
  cancel: () => void;
}

/**
 * Resumable upload with progress. Returns a handle so callers can show a
 * quiet progress shimmer and cancel if the moment passes.
 */
export function uploadAsset(
  uid: string,
  file: File,
  kind: AssetKind = "image",
  onProgress?: (fraction: number) => void
): UploadHandle {
  const path = makePath(uid, kind, file.name || `${kind}`);
  const task = uploadBytesResumable(ref(storage, path), file, {
    contentType: file.type || "application/octet-stream",
  });

  const promise = new Promise<{ path: string; url: string }>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(snap.bytesTransferred / Math.max(1, snap.totalBytes)),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ path, url });
      }
    );
  });

  return { promise, cancel: () => task.cancel() };
}

/** Simple awaitable variant. */
export async function uploadAssetAsync(
  uid: string,
  file: File,
  kind: AssetKind = "image"
): Promise<{ path: string; url: string }> {
  return uploadAsset(uid, file, kind).promise;
}

/** Release the original (used alongside fragment release). */
export async function deleteAsset(path: string) {
  await deleteObject(ref(storage, path));
}

/** Resolve a stored path to a fresh download URL. */
export async function resolveAssetUrl(path: string) {
  return getDownloadURL(ref(storage, path));
}
