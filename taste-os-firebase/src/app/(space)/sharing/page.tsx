"use client";

import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";
import { useLatestReport } from "@/hooks/useLatestReport";

/** A cinematic emotional postcard, not social media. The card draws its genome
 *  from the live Taste Report. See taste-os/sharing-studio.md. */
export default function SharingPage() {
  const { report } = useLatestReport();
  const top = report?.genome?.[0];
  const palette = report?.palette ?? ["#B07672", "#D9A66C", "#D8C7AC"];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-24 text-center">
      <Reveal as="h1">
        <span className="font-display italic text-beige" style={{ fontSize: "clamp(26px, 4.6vw, 46px)", lineHeight: 1.26, fontWeight: 300 }}>
          당신의 분위기는
          <br />
          말보다 더 많은 것을 전하고 있습니다.
        </span>
      </Reveal>

      {/* the taste card, drawn from the report */}
      <Reveal delay={700}>
        <article className="flex w-[min(320px,80vw)] flex-col items-center gap-5 rounded-[4px] border border-bone/40 bg-coal/40 px-7 py-10 text-center">
          <span className="font-display text-[11px] uppercase tracking-[0.2em] text-mist/60">Taste OS</span>
          <span className="font-display italic text-beige [font-size:clamp(24px,3.4vw,32px)]">
            {top?.en ?? "Quiet Warmth"}
          </span>
          <span className="font-display italic text-mist [font-size:14px]">{top?.ko ?? "조용한 따뜻함"}</span>
          {report?.narration?.[0] && (
            <span className="font-display italic leading-[1.6] text-beige/90 [font-size:clamp(14px,1.9vw,17px)]">
              {report.narration[0]}
            </span>
          )}
          <div className="mt-1 flex gap-2.5">
            {palette.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full"
                style={{ background: /^#|rgb/.test(c) ? c : undefined, boxShadow: "0 0 8px rgba(216,199,172,0.4)" }}
              />
            ))}
          </div>
        </article>
      </Reveal>

      <Reveal delay={1600}>
        <Beacon href="/home">나의 감정 기록 이어가기</Beacon>
      </Reveal>
    </main>
  );
}
