import { LocalStorageRepository } from "./local-storage-repository";
import type { AdDataRepository } from "./repository";

let instance: AdDataRepository | null = null;

/** 저장소 팩토리 — Supabase 등으로 교체 시 이 함수만 수정 */
export function getRepository(): AdDataRepository {
  if (!instance) instance = new LocalStorageRepository();
  return instance;
}

export * from "./repository";
