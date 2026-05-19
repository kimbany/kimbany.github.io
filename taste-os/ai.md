# Taste OS — AI System Architecture

> 추천 엔진이 아닙니다. *거울* 이에요.
> 행동을 *예측* 하지 않습니다. 증거를 *알아봅니다*.

이 문서는 `genome.md` (개념), `pipeline.ko.md` (단계별 흐름), `drift.md` (진화 추적) 에 흩어져 있던 AI 시스템 사양을 **하나의 구현 가능한 아키텍처** 로 통합합니다. 엔지니어가 이 문서를 읽고 v1을 빌드할 수 있도록 작성됐어요.

이 시스템의 단 하나의 설계 제약:

> **AI는 사용자가 *이미 한 일* 을 묘사합니다. *앞으로 할 일* 을 예측하지 않아요.**

함께 읽기: `system.md`, `voice.md`, `genome.md`, `pipeline.ko.md`, `drift.md`, `mvp.md`.

---

## 목차

0. [철학 — 거울이지 엔진이 아님](#0-철학--거울이지-엔진이-아님)
1. [시스템 개요 — 여섯 엔진](#1-시스템-개요--여섯-엔진)
2. [Aperture · 이미지 이해](#2-aperture--이미지-이해)
3. [Cadence · 감정적 언어](#3-cadence--감정적-언어)
4. [Constellation · 분위기 클러스터링](#4-constellation--분위기-클러스터링)
5. [Sediment · 감정 메모리 (3층 매니폴드)](#5-sediment--감정-메모리-3층-매니폴드)
6. [Drift · 정체성 진화](#6-drift--정체성-진화)
7. [Voice · 시네마틱 내레이션](#7-voice--시네마틱-내레이션)
8. [엔드 투 엔드 데이터 흐름](#8-엔드-투-엔드-데이터-흐름)
9. [벡터 & 메모리 아키텍처](#9-벡터--메모리-아키텍처)
10. [프라이버시 자세](#10-프라이버시-자세)
11. [지연 & 비용 예산](#11-지연--비용-예산)
12. [이 AI가 *하지 않는* 것들](#12-이-ai가-하지-않는-것들)
13. [구현 로드맵](#13-구현-로드맵)

---

## 0. 철학 — 거울이지 엔진이 아님

대부분의 AI 시스템은 *최적화 함수* 를 가집니다 — 더 많은 클릭, 더 긴 dwell time, 더 큰 LTV. Taste OS의 AI는 *최적화 함수가 없습니다*. 대신 *제약 함수* 가 있어요:

> 사용자가 자신에게 *진실인 한 줄* 을 간직하고 싶어할 것인가.

이 제약을 만족시키지 못하면 모델은 출시되지 않습니다. 만족시키면 다른 어떤 지표도 부수적이에요.

### AI가 답하는 단 하나의 질문

> *이 사람이 *이미 한 행위* 들에서 어떤 결이 *드러나는가*?*

이게 *예측* 이 아니라 *알아봄* 의 질문이에요. 차이가 모든 것을 결정합니다.

### 여섯 엔진의 공통 원칙

1. **증거 우선**: 모든 출력은 사용자가 *실제로 한 행위* 로 거슬러 올라가 추적 가능해야 합니다. 환상 금지.
2. **확신은 1급 시민**: 모든 축은 confidence 점수와 함께 저장됩니다. 낮은 확신은 *숨기지 않고* 드러내요.
3. **부재도 신호**: *없는 것* 도 *있는 것* 만큼 정보를 가집니다 (24장 이미지에 사람 얼굴 0개 → 강한 신호).
4. **반증 가능성**: 사용자에 대한 모든 진술은 *틀릴 수도 있는* 형태여야 합니다. 보편 진리는 *알아봄* 이 아니에요.
5. **시간은 결**: 어제와 오늘이 다른 답을 줄 수 있어요. 답이 다른 이유는 사용자가 변했기 때문이지 모델이 흔들리기 때문이 아니에요.

---

## 1. 시스템 개요 — 여섯 엔진

```
                                                                          
   증거 (사용자 입력)                                                      
       │                                                                  
       ├──────────┬──────────┬──────────┬──────────                       
       ▼          ▼          ▼          ▼                                  
   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                            
   │        │ │        │ │        │ │        │                            
   │ APERTURE│Cadence │ │ (느낌  │ │ (공간  │                            
   │        │ │        │ │ 슬라이더)│선택)  │                            
   │ 이미지 │ │ 언어   │ │ 직접   │ │ 직접   │                            
   │ 이해   │ │ 이해   │ │ 인코딩 │ │ 인코딩 │                            
   └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘                            
        │          │          │          │                                
        └──────────┴────┬─────┴──────────┘                                
                        ▼                                                  
                ┌───────────────┐                                          
                │ CONSTELLATION │   ← 클러스터링, 흐름 명명                
                └───────┬───────┘                                          
                        ▼                                                  
                ┌───────────────┐                                          
                │   SEDIMENT    │   ← 3층 매니폴드 (L1/L2/L3)              
                │  (Memory)     │                                          
                └───┬───────┬───┘                                          
                    │       │                                              
            ┌───────┘       └───────┐                                      
            ▼                       ▼                                      
      ┌──────────┐            ┌──────────┐                                
      │  DRIFT   │            │  VOICE   │                                
      │ Evolution│            │Narration │                                
      └────┬─────┘            └────┬─────┘                                
           │                       │                                       
           └──────────┬────────────┘                                       
                      ▼                                                    
              Taste Report                                                 
              (사용자가 보는 것)                                            
                                                                          
```

### 여섯 엔진의 역할 한 줄 요약

| 엔진 | 한국어 | 역할 |
|---|---|---|
| **Aperture** | 빛 받는 자리 | 이미지를 *감정 벡터* 로 |
| **Cadence** | 결 | 글의 *리듬과 무게* 를 측정 |
| **Constellation** | 별자리 | 흩어진 점들을 *명명된 흐름* 으로 |
| **Sediment** | 침전 | 시간에 따라 *층층이 쌓이는* 정체성 |
| **Drift** | 표류 | 어제와 오늘 사이의 *흐름* 을 알아봄 |
| **Voice** | 목소리 | 진실한 한 줄을 *짓는* 자리 |

---

## 2. Aperture · 이미지 이해

> 사진 한 장이 *감정 좌표* 가 되는 자리.

### 무엇을 하는가

사용자가 저장한 이미지를 받아 다음의 다중 신호로 변환:

1. **시맨틱 임베딩** (CLIP) — 무엇이 찍혔는지
2. **색채 정동** (CIELAB) — 색감의 분포와 온도
3. **광원 분석** — 방향, 색온도(K), 광원 수
4. **공간 분류** — 내/외부, 천장 높이, 재료 (린넨/오크/황동/콘크리트…)
5. **구도 분석** — 대비비, 채도 엔트로피, 빈 공간 비율

### 입력

```ts
type ImageEvidence = {
  id: string;
  userId: string;
  storageKey: string;        // S3 normalized image
  normalizedBytes: Uint8Array; // sRGB, ≤ 2048px long edge
  perceptualHash: string;
};
```

### 출력

```ts
type ImageReading = {
  id: string;
  evidenceId: string;

  // Core embedding
  clipEmbedding: Float32Array;     // 768-d, L2 normalized
  aestheticHead: Float32Array;     // 128-d, custom-tuned

  // Color
  chromatic: {
    dominantLAB: [number, number, number];
    paletteHexes: string[];          // 5 colors median-cut
    temperatureKelvin: number;       // estimated
    saturationEntropy: number;       // 0–1
    hueDistribution: number[];       // 12 buckets
  };

  // Light
  light: {
    sourceCount: 0 | 1 | 2 | 3;      // 0 = ambient
    direction: 'north'|'south'|'east'|'west'|'overhead'|'ambient';
    estimatedHour: { from: number; to: number };  // 0-23 fuzzy range
  };

  // Space
  space: {
    type: 'interior'|'exterior'|'liminal'|'natural'|'unknown';
    ceilingHeight: 'low'|'mid'|'high'|'open'|'na';
    materials: string[];             // ['linen', 'oak', 'brass', ...] top-K
  };

  // Composition
  composition: {
    edgeDensity: number;             // 0–1
    negativeSpaceRatio: number;
    verticalCenterOfMass: number;    // 0 = top, 1 = bottom
    primarySubjectArea: number;      // 0–1
  };

  // Confidence
  confidence: Float32Array;          // 16-d, per-feature
};
```

### 모델 스택

| 신호 | 모델 / 방법 | 비고 |
|---|---|---|
| CLIP 임베딩 | OpenCLIP ViT-L/14 | 또는 SigLIP, 큰 차이 없음 |
| 미적 헤드 | 큐레이션된 미적 코퍼스로 사전학습된 linear+ELU head | v1에서 동결, ~50K 이미지 라벨 |
| 색채 분석 | scikit-image + custom CIELAB clustering | 모델 아닌 결정론적 |
| 광원 분석 | small CNN (MobileNetV3 fine-tune) | 4-way + temperature regressor |
| 공간 분류 | CLIP-zero-shot + space taxonomy | 36개 라벨 |
| 재료 분류 | CLIP-zero-shot, multi-label | 24개 라벨 |
| 구도 분석 | OpenCV + DepthAnything | edge density, depth map → vertical CoM |

### 지연 목표

- 단일 이미지 (1024×1024): **120–280ms** p50, 500ms p95
- 배치 12개 동시: **1.4–2.8초**, GPU 풀에서

### 비용 추정

- GPU 시간: A10G 인스턴스에서 시간당 1,500 이미지 처리 → 이미지당 ~$0.0008
- 임베딩 저장: 768d float32 = 3KB, ~$0.0001/년

### Aperture가 *하지 않는* 것

- **얼굴 인식 / 신원 확인** — 절대로
- **OCR 텍스트 추출** — 사용자가 스크린샷을 올려도 글자를 읽지 않음
- **메타데이터 추출** (EXIF, GPS) — 저장 직후 모두 제거
- **이미지 *생성*** — 분석만, 생성 안 함

---

## 3. Cadence · 감정적 언어

> 문장 한 줄이 *결과 무게* 를 얻는 자리.

### 무엇을 하는가

사용자가 저장한 인용·텍스트·곡명·공간 캡션을 받아 다음을 측정:

1. **시맨틱 임베딩** (bge-m3, multilingual)
2. **운율 (prosody)** — 문장 길이, em-dash 빈도, 생략 빈도
3. **가치 (valence)** — 영문 VADER + 한국어 문학 어휘집
4. **추상도** — 구체 명사 vs 철학 명사
5. **시제 분포** — 과거형, 현재형, 미래형 비율
6. **대명사 분포** — 1인칭/2인칭/3인칭/생략

### 입력

```ts
type TextEvidence = {
  id: string;
  userId: string;
  text: string;
  source: 'quote' | 'caption' | 'reflection' | 'space_name' | 'song_title';
  language?: 'ko' | 'en' | 'ja' | 'mixed';
};
```

### 출력

```ts
type TextReading = {
  id: string;
  evidenceId: string;

  embedding: Float32Array;          // 1024-d, bge-m3
  language: 'ko' | 'en' | 'ja' | 'mixed';

  prosody: {
    avgSentenceLength: number;       // in tokens
    emDashDensity: number;           // per 100 chars
    ellipsisDensity: number;
    fragmentCount: number;           // sentence fragments
    capitalDensity: number;          // for ALL CAPS detection
  };

  valence: {
    polarity: number;                // -1 to 1
    melancholy: number;              // 0–1, domain-specific
    intensity: number;               // 0–1
  };

  abstraction: {
    concretenessScore: number;       // 0 = pure abstract, 1 = pure concrete
    abstractNounCount: number;
    concreteNounCount: number;
  };

  temporality: {
    past: number;                    // 0–1 density of past-tense
    present: number;
    future: number;
    timeless: number;                // gnomic statements
  };

  pronouns: {
    first: number;                   // 0–1
    second: number;
    third: number;
    omitted: number;                 // critical for Korean
  };

  recurringMotifs: string[];         // detected via N-gram overlap with corpus
};
```

### 한국어를 위한 특수 처리

`voice.md` 에 따라 한국어 보이스가 *문장 종결 어미* 에 큰 무게를 두기 때문에, Cadence는 **종결 어미 분포** 를 별도 신호로 추적합니다:

```ts
type KoreanEndings = {
  '~예요/이에요': number;        // gentle declarative
  '~네요': number;               // mild realization
  '~군요': number;               // recognition
  '~더라고요': number;           // recalled observation
  '~죠': number;                 // shared knowledge
  '~ㄹ게요': number;             // soft promise
  '~았/었어요': number;          // past intimate
  '~합니다': number;             // formal (rare)
  // ...
};
```

이 분포가 사용자의 *내면 어조* 를 가장 정확히 보여줍니다.

### 모델 스택

| 신호 | 모델 / 방법 |
|---|---|
| 임베딩 | BAAI/bge-m3 (multilingual, dense + sparse + colbert) |
| 한국어 형태소 | KIWI 또는 KoNLPy/Okt (종결 어미 검출용) |
| Valence (영문) | VADER + custom literary corpus |
| Valence (한국어) | Pretrained KoBERT sentiment + literary lexicon |
| 추상도 | MRC concreteness norms + 한국어 어휘집 |
| 시제 / 대명사 | KIWI POS + 패턴 매칭 |

### 지연 목표

- 단일 인용 (≤ 200자): **40–80ms**
- 배치 10개: **120–200ms**

---

## 4. Constellation · 분위기 클러스터링

> 흩어진 점들이 *명명된 흐름* 으로 자라나는 자리.

### 무엇을 하는가

사용자의 모든 reading (Image, Text, Audio, Feeling) 을 단일 매니폴드로 투영하고, *명명된 흐름* (Currents) 으로 클러스터링합니다.

### 흐름은 *카테고리* 가 아닌 *방향*

`genome.md` §7 의 흐름 정의를 따릅니다: 흐름은 매니폴드의 *명명된 방향* 이지 사용자가 *앉는 상자* 가 아닙니다. 한 사용자에게는 *여러 흐름* 이 *다른 강도* 로 동시에 흐를 수 있어요.

### 알고리즘

```
모든 evidence readings (개별 항목 단위)
    │
    ▼
연결 → 학습된 선형 헤드 → 64-d 통합 임베딩
    │
    ▼
UMAP  (n_neighbors=15, min_dist=0.1, metric='cosine')
    │
    ▼
HDBSCAN  (min_cluster_size=2, leaf method)
    │      ↑ 작게 설정한 이유: 단일 이상값도 *신호* 로 간주
    ▼
미세 클러스터 4–7 개
    │
    ▼
테마 병합  (cosine ≥ 0.78 → 같은 흐름)
    │
    ▼
명명된 흐름 2–4 개
    │
    ▼
각 흐름에 Claude로 두 단어 명사구 부여
```

### 흐름 명명 — Claude 호출

```
SYSTEM: 두 단어 한국어 명사구를 생성하세요. 명사구는 시적이고 구체적이어야 합니다.
        규칙:
        - 정확히 두 단어, 첫 단어가 두 번째 단어를 수식
        - 구체적 명사 + 분위기 (예: "옻칠한 황혼", "북쪽의 린넨", "삼나무 수학자")
        - 금지: "minimalist", "vibes", "main character", "aesthetic"
        - 한 후보가 다른 사용자들의 흐름 이름과 0.85 이상 cosine으로 유사하면 재생성

USER: 흐름의 상위 6 축 (극 이름), 우세 팔레트, 대표 증거 3 조각

OUTPUT: 8개의 후보 → 차단 목록 통과 → 미적 perplexity 최저 1개
```

### 출력

```ts
type Current = {
  id: string;
  userId: string;
  name: string;                      // "옻칠한 황혼"
  nameEn?: string;                   // "Lacquered Dusk" (옵션)
  centroidVector: Float32Array;      // 64-d
  strength: number;                  // 0–1
  stability: {
    firstSeen: Date;
    weeksActive: number;
    lastTouched: Date;
  };
  representativeEvidence: EvidenceRef[];  // top 3
};
```

### 강도와 안정성

- **강도** = 매니폴드에서 사용자 위치와 이 흐름 centroid의 cosine 유사도
- **안정성** = 이 흐름의 centroid가 최근 N주 동안 얼마나 움직였는지의 역수

흐름이 *14주째 같은 자리* 면 "steady", *3주 이내 등장* 이면 "newly forming".

### 다른 사용자와의 비교

**비교하지 않습니다.** 다른 사용자의 흐름 이름은 *재사용 방지* 를 위해서만 검사됩니다. 두 사용자가 비슷한 흐름을 가질 수 있지만 — 시스템은 *그들을 묶지 않아요*. 매칭 없음, 추천 없음.

### 지연

- 신규 사용자 첫 합성: 1–2초 (UMAP)
- 기존 사용자 점진 갱신: <500ms

---

## 5. Sediment · 감정 메모리 (3층 매니폴드)

> 시간에 따라 *층층이 쌓이는* 자기 자신.

### 무엇을 하는가

사용자의 정체성을 *하나의 벡터* 가 아닌 *3개의 시간 척도가 다른 벡터* 로 저장합니다.

```
                                                                          
   L3 · Constitution    (느림, 년 단위)                                    
       6 축                                                                
       철학적·기질적 지향                                                  
       바뀌려면 ≥ 0.15 코사인 델타                                          
                                                                          
   ┌────────────────────────────────────────────────────────────┐         
   │ L2 · Atmosphere    (중간, 계절 단위)                       │         
   │     14 축                                                  │         
   │     미적 차원                                              │         
   │     매주 갱신                                              │         
   │                                                            │         
   │  ┌──────────────────────────────────────────────────────┐ │         
   │  │ L1 · Impression  (빠름, 일 단위)                     │ │         
   │  │     44 축                                            │ │         
   │  │     이번 주의 기분                                   │ │         
   │  │     매일 EMA τ=30d 로 갱신                           │ │         
   │  └──────────────────────────────────────────────────────┘ │         
   └────────────────────────────────────────────────────────────┘         
                                                                          
```

### 왜 3층인가

한 사용자는 *지금* 무엇에 끌리는지 (L1), *이 계절* 어떤 결을 가지는지 (L2), *근본적으로* 어떤 사람인지 (L3) 가 모두 *다른 시간 척도* 로 변합니다. 하나로 합치면 *L1의 흔들림* 이 *L3* 의 결론에 잘못 영향을 줍니다.

### 갱신 규칙

```ts
type SedimentUpdate = {
  L1: {
    rule: 'EMA τ=30d, decay on read',
    cadence: 'daily, plus on every Tend',
  },
  L2: {
    rule: 'sliding window mean of last 8 weeks of L1 readings',
    cadence: 'weekly cron',
    boundaryDetection: 'chapter boundary when L2 delta > 0.18 cosine over 4 weeks',
  },
  L3: {
    rule: 'top 6 most-stable axes from L2 over last 90 days',
    cadence: 'monthly; full recomputation only if L3 delta > 0.15 cosine',
    onChange: 'send quiet email, regenerate Mirror line, archive prior',
  },
};
```

### 데이터 모델

```ts
type TasteVector = {
  userId: string;
  measuredAt: Date;
  modelVersion: string;

  impression: Float32Array;      // 44
  atmosphere: Float32Array;      // 14
  constitution: Float32Array;    // 6

  confidence: Float32Array;      // 64, per-axis
  evidenceCount: {
    images: number; sounds: number; quotes: number;
    spaces: number; feelings: number;
  };
};
```

### 저장 — pgvector

```sql
CREATE TABLE taste_vectors (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id),
  measured_at TIMESTAMPTZ NOT NULL,
  model_ver   TEXT NOT NULL,

  l1          VECTOR(44),
  l2          VECTOR(14),
  l3          VECTOR(6),
  confidence  VECTOR(64),

  evidence_count JSONB,

  UNIQUE (user_id, measured_at, model_ver)
);

CREATE INDEX ON taste_vectors USING ivfflat (l2 vector_cosine_ops);
```

각 사용자에 대해 *시계열* 로 매주 한 행씩 누적 (52 rows/user/year). 90일 미만은 raw, 그 이후는 월간 평균으로 압축.

### 확신도 (Confidence)

각 axis마다 0–1 confidence:

```
confidence_axis_i = sigmoid(
  α · log(1 + evidence_count) +
  β · modality_agreement_score +
  γ · temporal_stability
)
```

낮은 confidence는 *보여줍니다* — UI에서 막대를 더 흐리게 + *"이건 아직 듣는 중이에요"* 라벨.

---

## 6. Drift · 정체성 진화

> 어제와 오늘 사이의 *변화* 가 *변하는 것* 이 아니라 *자기에게 가까워지는 일* 임을 알아보는 시스템.

### 무엇을 하는가

Sediment의 시계열을 읽어 *Chapter*, *Turn*, *Echo* 를 검출합니다.

### Chapter 경계 감지

```ts
function detectChapterBoundary(userId, t1, t2) {
  const v1 = getL2Mean(userId, t1 - 4 weeks, t1);
  const v2 = getL2Mean(userId, t2 - 4 weeks, t2);
  const delta = 1 - cosineSim(v1, v2);

  if (delta > 0.32) return 'era';        // 매우 큰 변화 (수년 단위)
  if (delta > 0.18) return 'chapter';    // 일반 변화
  return null;                            // 같은 챕터
}
```

새 챕터가 감지되면:
1. 이전 챕터를 *finalize* (immutable)
2. 챕터 이름 생성 (Claude, Voice 엔진)
3. 챕터의 dominant palette 추출
4. Reflection 생성

### Turn 검출

두 인접 챕터 사이의 변화를 한 문장으로 표현. 변화의 *방향* 이 핵심.

```
delta_per_axis = v2 - v1
top_3_changes = sort by |delta|, descending

→ Voice 엔진으로 보내 한 문장 생성
   ("그러더니, 천천히, 빛이 돌아섰어요.")
```

### Echo 검출

Echo = 3개 이상의 *비인접* 챕터에 걸쳐 반복되는 클러스터.

```ts
function detectEchoes(userId) {
  const allEvidence = getAllEvidenceWithChapter(userId);
  const clusters = HDBSCAN(allEvidence.embeddings);

  const echoes = clusters.filter((c) =>
    c.size >= 3
    && spans_chapters(c) >= 3
    && has_gap_between_chapters(c)
    && cohesion(c) >= 0.72
  );

  return echoes.map(toEchoArtifact);
}
```

Echo가 발견되면 *작은 acknowledgment* 만 — 사용자의 Drift 페이지에 한 줄로 표시. 강요 없음.

---

## 7. Voice · 시네마틱 내레이션

> 진실한 한 줄이 *생성* 이 아니라 *짓는* 자리.

### 무엇을 하는가

Sediment + Constellation + Drift의 출력을 *사용자가 간직하고 싶을 만한 한 문장* 으로 합성합니다.

### 모델

- **Claude Opus 4.x** (또는 후속 모델)
- 온도: 0.7 (보고서 본문), 0.6 (Mirror line)

### 두 가지 프롬프트 — Currents vs Report

#### 1. Currents 명명

```
SYSTEM: 시적인 두 단어 한국어 명사구를 생성합니다. 사용자의 클러스터 시그니처를
        반영하면서 동시에 일반화되지 않아야 합니다.

        규칙:
        - 두 단어 (예외 없음)
        - 첫 단어가 둘째 단어를 수식
        - 구체적 명사 + 분위기 (예: "옻칠한 황혼")
        - 금지: "minimalist", "vibes", "modern", "essence",
          "main character", "vibe check"
        - 영문 명사구 cosine 유사도 0.85 이상이면 재생성

USER: 클러스터 시그니처 (상위 6 L2 축의 극 이름),
      우세 팔레트 (5 색의 이름),
      대표 증거 3 조각 (이미지 캡션, 인용 단편, 곡명).
```

#### 2. Cinematic Report + Mirror Line

```
SYSTEM: 당신은 한 명의 Taste Genome 보고서를 작성합니다. 거울이지 분석이 아닙니다.

        구조 (느껴지지만 표지되지 않는 4막):
        I. 장소 — 분위기 먼저 ("늦은 오후입니다…")
        II. 패턴 — 2-3 개의 명명된 흐름을 증거와 함께 명명
        III. 긴장 — 역류 한 줄 ("그리고 — 142 BPM 트랙 하나")
        IV. 줄 — Mirror line으로의 다리

        규칙:
        - 250–400 한국어 음절 (약 500–800자)
        - 2인칭, 단 "당신은" 단어는 최대 한 번
        - 시제: 현재 (관찰)
        - 비유: 단락당 최대 1회
        - 금지 어휘: '분석', 'AI', '알고리즘', '데이터', '추천',
          'vibes', 'aesthetic', 'minimal', 'essence',
          '당신은 ___ 같은 사람이에요' 형태의 직유
        - Mirror line 별도 요구:
          * 1 문장 (한국어로는 2-3 문장)
          * 2인칭, 현재형
          * 구체적 명사 ≥ 1
          * 정신적으로 반증 가능

USER: 사용자의 L2 벡터 (14 축),
      상위 흐름들 (이름, 강도, 안정성),
      우세 팔레트, 우세 시간, 우세 재료,
      철학적 공명 (2-3 사조 + 마찰),
      역류 관찰 (있다면),
      구체적 증거 4 조각 (verbatim).
```

### 사후 검증 (Post-generation gates)

생성된 출력은 사용자에게 보여지기 전에 두 검사를 통과해야 합니다:

#### A. Flattery Audit

```ts
function flatteryAudit(text: string): boolean {
  const forbidden = [
    /특별한/, /유일한/, /남다른/,
    /great/i, /amazing/i, /unique/i,
    /당신은\s+[^은\s]+\s+같은\s+사람이에요/,
    /당신만의/, /오직\s+당신만/,
  ];
  return !forbidden.some((p) => p.test(text));
}
```

#### B. Falsifiability Check

Mirror line은 *틀릴 수도 있는* 진술이어야 합니다. *보편 진리* 면 reject.

```ts
function falsifiabilityCheck(line: string): boolean {
  // Claude를 다시 호출해서 검사
  return claude.evaluate(
    `이 문장이 *특정 사람* 에 대한 *구체적 관찰* 인지 (true),
     아니면 *누구에게나 해당될* 일반 진리인지 (false) 판정하세요: "${line}"`
  );
}
```

두 검사 모두 통과해야 사용자에게 보여집니다. 통과하지 못하면 자동 재생성 (최대 3회), 그래도 실패하면 *partial mode* 경고와 함께 짧은 출력으로 fallback.

### 다국어 Voice

한국어가 primary. 영문은 *sibling utterance* (per `voice.md` §12) — 직역이 아니라 *영문 독자에게 자연스러운 별도 작성*. 두 언어 동시 생성 시 토큰 비용 약 2배.

### 지연 & 비용

| 호출 | 입력 토큰 | 출력 토큰 | 비용 (Claude Opus) |
|---|---|---|---|
| Currents 명명 (4개) | ~600 | ~80 | ~$0.013 |
| Cinematic Report | ~2,400 | ~600 | ~$0.054 |
| Mirror Line | ~800 | ~80 | ~$0.018 |
| Falsifiability Check | ~200 | ~20 | ~$0.005 |
| **합계** | | | **~$0.09 / 사용자 / Genome 재생성** |

월별 재생성 cadence + 사용자 100만이면 월 $90K — 모델 비용. 손익 분기 가능한 비용.

---

## 8. 엔드 투 엔드 데이터 흐름

```
                                                                              
   사용자가 증거 추가 (이미지, 음악, 인용, 공간, 느낌)                          
       │                                                                      
       ▼                                                                      
   ┌────────────────────────────────┐                                         
   │ 1. Ingest                       │                                         
   │   - 정규화 (sRGB, LUFS, NFC)    │                                         
   │   - 지각적 중복 제거             │                                         
   │   - Evidence 객체 생성           │                                         
   └────────────┬────────────────────┘                                         
                ▼                                                              
   ┌────────────────────────────────┐                                         
   │ 2. Per-modality encoding         │                                         
   │   - Aperture (이미지/공간)       │                                         
   │   - Cadence (인용/곡명)          │                                         
   │   - 직접 인코딩 (느낌 슬라이더)   │                                         
   │   - CLAP (음악, 향후)           │                                         
   └────────────┬────────────────────┘                                         
                ▼                                                              
   ┌────────────────────────────────┐                                         
   │ 3. Manifold projection           │                                         
   │   - 학습된 선형 헤드 → 64-d      │                                         
   │   - L1/L2/L3 슬라이스           │                                         
   │   - 축별 confidence              │                                         
   └────────────┬────────────────────┘                                         
                ▼                                                              
   ┌────────────────────────────────┐                                         
   │ 4. Constellation                 │                                         
   │   - UMAP + HDBSCAN              │                                         
   │   - 테마 병합                    │                                         
   │   - 2–4 명명되지 않은 클러스터    │                                         
   └────────────┬────────────────────┘                                         
                ▼                                                              
   ┌────────────────────────────────┐                                         
   │ 5. Pattern detection             │                                         
   │   - Counter-current, Hour, Reach,│                                         
   │     Refuge, Horizon, Echo,      │                                         
   │     Silence                     │                                         
   │   - 강도 × 신선도 순위           │                                         
   └────────────┬────────────────────┘                                         
                ▼                                                              
   ┌────────────────────────────────┐                                         
   │ 6. Philosophical alignment       │                                         
   │   - 12 사조 prototype과 cosine   │                                         
   │   - 상위 2-3개 + 마찰            │                                         
   └────────────┬────────────────────┘                                         
                ▼                                                              
   ┌────────────────────────────────┐                                         
   │ 7. Voice — narrative synthesis   │                                         
   │   - Currents 명명 (Claude)       │                                         
   │   - Cinematic report (Claude)    │                                         
   │   - Mirror line (Claude)        │                                         
   │   - Flattery audit              │                                         
   │   - Falsifiability check        │                                         
   └────────────┬────────────────────┘                                         
                ▼                                                              
   ┌────────────────────────────────┐                                         
   │ 8. Presentation gate             │                                         
   │   - 최소 30초 유지               │                                         
   │   - 호흡 안무로 렌더              │                                         
   └────────────┬────────────────────┘                                         
                ▼                                                              
        Taste Report 사용자에게 도착                                            
                                                                              
```

### 단계별 캐싱

모든 단계는 `(user_id, evidence_hash, model_version, prompt_hash)` 로 캐시 키. 동일 입력 = 무료 재호출. 새 증거 1개 추가 시 → 그 항목만 단계 1-2 실행, 단계 3-7은 점진적으로 재실행.

---

## 9. 벡터 & 메모리 아키텍처

### 기술 선택

| 영역 | 선택 | 이유 |
|---|---|---|
| Vector DB | **pgvector** (Postgres 확장) | 비용 효율, 다른 DB와 통합, ACID |
| Embedding 저장 | 이미지·텍스트·오디오: 별도 pgvector 테이블 | per-modality 인덱스 가능 |
| Time-series | 같은 Postgres + TimescaleDB | L1/L2/L3 시계열 |
| Cache | Redis | Voice 출력 캐시, idempotency |
| Object store | S3 (사용자별 KMS 키) | 원본 이미지/오디오 |

### 테이블 구조

```sql
-- Raw evidence
CREATE TABLE evidence (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL,
  kind          TEXT NOT NULL,        -- image/sound/quote/space/feeling
  storage_key   TEXT,                 -- S3 if applicable
  perceptual_hash TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  source        TEXT NOT NULL         -- onboarding / tend / import
);

-- Aperture readings (image)
CREATE TABLE image_readings (
  id            UUID PRIMARY KEY,
  evidence_id   UUID REFERENCES evidence(id),
  clip_embedding VECTOR(768),
  aesthetic_head VECTOR(128),
  -- ... color/light/space/composition fields ...
  confidence    VECTOR(16)
);
CREATE INDEX ON image_readings USING ivfflat (clip_embedding vector_cosine_ops);

-- Cadence readings (text)
CREATE TABLE text_readings (
  id            UUID PRIMARY KEY,
  evidence_id   UUID REFERENCES evidence(id),
  embedding     VECTOR(1024),
  prosody       JSONB,
  valence       JSONB,
  abstraction   JSONB,
  temporality   JSONB,
  pronouns      JSONB,
  recurring_motifs TEXT[]
);
CREATE INDEX ON text_readings USING ivfflat (embedding vector_cosine_ops);

-- Sediment (time-series)
CREATE TABLE taste_vectors (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL,
  measured_at   TIMESTAMPTZ NOT NULL,
  model_ver     TEXT NOT NULL,
  l1            VECTOR(44),
  l2            VECTOR(14),
  l3            VECTOR(6),
  confidence    VECTOR(64),
  UNIQUE (user_id, measured_at, model_ver)
);
SELECT create_hypertable('taste_vectors', 'measured_at');

-- Constellation (currents)
CREATE TABLE currents (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL,
  name          TEXT NOT NULL,
  name_en       TEXT,
  centroid      VECTOR(64),
  strength      REAL,
  first_seen    TIMESTAMPTZ,
  last_touched  TIMESTAMPTZ
);

-- Drift (chapters)
CREATE TABLE chapters (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL,
  granularity     TEXT NOT NULL,        -- season/year/era
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  name            TEXT,
  l2_vector_mean  VECTOR(14),
  l2_vector_delta VECTOR(14),
  opening_prose   TEXT,
  closing_observation TEXT
);

-- Echoes
CREATE TABLE echoes (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL,
  motif         TEXT NOT NULL,
  frequency_prose TEXT,
  first_seen_at TIMESTAMPTZ,
  last_seen_at  TIMESTAMPTZ,
  cluster_evidence_ids UUID[]
);

-- Mirror records
CREATE TABLE mirror_records (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL,
  sentence    TEXT NOT NULL,
  set_at      TIMESTAMPTZ,
  still_true_at TIMESTAMPTZ,
  retired_at  TIMESTAMPTZ
);
```

### Vector DB의 검색 패턴

Taste OS는 *추천 시스템이 아니므로* nearest-neighbor 검색을 사용자 → 사용자 매칭에 *쓰지 않습니다*. 다음 두 가지 패턴만 사용:

1. **사용자 내부**: 새 evidence와 그 사용자의 기존 evidence들 사이 유사도 (Echo 감지용)
2. **사조 prototype과의 비교**: 12개 철학 사조 (Stoic, Daoist…) 의 prototype vector와 사용자 L2의 cosine

다른 사용자와 비교하는 검색은 *결코 일어나지 않습니다*.

---

## 10. 프라이버시 자세

### 6가지 약속

1. **사용자별 KMS 키로 암호화 at rest** — 사용자가 계정 삭제 요청 시 키를 파기하면 데이터는 사실상 복호 불가
2. **Evidence와 Genome 분리 저장** — 사용자가 원본 이미지를 지워도 Genome 벡터는 유지됨 (벡터에서 이미지를 *역구성* 할 수 없음)
3. **30일 삭제 grace period** — 계정 삭제 후 30일 안에 복구 가능, 그 후 모든 데이터 영구 파기
4. **3rd-party 학습 안 함** — Claude API는 Anthropic의 "training opt-out" 키로 호출. 사용자 데이터는 모델 개선에 사용되지 않음.
5. **개인 식별 정보 절대 추출 안 함** — EXIF GPS는 업로드 직후 제거, 얼굴 인식 없음, OCR 없음
6. **벡터 자체도 사용자별 격리** — 한 사용자의 벡터를 다른 사용자의 검색에 사용 안 함

### 데이터 보존 정책

| 데이터 | 보존 기간 |
|---|---|
| Raw evidence (원본 이미지/음악) | 사용자 보유 — 언제든 삭제 가능 |
| Embeddings (벡터) | 사용자 보유 — 원본 없어도 유지 |
| L1 / 인상 | 90일 raw, 그 후 월간 평균으로 압축 |
| L2 / 분위기 | 모두 보유 (시계열) |
| L3 / 헌법 | 모두 보유 (시계열) |
| Mirror records | 모두 보유, retire 가능 |
| Voice 출력 | 캐시 12개월, 그 후 재생성 시 필요하면 다시 |

---

## 11. 지연 & 비용 예산

### 사용자 한 명, 첫 Genome (온보딩 직후)

| 단계 | 시간 | 비용 |
|---|---|---|
| 1. Ingest | 1–3s | $0.001 |
| 2. Aperture (12 이미지) | 1.4–2.8s | $0.012 |
| 2. Cadence (3–7 인용) | 0.2s | <$0.001 |
| 3. Manifold projection | <100ms | <$0.001 |
| 4. Constellation (UMAP + HDBSCAN) | 1–2s | <$0.001 |
| 5. Patterns | <500ms | — |
| 6. Alignment | <100ms | — |
| 7. Voice (Currents + Report + Mirror) | 12–20s | $0.085 |
| 8. Presentation gate | 최소 24s | — |
| **합계** | **~30–45초** | **~$0.10** |

### 월간 갱신 (기존 사용자)

증거가 새로 들어왔다면:
- Re-encoding: 새 evidence만 → ~$0.005
- Re-clustering: 점진 → ~$0.001
- Voice 재생성: 월간 1회 if 흐름이 의미 있게 변함 → ~$0.085
- **합계**: ~$0.10/사용자/월

### 손익 분기 추정

- 무료 첫 Genome: $0.10
- $60/년 구독 = $5/월
- 한 사용자가 평균 10개월 머물면: $0.10 + ($0.10 × 10) = $1.10 비용 vs $50 매출
- **마진**: ~98%

이 마진이 광고 없이, 사용자 트래킹 없이, social loop 없이 운영 가능한 이유입니다.

---

## 12. 이 AI가 *하지 않는* 것들

명시적이고 영구적인 거부 목록. 이 목록은 *제품 정체성* 의 일부입니다.

### 영구 거부

| 기능 | 거부 이유 |
|---|---|
| 추천 ("당신이 좋아할 만한") | OS의 목적이 *알아봄* 이지 *제안* 이 아님 |
| 행동 예측 ("당신은 ___ 를 할 것입니다") | 예측은 *사용자를 가둠* |
| 카테고리화 (MBTI 류) | 정체성은 상자가 아닌 *방향* |
| Engagement 최적화 | dwell time을 늘리는 모델 자체를 만들지 않음 |
| A/B 테스트 (사용자 카피) | 모든 카피는 *저자* 가 있음 |
| 다른 사용자와의 비교 | "당신은 평균보다 X" 같은 진술 없음 |
| 사용자 데이터로 학습 | 모델은 큐레이션된 데이터로만 학습 |
| 감정 *조작* | dark patterns 없음, FOMO 없음 |
| 알림 발송 | 이메일 주 1회 + 만남이 있을 때만 |
| Social graph 컴퓨팅 | 친구 추천 없음, 매칭 없음 |
| Personalized ads signal | 외부 광고 시스템에 데이터 전달 없음 |

### 시간을 두고 재검토 가능 (지금은 거부)

- 그룹 Genome (두 명 이상의 *교차 분위기*) — 정체성의 *단수성* 이 흔들릴 수 있어서 신중
- 모바일 native app — PWA 로 충분, native가 더 *접근성 강요* 가 됨

### 자주 요청받지만 거부

- "내 Genome을 인스타그램에 공유" — 스크린샷이 옳은 답이지 share button이 아님
- "다른 사람과 매칭해줘" — 매칭은 *우정* 의 적
- "내 Genome으로 광고 봐줘" — Genome은 *사적* 임

---

## 13. 구현 로드맵

### Phase 1 — Foundation (Week 1–4)

목표: 한 명의 엔지니어가 자기 evidence로 *진짜 Genome* 을 만들 수 있게.

- [ ] Aperture v1 (CLIP only, 색/광원/공간 features는 임시 hardcode)
- [ ] Cadence v1 (bge-m3 only, 한국어 종결 어미 검출 우선)
- [ ] Sediment v1 (pgvector 테이블 생성, L2만 우선)
- [ ] 60-d 학습된 선형 헤드 (큐레이션 데이터 5K로 사전학습)
- [ ] Manual Constellation (Claude에 직접 클러스터 명명 요청)
- [ ] Voice v1 (Currents + Mirror line, Report 제외)
- [ ] Flattery audit (자동), Falsifiability check (수동)

**완료 기준**: 5명의 alpha tester가 자기 Genome을 받고, 3/5 이상이 *"한 줄이 진실 같았어요"* 라고 응답.

### Phase 2 — The Pipeline (Week 5–8)

- [ ] Aperture full (색채/광원/공간/구도 features 자동)
- [ ] Cadence full (prosody, valence, abstraction, temporality)
- [ ] CLAP audio encoder (Spotify URL → audio sample → embedding)
- [ ] Constellation auto (UMAP + HDBSCAN + 자동 명명)
- [ ] Pattern detection 7가지 (Silence 포함)
- [ ] Philosophical alignment 12 사조
- [ ] Voice — Cinematic Report 4 막 + Falsifiability auto-check

**완료 기준**: 50명 closed beta, Screenshot Rate ≥ 20%.

### Phase 3 — Memory & Evolution (Week 9–12)

- [ ] L1 일 단위 EMA 갱신
- [ ] L3 6 축 자동 추출 + 변화 감지
- [ ] Drift Chapter 경계 자동 감지
- [ ] Turn 자동 생성
- [ ] Echo 감지

**완료 기준**: 4주 이상 사용한 베타 사용자가 Drift 페이지에서 *변화* 를 *느낄 수 있음*.

### Phase 4 — Polish & Launch (Week 13–14)

- [ ] 다국어 Voice (영문 sibling utterance)
- [ ] Privacy review
- [ ] Cost optimization (배치, 캐싱)
- [ ] Production rollout

---

## 닫는 말

이 시스템의 모든 부분 — 6개 엔진, 매니폴드, 클러스터링, narration — 은 *하나의 행동* 을 위해 존재합니다:

> *사용자가 자기 자신에 대한 한 줄을 어딘가 사적인 곳에 간직하고 싶어함.*

이 행동은 측정되지 않고, 최적화되지 않고, 추적되지 않습니다. 우리는 *간직되었는지 알 수 없어요*. 그게 디자인이에요 — *알면 망가지는* 종류의 가치이기 때문입니다.

엔지니어가 이 문서를 읽고 빌드를 시작할 때, 모든 결정의 최종 검사는 단 하나의 질문이어야 해요:

> *이 기능이 *간직됨* 의 가능성을 *높이는가* 아니면 *낮추는가*?*

높이면 ship. 낮추면 — 아무리 *기술적으로 흥미로운* 기능이어도 — 짓지 않습니다. 그게 이 AI를 *추천 기계* 가 아닌 *거울* 로 만드는 유일한 방법이에요.
