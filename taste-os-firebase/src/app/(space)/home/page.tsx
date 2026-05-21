"use client";

import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";
import { Narration } from "@/components/cinematic/Narration";
import { MemoryDrift } from "@/components/memory/MemoryDrift";
import { useCurrentAtmosphere } from "@/hooks/useCurrentAtmosphere";
import { useLatestReport } from "@/hooks/useLatestReport";
import { useEmotionalMemories } from "@/hooks/useEmotionalMemories";
import { useTimeline } from "@/hooks/useTimeline";
import { useNostalgicMemory } from "@/hooks/useNostalgicMemory";

const eyebrow = "font-sans text-[11px] uppercase tracking-[0.18em] text-mist/70";

/**
 * Identity Dashboard — a living emotional room, wired to real data:
 * current atmosphere, evolving identity (genome), streamed narration, drifting
 * memory fragments, resonance patterns, an evolution preview, and a quietly
 * resurfaced nostalgic memory. All real-time via Firestore snapshots.
 */
export default function HomePage() {
  const atmosphere = useCurrentAtmosphere();
  const { report } = useLatestReport();
  const { memories } = useEmotionalMemories(24);
  const { trajectory } = useTimeline();
  const nostalgic = useNostalgicMemory();

  const labelEn = atmosphere?.labelEn ?? report?.genome?.[0]?.en ?? "Quiet Warmth";
  const labelKo = atmosphere?.labelKo ?? report?.genome?.[0]?.ko ?? "조용한 따뜻함";
  const themes = report?.sections?.recurringThemes ?? [];

  return (
    <main className="flex flex-col items-center">
      {/* current atmosphere + evolving identity */}
      <section className="flex min-h-[90vh] flex-col items-center justify-center gap-6 px-6 text-center">
        <Reveal as="p" className={eyebrow}>오늘의 공기</Reveal>
        <Reveal delay={500} as="p">
          <span className="font-display italic text-beige [font-size:clamp(28px,4.4vw,42px)]">{labelEn}</span>
        </Reveal>
        <Reveal delay={1100} as="p">
          <span className="font-display italic leading-[1.7] text-mist [font-size:clamp(17px,2.2vw,22px)]">
            {labelKo} 속에서
            <br />
            머무르고 있어요.
          </span>
        </Reveal>
      </section>

      {/* a quiet noticing — streamed narration */}
      <section className="flex min-h-screen flex-col items-center justify-center gap-10 px-6">
        <Reveal as="p" className={eyebrow}>조용한 알아챔</Reveal>
        <Narration mode="resonant" />
      </section>

      {/* drifting memory fragments */}
      <section className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-6">
        <Reveal as="p" className={eyebrow}>머무른 결들</Reveal>
        <MemoryDrift memories={memories} />
      </section>

      {/* emotional resonance patterns (recurring themes) */}
      {themes.length > 0 && (
        <section className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
          <Reveal as="p" className={eyebrow}>반복되는 결</Reveal>
          {themes.slice(0, 4).map((t, i) => (
            <Reveal key={t + i} delay={i * 200} as="p">
              <span className="font-display italic text-beige [font-size:clamp(17px,2.4vw,24px)]">{t}</span>
            </Reveal>
          ))}
        </section>
      )}

      {/* evolution preview — trajectory dots */}
      {trajectory.length > 0 && (
        <section className="flex min-h-[50vh] flex-col items-center justify-center gap-8 px-6 text-center">
          <Reveal as="p" className={eyebrow}>흘러온 결</Reveal>
          <Reveal delay={400}>
            <div className="flex items-end gap-4">
              {trajectory.slice(-6).map((s, i, arr) => (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  <span
                    className="rounded-full"
                    style={{
                      width: 8 + (i === arr.length - 1 ? 10 : i * 2),
                      height: 8 + (i === arr.length - 1 ? 10 : i * 2),
                      background: `rgba(216,199,172,${0.4 + (s.warmth ?? 0.5) * 0.5})`,
                      boxShadow: "0 0 12px rgba(176,118,114,0.3)",
                    }}
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* a quietly resurfaced memory */}
      {nostalgic?.caption && (
        <section className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <Reveal as="p" className={eyebrow}>한동안 잊고 있던 결</Reveal>
          <Reveal delay={400} as="p">
            <span className="font-display italic leading-[1.7] text-mist/90 [font-size:clamp(16px,2.2vw,20px)]">
              {nostalgic.caption}
            </span>
          </Reveal>
        </section>
      )}

      {/* continuation */}
      <section className="flex min-h-[50vh] flex-col items-center justify-center gap-9 px-6 pb-32 text-center">
        <Reveal>
          <hr className="h-px w-9 border-0 bg-bone/40" />
        </Reveal>
        <Reveal delay={400}>
          <Beacon href="/evolution">나의 변화 이어보기</Beacon>
        </Reveal>
      </section>
    </main>
  );
}
