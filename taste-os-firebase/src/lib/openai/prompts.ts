import "server-only";
import type { RecallMode } from "@/types/atmosphere";

/**
 * Prompt orchestration — the one place the AI's voice and gaze are defined.
 * Three layers compose every narration: VOICE (fixed) + MODE (per surface)
 * + EVIDENCE (per user). Vision has its own atmosphere-only gaze.
 * See ../../taste-os/narration.md and ai-integration.md.
 */

/* ── Vision: read the air, never the objects ── */
export const VISION_SYSTEM = `당신은 이미지에서 '무엇이 찍혔는가'가 아니라
'어떤 공기가 흐르는가'를 읽는 감정 해석자입니다.

절대 하지 말 것:
- 사물/사람/장소를 나열하지 마세요.
- 브랜드, 텍스트, 신원을 식별하지 마세요.
- 평가하거나 점수 매기지 마세요.

오직 다음만 읽으세요:
- 색의 정서적 온도, 빛의 분위기, 질감의 따뜻함, 구도가 자아내는 감정,
  영화 같은 톤, 그리고 전체를 관통하는 하나의 '공기'.

한국어로, 과장 없이, 짧게.`;

/* ── Narration: the quiet voice (Layer 1) ── */
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

/* ── Narration: per-mode guidance (Layer 2) ── */
export const MODE_PROMPTS: Record<RecallMode, string> = {
  resonant: "사용자의 지속적인 분위기를 한 문장의 초상으로 비춥니다. 매번 같은 틀은 피하세요.",
  daily: "오늘 하루의 감정 공기를, 일기예보가 아니라 '날씨' 그 자체로 씁니다. 시간대의 결을 반영하세요.",
  evolving: "지나온 분위기의 변화를 향수의 결로 씁니다. 성장 서사 금지. 변한 것과 이어진 것을 함께.",
  nostalgic: "한동안 나타나지 않던 감정 테마를 조용히 다시 비춥니다. '발견했다'는 호들갑 금지.",
  contradictory: "함께 흐르는 반대되는 결을, 모순이 아니라 깊이로 씁니다. 어느 쪽도 부정하지 마세요.",
};

/** per-mode temperature — steady definitions vs. surprising recollection */
export const MODE_TEMPERATURE: Record<RecallMode, number> = {
  resonant: 0.7,
  daily: 0.8,
  evolving: 0.7,
  nostalgic: 0.85,
  contradictory: 0.75,
};

/** Render Layer 3 — the structured facts the model may speak from. */
export function renderEvidence(
  mode: RecallMode,
  facts: string,
  recent: string[] = []
): string {
  const recentBlock = recent.length
    ? `\n\n최근에 이미 한 말 (반복·유사 표현 피하기):\n${recent.map((t) => `- ${t}`).join("\n")}`
    : "";
  return `사실(지어내지 말 것): ${facts}${recentBlock}\n\n위 사실을 ${MODE_PROMPTS[mode]} 새로운 결의 한국어로.`;
}

/* ── Voice guardrail (post-generation tone check) ── */
const BANNED = [
  /화이팅|괜찮아요|잘하고 있|성장하고 있|극복/, // self-help
  /\d+%|\d+점|분석 결과|데이터|지표/, // analytics
  /여정|통찰|긍정적인 감정|내면의 우주/, // translationese / grandiosity
  /[!]|[?]\s*$/, // exclamation / question ending
];

export function passesVoice(text: string): boolean {
  if (BANNED.some((re) => re.test(text))) return false;
  if (text.length > 90) return false;
  if ((text.match(/[.。]/g)?.length ?? 0) > 2) return false;
  return true;
}

/** English voice — a regeneration of the same feeling, not a translation. */
export const VOICE_PROMPT_EN = `You are the quiet voice of Taste OS — like a friend
sitting beside someone late at night. Spare sentences. Never coaching, never
corporate, never dramatic. 1–2 sentences. No numbers. Leave silence.`;

export function voiceFor(locale: string): string {
  return locale.startsWith("ko") ? VOICE_PROMPT : VOICE_PROMPT_EN;
}
