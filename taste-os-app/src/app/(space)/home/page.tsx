import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";
import { Narration } from "@/components/cinematic/Narration";

/**
 * The quiet room the user returns to. A representative wiring of the
 * cinematic primitives + streaming narration over the shared atmosphere.
 * (Full sections per taste-os/home.md.)
 */
export default function HomePage() {
  return (
    <main className="flex flex-col items-center">
      {/* current atmosphere */}
      <section className="flex min-h-[90vh] flex-col items-center justify-center gap-7 px-6 text-center">
        <Reveal as="p" className="font-sans text-[11px] uppercase tracking-[0.18em] text-mist/70">
          오늘의 공기
        </Reveal>
        <Reveal delay={500} as="p">
          <span className="font-display italic text-beige" style={{ fontSize: "clamp(28px, 4.4vw, 42px)" }}>
            Quiet Warmth
          </span>
        </Reveal>
        <Reveal delay={1100} as="p">
          <span className="font-display italic text-mist" style={{ fontSize: "clamp(17px, 2.2vw, 22px)", lineHeight: 1.7 }}>
            조용한 따뜻함 속에서
            <br />
            머무르고 있어요.
          </span>
        </Reveal>
      </section>

      {/* a quiet noticing — streamed from the narration engine */}
      <section className="flex min-h-screen flex-col items-center justify-center gap-10 px-6">
        <Reveal as="p" className="font-sans text-[11px] uppercase tracking-[0.18em] text-mist/70">
          조용한 알아챔
        </Reveal>
        <Narration mode="resonant" />
      </section>

      {/* continuation */}
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-9 px-6 pb-32 text-center">
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
