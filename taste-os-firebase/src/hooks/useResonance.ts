"use client";

import { useCallback, useEffect, useRef } from "react";
import { recordResonance, type ResonanceKind } from "@/lib/firebase/services/resonance";

/**
 * Resonance observation — the quiet, emotion-first signals.
 *  - lingerRef: attach to a region; if a person dwells past `dwellMs`, that's
 *    a "lingered" signal (a moment they stayed inside).
 *  - keep(): an explicit "간직하기" — a line worth carrying.
 *  - on mount, records "returned" for the surface (a meaningful revisit).
 * No clicks, no scroll depth, no timers that reward staying.
 */
export function useResonance(surface: string, opts: { dwellMs?: number; recordReturn?: boolean } = {}) {
  const { dwellMs = 6000, recordReturn = true } = opts;
  const lingered = useRef(false);

  useEffect(() => {
    if (recordReturn) void recordResonance("returned", surface);
  }, [surface, recordReturn]);

  const keep = useCallback(
    (ref?: string) => void recordResonance("kept", surface, ref),
    [surface]
  );

  const lingerRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node || lingered.current) return;
      if (!("IntersectionObserver" in window)) return;
      let timer: number | undefined;
      const io = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          if (e?.isIntersecting) {
            timer = window.setTimeout(() => {
              if (!lingered.current) {
                lingered.current = true;
                void recordResonance("lingered", surface, node.dataset.ref);
                io.disconnect();
              }
            }, dwellMs);
          } else if (timer) {
            window.clearTimeout(timer);
          }
        },
        { threshold: 0.6 }
      );
      io.observe(node);
    },
    [surface, dwellMs]
  );

  const signal = useCallback(
    (kind: ResonanceKind, ref?: string) => void recordResonance(kind, surface, ref),
    [surface]
  );

  return { lingerRef, keep, signal };
}
