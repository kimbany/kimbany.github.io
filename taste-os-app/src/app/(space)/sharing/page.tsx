import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";

/** A cinematic emotional postcard, not social media. See taste-os/sharing-studio.md. */
export default function SharingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <Reveal as="h1">
        <span className="font-display italic text-beige" style={{ fontSize: "clamp(28px, 5vw, 50px)", lineHeight: 1.26, fontWeight: 300 }}>
          당신의 분위기는
          <br />
          말보다 더 많은 것을 전하고 있습니다.
        </span>
      </Reveal>
      <Reveal delay={1400} as="p">
        <span className="font-display italic text-mist" style={{ fontSize: "clamp(16px, 2.2vw, 20px)", lineHeight: 1.85 }}>
          설명하지 않아도,
          <br />
          당신만의 감정은 조용히 전해질 수 있어요.
        </span>
      </Reveal>
      <Reveal delay={2200}>
        <Beacon href="/home">나의 감정 기록 이어가기</Beacon>
      </Reveal>
    </main>
  );
}
