"use client";

/** Upload validation — mirrors the limits enforced server-side in storage.rules. */
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/avif"];

export function validateImageFile(file: File): { ok: true } | { ok: false; reason: string } {
  if (!file.type.startsWith("image/")) return { ok: false, reason: "이미지 파일만 올릴 수 있어요." };
  if (!ALLOWED.includes(file.type) && file.type !== "image/heif")
    return { ok: false, reason: "이 형식은 아직 읽기 어려워요." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: "조금 더 가벼운 이미지로 올려 주세요." };
  return { ok: true };
}
