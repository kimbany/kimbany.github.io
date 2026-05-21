"use client";

import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";
import { Narration } from "@/components/cinematic/Narration";
import { useTimeline } from "@/hooks/useTimeline";

const eyebrow = "font-sans text-[11px] uppercase tracking-[0.18em] text-mist/70";

/**
 * Identity Evolution Timeline — a cinematic walk through the seasons of a self,
 * built from real atmosphere snapshots + timeline markers. The Evolution Engine
 * (warmth shift, atmosphere shifts) reads straight from this data.
 */
export default function EvolutionPage() {
  const { trajectory, events, warmthShift } = useTimeline();

  const seasons = trajectory.length
    ? trajectory
    : events.map((e, i) => ({
        id: e.id,
        labelKo: e.labelKo,
        labelEn: e.toLabel,
        warmth: e.warmth ?? 0.5,
        periodStart: "",
        current: i === events.length - 1,
      }));

  return (
    <main className="flex flex-col items-center">
      <section className="flex min-h-[90vh] flex-col items-center justify-center gap-7 px-6 text-center">
        <Reveal as="h1">
          <span className="font-display italic text-beige [font-size:clamp(28px,5vw,50px)] leading-[1.26] [font-weight:300]">
            당신은 생각보다 많은 계절을
            <br />
            지나오고 있었습니다.
          </span>
        </Reveal>
        {warmthShift > 0.05 && (
          <Reveal delay={900} as="p">
            <span className="font-display italic text-mist [font-size:clamp(16px,2.2vw,20px)]">
              예전보다 조금 더 따뜻한 쪽으로, 천천히.
            </span>
          </Reveal>
        )}
      </section>

      {/* real seasons */}
      {seasons.length > 0 ? (
        seasons.map((s, i) => (
          <section
            key={s.id ?? i}
            className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-6 text-center"
          >
            <Reveal as="p" className={eyebrow}>
              {i === seasons.length - 1 ? "지금의 계절" : `${seasons.length - i}번째 전의 계절`}
            </Reveal>
            <Reveal delay={400} as="h2">
              <span className="font-display italic text-beige [font-size:clamp(26px,4.4vw,44px)] leading-[1.2]">
                {s.labelEn ?? s.labelKo}
              </span>
            </Reveal>
            <Reveal delay={800} as="p">
              <span className="font-display italic text-mist [font-size:14px]">{s.labelKo}</span>
            </Reveal>
          </section>
        ))
      ) : (
        <section className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
          <Reveal as="p">
            <span className="font-display italic leading-[1.6] text-mist [font-size:clamp(17px,2.4vw,22px)]">
              아직은 한 계절이에요.
              <br />
              시간이 쌓이면, 결이 흘러온 길이 보일 거예요.
            </span>
          </Reveal>
        </section>
      )}

      {/* a quiet evolving narration */}
      <section className="flex min-h-screen items-center justify-center px-6">
        <Narration mode="evolving" />
      </section>

      <section className="flex min-h-[50vh] items-center justify-center px-6 pb-24">
        <Reveal delay={400}>
          <Beacon href="/home">지금의 나로 돌아가기</Beacon>
        </Reveal>
      </section>
    </main>
  );
}
