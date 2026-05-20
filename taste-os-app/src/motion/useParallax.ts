"use client";

import { useEffect } from "react";

/**
 * Damped cursor parallax → CSS vars --parallax-x / --parallax-y on :root.
 * Lerp factor 0.04 = slow, floating, never twitchy.
 * Disabled for touch-only and reduced-motion.
 */
export function useParallax() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touchOnly =
      "ontouchstart" in window && !window.matchMedia("(hover: hover)").matches;
    if (reduced || touchOnly) return;

    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0,
      raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const tick = () => {
      cx += (tx - cx) * 0.04;
      cy += (ty - cy) * 0.04;
      const root = document.documentElement.style;
      root.setProperty("--parallax-x", cx.toFixed(3));
      root.setProperty("--parallax-y", cy.toFixed(3));
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
}
