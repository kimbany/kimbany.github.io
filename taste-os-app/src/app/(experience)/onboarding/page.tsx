import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";

/**
 * Onboarding entry. The full flow (images / music / quotes / atmosphere /
 * reflection) lives as composable steps; see taste-os/onboarding.md.
 */
export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <Reveal as="h1">
        <span
          className="font-display italic text-beige"
          style={{ fontSize: "clamp(28px, 5vw, 48px)", lineHeight: 1.25, fontWeight: 300 }}
        >
          우리는 자꾸 마음이 머무는
          <br />
          것들을 닮아갑니다.
        </span>
      </Reveal>
      <Reveal delay={1400} as="p">
        <span className="font-display italic text-mist" style={{ fontSize: "clamp(16px, 2.2vw, 20px)", lineHeight: 1.8 }}>
          몇 장면만, 천천히 골라볼게요.
        </span>
      </Reveal>
      <Reveal delay={2200}>
        <Beacon href="/analysis">시작할게요</Beacon>
      </Reveal>
    </main>
  );
}
