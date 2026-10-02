"use client";

import { create } from "zustand";
import type { AppSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/lib/config/default-settings";
import { getRepository } from "@/lib/db";

function mergeSettings(saved: Partial<AppSettings> | null): AppSettings {
  if (!saved) return DEFAULT_SETTINGS;
  const t = saved.alertThresholds;
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    alertThresholds: t
      ? {
          ...DEFAULT_SETTINGS.alertThresholds,
          ...t,
          bases: { ...DEFAULT_SETTINGS.alertThresholds.bases, ...t.bases },
        }
      : DEFAULT_SETTINGS.alertThresholds,
  };
}

interface SettingsState {
  settings: AppSettings;
  loaded: boolean;
  load: () => Promise<void>;
  save: (next: AppSettings) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  load: async () => {
    const saved = await getRepository().getSettings();
    set({ settings: mergeSettings(saved), loaded: true });
  },
  save: async (next) => {
    await getRepository().saveSettings(next);
    set({ settings: next });
  },
  reset: async () => {
    await getRepository().saveSettings(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));
