import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";
import { Narration } from "@/components/cinematic/Narration";

/** Weather for the soul. Full screen in taste-os/daily.md. */
export default function DailyPage() {
  return (
    <main className="flex flex-col items-center">
      <section className="flex min-h-[90vh] flex-col items-center justify-center gap-7 px-6 text-center">
        <Reveal as="h1">
          <span className="font-display italic text-beige" style={{ fontSize: "clamp(28px, 5vw, 50px)", lineHeight: 1.26, fontWeight: 300 }}>
            오늘 당신 안에는
            <br />
            이런 공기가 흐르고 있어요.
          </span>
        </Reveal>
      </section>
      <section className="flex min-h-screen items-center justify-center px-6">
        <Narration mode="daily" />
      </section>
      <section className="flex min-h-[50vh] items-center justify-center px-6 pb-24">
        <Reveal delay={400}>
          <Beacon href="/evolution">오늘의 감정 이어보기</Beacon>
        </Reveal>
      </section>
    </main>
  );
}
