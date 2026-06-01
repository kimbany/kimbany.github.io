"use client";

import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";
import { ReflectionPrompt } from "@/components/feedback/ReflectionPrompt";

/**
 * A quiet room for reflection feedback — entered only when a person wants to
 * leave a trace. The four questions surface one at a time across visits.
 */
export default function ReflectPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-24 text-center">
      <Reveal as="p" className="font-sans text-[11px] uppercase tracking-[0.2em] text-mist/60">
        머문 자리
      </Reveal>
      <Reveal delay={400} as="h1">
        <span className="font-display italic text-beige [font-size:clamp(24px,4.4vw,40px)] leading-[1.3] [font-weight:300]">
          잠시 머무는 동안,
          <br />
          무엇이 마음에 남았나요.
        </span>
      </Reveal>
      <Reveal delay={1100}>
        <ReflectionPrompt />
      </Reveal>
      <Reveal delay={1700}>
        <Beacon href="/home">다시 나의 공간으로</Beacon>
      </Reveal>
    </main>
  );
}
