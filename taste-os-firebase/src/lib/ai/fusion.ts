import "server-only";
import type { ReportContrast, ReportEcho, Tone } from "@/lib/firebase/collections";

/**
 * Multimodal emotional fusion. Gathers a person's remembered fragments across
 * every modality (image atmospheres, writing, quotes, music, atmosphere picks)
 * and distills the data-derived parts of a Taste Report — recurring themes,
 * coexisting contrasts, memory echoes, visual resonance, warmth, dominant tone.
 * The LLM then names the genome + writes the narration over this scaffold.
 */

export interface MemoryLite {
  id: string;
  modality: string;
  emotionText: string;
  caption: string | null;
  tone: Tone | null;
  warmth: number | null;
  atmosphereTags: string[] | null;
  palette: string[] | null;
  narrationFragment: string | null;
}

export interface Fusion {
  count: number;
  byModality: Record<string, number>;
  corpus: string[]; // emotion sentences (LLM input)
  recurringThemes: string[]; // most frequent atmosphere tags
  contrasts: ReportContrast[]; // cool ↔ warm themes that coexist
  echoes: ReportEcho[]; // sampled memory echoes
  resonance: string[]; // narration fragments (visual emotional resonance)
  palette: string[]; // most frequent palette names
  warmth: number; // 0..1 average
  dominantTone: Tone;
  memoryLinks: string[];
}

function topByFrequency(items: string[], n: number): string[] {
  const freq = new Map<string, number>();
  for (const it of items) {
    const k = it.trim();
    if (!k) continue;
    freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}

export function fuse(memories: MemoryLite[]): Fusion {
  const byModality: Record<string, number> = {};
  const allTags: string[] = [];
  const warmTags: string[] = [];
  const coolTags: string[] = [];
  const allPalette: string[] = [];
  const warmths: number[] = [];
  const toneCounts: Record<string, number> = {};

  for (const m of memories) {
    byModality[m.modality] = (byModality[m.modality] ?? 0) + 1;
    if (m.atmosphereTags) {
      allTags.push(...m.atmosphereTags);
      if (m.tone === "warm") warmTags.push(...m.atmosphereTags);
      if (m.tone === "cool") coolTags.push(...m.atmosphereTags);
    }
    if (m.palette) allPalette.push(...m.palette);
    if (typeof m.warmth === "number") warmths.push(m.warmth);
    if (m.tone) toneCounts[m.tone] = (toneCounts[m.tone] ?? 0) + 1;
  }

  const recurringThemes = topByFrequency(allTags, 5);
  const topWarm = topByFrequency(warmTags, 2);
  const topCool = topByFrequency(coolTags, 2);
  const contrasts: ReportContrast[] = [];
  for (let i = 0; i < Math.min(topCool.length, topWarm.length); i++) {
    contrasts.push({ coolKo: topCool[i]!, warmKo: topWarm[i]! });
  }

  const echoes: ReportEcho[] = memories
    .filter((m) => m.caption)
    .slice(0, 4)
    .map((m) => ({ caption: m.caption!, atmosphere: m.emotionText }));

  const resonance = memories
    .map((m) => m.narrationFragment)
    .filter((x): x is string => !!x)
    .slice(0, 3);

  const warmth = warmths.length ? warmths.reduce((a, b) => a + b, 0) / warmths.length : 0.5;
  const dominantTone =
    (Object.entries(toneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Tone) ?? "mixed";

  return {
    count: memories.length,
    byModality,
    corpus: memories.map((m) => m.emotionText).filter(Boolean).slice(0, 40),
    recurringThemes,
    contrasts,
    echoes,
    resonance,
    palette: topByFrequency(allPalette, 5),
    warmth,
    dominantTone,
    memoryLinks: memories.map((m) => m.id).slice(0, 12),
  };
}
