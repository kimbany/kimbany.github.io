"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/cinematic/Reveal";
import { recordReflection } from "@/lib/firebase/services/resonance";

/**
 * Reflection feedback — not a survey, a quiet question after a moment that
 * landed. One question at a time, in the late-night essay voice. No stars,
 * no required fields, no "rate your experience".
 */
const QUESTIONS = [
  "어떤 문장이 가장 오래 기억에 남았나요?",
  "어떤 순간에 가장 이해받는 느낌이 들었나요?",
  "다시 들어오고 싶은 감정이 있었나요?",
  "이상하게 계속 생각나는 장면이 있었나요?",
];

export function ReflectionPrompt({ index }: { index?: number }) {
  const question = useMemo(
    () => QUESTIONS[(index ?? Math.floor(Math.random() * QUESTIONS.length)) % QUESTIONS.length]!,
    [index]
  );
  const [answer, setAnswer] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Reveal as="p">
        <span className="font-display text-[14px] italic text-mist/70">
          고마워요. 당신이 남긴 결이, 이 공간에 조용히 스며들어요.
        </span>
      </Reveal>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!answer.trim()) return;
        await recordReflection(question, answer);
        setDone(true);
      }}
      className="flex w-[min(460px,88vw)] flex-col items-center gap-4 text-center"
    >
      <p className="font-display text-[clamp(16px,2.4vw,21px)] italic leading-[1.6] text-beige/90">
        {question}
      </p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={2}
        placeholder="떠오르는 그대로, 한 줄이어도 좋아요"
        className="w-full resize-none rounded-[2px] border border-bone/30 bg-beige/[0.03] px-4 py-3 text-center font-display text-[16px] italic text-beige outline-none transition-colors placeholder:text-mist/40 focus:border-rose/40"
      />
      <button
        type="submit"
        className="font-display text-[13px] italic text-mist/60 transition-opacity hover:opacity-100"
      >
        ─ 조용히 건네기 ─
      </button>
    </form>
  );
}
