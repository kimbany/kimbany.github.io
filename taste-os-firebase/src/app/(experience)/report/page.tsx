"use client";

import { useState } from "react";
import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";
import { Narration } from "@/components/cinematic/Narration";
import { useLatestReport } from "@/hooks/useLatestReport";
import { generateTasteReport } from "@/server/actions/report";
import { auth } from "@/lib/firebase/client";

const eyebrow = "font-sans text-[11px] uppercase tracking-[0.18em] text-mist/70";
const headline = "font-display italic text-beige leading-[1.3] [font-size:clamp(26px,4.4vw,46px)]";
const line = "font-display italic text-beige leading-[1.6] [font-size:clamp(20px,3vw,30px)]";

export default function ReportPage() {
  const { report, loading } = useLatestReport();
  const [weaving, setWeaving] = useState(false);

  async function weave() {
    setWeaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) await generateTasteReport({ idToken });
    } catch {
      /* graceful — a gentle portrait still appears once written */
    } finally {
      setWeaving(false);
    }
  }

  // ── no report yet: a quiet invitation to weave one ──
  if (!loading && !report) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-9 px-6 text-center">
        <Reveal as="h1">
          <span className={headline}>
            아직, 당신의 분위기를
            <br />
            엮어두지 않았어요.
          </span>
        </Reveal>
        <Reveal delay={900}>
          {weaving ? (
            <span className="font-display italic text-mist [font-size:clamp(16px,2.2vw,20px)]">
              당신의 결들을 모아, 하나의 분위기를 엮고 있어요.
            </span>
          ) : (
            <Beacon onClick={weave}>이제 당신의 분위기를 보여드릴게요</Beacon>
          )}
        </Reveal>
      </main>
    );
  }

  const r = report;

  return (
    <main className="flex flex-col items-center">
      {/* 01 — opening */}
      <section className="flex min-h-screen flex-col items-center justify-center gap-7 px-6 text-center">
        <Reveal as="h1">
          <span className={headline}>
            당신 안에는 이런 분위기가
            <br />
            흐르고 있었어요.
          </span>
        </Reveal>
      </section>

      {/* 02 — taste genome constellation */}
      <section className="flex min-h-[90vh] flex-col items-center justify-center gap-10 px-6 text-center">
        <Reveal as="p" className={eyebrow}>
          당신의 감정 별자리
        </Reveal>
        <div className="flex max-w-[640px] flex-wrap items-center justify-center gap-x-7 gap-y-4">
          {(r?.genome ?? []).map((g, i) => (
            <Reveal key={g.en} delay={400 + i * 300}>
              <span
                className="font-display italic text-beige"
                style={{ fontSize: "clamp(20px, 2.8vw, 32px)", opacity: 0.6 + (g.weight ?? 0.5) * 0.4 }}
              >
                {g.en}
              </span>
            </Reveal>
          ))}
        </div>
        <Reveal delay={1800} as="p">
          <span className="font-display italic text-mist [font-size:13px]">
            {(r?.genome ?? []).map((g) => g.ko).join(" · ")}
          </span>
        </Reveal>
      </section>

      {/* 03 — emotional atmosphere + a live quiet noticing */}
      <section className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 text-center">
        <Reveal as="p" className={eyebrow}>
          당신의 공기
        </Reveal>
        {r?.sections?.atmosphereKo && (
          <Reveal delay={400} as="p">
            <span className={line}>{r.sections.atmosphereKo}</span>
          </Reveal>
        )}
        <Narration mode="resonant" />
      </section>

      {/* 04 — recurring emotional themes */}
      {!!r?.sections?.recurringThemes?.length && (
        <section className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-6 text-center">
          <Reveal as="p" className={eyebrow}>
            반복되는 결
          </Reveal>
          <div className="flex flex-col gap-5">
            {r.sections.recurringThemes.map((t, i) => (
              <Reveal key={t + i} delay={i * 220} as="p">
                <span className="font-display italic text-beige [font-size:clamp(18px,2.6vw,26px)]">{t}</span>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* 05 — emotional contrasts */}
      {!!r?.sections?.contrasts?.length && (
        <section className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-6 text-center">
          <Reveal as="p" className={eyebrow}>
            함께 흐르는 결
          </Reveal>
          <div className="flex flex-col gap-5">
            {r.sections.contrasts.map((c, i) => (
              <Reveal key={i} delay={i * 220} as="p">
                <span className="font-display italic text-beige [font-size:clamp(18px,2.6vw,24px)]">
                  {c.coolKo} <span className="text-mist/50">↔</span> {c.warmKo}
                </span>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* 06 — atmosphere evolution */}
      {r?.sections?.evolutionKo && (
        <section className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-6 text-center">
          <Reveal as="p" className={eyebrow}>
            흘러온 결
          </Reveal>
          <Reveal delay={400} as="p">
            <span className={line}>{r.sections.evolutionKo}</span>
          </Reveal>
        </section>
      )}

      {/* 07 — visual emotional resonance */}
      {!!r?.sections?.resonance?.length && (
        <section className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
          <Reveal as="p" className={eyebrow}>
            시각적 공명
          </Reveal>
          {r.sections.resonance.map((res, i) => (
            <Reveal key={i} delay={i * 260} as="p">
              <span className="font-display italic leading-[1.7] text-mist/90 [font-size:clamp(16px,2.2vw,20px)]">
                {res}
              </span>
            </Reveal>
          ))}
        </section>
      )}

      {/* 08 — emotional memory echoes */}
      {!!r?.sections?.echoes?.length && (
        <section className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
          <Reveal as="p" className={eyebrow}>
            기억의 잔상
          </Reveal>
          {r.sections.echoes.map((e, i) => (
            <Reveal key={i} delay={i * 240} as="p">
              <span className="font-display italic text-beige/90 [font-size:clamp(16px,2.2vw,20px)]">
                {e.caption}
              </span>
            </Reveal>
          ))}
        </section>
      )}

      {/* 09 — ending + continuation */}
      <section className="flex min-h-[80vh] flex-col items-center justify-center gap-10 px-6 pb-32 text-center">
        <Reveal as="p">
          <span className="font-display italic leading-[1.4] text-beige [font-size:clamp(24px,4vw,42px)]">
            당신은 계속 변하고 있습니다.
            <br />
            그리고 그 변화 속에도,
            <br />
            당신만의 분위기는 조용히 이어지고 있어요.
          </span>
        </Reveal>
        <Reveal delay={1600}>
          <Beacon href="/home">나의 감정 공간으로 이어가기</Beacon>
        </Reveal>
      </section>
    </main>
  );
}
