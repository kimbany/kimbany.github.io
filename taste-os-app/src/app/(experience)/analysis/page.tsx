import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";
import { Narration } from "@/components/cinematic/Narration";

/**
 * The cinematic interpretation space (not a loading screen).
 * Streamed narration over drifting fragments; see taste-os/analysis.md.
 */
export default function AnalysisPage() {
  return (
    <main className="flex flex-col items-center">
      <section className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-6 text-center">
        <Reveal as="h1">
          <span className="font-display italic text-beige" style={{ fontSize: "clamp(26px, 4.6vw, 46px)", lineHeight: 1.3, fontWeight: 300 }}>
            당신 안에 오래 머물렀던 감정들을
            <br />
            연결하고 있어요.
          </span>
        </Reveal>
      </section>
      <section className="flex min-h-screen items-center justify-center px-6">
        <Narration mode="evolving" />
      </section>
      <section className="flex min-h-[50vh] items-center justify-center px-6 pb-24">
        <Reveal delay={400}>
          <Beacon href="/report">이제 당신만의 분위기를 보여드릴게요</Beacon>
        </Reveal>
      </section>
    </main>
  );
}
