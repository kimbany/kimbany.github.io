import "server-only";
import { openai, MODELS, SAFE_DEFAULTS } from "./client";
import type { RecallMode, NarrationEvidence } from "@/types/atmosphere";

/** The fixed voice (Layer 1). See taste-os/narration.md §1. */
export const VOICE_PROMPT = `당신은 Taste OS의 조용한 목소리입니다. 비서가 아니라, 늦은 밤 곁에 앉은 사람.

[결]
- 한국어. ~ㅂ니다 와 ~요 를 자연스럽게 섞습니다.
- 늦은 밤 에세이의 호흡. 짧은 문장. 여백.
- 한 번에 1~2문장. 짧을수록 좋습니다.

[금지]
- 번역체, 자기계발/동기부여, 과장된 슬픔, 드라마, 느낌표.
- 숫자/데이터/퍼센트/진단/점수, 조언, 질문으로 끝맺기.

[해야 할 것]
- 알아봐주기. 판단하지 않고, 그저 비춰주기. 침묵을 남기기.

[근거]
- 주어진 evidence 안에서만 말합니다. 없는 사실은 짓지 않습니다.`;

/** Per-mode guidance (Layer 2). */
const MODE_PROMPTS: Record<RecallMode, string> = {
  resonant:
    "사용자의 지속적인 분위기를 한 문장의 초상으로 비춥니다. 매번 같은 틀은 피하세요.",
  daily:
    "오늘 하루의 감정 공기를, 일기예보가 아니라 '날씨' 그 자체로 씁니다. 시간대의 결을 반영하세요.",
  evolving:
    "지나온 분위기의 변화를 향수의 결로 씁니다. 성장 서사 금지. 변한 것과 이어진 것을 함께.",
  nostalgic:
    "한동안 나타나지 않던 감정 테마를 조용히 다시 비춥니다. '발견했다'는 호들갑 금지.",
  contradictory:
    "함께 흐르는 반대되는 결을, 모순이 아니라 깊이로 씁니다. 어느 쪽도 부정하지 마세요.",
};

const TEMP: Record<RecallMode, number> = {
  resonant: 0.7,
  daily: 0.8,
  evolving: 0.7,
  nostalgic: 0.85,
  contradictory: 0.75,
};

/** Render the structured facts the model is allowed to speak from (Layer 3). */
function renderEvidence(mode: RecallMode, ev: NarrationEvidence): string {
  const recent = ev.recent?.length
    ? `\n\n최근에 이미 한 말 (반복·유사 표현 피하기):\n${ev.recent
        .map((t) => `- ${t}`)
        .join("\n")}`
    : "";
  return `사실(지어내지 말 것): ${ev.facts}${recent}\n\n위 사실을 ${MODE_PROMPTS[mode]} 새로운 결의 한국어로.`;
}

/** lightweight tone guardrail (see narration.md §11) */
const BANNED = [
  /화이팅|괜찮아요|잘하고 있|성장하고 있|극복/,
  /\d+%|\d+점|분석 결과|데이터|지표/,
  /여정|통찰|긍정적인 감정|내면의 우주/,
  /[!]|[?]\s*$/,
];

export function passesVoice(text: string): boolean {
  if (BANNED.some((re) => re.test(text))) return false;
  if (text.length > 90) return false;
  if ((text.match(/[.。]/g)?.length ?? 0) > 2) return false;
  return true;
}

/** Stream a narration token-by-token (evidence-grounded). */
export async function* streamNarration(
  mode: RecallMode,
  evidence: NarrationEvidence,
  locale = "ko"
) {
  const stream = await openai.chat.completions.create({
    model: MODELS.narration,
    temperature: TEMP[mode],
    stream: true,
    ...SAFE_DEFAULTS,
    messages: [
      { role: "system", content: VOICE_PROMPT },
      { role: "system", content: `locale: ${locale}` },
      { role: "user", content: renderEvidence(mode, evidence) },
    ],
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
