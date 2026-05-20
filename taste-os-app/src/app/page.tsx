import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";

/**
 * The threshold. Not a marketing landing — a quiet invitation.
 */
export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <Reveal as="h1" className="max-w-[640px] font-display text-beige" >
        <span
          className="italic"
          style={{ fontSize: "clamp(32px, 5.6vw, 56px)", lineHeight: 1.22, fontWeight: 300 }}
        >
          당신은 어떤 분위기 속에서
          <br />
          가장 오래 머무르나요?
        </span>
      </Reveal>

      <Reveal delay={1400}>
        <hr className="h-px w-8 border-0 bg-bone/40" />
      </Reveal>

      <Reveal delay={1800} as="p">
        <span
          className="font-display italic text-mist"
          style={{ fontSize: "clamp(18px, 2.4vw, 24px)", lineHeight: 1.78 }}
        >
          사람은 자신이 사랑하는
          <br />
          공기의 결을 닮아갑니다.
        </span>
      </Reveal>

      <Reveal delay={2600}>
        <Beacon href="/onboarding">시작하기</Beacon>
      </Reveal>
    </main>
  );
}
