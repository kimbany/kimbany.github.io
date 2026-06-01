"use client";

import { useEffect, useRef } from "react";

/**
 * The three-layer atmosphere shared by every screen:
 * orbs (emotional light), dust (drifting particles), grain (film texture),
 * plus the sigil. Pure decoration-free — this IS the space.
 */
export function AmbientField() {
  const dustRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const field = dustRef.current;
    if (!field) return;

    const width = window.innerWidth;
    const count = width < 768 ? 12 : width < 1280 ? 18 : 26;
    const tones = ["dust-rose", "dust-silver", "dust-ember"];
    const nodes: HTMLSpanElement[] = [];

    for (let i = 0; i < count; i++) {
      const d = document.createElement("span");
      d.className = `tos-dust ${tones[i % tones.length]}`;
      const size = 1.5 + Math.random() * 1.8;
      d.style.left = `${Math.random() * 100}%`;
      d.style.width = `${size}px`;
      d.style.height = `${size}px`;
      const dur = 16 + Math.random() * 8;
      const delay = i * 0.55 - 8;
      d.style.animation = `tos-dust-rise ${dur}s linear infinite, tos-dust-fade ${dur}s ease-in-out infinite`;
      d.style.animationDelay = `${delay}s, ${delay}s`;
      field.appendChild(d);
      nodes.push(d);
    }
    return () => nodes.forEach((n) => n.remove());
  }, []);

  return (
    <>
      <div className="tos-orb tos-orb-1" aria-hidden />
      <div className="tos-orb tos-orb-2" aria-hidden />
      <div className="tos-orb tos-orb-3" aria-hidden />
      <div className="tos-orb tos-orb-4" aria-hidden />
      <div ref={dustRef} className="tos-dust-field" aria-hidden />
      <div className="tos-sigil" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <path d="M12 3.5 A 8.5 8.5 0 1 0 20.4 11.2" />
        </svg>
      </div>
      <div className="tos-grain" aria-hidden />

      <style jsx global>{`
        .tos-orb {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: 2;
          mix-blend-mode: screen; filter: blur(60px); opacity: 0.65;
          transition: opacity 2.4s ease;
        }
        .tos-orb-1 { top: 8%; left: 4%; width: 460px; height: 460px;
          background: radial-gradient(circle, rgba(176,118,114,0.20), transparent 70%);
          animation: tos-d1 56s ease-in-out infinite; }
        .tos-orb-2 { top: 40%; left: 76%; width: 380px; height: 380px;
          background: radial-gradient(circle, rgba(143,160,172,0.16), transparent 70%);
          animation: tos-d2 62s ease-in-out infinite; }
        .tos-orb-3 { top: 62%; left: 12%; width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(217,166,108,0.16), transparent 70%);
          animation: tos-d3 70s ease-in-out infinite; }
        .tos-orb-4 { top: 82%; left: 70%; width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(216,199,172,0.12), transparent 70%);
          animation: tos-d4 80s ease-in-out infinite; }
        @keyframes tos-d1 { 0%,100%{translate:0 0} 33%{translate:50px -40px} 66%{translate:-30px 50px} }
        @keyframes tos-d2 { 0%,100%{translate:0 0} 33%{translate:-40px 30px} 66%{translate:40px -20px} }
        @keyframes tos-d3 { 0%,100%{translate:0 0} 33%{translate:60px 30px} 66%{translate:-40px -50px} }
        @keyframes tos-d4 { 0%,100%{translate:0 0} 33%{translate:-30px -40px} 66%{translate:50px 30px} }

        .tos-dust-field { position: fixed; inset: 0; pointer-events: none; z-index: 3; }
        .tos-dust { position: absolute; border-radius: 50%; filter: blur(0.5px); opacity: 0; }
        .dust-rose { background: rgba(176,118,114,0.42); }
        .dust-silver { background: rgba(143,160,172,0.32); }
        .dust-ember { background: rgba(217,166,108,0.34); }
        @keyframes tos-dust-rise { 0%{transform:translateY(105vh)} 100%{transform:translateY(-10vh) translateX(24px)} }
        @keyframes tos-dust-fade { 0%,100%{opacity:0} 15%,85%{opacity:0.42} }

        .tos-sigil { position: fixed; top: 32px; left: 32px; color: var(--c-mist);
          opacity: 0.22; z-index: 50; animation: tos-sigil 3.6s ease-in-out 5s infinite; }
        @keyframes tos-sigil { 0%,100%{opacity:0.2} 50%{opacity:0.36} }

        .tos-grain {
          position: fixed; inset: -50%; width: 200%; height: 200%;
          pointer-events: none; z-index: 100; opacity: 0.055; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.28 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
          animation: tos-grain 0.6s steps(4) infinite;
        }
        @keyframes tos-grain { 0%{transform:translate(0,0)} 25%{transform:translate(-5%,4%)} 50%{transform:translate(5%,-3%)} 75%{transform:translate(-3%,-5%)} 100%{transform:translate(2%,3%)} }

        @media (prefers-reduced-motion: reduce) {
          .tos-orb, .tos-sigil, .tos-grain { animation: none !important; }
        }
        @media (max-width: 768px) { .tos-sigil { top: 20px; left: 20px; } .tos-orb-3, .tos-orb-4 { display: none; } }
      `}</style>
    </>
  );
}
