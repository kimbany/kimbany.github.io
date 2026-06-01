import { Reveal } from "@/components/cinematic/Reveal";
import { EmotionalUpload } from "@/components/upload/EmotionalUpload";

/**
 * Image upload → AI atmosphere analysis. Not recognition — a quiet reading of
 * a scene's feeling, which becomes a remembered fragment and, in turn, shapes
 * the Taste Report. Full pipeline lives in lib/ai/* + server/actions/*.
 */
export default function UploadPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-24 text-center">
      <Reveal as="h1">
        <span
          className="font-display italic text-beige"
          style={{ fontSize: "clamp(26px, 4.6vw, 46px)", lineHeight: 1.28, fontWeight: 300 }}
        >
          마음이 머물렀던 한 장면을
          <br />
          가만히 올려 주세요.
        </span>
      </Reveal>

      <EmotionalUpload />

      <Reveal delay={800} as="p">
        <span className="font-display text-[13px] italic text-mist/60">
          무엇이 찍혔는지가 아니라, 어떤 공기가 흐르는지를 읽어요.
        </span>
      </Reveal>
    </main>
  );
}
