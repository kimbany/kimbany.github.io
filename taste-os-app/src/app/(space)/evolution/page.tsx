import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";
import { Narration } from "@/components/cinematic/Narration";

/** A walk through emotional seasons. Full version in taste-os/evolution.md. */
export default function EvolutionPage() {
  return (
    <main className="flex flex-col items-center">
      <section className="flex min-h-[90vh] flex-col items-center justify-center gap-7 px-6 text-center">
        <Reveal as="h1">
          <span className="font-display italic text-beige" style={{ fontSize: "clamp(28px, 5vw, 50px)", lineHeight: 1.26, fontWeight: 300 }}>
            당신은 생각보다 많은 계절을
            <br />
            지나오고 있었습니다.
          </span>
        </Reveal>
      </section>
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
