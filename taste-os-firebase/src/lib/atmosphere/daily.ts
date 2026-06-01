import type { MemoryDoc, Tone } from "@/lib/firebase/collections";

/**
 * Derive today's living atmosphere from recent memories — not a metric, a
 * reading. Looks at the most recent fragments' warmth + tone and names the
 * air. Pure + synchronous so the dashboard can feel instant.
 */
export interface DailyAtmosphere {
  labelKo: string;
  labelEn: string;
  warmth: number;
  tone: Tone;
  hasData: boolean;
}

const LABELS: { max: number; ko: string; en: string }[] = [
  { max: 0.3, ko: "차가운 도시의 고독감", en: "Cinematic Solitude" },
  { max: 0.45, ko: "잔잔한 미래감", en: "Calm Futurism" },
  { max: 0.6, ko: "느린 밤공기", en: "Slow Night" },
  { max: 0.78, ko: "아날로그 온기", en: "Analog Tenderness" },
  { max: 1.01, ko: "조용한 따뜻함", en: "Quiet Warmth" },
];

export function deriveDailyAtmosphere(memories: Array<MemoryDoc & { id: string }>): DailyAtmosphere {
  const recent = memories.slice(0, 12);
  const warmths = recent.map((m) => m.warmth).filter((w): w is number => typeof w === "number");
  const toneCounts: Record<string, number> = {};
  for (const m of recent) if (m.tone) toneCounts[m.tone] = (toneCounts[m.tone] ?? 0) + 1;

  const warmth = warmths.length ? warmths.reduce((a, b) => a + b, 0) / warmths.length : 0.55;
  const tone = (Object.entries(toneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Tone) ?? "mixed";
  const label = LABELS.find((l) => warmth < l.max) ?? LABELS[LABELS.length - 1]!;

  return { labelKo: label.ko, labelEn: label.en, warmth, tone, hasData: recent.length > 0 };
}

/** A tone → emotional color, for drifting memory cards. */
export function toneColor(tone: Tone | null, warmth: number | null = 0.5): string {
  if (tone === "cool") return "rgba(143, 160, 172, 0.7)";
  if (tone === "warm") return (warmth ?? 0.6) > 0.7 ? "rgba(217, 166, 108, 0.7)" : "rgba(176, 118, 114, 0.7)";
  if (tone === "neutral") return "rgba(154, 142, 129, 0.6)";
  return "rgba(216, 199, 172, 0.6)"; // mixed / unknown
}
