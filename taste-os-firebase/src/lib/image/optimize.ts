"use client";

/**
 * Optimized image handling — downscale + recompress on the client before
 * upload. Atmosphere reading needs feeling, not megapixels, so this keeps
 * uploads light and Vision cheap without touching the emotional content.
 */
export async function optimizeImage(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    if (!blob || blob.size >= file.size) return file; // keep original if no win
    const name = file.name.replace(/\.\w+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file; // never block the moment over an optimization
  }
}

/** A local object URL for an immediate, quiet preview while we work. */
export function previewUrl(file: File): string {
  return URL.createObjectURL(file);
}
