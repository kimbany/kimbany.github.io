"use client";

import { useMemo } from "react";
import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";
import { Narration } from "@/components/cinematic/Narration";
import { MemoryDrift } from "@/components/memory/MemoryDrift";
import { useEmotionalMemories } from "@/hooks/useEmotionalMemories";
import { deriveDailyAtmosphere } from "@/lib/atmosphere/daily";

const eyebrow = "font-sans text-[11px] uppercase tracking-[0.18em] text-mist/70";

/**
 * Daily Atmosphere — weather for the soul, derived live from recent memories
 * (uploads, reflections, recurring tones). Not a metric; a reading of today's
 * air, with a streamed daily narration and the resonant fragments beneath it.
 */
export default function DailyPage() {
  const { memories } = useEmotionalMemories(24);
  const daily = useMemo(() => deriveDailyAtmosphere(memories), [memories]);

  return (
    <main className="flex flex-col items-center">
      <section className="flex min-h-[90vh] flex-col items-center justify-center gap-7 px-6 text-center">
        <Reveal as="h1">
          <span className="font-display italic text-beige [font-size:clamp(28px,5vw,50px)] leading-[1.26] [font-weight:300]">
            오늘 당신 안에는
            <br />
            이런 공기가 흐르고 있어요.
          </span>
        </Reveal>
        <Reveal delay={900} as="p">
          <span className="font-display italic text-mist [font-size:clamp(18px,2.6vw,26px)]">
            {daily.labelKo}
          </span>
        </Reveal>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6">
        <Narration mode="daily" />
      </section>

      <section className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-6">
        <Reveal as="p" className={eyebrow}>오늘과 공명하는 결</Reveal>
        <MemoryDrift memories={memories} />
      </section>

      <section className="flex min-h-[50vh] items-center justify-center px-6 pb-24">
        <Reveal delay={400}>
          <Beacon href="/evolution">오늘의 감정 이어보기</Beacon>
        </Reveal>
      </section>
    </main>
  );
}
