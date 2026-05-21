"use client";

import { useMemo } from "react";
import type { MemoryDoc } from "@/lib/firebase/collections";
import { toneColor } from "@/lib/atmosphere/daily";

/**
 * Drifting emotional memory fragments — not a gallery, a quiet field of
 * recollections. Each fragment is a small tone-colored card that floats; its
 * caption surfaces on hover. Renders the *feeling* (tone/caption), never fetches
 * the original image — so it stays light and the air keeps breathing.
 */
export function MemoryDrift({
  memories,
  className = "",
}: {
  memories: Array<MemoryDoc & { id: string }>;
  className?: string;
}) {
  // deterministic scatter so positions are stable across renders
  const placed = useMemo(
    () =>
      memories.slice(0, 10).map((m, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const x = 6 + ((seed % 1000) / 1000) * 84;
        const y = 8 + (((seed >> 3) % 1000) / 1000) * 76;
        const dur = 11 + (i % 5) * 1.6;
        const delay = -(i * 1.3);
        return { m, x, y, dur, delay };
      }),
    [memories]
  );

  if (placed.length === 0) {
    return (
      <div className={`flex h-[280px] w-full items-center justify-center ${className}`}>
        <p className="font-display text-[14px] italic text-mist/50">
          머무른 결들이, 곧 이곳에 떠다닐 거예요.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative h-[340px] w-full max-w-[640px] ${className}`} aria-hidden>
      {placed.map(({ m, x, y, dur, delay }) => (
        <div
          key={m.id}
          className="tos-frag group absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${x}%`, top: `${y}%`, animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
        >
          <span
            className="block h-14 w-14 rounded-full"
            style={{
              background: `radial-gradient(circle, ${toneColor(m.tone, m.warmth)}, transparent 70%)`,
              filter: "blur(6px)",
            }}
          />
          {m.caption && (
            <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-display text-[12px] italic text-mist opacity-0 transition-opacity duration-700 group-hover:opacity-90">
              {m.caption}
            </span>
          )}
        </div>
      ))}

      <style jsx>{`
        .tos-frag {
          animation-name: tos-frag-float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        @keyframes tos-frag-float {
          0%,
          100% {
            transform: translate(-50%, -50%);
          }
          50% {
            transform: translate(calc(-50% + 18px), calc(-50% - 22px));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .tos-frag {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
