"use client";

import { useState } from "react";
import { whisperFeedback } from "@/lib/firebase/services/beta";

/**
 * A whisper, not a survey. One quiet line — "지금 마음이 어떤가요" — that a
 * beta visitor can leave after a moment that landed. No stars, no scores.
 */
export function FeedbackWhisper() {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="font-display text-[14px] italic text-mist/70">
        고마워요. 당신의 한 마디가, 이 공기를 데워요.
      </p>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        try {
          await whisperFeedback(text);
        } catch {
          /* silent — feedback is a gift, never a gate */
        } finally {
          setSent(true);
        }
      }}
      className="flex w-[min(440px,86vw)] flex-col items-center gap-3"
    >
      <label className="font-display text-[14px] italic text-mist/70">지금, 마음이 어떤가요</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
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
