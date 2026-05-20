"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE, DURATION } from "@/motion/easings";
import type { RecallMode } from "@/types/atmosphere";

/**
 * Streams a narration from /api/narrate and reveals it sentence-by-sentence
 * with breath pacing: a line blooms, lingers (longer if longer), dissolves,
 * then silence. Generation is fast; the words are slow on purpose.
 * (See narration.md §8.)
 */
export function Narration({ mode = "resonant" }: { mode?: RecallMode }) {
  const [line, setLine] = useState<string>("");
  const [visible, setVisible] = useState(false);
  const queue = useRef<string[]>([]);
  const running = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;

    const breath = (text: string) => {
      if (reduced) return 1200;
      const chars = text.replace(/\s/g, "").length;
      return Math.min(4200, 900 + chars * 95);
    };

    async function drainQueue() {
      if (running.current) return;
      running.current = true;
      while (queue.current.length && !cancelled) {
        const next = queue.current.shift()!;
        setLine(next);
        setVisible(true);
        await sleep(DURATION.reveal * 1000);
        await sleep(breath(next));
        setVisible(false);
        await sleep(DURATION.exit * 1000 + 1300); // exit + silence
      }
      running.current = false;
    }

    async function run() {
      try {
        const { auth } = await import("@/lib/firebase/client");
        const idToken = (await auth.currentUser?.getIdToken()) ?? null;
        const res = await fetch("/api/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, idToken }),
        });
        if (!res.body) return;
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let sentence = "";
        while (!cancelled) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const events = buf.split("\n\n");
          buf = events.pop() ?? "";
          for (const ev of events) {
            const m = ev.match(/^data: (.*)$/s);
            if (!m) continue;
            if (m[1] === "[DONE]") {
              if (sentence.trim()) queue.current.push(sentence.trim());
              continue;
            }
            try {
              const { token } = JSON.parse(m[1]!) as { token: string };
              sentence += token;
              if (/[.。\n]/.test(token)) {
                queue.current.push(sentence.trim());
                sentence = "";
                drainQueue();
              }
            } catch {
              /* ignore partial */
            }
          }
        }
        drainQueue();
      } catch {
        /* graceful silence */
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return (
    <div className="relative flex min-h-[38vh] w-full max-w-[720px] items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {visible && (
          <motion.p
            key={line}
            className="text-center font-display italic text-beige"
            style={{
              fontSize: "clamp(24px, 4vw, 40px)",
              lineHeight: 1.5,
              letterSpacing: "-0.008em",
            }}
            initial={{ opacity: 0, filter: "blur(14px)", letterSpacing: "0.10em" }}
            animate={{ opacity: 1, filter: "blur(0px)", letterSpacing: "-0.008em" }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: DURATION.reveal, ease: EASE.breathIn }}
          >
            {line.split("\n").map((seg, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {seg}
              </span>
            ))}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
