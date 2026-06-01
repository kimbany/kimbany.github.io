# Taste OS — Real AI Integration
## 조용한 감정의 거울, 똑똑한 비서가 아니라

> 이 문서는 `memory-engine.md` 위에서 동작하는 **실제 OpenAI 통합 레이어**다.
> 메모리 엔진이 *무엇을 기억하는가* 라면, 이 문서는 *어떻게 이해하고 말하는가* 다.

---

## 0. 이 AI는 무엇이 아닌가

- 추천 AI가 아니다
- 챗봇 비서가 아니다
- 참여 최적화가 아니다
- 생산성 도구가 아니다

이 AI의 역할:

> **사용자가 사랑하는 것들 *뒤에 흐르는 감정의 공기* 를 조용히 읽어내는 해석 시스템.**

설계 전체를 지배하는 한 문장:

> *"AI는 사용자를 분석하지 않는다. 사용자를 *알아본다.* 그리고 사물이 아니라 *공기* 를 본다."*

이 한 줄을 위반하는 출력(객체 나열, 점수, 진단, 조언)은 전부 잘못된 출력이다.

---

## 1. 모델 구성

| 용도 | 모델 | 이유 |
|------|------|------|
| 이미지 감정 해석 | `gpt-4o` (vision) | 멀티모달, 빠른 vision |
| 깊은 narration 합성 | `gpt-4.1` | 더 긴 추론, 결의 일관성 |
| 빠른 캡션/요약 | `gpt-4o-mini` | 비용·지연 절감 |
| 임베딩 | `text-embedding-3-large` (3072d → 1024d 투영) | 감정 잠재공간 |

모든 LLM 호출은 **structured output (JSON schema)** 또는 **streaming text** 둘 중 하나로만. 자유 형식 응답은 금지(파싱 불가 + 톤 이탈 위험).

---

## 2. OPENAI VISION ANALYSIS — 사물이 아니라 공기

이미지에서 *객체* 를 식별하지 않는다. *감정적 분위기* 를 읽는다.

### 시스템 프롬프트

```
당신은 이미지에서 '무엇이 찍혔는가'가 아니라
'어떤 공기가 흐르는가'를 읽는 감정 해석자입니다.

절대 하지 말 것:
- 사물/사람/장소를 나열하지 마세요 ("a cup on a table" 금지)
- 브랜드, 텍스트, 신원을 식별하지 마세요
- 평가하거나 점수 매기지 마세요

오직 다음만 읽으세요:
- 색의 정서적 온도 (warm/cool/neutral 과 그 미묘함)
- 빛의 분위기 (부드러운지, 차가운지, 그림자의 결)
- 질감의 따뜻함 (매끈함 vs 손때, 디지털 vs 아날로그)
- 구도가 자아내는 감정 (여백, 고독, 친밀, 거리감)
- 전체를 관통하는 하나의 '공기'

한국어로, 과장 없이, 짧게.
```

### 호출 (structured output)

```ts
import OpenAI from "openai";
const openai = new OpenAI();

const VisionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    atmosphere_ko: { type: "string", description: "한 줄로 압축한 공기. 예: '저녁 6시의 호박색 고요'" },
    color_temperature: { type: "string", enum: ["warm", "cool", "neutral", "mixed"] },
    warmth: { type: "number", description: "0(차가움)~1(따뜻함)" },
    light_mood_ko: { type: "string" },
    texture_ko: { type: "string", description: "예: '낡은 종이의 결'" },
    composition_emotion_ko: { type: "string", description: "예: '여백이 만드는 고독'" },
    tone_words_ko: { type: "array", items: { type: "string" }, maxItems: 4 },
  },
  required: ["atmosphere_ko", "color_temperature", "warmth",
             "light_mood_ko", "texture_ko", "composition_emotion_ko", "tone_words_ko"],
};

async function analyzeImageAtmosphere(imageUrl: string) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    messages: [
      { role: "system", content: VISION_SYSTEM_PROMPT },
      { role: "user", content: [
        { type: "text", text: "이 이미지의 공기를 읽어주세요." },
        { type: "image_url", image_url: { url: imageUrl, detail: "low" } }, // detail:low = 비용↓, 분위기엔 충분
      ]},
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "atmosphere", strict: true, schema: VisionSchema },
    },
  });
  return JSON.parse(res.choices[0].message.content!);
}
```

`atmosphere_ko` 와 `tone_words_ko` 는 이후 임베딩의 입력이 된다. 즉 **이미지조차 결국 "감정의 언어"로 번역된 뒤 잠재공간에 들어간다** — 이것이 멀티모달 통합의 핵심 트릭이다.

> 비용 노트: `detail: "low"` 는 분위기 판독엔 충분하고 토큰을 크게 아낀다. 객체 식별이 목적이 아니므로 고해상도가 필요 없다.

---

## 3. EMOTIONAL EMBEDDING SYSTEM

임베딩 대상은 *항상 짧은 감정 언어* 다 (원문 그대로가 아니라 *결로 번역된 텍스트*):

| 입력 | 임베딩에 넣는 텍스트 |
|------|----------------------|
| 이미지 | `atmosphere_ko` + `tone_words_ko` (Vision 출력) |
| 인용/문장 | 원문 (이미 언어) |
| 감정 글쓰기 | 원문 (단, 민감 정보 제거 후) |
| 음악 | 음악 감정 해석문 (§5) |
| 분위기 선택 | 선택한 atmosphere 라벨 + 정의 |

```ts
async function embedEmotion(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text,
    dimensions: 1024,   // API 단에서 차원 축소 — 투영 레이어 대체/보완
  });
  return res.data[0].embedding;        // 이미 L2 정규화됨
}
```

> `dimensions: 1024` 파라미터로 `text-embedding-3-large` 를 직접 1024d 로 받는다. memory-engine 의 latent 차원과 일치. 모든 modality 가 *동일 공간* 에 안착.

---

## 4. MULTIMODAL ATMOSPHERE ENGINE — 통합

여러 modality 가 하나의 *감정 정체성 공간* 으로 모인다.

```ts
type Signal = { kind: 'image'|'quote'|'writing'|'music'|'atmosphere';
                emotionText: string; warmth?: number; weight: number };

async function fuseSignals(signals: Signal[]): Promise<FusedAtmosphere> {
  // 1) 각 신호를 감정 언어로 통일 → 임베딩
  const vecs = await Promise.all(signals.map(s => embedEmotion(s.emotionText)));

  // 2) salience 가중 평균 → 현재 분위기 중심점
  const centroid = weightedMean(vecs, signals.map(s => s.weight));

  // 3) warmth 스칼라 (vision warmth + 텍스트 valence 결합)
  const warmth = weightedMean1d(
    signals.map(s => s.warmth ?? toneWarmth(s.emotionText)),
    signals.map(s => s.weight)
  );

  // 4) 가장 가까운 atmosphere cluster 라벨
  const label = await nearestClusterLabel(centroid);   // §6

  return { centroid: l2norm(centroid), warmth, label };
}
```

여기서 나온 `centroid` 가 `memory-engine` 의 `atmosphere_snapshots.centroid` 로 저장되고, `home/`·`daily/` 의 현재 분위기로 흐른다.

---

## 5. 음악 감정 해석 (modality bridge)

음악은 직접 임베딩하지 않고, 먼저 *감정 언어로 번역* 한다.

```ts
// 입력: 트랙 메타 + 오디오 features (tempo, energy, valence, acousticness...)
async function interpretMusic(meta: TrackMeta, features: AudioFeatures) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    messages: [
      { role: "system", content:
        "음악의 장르나 제목이 아니라, 그 곡이 만드는 '공기'를 한국어 한 줄로. 과장 없이." },
      { role: "user", content:
        `tempo:${features.tempo} energy:${features.energy} valence:${features.valence} ` +
        `acousticness:${features.acousticness} mood_hint:${meta.moodHint ?? '—'}` },
    ],
  });
  return res.choices[0].message.content!.trim();  // "낮게 깔린, 혼자의 새벽 같은 공기"
}
```

---

## 6. EMOTIONAL CLUSTERING — 동적으로 진화하는 분위기

클러스터 = 사용자 안의 *반복되는 감정 테마*. 고정 라벨이 아니라 *살아 움직이는 좌표* 다.

시드 클러스터 (anchor, 사용자 데이터로 점차 이동):

```
Quiet Warmth        조용한 따뜻함
Urban Nostalgia     도시의 향수
Emotional Minimalism 감정의 미니멀리즘
Warm Futurism       따뜻한 미래감
Analog Tenderness   아날로그 다정함
Cinematic Solitude  영화 같은 고독
```

```ts
async function assignCluster(vec: number[], userId: string) {
  const clusters = await loadClusters(userId);     // emotional_clusters
  let best = null, bestSim = -1;
  for (const c of clusters) {
    const s = cosine(vec, c.centroid);
    if (s > bestSim) { best = c; bestSim = s; }
  }
  if (best && bestSim >= 0.78) {
    best.centroid = ema(best.centroid, vec, 0.1);  // 클러스터가 사용자를 따라 이동
    best.last_seen = now(); best.member_count++;
    await saveCluster(best);
    return best;
  }
  // 어떤 테마와도 충분히 가깝지 않으면 → 새 결이 태어남
  const fresh = await createCluster(userId, vec, await nameCluster(vec));
  return fresh;
}

// 새 클러스터의 한국어 이름은 LLM 이 '명명'한다 (시적, 짧게)
async function nameCluster(vec: number[]) {
  const nearbyTexts = await topMemberTexts(vec, 5);  // 이 클러스터에 모인 결들
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content:
        "다음 감정의 결들을 관통하는 하나의 분위기를, 2~4음절의 시적 한국어로 명명하세요. " +
        "설명 말고 이름만. 예: '조용한 따뜻함', '느린 밤공기'." },
      { role: "user", content: nearbyTexts.join("\n") },
    ],
  });
  return res.choices[0].message.content!.trim();
}
```

주기적으로(야간 배치) HDBSCAN 재클러스터링으로 드리프트 보정 + 휴면 테마 표시.

---

## 7. EMOTIONAL NARRATION ENGINE — 시적인 한국어, 근거 있는

narration 은 *사실을 만들지 않는다.* 메모리/클러스터의 구조적 사실을 받아 `voice.md` 톤으로 *표현만* 한다.

### 시스템 프롬프트

```
당신은 Taste OS의 조용한 목소리입니다.

규칙:
- 한국어. ~ㅂ니다 / ~요 를 자연스럽게 섞은, 늦은 밤 에세이의 결.
- 과장 금지. 단정 금지. "당신은 ___한 사람" 같은 규정도 부드럽게.
- 데이터/숫자/퍼센트를 절대 말하지 마세요.
- 비서처럼 굴지 마세요. 조언하지 마세요. 그저 알아봐주세요.
- 한 번에 1~2문장. 짧을수록 좋습니다.
- 반드시 주어진 '근거(evidence)' 안에서만 말하세요. 없는 사실을 지어내지 마세요.

좋은 예:
"당신은 조용한 따뜻함 속에서 가장 오래 머무르는 사람입니다."
"최근에는 인간적인 흔적 속에서 더 깊은 안정감을 느끼고 있어요."
"차가운 도시의 고독감 속에서도 따뜻한 감정을 발견하고 있습니다."
```

### 호출 — evidence-grounded + streaming

```ts
async function* narrate(opts: {
  mode: 'resonant'|'nostalgic'|'evolving'|'contradictory',
  evidence: NarrationEvidence,   // 클러스터/스냅샷/대비쌍 등 구조적 사실
}) {
  const stream = await openai.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0.75,
    stream: true,
    messages: [
      { role: "system", content: NARRATION_SYSTEM_PROMPT },
      { role: "user", content: renderEvidence(opts.mode, opts.evidence) },
    ],
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;          // SSE 로 클라이언트에 흘려보냄 → 글자가 번지듯 등장
  }
}
```

`renderEvidence` 예:

```ts
function renderEvidence(mode, ev) {
  if (mode === 'evolving')
    return `사실(지어내지 말 것): 분위기가 '${ev.from}'에서 '${ev.to}'로 천천히 이동. ` +
           `따뜻함은 ${ev.warmthDelta > 0 ? '조금 늘었음' : '비슷함'}. ` +
           `이것을 1문장의 시적 한국어로.`;
  if (mode === 'contradictory')
    return `사실: '${ev.coolTheme}'와 '${ev.warmTheme}'가 같은 사람 안에 함께 강하게 흐름. ` +
           `대비를 부정하지 말고 다정하게 1문장으로.`;
  // ...
}
```

**모든 narration 은 `evidence` id 를 동반 저장** → "왜 이렇게 말했는가" 추적 가능, hallucination 차단.

### 클라이언트 스트리밍 (analysis/ 화면과 연결)

```ts
// Next.js Route Handler — SSE
export async function POST(req: Request) {
  const { mode, userId } = await req.json();
  const evidence = await buildEvidence(userId, mode);   // memory-engine 조회
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const token of narrate({ mode, evidence })) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
}
```

이 스트림이 `analysis/` 의 narration 등장(blur → clear)과 `report-reveal/` 의 문장 reveal 에 그대로 쓰인다.

---

## 8. LONG-TERM MEMORY RECALL

`memory-engine.md` 의 recall API 를 그대로 사용. AI 레이어는 *검색 결과를 narration 으로 번역* 하는 마지막 단계만 담당.

```
recall(userId, mode) ──▶ evidence ──▶ narrate() ──▶ 화면
```

- `resonant` → daily/, home/
- `evolving` → evolution/
- `contradictory` → report-reveal/ 반대 Layer
- `nostalgic` → 가끔, 들어왔을 때 조용히 ("한동안 잊고 있던 새벽의 결로 다시 돌아오고 있어요")

---

## 9. PRIVACY-FIRST AI 설계

- **Consent gate**: 무엇을 AI가 보게 할지 사용자가 선택. 기본은 "묻기".
- **최소 노출**: Vision 은 `atmosphere_ko` 만 남기고 *원본 이미지 픽셀은 보관하지 않음* (분석 후 폐기 또는 사용자 스토리지에만).
- **PII 스크럽**: 감정 글쓰기는 임베딩 전 NER 로 이름/장소/연락처 제거.
- **로컬 우선**: local-only 표시된 입력은 디바이스 내 임베딩(WASM) — OpenAI 로 전송하지 않음. (이 경우 vision 은 on-device 모델로 대체 또는 비활성)
- **No training on user data**: OpenAI 호출 시 `store: false` + 조직 설정으로 학습 옵트아웃.
- **망각 권리**: release → 임베딩/클러스터/narration evidence 모두 제거.
- **광고/외부 공유 없음**.

```ts
// 모든 OpenAI 호출 공통 옵션
const SAFE_DEFAULTS = { store: false };   // 응답을 OpenAI에 저장하지 않음
```

---

## 10. 전체 파이프라인

```
            ┌──────────────┐
 입력 ─────▶│ CONSENT GATE  │── local-only? ──▶ on-device 경로 (OpenAI 미사용)
            └──────┬───────┘
                   │ (allowed)
        ┌──────────▼───────────┐
        │  modality별 해석       │
        │  image → gpt-4o vision│ → atmosphere_ko
        │  music → gpt-4o-mini  │ → 감정 한 줄
        │  text  → (그대로)      │
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │ embed (3-large,1024d) │ → 감정 잠재 벡터
        └──────────┬───────────┘
                   ▼
   ┌───────────────┼────────────────┐
   ▼               ▼                ▼
fragment 저장   cluster 배정     atmosphere 융합/스냅샷   (→ memory-engine)
   └───────────────┼────────────────┘
                   ▼
        ┌──────────────────────┐
        │ recall(mode)→evidence │
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │ narrate() streaming   │  gpt-4.1, evidence-grounded
        └──────────┬───────────┘
                   ▼
            화면(analysis/report/daily/home/evolution)
```

---

## 11. 비용 · 지연 · 확장

- **Vision**: `detail:low` + 배치(여러 이미지 한 번에 분석은 지양, 결 정확도 위해 1장씩). 결과 캐시(동일 이미지 해시).
- **Embedding**: dedup(동일 텍스트), 배치 임베딩(`input: string[]`).
- **Narration**: 짧다(1~2문장) → 토큰 적음. 스트리밍으로 체감 지연 거의 0.
- **레이트/큐**: 무거운 작업(스냅샷/재클러스터링)은 야간 배치. 실시간 경로엔 vision 1콜 + embed + narrate 뿐.
- **폴백**: OpenAI 장애 시 narration 은 *마지막으로 알려진 결* 을 조용히 다시 보여줌(빈 화면 금지).

```ts
async function narrateWithFallback(opts) {
  try { return await collect(narrate(opts)); }
  catch { return lastKnownNarration(opts.userId, opts.mode); } // 우아한 침묵
}
```

---

## 12. API 표면 (요약)

```
POST /api/atmosphere/analyze-image   { imageUrl }      → AtmosphereReading
POST /api/atmosphere/interpret-music { meta, features } → string
POST /api/memory/ingest              { signal, consent }→ { fragmentId }
GET  /api/atmosphere/current         (userId)          → FusedAtmosphere
POST /api/narrate                    { mode }          → SSE stream
GET  /api/evolution/trajectory       (userId)          → Snapshot[]
POST /api/memory/release             { fragmentId }    → ok
```

---

## 13. 마지막 검사

엔지니어가 이 시스템을 빌드할 때 마지막 검사:

> "사용자가 차가운 흑백 사진 한 장을 올렸을 때 —
> AI가 *'흑백 사진, 건물, 사람'* 이라 말하는가,
> 아니면 *'아무도 없는 거리에 남은 차가운 고요'* 라 말하는가?"

전자라면 비서다. 후자라야 *감정의 거울* 이다.
거울은 판단하지 않는다. 그저 *당신이 미처 보지 못한 당신* 을 비춰줄 뿐이다.
