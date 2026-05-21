"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";

/**
 * Emotional friction detection — QA instrumentation, OFF unless
 * NEXT_PUBLIC_EMOTIONAL_QA="1". It does not optimize anything; it whispers to
 * the team when the experience risks breaking immersion:
 *  - pacing too fast (scrolling past a narration faster than it can breathe)
 *  - agitation (rapid repeated taps — an immersion break)
 *  - cold fallbacks (a degraded/robotic narration was shown)
 * Owner-scoped, write-only. Never shown to the user.
 */
export const QA_ON = process.env.NEXT_PUBLIC_EMOTIONAL_QA === "1";

type FrictionKind = "fast_pacing" | "agitation" | "cold_narration" | "immersion_break";

async function logFriction(kind: FrictionKind, detail: string, surface: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await addDoc(collection(db, "friction_signals"), {
      uid,
      kind,
      detail: detail.slice(0, 200),
      surface,
      createdAt: serverTimestamp(),
    });
  } catch {
    /* silent */
  }
}

/** Report a known cold/degraded narration (called from the AI layer surface). */
export function reportColdNarration(surface: string) {
  if (QA_ON) void logFriction("cold_narration", "voice fell back", surface);
}

let started = false;

export function startFrictionProbe() {
  if (!QA_ON || started || typeof window === "undefined") return;
  started = true;

  // — pacing: a fast flick past a narration region —
  let lastY = window.scrollY;
  let lastT = performance.now();
  const onScroll = () => {
    const now = performance.now();
    const dy = Math.abs(window.scrollY - lastY);
    const dt = Math.max(1, now - lastT);
    const v = dy / dt; // px/ms
    if (v > 4 && narrationInView()) {
      void logFriction("fast_pacing", `v=${v.toFixed(2)}px/ms`, pathSurface());
    }
    lastY = window.scrollY;
    lastT = now;
  };

  // — agitation: 4+ taps within 1.2s —
  const taps: number[] = [];
  const onTap = () => {
    const now = performance.now();
    taps.push(now);
    while (taps.length && now - taps[0]! > 1200) taps.shift();
    if (taps.length >= 4) {
      void logFriction("agitation", `${taps.length} taps/1.2s`, pathSurface());
      taps.length = 0;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointerdown", onTap, { passive: true });
}

function narrationInView(): boolean {
  const el = document.querySelector("[data-narration-region]");
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}

function pathSurface(): string {
  return typeof location !== "undefined" ? location.pathname : "unknown";
}
