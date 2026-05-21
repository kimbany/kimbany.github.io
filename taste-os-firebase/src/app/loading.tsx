/**
 * Cinematic route loading — never a spinner. A single breathing point of light
 * and a quiet line, so even waiting feels like part of the atmosphere.
 */
export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-7 px-6 text-center">
      <span className="tos-load-dot" aria-hidden />
      <p className="font-display text-[clamp(15px,2vw,18px)] italic text-mist/70">
        잠시, 공기를 고르고 있어요.
      </p>
      <style>{`
        .tos-load-dot {
          width: 6px; height: 6px; border-radius: 9999px;
          background: var(--c-beige, #D8C7AC);
          box-shadow: 0 0 16px rgba(216,199,172,0.7), 0 0 40px rgba(176,118,114,0.4);
          animation: tos-load 3.4s ease-in-out infinite;
        }
        @keyframes tos-load {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        @media (prefers-reduced-motion: reduce) { .tos-load-dot { animation: none; } }
      `}</style>
    </main>
  );
}
