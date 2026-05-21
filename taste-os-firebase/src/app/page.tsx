import Link from "next/link";
import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";

/**
 * Soft-launch landing — not a campaign, a discovery. A slow cinematic intro a
 * person quietly falls into: a few atmosphere lines, the core poem, and a calm
 * invitation. Mobile-first, made for night.
 */
export default function Page() {
  return (
    <main className="flex flex-col items-center">
      {/* opening — the slow intro sequence */}
      <section className="flex min-h-[100svh] flex-col items-center justify-center gap-9 px-6 text-center">
        <Reveal as="p" className="font-sans text-[11px] uppercase tracking-[0.24em] text-mist/55">
          Taste OS
        </Reveal>

        <Reveal delay={800} as="h1" className="max-w-[640px] font-display text-beige">
          <span className="italic" style={{ fontSize: "clamp(32px, 5.6vw, 56px)", lineHeight: 1.24, fontWeight: 300 }}>
            당신은 어떤 분위기 속에서
            <br />
            가장 오래 머무르나요?
          </span>
        </Reveal>

        <Reveal delay={2200}>
          <hr className="h-px w-8 border-0 bg-bone/40" />
        </Reveal>

        <Reveal delay={2700} as="p">
          <span className="font-display italic text-mist" style={{ fontSize: "clamp(17px, 2.4vw, 23px)", lineHeight: 1.8 }}>
            사람은 자신이 사랑하는
            <br />
            공기의 결을 닮아갑니다.
          </span>
        </Reveal>

        <Reveal delay={3800} className="flex flex-col items-center gap-5">
          <Beacon href="/beta">조용히 들어가기</Beacon>
          <Link
            href="/onboarding"
            className="font-display text-[14px] italic text-mist/55 transition-opacity hover:opacity-100"
          >
            ─ 공기만 먼저 느껴볼게요 ─
          </Link>
        </Reveal>
      </section>

      {/* what it is — atmospheric, never feature copy */}
      <section className="flex min-h-[80svh] flex-col items-center justify-center gap-7 px-6 text-center">
        <Reveal as="p">
          <span className="font-display italic leading-[1.7] text-beige/90" style={{ fontSize: "clamp(20px, 3vw, 30px)" }}>
            여기엔 점수도, 유형도, 진단도 없어요.
            <br />
            그저, 당신 안에 흐르는 공기를
            <br />
            조용히 비춰드릴 뿐이에요.
          </span>
        </Reveal>
      </section>

      {/* a closing line that lingers */}
      <section className="flex min-h-[70svh] flex-col items-center justify-center gap-10 px-6 pb-32 text-center">
        <Reveal as="p">
          <span className="font-display italic leading-[1.5] text-beige" style={{ fontSize: "clamp(24px, 4vw, 42px)" }}>
            당신은 계속 변하고 있습니다.
            <br />
            그 변화 속에도, 당신만의 분위기는
            <br />
            조용히 이어지고 있어요.
          </span>
        </Reveal>
        <Reveal delay={1400}>
          <Beacon href="/beta">나의 분위기를 만나러 가기</Beacon>
        </Reveal>
      </section>
    </main>
  );
}
