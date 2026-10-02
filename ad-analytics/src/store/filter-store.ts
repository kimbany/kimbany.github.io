"use client";

import { create } from "zustand";
import type { PlatformId } from "@/types/ad-data";
import type { DatePreset, DateRange } from "@/types/analytics";

interface FilterState {
  preset: DatePreset;
  customRange: DateRange | null;
  brands: string[];
  platforms: PlatformId[];
  /** campaignKey 목록 (platform::brand::campaign) */
  campaigns: string[];
  setPreset: (p: DatePreset) => void;
  setCustomRange: (r: DateRange) => void;
  setBrands: (b: string[]) => void;
  setPlatforms: (p: PlatformId[]) => void;
  setCampaigns: (c: string[]) => void;
  reset: () => void;
}

const initial = {
  preset: "last7" as DatePreset,
  customRange: null,
  brands: [] as string[],
  platforms: [] as PlatformId[],
  campaigns: [] as string[],
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initial,
  setPreset: (preset) => set({ preset }),
  setCustomRange: (customRange) => set({ customRange, preset: "custom" }),
  // 브랜드/플랫폼이 바뀌면 캠페인 선택은 초기화 (존재하지 않는 캠페인 필터 방지)
  setBrands: (brands) => set({ brands, campaigns: [] }),
  setPlatforms: (platforms) => set({ platforms, campaigns: [] }),
  setCampaigns: (campaigns) => set({ campaigns }),
  reset: () => set(initial),
}));
