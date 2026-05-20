import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";

/**
 * The Taste Report reveal — a cinematic emotional portrait, not results.
 * Full scroll experience in taste-os/report-reveal.md.
 */
export default function ReportPage() {
  return (
    <main className="flex flex-col items-center">
      <section className="flex min-h-screen flex-col items-center justify-center gap-7 px-6 text-center">
        <Reveal as="h1">
          <span className="font-display italic text-beige" style={{ fontSize: "clamp(30px, 5.4vw, 56px)", lineHeight: 1.25, fontWeight: 300 }}>
            당신 안에는 이런 분위기가
            <br />
            흐르고 있었어요.
          </span>
        </Reveal>
      </section>

      <section className="flex min-h-[90vh] flex-col items-center justify-center gap-10 px-6 text-center">
        <Reveal as="p" className="font-sans text-[11px] uppercase tracking-[0.18em] text-mist/70">
          당신의 감정 별자리
        </Reveal>
        <Reveal delay={500} as="p">
          <span className="font-display italic text-beige" style={{ fontSize: "clamp(22px, 3vw, 34px)" }}>
            Quiet Warmth · Urban Nostalgia
            <br />
            Emotional Minimalism · Warm Futurism
          </span>
        </Reveal>
      </section>

      <section className="flex min-h-[80vh] flex-col items-center justify-center gap-10 px-6 pb-32 text-center">
        <Reveal as="p">
          <span className="font-display italic text-beige" style={{ fontSize: "clamp(26px, 4vw, 44px)", lineHeight: 1.4, fontWeight: 300 }}>
            당신은 계속 변하고 있습니다.
            <br />
            그리고 그 변화 속에도,
            <br />
            당신만의 분위기는 조용히 이어지고 있어요.
          </span>
        </Reveal>
        <Reveal delay={1800}>
          <Beacon href="/home">나의 감정 공간으로 이어가기</Beacon>
        </Reveal>
      </section>
    </main>
  );
}
