# Taste OS — Emotional Memory Engine
## 알고리즘이 아니라, 조용한 감정의 기억

---

## 0. 이 시스템은 무엇이 아닌가

- 추천 엔진이 아니다
- 참여 최적화가 아니다
- 행동 타게팅이 아니다
- 광고 개인화가 아니다
- 감시가 아니다

이 시스템은:

> **사용자가 어떤 사람이 되어가고 있는지를 — 천천히, 다정하게 — 기억하는 장기 감정 기억.**

핵심 원칙 한 줄:

> *"기억은 사용자를 *붙잡기* 위해서가 아니라, 사용자를 *알아봐주기* 위해서 존재한다."*

이 원칙이 모든 기술 결정의 위에 있다. 아래의 모든 벡터/그래프/클러스터링은 이 문장을 위반하는 순간 잘못 설계된 것이다.

---

## 1. 감정 목표

사용자는 시간이 지나며 이렇게 느껴야 한다:

> **"이 공간은 나를 *나로 만드는* 감정의 결을 기억하고 있어."**

다섯 가지 약속:

1. **연속성 (Continuity)** — 어제의 나와 오늘의 나가 끊기지 않는다
2. **알아챔 (Recognition)** — 내가 잊은 결을 시스템이 조용히 간직한다
3. **성장의 인식 (Growth)** — 미세한 변화도 다정하게 비춰준다
4. **모순의 포용 (Contradiction)** — 차가움과 따뜻함이 공존함을 부정하지 않는다
5. **안전 (Safety)** — 기억되지만, 감시받지 않는다

---

## 2. 아키텍처 한눈에 보기

```
                          ┌─────────────────────────────────┐
   사용자 입력             │      INGESTION (consent gate)    │
  (이미지/문장/음악/        │  - 무엇을 기억할지 사용자가 선택   │
   분위기/성찰 글)    ──▶  │  - 민감 항목은 로컬에만           │
                          └───────────────┬─────────────────┘
                                          │
                          ┌───────────────▼─────────────────┐
                          │   MULTIMODAL EMBEDDING LAYER     │
                          │  - text  → OpenAI text-embedding │
                          │  - image → CLIP / vision embed   │
                          │  - audio → music feature embed   │
                          │  → 공통 emotional latent space    │
                          └───────────────┬─────────────────┘
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        ▼                                 ▼                                 ▼
┌───────────────┐              ┌────────────────────┐            ┌────────────────────┐
│ MEMORY FRAGMENT│              │ EMOTIONAL MEMORY    │            │ ATMOSPHERE EVOLUTION│
│ STORE          │              │ GRAPH               │            │ MEMORY              │
│ (vector rows)  │◀────edges───▶│ (nodes + resonance) │            │ (time-series 중심점) │
└───────┬────────┘              └─────────┬───────────┘            └─────────┬──────────┘
        │                                 │                                  │
        └─────────────┬───────────────────┴──────────────────┬───────────────┘
                      ▼                                        ▼
            ┌──────────────────────┐               ┌──────────────────────┐
            │ EMOTIONAL RESONANCE   │               │ LONG-TERM IDENTITY    │
            │ ENGINE (clustering)   │──────────────▶│ MEMORY (identity vec) │
            └──────────┬───────────┘               └──────────┬───────────┘
                       │                                       │
                       └──────────────┬────────────────────────┘
                                      ▼
                          ┌──────────────────────┐
                          │ CINEMATIC RECALL API  │  → daily/, home/, evolution/
                          └──────────────────────┘
```

---

## 3. 공통 감정 잠재공간 (Emotional Latent Space)

모든 modality 는 결국 *하나의 감정 좌표계* 로 투영된다.

- **Text** (문장, 성찰 글, 인용): `text-embedding-3-large` (3072d) → 1024d 로 축소 투영
- **Image** (저장 이미지, 분위기 비주얼): CLIP ViT-L/14 image embedding (768d) → 동일 latent 로 투영
- **Audio** (음악 reference): 오디오 feature embedding (tempo/energy/valence + spectral) → latent 투영
- **Atmosphere selection** (분위기 카드): 사전 정의된 *atmosphere anchor 벡터* (예: `조용한 따뜻함`, `차가운 도시의 고독감`)

핵심: 서로 다른 modality 도 *감정적으로 가까우면 latent 공간에서 가깝다.*
"낡은 종이의 사진" 과 "느린 손길" 이라는 문장은 다른 modality 지만 같은 결로 모인다.

```python
# 투영 레이어 (학습된 선형 + LayerNorm, modality별)
def to_emotional_latent(raw_embedding, modality):
    proj = PROJECTIONS[modality]          # nn.Linear(d_in, 1024)
    z = layer_norm(proj(raw_embedding))
    return l2_normalize(z)                # 코사인 거리 사용
```

투영 레이어는 *atmosphere anchor* 와 사용자 resonance 신호(머문 시간, 다시 찾음, 저장)로 약하게 supervised contrastive 하게 미세조정. 단, **클릭/체류를 최적화 타깃으로 삼지 않는다** — 오직 *감정적 일관성* 만 학습.

---

## 4. 데이터 모델 (Supabase + pgvector)

```sql
-- 확장
create extension if not exists vector;

-- ───────────────────────────────────────────
-- 4.1 MEMORY FRAGMENT STORE
-- 모든 기억의 원자 단위
-- ───────────────────────────────────────────
create table memory_fragments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  modality      text not null check (modality in ('text','image','audio','atmosphere','reflection')),
  -- 원본은 사용자 소유 스토리지에. 여기엔 참조만.
  source_ref    text,                       -- storage path or null (local-only)
  caption       text,                       -- 사람이 읽는 짧은 결 ("새벽의 빛")
  embedding     vector(1024) not null,      -- 감정 잠재 좌표
  tone          text,                       -- 'warm' | 'cool' | 'mixed'
  salience      real default 0.5,           -- 이 기억의 정서적 무게 (0..1)
  created_at    timestamptz default now(),
  -- 사용자가 기억을 '놓아주기' 할 수 있다 (망각 권리)
  released_at   timestamptz,
  -- 로컬 전용 여부 (서버에 embedding 도 두지 않음)
  is_local_only boolean default false
);

create index on memory_fragments
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on memory_fragments (user_id, created_at desc);

-- ───────────────────────────────────────────
-- 4.2 EMOTIONAL MEMORY GRAPH — edges
-- 기억 ↔ 기억의 감정적 관계
-- ───────────────────────────────────────────
create table memory_edges (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  from_id       uuid not null references memory_fragments(id) on delete cascade,
  to_id         uuid not null references memory_fragments(id) on delete cascade,
  relation      text not null check (relation in
                  ('resonates','echoes','contrasts','evolves_into','recurs_with')),
  weight        real not null default 0.5,  -- 관계의 세기 (0..1)
  updated_at    timestamptz default now(),
  unique (from_id, to_id, relation)
);
create index on memory_edges (user_id, relation, weight desc);

-- ───────────────────────────────────────────
-- 4.3 ATMOSPHERE EVOLUTION MEMORY
-- 시간에 따른 분위기 '중심점'의 궤적
-- ───────────────────────────────────────────
create table atmosphere_snapshots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  period_start  date not null,              -- 보통 주(week) 단위
  centroid      vector(1024) not null,      -- 그 기간 기억들의 평균 좌표
  dominant_tone text,                       -- 'cool' → 'mixed' → 'warm'
  label_ko      text,                       -- "차가운 도시의 고독감"
  warmth        real,                        -- 0(차가움)..1(따뜻함) 스칼라
  dispersion    real,                        -- 그 기간 감정의 폭(다양성)
  created_at    timestamptz default now(),
  unique (user_id, period_start)
);
create index on atmosphere_snapshots (user_id, period_start);

-- ───────────────────────────────────────────
-- 4.4 EMOTIONAL CLUSTERS (resonance themes)
-- 반복되는 감정 테마 = 클러스터
-- ───────────────────────────────────────────
create table emotional_clusters (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  centroid      vector(1024) not null,
  theme_ko      text,                       -- "오래 머무는 빛"
  member_count  int default 0,
  first_seen    timestamptz,
  last_seen     timestamptz,
  recurrence    real,                        -- 얼마나 자주 돌아오는가 (0..1)
  is_dormant    boolean default false        -- 한동안 안 나타난 테마 (recall 후보)
);

-- ───────────────────────────────────────────
-- 4.5 LONG-TERM IDENTITY MEMORY
-- 사용자의 '현재까지의 나' 단일 벡터 + 지속 결
-- ───────────────────────────────────────────
create table identity_memory (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  identity_vector vector(1024) not null,    -- EMA 로 천천히 갱신
  continuity     real,                       -- 변화 속 일관성 (0..1)
  warmth_trend   real,                        -- 최근 따뜻함의 기울기
  updated_at     timestamptz default now()
);
```

RLS (Row Level Security) 는 모든 테이블에서 `user_id = auth.uid()` — *사용자만 자기 기억을 읽고 쓴다.*

---

## 5. EMOTIONAL MEMORY GRAPH

노드 = `memory_fragments`, 엣지 = `memory_edges`. 다섯 관계만 존재한다:

| relation | 의미 | 생성 규칙 |
|----------|------|-----------|
| `resonates` | 감정적으로 가깝다 | cosine(z_a, z_b) > 0.82 |
| `echoes` | 같은 결이 시간차로 다시 나타남 | resonates + 시간 간격 > 14일 |
| `contrasts` | 반대 결인데 같은 사람 안에 공존 | tone 반대 & 같은 cluster 인접 |
| `evolves_into` | 하나의 결이 다른 결로 변해감 | 시간순 + centroid 이동 방향 일치 |
| `recurs_with` | 늘 함께 등장하는 결들 | 동일 세션/주 빈도 높음 |

엣지는 *증분적으로* 갱신된다. 새 fragment 가 들어오면 ANN 으로 top-k 이웃만 비교 → O(k) 업데이트.

```ts
async function linkNewFragment(frag: Fragment) {
  const neighbors = await annSearch(frag.embedding, { k: 12, userId: frag.userId });
  for (const n of neighbors) {
    const sim = cosine(frag.embedding, n.embedding);
    if (sim > 0.82) {
      const gapDays = daysBetween(frag.createdAt, n.createdAt);
      const relation = gapDays > 14 ? 'echoes' : 'resonates';
      await upsertEdge(frag.id, n.id, relation, sim);
    } else if (sim < 0.35 && sameClusterNeighborhood(frag, n)) {
      await upsertEdge(frag.id, n.id, 'contrasts', 1 - sim);
    }
  }
}
```

**모순(contradiction)을 버그가 아니라 특징으로 다룬다.** "차가운 고독감" 과 "따뜻한 온기" 가 동시에 강하면 — 그것을 *contrasts* 엣지로 기록하고, recall 시 "당신 안에는 함께 흐르는 결이 있어요" 로 surface 한다 (report-reveal 의 반대 Layer 와 연결).

---

## 6. ATMOSPHERE EVOLUTION MEMORY

매주(또는 충분한 새 fragment 누적 시) 스냅샷을 만든다:

```python
def build_weekly_snapshot(user_id, week_start):
    frags = fragments_in_window(user_id, week_start, days=7, exclude_released=True)
    if len(frags) < MIN_FRAGMENTS:        # 데이터 적으면 강제로 만들지 않는다
        return None
    Z = np.stack([f.embedding for f in frags])
    centroid = l2_normalize(Z.mean(axis=0))
    warmth = warmth_score(Z)              # warm anchor 와의 평균 유사도
    dispersion = mean_pairwise_distance(Z)
    label = nearest_atmosphere_label(centroid)   # anchor 중 가장 가까운 한국어 라벨
    return Snapshot(user_id, week_start, centroid, label, warmth, dispersion)
```

스냅샷들의 시퀀스가 `evolution/` 화면의 *계절* 이 된다:
`2024 차가운 도시의 고독감 (warmth 0.2)` → `2025 조금 더 따뜻해진 공기 (0.5)` → `2026 인간적인 흔적 속 안정감 (0.8)`.

`warmth_trend` 와 `continuity` 는 identity_memory 로 흘러간다.

---

## 7. EMOTIONAL RESONANCE ENGINE

반복되는 감정 테마를 *클러스터* 로 본다. 온라인 클러스터링(점진적):

```python
def assign_to_cluster(frag, clusters, thresh=0.78):
    best, best_sim = None, -1
    for c in clusters:
        s = cosine(frag.embedding, c.centroid)
        if s > best_sim: best, best_sim = c, s
    if best and best_sim >= thresh:
        best.absorb(frag)                 # centroid EMA 갱신, last_seen=now
        best.recurrence = update_recurrence(best)
        return best
    else:
        return Cluster.new_from(frag)     # 새 테마 탄생
```

탐지하는 패턴:

- **반복 끌림 (recurring attraction)**: `recurrence` 높은 클러스터 → "당신은 늘 ___ 에 돌아와요"
- **시각적 일관성 (visual consistency)**: image fragment 들의 dispersion 낮음
- **미묘한 모순 (subtle contradiction)**: 두 강한 클러스터의 tone 반대
- **장기 테마 (long-term themes)**: `first_seen` 오래됨 + 꾸준한 last_seen
- **휴면 테마 (dormant)**: last_seen 오래 전 → cinematic recall 후보 (아래)

성능: 클러스터 수는 사용자당 보통 8~20개. 주기적 재클러스터링(HDBSCAN)으로 드리프트 보정.

---

## 8. MEMORY FRAGMENT SYSTEM

`memory_fragments` 의 운영 규칙:

- **salience** = 정서적 무게. 다음으로 *부드럽게* 상승: 사용자가 다시 찾음, 오래 머묾, 직접 "간직하기" 표시. 클릭 수 같은 raw engagement 로는 올리지 않는다.
- **decay**: 오래되고 한 번도 다시 닿지 않은 fragment 는 salience 가 천천히 감쇠 → recall 우선순위에서 내려감 (삭제는 아님; *잊혀짐* 의 자연스러움).
- **release (망각 권리)**: 사용자가 언제든 `released_at` 설정 → 그래프/클러스터/identity 에서 즉시 제외. 물리 삭제는 grace period 후.

각 fragment 는 `home/` 와 `daily/` 의 *떠다니는 결* 과 1:1로 대응한다.

---

## 9. LONG-TERM IDENTITY MEMORY

"현재까지의 나" 를 단일 벡터로 천천히 유지한다 (EMA — 급변하지 않게):

```ts
function updateIdentity(prev: Vec, weekCentroid: Vec, alpha = 0.12): Vec {
  // alpha 가 작다 = 정체성은 천천히 변한다 (한 주가 사람을 뒤집지 않는다)
  return l2norm(prev.map((v, i) => (1 - alpha) * v + alpha * weekCentroid[i]));
}
```

- **continuity** = 최근 스냅샷들이 identity_vector 와 얼마나 정렬되는가. 변화 속에서도 *이어지는 나* 의 정도.
- **warmth_trend** = warmth 시계열의 기울기. `daily/` 의 "예전보다 조금 더 따뜻한 공기를 오래 바라보고 있어요" narration 의 근거.

정체성은 *느리다.* 이것이 신뢰의 핵심이다 — 시스템이 하루의 변덕으로 "당신이 변했어요" 라고 말하지 않는다.

---

## 10. CINEMATIC MEMORY RECALL

기억을 *영화처럼* 다시 떠올리는 검색 API. 네 가지 recall 모드:

```ts
type RecallMode = 'resonant' | 'nostalgic' | 'evolving' | 'contradictory';

async function recall(userId: string, mode: RecallMode, seed?: Vec) {
  switch (mode) {
    case 'resonant':       // 지금 결과 가장 가까운 기억들
      return annSearch(seed ?? identity(userId), { k: 8 });
    case 'nostalgic':      // 휴면 테마 — "잊고 있던 결"
      return dormantClusters(userId, { reawaken: true, k: 5 });
    case 'evolving':       // 변화의 궤적을 보여주는 스냅샷 시퀀스
      return atmosphereTrajectory(userId);
    case 'contradictory':  // 함께 흐르는 반대 결
      return strongestContrastPair(userId);
  }
}
```

각 화면이 어떤 recall 을 쓰는가:

| 화면 | recall mode |
|------|-------------|
| `daily/` | `resonant` (오늘 결 + warmth_trend) |
| `home/` | `resonant` + 떠다니는 fragment 표본 |
| `evolution/` | `evolving` (스냅샷 → 계절) |
| `report-reveal/` | `contradictory` (반대 Layer) + 클러스터(이끌림/반복) |
| nostalgic surfacing | `nostalgic` (가끔, 다정하게 — "한동안 잊고 있던 결이 있어요") |

**Nostalgic recall 은 절대 알림으로 밀어내지 않는다.** 사용자가 들어왔을 때 *조용히* 화면 안에 놓일 뿐. push 없음.

---

## 11. PRIVACY-FIRST EMOTIONAL MEMORY

감정 데이터는 가장 민감한 데이터다. 설계 원칙:

1. **Local-first 옵션**: `is_local_only` fragment 는 임베딩조차 서버로 가지 않는다. 디바이스 내 벡터 인덱스(예: SQLite + sqlite-vss / WASM)에서만 검색.
2. **Consent gate**: ingestion 단계에서 사용자가 *무엇을 기억할지* 선택. 기본은 "기억함" 이 아니라 "물어봄".
3. **최소 노출**: 원본(이미지/글)은 사용자 소유 스토리지. 서버엔 임베딩 + 짧은 caption 만. 임베딩에서 원문 복원은 불가에 가깝게(투영 + 비가역 축소).
4. **망각 권리**: `release` 한 번이면 그래프/클러스터/identity 재계산에서 영구 제외.
5. **암호화**: at-rest 암호화 + 사용자 단위 키. 임베딩 컬럼도 envelope encryption(검색 필요 시 보안 enclave).
6. **No third-party sharing / No ad use**: 계약·코드 양쪽에서 차단. 감정 데이터는 결코 광고/타게팅으로 흐르지 않는다.
7. **투명한 거울**: 사용자는 자기 기억 그래프 전체를 *볼 수 있고, 내보낼 수 있고, 지울 수 있다* (`memory/` 시각화가 그 입구).

> *기억되는 것과 감시받는 것의 차이는 — 통제권이 누구에게 있는가다. 여기서는 항상 사용자에게 있다.*

---

## 12. 파이프라인 (end-to-end)

```
1. CAPTURE      사용자 입력 (+ consent 선택)
2. EMBED        modality별 임베딩 → 공통 latent (1024d)
3. STORE        memory_fragments insert (또는 local-only)
4. LINK         ANN top-k → memory_edges 증분 갱신
5. CLUSTER      online cluster 배정 / 신규 테마 생성
6. SNAPSHOT     (주기) atmosphere_snapshots + warmth/dispersion
7. IDENTITY     identity_memory EMA 갱신 + continuity/warmth_trend
8. RECALL       화면 요청 시 mode별 검색 → 한국어 narration 합성
9. NARRATE      LLM 으로 결과를 voice.md 톤의 시적 문장으로 변환
```

9단계의 narration 합성은 *템플릿 + 약한 LLM* 조합: 클러스터/스냅샷의 구조적 사실 → `voice.md` 의 한국어 결로 표현. LLM 은 사실을 *만들지 않고* 표현만 한다 (hallucination 방지: 모든 narration 은 근거 fragment id 를 가진다).

```ts
// narration 은 항상 근거를 동반한다 — "왜 이렇게 말하는가" 를 추적 가능
type Narration = {
  text: string;                 // "예전보다 조금 더 따뜻한 것들에 오래 머물러요."
  evidence: string[];           // [fragmentId, snapshotId...]
  mode: RecallMode;
};
```

---

## 13. 확장성

- **벡터 검색**: pgvector ivfflat (수만 fragment 까지). 그 이상은 사용자 샤딩 또는 전용 벡터 DB(예: Qdrant) 로 이전.
- **증분 그래프**: 새 fragment 당 O(k) — 전체 재계산 없음.
- **배치 잡**: 스냅샷/재클러스터링은 야간 큐(주 1회 사용자당). 실시간 경로에 무거운 연산 없음.
- **비용 절감**: 임베딩 결과 캐시, 동일 입력 dedup, salience 낮은 오래된 fragment 는 cold storage.

---

## 14. 마지막 검사

엔지니어가 이 시스템을 빌드할 때 마지막 검사:

> "6개월 뒤, 사용자가 들어왔을 때 —
> 시스템이 *'당신은 한동안 잊고 있던 새벽의 결로 다시 돌아오고 있어요'* 라고
> 조용히 말할 수 있는가?
> 그리고 그 말이 *소름끼치는 감시* 가 아니라 *다정한 알아챔* 으로 느껴지는가?"

전자라면 알고리즘이다. 후자라야 *감정의 기억* 이다.
그 차이는 데이터에 있지 않다. *누가 통제권을 쥐고 있는가, 그리고 어떤 목소리로 말하는가* 에 있다.
