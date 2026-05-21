"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/cinematic/Reveal";
import { Beacon } from "@/components/cinematic/Beacon";
import { joinWaitlist, redeemInvite } from "@/lib/firebase/services/beta";

/**
 * The threshold of a private beta. An invite opens the door; otherwise a quiet
 * promise to hold a place. No urgency, no counts — an invitation, not a funnel.
 */
export default function BetaPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [waitNote, setWaitNote] = useState("");

  async function tryInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      const ok = await redeemInvite(code);
      if (ok) {
        setInviteNote("문이 열려요. 들어오세요.");
        setTimeout(() => router.push("/onboarding"), 1400);
      } else {
        setInviteNote("아직 닿지 않은 코드예요. 괜찮아요, 자리를 맡아둘게요.");
      }
    } catch {
      setInviteNote("지금은 확인이 어려웠어요. 잠시 후 다시.");
    }
  }

  async function hold(e: React.FormEvent) {
    e.preventDefault();
    try {
      await joinWaitlist(email);
      setWaitNote("자리를 맡아두었어요. 가장 조용한 시간에 닿을게요.");
    } catch {
      setWaitNote("닿을 수 있는 곳을 적어 주세요.");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-9 px-6 py-24 text-center">
      <Reveal as="p" className="font-sans text-[11px] uppercase tracking-[0.2em] text-mist/60">
        조용한 베타
      </Reveal>
      <Reveal delay={400} as="h1">
        <span className="font-display italic text-beige [font-size:clamp(28px,5vw,50px)] leading-[1.26] [font-weight:300]">
          당신을 위한 자리를,
          <br />
          조용히 열어두고 있어요.
        </span>
      </Reveal>

      <Reveal delay={1100}>
        <form onSubmit={tryInvite} className="flex w-[min(420px,86vw)] flex-col items-center gap-3">
          <label className="font-display text-[14px] italic text-mist/80">초대 코드가 있다면</label>
          <div className="flex w-full gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="조용히 건네받은 코드"
              className="flex-1 rounded-[2px] border border-bone/40 bg-beige/[0.03] px-4 py-3 font-display text-[16px] italic text-beige outline-none transition-colors focus:border-rose/45"
            />
            <button className="w-12 rounded-[2px] border border-bone/40 text-beige transition-colors hover:border-rose/50" aria-label="입장">→</button>
          </div>
          {inviteNote && <p className="font-display text-[14px] italic text-beige/90">{inviteNote}</p>}
        </form>
      </Reveal>

      <Reveal delay={1500}>
        <form onSubmit={hold} className="flex w-[min(420px,86vw)] flex-col items-center gap-3">
          <label className="font-display text-[14px] italic text-mist/80">자리를 맡아둘게요</label>
          <div className="flex w-full gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="당신에게 닿을 곳"
              className="flex-1 rounded-[2px] border border-bone/40 bg-beige/[0.03] px-4 py-3 font-display text-[16px] italic text-beige outline-none transition-colors focus:border-rose/45"
            />
            <button className="w-12 rounded-[2px] border border-bone/40 text-beige transition-colors hover:border-rose/50" aria-label="자리 맡기">→</button>
          </div>
          {waitNote && <p className="font-display text-[14px] italic text-beige/90">{waitNote}</p>}
        </form>
      </Reveal>

      <Reveal delay={2000} as="p">
        <span className="font-display text-[13px] italic leading-[1.7] text-mist/55">
          대기 인원도, 카운트다운도 보여드리지 않아요.
          <br />
          이건 줄 서기가 아니라, 조용한 약속이니까요.
        </span>
      </Reveal>

      <Reveal delay={2400}>
        <Beacon href="/onboarding">공기만 먼저 느껴볼게요</Beacon>
      </Reveal>
    </main>
  );
}
