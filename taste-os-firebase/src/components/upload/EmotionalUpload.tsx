"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Beacon } from "@/components/cinematic/Beacon";
import { Reveal } from "@/components/cinematic/Reveal";
import { useIngestMemory } from "@/hooks/useIngestMemory";
import { generateTasteReport } from "@/server/actions/report";
import { auth } from "@/lib/firebase/client";
import { previewUrl } from "@/lib/image/optimize";

type Phase = "idle" | "selected" | "reading" | "revealed" | "weaving" | "error";

interface Reading {
  atmosphere: string;
  palette: string[];
  resonance: string;
  toneWords: string[];
  degraded: boolean;
}

const READING_LINES = [
  "이 장면의 공기를 천천히 들이쉬고 있어요.",
  "빛과 결 사이에서, 감정의 온도를 읽고 있어요.",
  "말로 다 담기 어려운 분위기를, 가만히 옮겨 적고 있어요.",
];

export function EmotionalUpload() {
  const router = useRouter();
  const { ingestImage, progress, busy } = useIngestMemory();
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [line, setLine] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const choose = useCallback((f: File | null) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(previewUrl(f));
    setPhase("selected");
  }, []);

  async function read() {
    if (!file) return;
    setPhase("reading");
    // gentle rotating loading lines while Vision works
    const timer = setInterval(() => setLine((l) => (l + 1) % READING_LINES.length), 2600);
    try {
      const r = await ingestImage(file);
      setReading({
        atmosphere: r.atmosphere,
        palette: r.palette ?? [],
        resonance: r.resonance,
        toneWords: r.toneWords ?? [],
        degraded: r.degraded,
      });
      setPhase("revealed");
    } catch {
      setPhase("error");
    } finally {
      clearInterval(timer);
    }
  }

  async function weave() {
    setPhase("weaving");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) await generateTasteReport({ idToken });
    } catch {
      // graceful — the report page still renders a gentle portrait
    } finally {
      router.push("/report");
    }
  }

  return (
    <div className="flex w-full max-w-[640px] flex-col items-center gap-9 text-center">
      {/* ── drop zone / preview ── */}
      <div
        className="relative flex aspect-[4/5] w-[min(360px,80vw)] items-center justify-center overflow-hidden rounded-[3px] border border-bone/40 transition-colors duration-700 hover:border-rose/40"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          choose(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => phase === "idle" && inputRef.current?.click()}
        role="button"
        aria-label="이미지 올리기"
        style={{ cursor: phase === "idle" ? "pointer" : "default" }}
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            className="h-full w-full object-cover transition-all duration-[2000ms]"
            style={{
              filter: phase === "reading" ? "blur(14px) saturate(0.8)" : "blur(0) saturate(1)",
              opacity: phase === "reading" ? 0.55 : 1,
            }}
          />
        ) : (
          <span className="px-8 font-display text-[clamp(15px,2vw,18px)] italic text-mist/70">
            마음이 머물렀던 한 장면을
            <br />
            여기에 올려 주세요.
          </span>
        )}

        {/* uploading shimmer */}
        {busy && phase === "reading" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-bone/20">
            <div
              className="h-full bg-gradient-to-r from-rose/60 to-ember/50 transition-[width] duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => choose(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* ── per-phase quiet UI ── */}
      {phase === "selected" && (
        <div className="flex flex-col items-center gap-6">
          <p className="font-display text-[clamp(16px,2.2vw,20px)] italic text-mist">
            이 장면의 공기를, 천천히 읽어볼게요.
          </p>
          <Beacon onClick={read}>공기 읽기</Beacon>
        </div>
      )}

      {phase === "reading" && (
        <p className="min-h-[28px] font-display text-[clamp(17px,2.4vw,22px)] italic text-beige opacity-90 transition-opacity duration-1000">
          {READING_LINES[line]}
        </p>
      )}

      {phase === "revealed" && reading && (
        <div className="flex flex-col items-center gap-6">
          <Reveal as="p">
            <span className="font-display text-[clamp(22px,3.4vw,32px)] italic leading-[1.4] text-beige">
              {reading.atmosphere}
            </span>
          </Reveal>
          {reading.palette.length > 0 && (
            <Reveal delay={600}>
              <span className="font-display text-[13px] italic text-mist">
                {reading.palette.join(" · ")}
              </span>
            </Reveal>
          )}
          {reading.resonance && (
            <Reveal delay={1000} as="p">
              <span className="font-display text-[clamp(15px,2vw,18px)] italic leading-[1.7] text-mist/90">
                {reading.resonance}
              </span>
            </Reveal>
          )}
          <Reveal delay={1600}>
            <div className="mt-2 flex flex-col items-center gap-4">
              <Beacon onClick={weave}>이 결로 분위기 만들기</Beacon>
              <button
                className="font-display text-[13px] italic text-mist/60 transition-opacity hover:opacity-100"
                onClick={() => {
                  setPhase("idle");
                  setPreview(null);
                  setFile(null);
                  setReading(null);
                }}
              >
                ─ 다른 장면도 올릴게요 ─
              </button>
            </div>
          </Reveal>
        </div>
      )}

      {phase === "weaving" && (
        <p className="font-display text-[clamp(17px,2.4vw,22px)] italic text-beige opacity-90">
          당신의 결들을 모아, 하나의 분위기를 엮고 있어요.
        </p>
      )}

      {phase === "error" && (
        <div className="flex flex-col items-center gap-5">
          <p className="font-display text-[clamp(16px,2.2vw,20px)] italic text-mist">
            지금은 공기를 읽기 어려웠어요. 잠시 후 다시 머물러 주세요.
          </p>
          <Beacon onClick={read}>다시 읽어보기</Beacon>
        </div>
      )}
    </div>
  );
}
