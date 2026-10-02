"use client";

import { create } from "zustand";
import type { AdRecord } from "@/types/ad-data";
import type { DuplicateMode, UploadRecord } from "@/types/upload";
import { getRepository, dedupeKeyOf } from "@/lib/db";
import { generateMockRecords } from "@/lib/mock/generate";
import { todayLocal } from "@/lib/utils/date";

type Status = "idle" | "loading" | "ready" | "error";

interface ImportInput {
  records: AdRecord[];
  upload: UploadRecord;
  mode: DuplicateMode;
}

interface DataState {
  status: Status;
  error: string | null;
  /** 업로드된 실제 데이터 */
  records: AdRecord[];
  /** 샘플(mock) 데이터 — 저장하지 않고 메모리에서 생성 */
  sampleRecords: AdRecord[];
  uploads: UploadRecord[];
  load: () => Promise<void>;
  /** 기존 데이터와 중복되는 레코드 dedupe key 목록 */
  findDuplicates: (records: AdRecord[]) => Set<string>;
  importUpload: (input: ImportInput) => Promise<{ inserted: number; skipped: number; replaced: number }>;
  deleteUpload: (id: string) => Promise<number>;
  clearAll: () => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  status: "idle",
  error: null,
  records: [],
  sampleRecords: [],
  uploads: [],

  load: async () => {
    if (get().status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const repo = getRepository();
      const [records, uploads] = await Promise.all([repo.listRecords(), repo.listUploads()]);
      const sampleRecords = get().sampleRecords.length ? get().sampleRecords : generateMockRecords({ endDate: todayLocal() });
      set({ records, uploads, sampleRecords, status: "ready" });
    } catch (e) {
      set({ status: "error", error: (e as Error).message });
    }
  },

  findDuplicates: (incoming) => {
    const existing = new Set(get().records.map(dedupeKeyOf));
    const dup = new Set<string>();
    for (const r of incoming) {
      const k = dedupeKeyOf(r);
      if (existing.has(k)) dup.add(k);
    }
    return dup;
  },

  importUpload: async ({ records, upload, mode }) => {
    const repo = getRepository();
    const duplicates = get().findDuplicates(records);
    let toInsert = records;
    let replaceKeys: Set<string> | undefined;
    if (mode === "skip") toInsert = records.filter((r) => !duplicates.has(dedupeKeyOf(r)));
    else replaceKeys = duplicates;

    const finalUpload: UploadRecord = {
      ...upload,
      rowCount: toInsert.length,
      duplicateMode: duplicates.size ? mode : undefined,
      duplicateCount: duplicates.size,
    };
    await repo.insertRecords(toInsert, replaceKeys);
    await repo.insertUpload(finalUpload);
    set({ records: await repo.listRecords(), uploads: await repo.listUploads() });
    return {
      inserted: toInsert.length,
      skipped: mode === "skip" ? duplicates.size : 0,
      replaced: mode === "overwrite" ? duplicates.size : 0,
    };
  },

  deleteUpload: async (id) => {
    const repo = getRepository();
    const removed = await repo.deleteRecordsBySource(id);
    await repo.deleteUpload(id);
    set({ records: await repo.listRecords(), uploads: await repo.listUploads() });
    return removed;
  },

  clearAll: async () => {
    await getRepository().clearRecords();
    set({ records: [], uploads: [] });
  },
}));
