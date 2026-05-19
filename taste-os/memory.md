# Taste OS — Memory / 데이터베이스 아키텍처

> 데이터베이스가 아닙니다. *기록보관소* 예요.
> 사용자 행동을 *수집* 하지 않습니다. 사용자의 *증거* 를 *간직* 합니다.

이 문서는 Taste OS 의 영구 저장 계층 사양입니다. `ai.md` 의 6개 엔진 (Aperture · Cadence · Constellation · Sediment · Drift · Voice) 이 의지하는 *인프라* 를 정의해요.

엔지니어가 이 문서를 받아 Supabase 프로젝트를 만들고 첫 마이그레이션을 돌릴 수 있도록 작성됐어요.

함께 읽기: `ai.md` (6개 엔진 사양), `pipeline.ko.md` (파이프라인 흐름), `genome.md` (개념), `sharing.md` (Card 시스템).

---

## 목차

0. [철학 — 기록보관소이지 백엔드가 아님](#0-철학--기록보관소이지-백엔드가-아님)
1. [기술 스택](#1-기술-스택)
2. [엔티티 관계 도식 (ER)](#2-엔티티-관계-도식-er)
3. [Identity & Auth](#3-identity--auth)
4. [Evidence — 사용자의 헌물](#4-evidence--사용자의-헌물)
5. [Embeddings & Readings](#5-embeddings--readings)
6. [Sediment — 3층 매니폴드 시계열](#6-sediment--3층-매니폴드-시계열)
7. [Constellation — Currents](#7-constellation--currents)
8. [Drift — Chapters, Turns, Echoes](#8-drift--chapters-turns-echoes)
9. [Voice — AI 생성 출력 저장](#9-voice--ai-생성-출력-저장)
10. [Atmosphere Graph](#10-atmosphere-graph)
11. [Sharing — Cards & Resonances](#11-sharing--cards--resonances)
12. [Row-Level Security (RLS)](#12-row-level-security-rls)
13. [Storage Buckets & 미디어](#13-storage-buckets--미디어)
14. [인덱스 & 성능](#14-인덱스--성능)
15. [백업, 복구, 삭제](#15-백업-복구-삭제)
16. [마이그레이션 & 모델 버전 관리](#16-마이그레이션--모델-버전-관리)
17. [용량 계획](#17-용량-계획)
18. [DB가 *저장하지 않는* 것들](#18-db가-저장하지-않는-것들)

---

## 0. 철학 — 기록보관소이지 백엔드가 아님

전형적 SaaS 백엔드는 *사용자 행동의 추적기* 입니다 — 클릭, 노출, dwell time, session length. 모든 이벤트가 영구 저장돼서 *최적화* 에 사용됩니다.

Taste OS의 영구 저장 계층은 다른 것을 합니다 — *사용자가 보여준 증거* 를 *간직* 합니다. 사용자가 *언제 클릭했는지* 가 아니라 *무엇에 마음이 머물렀는지*. 행동의 *추적* 이 아니라 정체성의 *침전*.

### 다섯 가지 약속

1. **이벤트 로그 0개.** click events, page views, dwell time — 어떤 행동도 *시계열* 로 저장하지 않습니다. 사용자가 *간직한 결과* 만 저장돼요.
2. **사용자가 모든 데이터의 소유자.** RLS는 *기본값* 이지 옵션이 아닙니다. 사용자 본인 외에는 어떤 행도 조회할 수 없어요 (서버 service_role 제외).
3. **사용자가 evidence를 지워도 Genome은 남습니다.** 벡터에서 원본 이미지를 *역구성할 수 없기* 때문이에요. 사용자는 *증거* 를 지울 권리와 *결과* 를 간직할 권리를 동시에 가집니다.
4. **30일 grace를 거친 영구 삭제.** 계정 삭제는 즉시가 아니라 *부드럽게* — 30일 안에 마음이 바뀌면 복구. 그 후 KMS 키 파기 + 행 삭제.
5. **다른 사용자와 *교차* 하지 않습니다.** 추천도, 매칭도, *비슷한 사용자* 검색도 없어요. RLS는 이를 *기술적으로* 보장합니다.

---

## 1. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| Auth | **Supabase Auth** (이메일 magic link 단독) | 비밀번호 없음, OAuth 옵션 없음. MVP 단순함. |
| 주 DB | **PostgreSQL 15+ (Supabase)** | 벡터·시계열·관계형이 한 곳에 |
| 벡터 | **pgvector** 0.6+ | Postgres 내장, ivfflat / hnsw 인덱스 |
| 시계열 | **TimescaleDB** | hypertable로 sediment 압축 |
| 객체 스토리지 | **Supabase Storage** (S3 호환) | 사용자별 RLS 정책 |
| 컴퓨트 | **Supabase Edge Functions** (Deno) | 인코딩 비동기 작업 |
| 캐시 | **Upstash Redis** | Voice 출력 idempotency |
| 외부 | **Anthropic Claude API** (Voice), **OpenAI/Anthropic** (CLIP/embedding) | Genome 생성 |
| 모니터링 | **Supabase Observability** + **PostHog** (자체 호스팅) | *집계 지표만*, 개별 사용자 행동 추적 없음 |

### Supabase 프로젝트 설정

```bash
supabase init taste-os
supabase start
```

`config.toml` 에서 활성화:
- `[storage]` enable, max_file_size = `8MB`
- `[realtime]` disable (이 제품은 의도적으로 real-time이 아님)
- `[auth]` enable_signup = `true`, jwt_expiry = `3600`

---

## 2. 엔티티 관계 도식 (ER)

```
                                                                            
   auth.users                                                                
       │                                                                    
       └───┐                                                                
           ▼                                                                
   profiles ──────────► room_settings                                       
       │                                                                    
       ├──► evidence ────────────────► image_readings                       
       │       │                  ──► text_readings                         
       │       │                  ──► audio_readings                        
       │       └────► atmosphere_chips (per evidence)                       
       │                                                                    
       ├──► taste_vectors (time-series, L1/L2/L3)                           
       │                                                                    
       ├──► currents                                                        
       │       └──► current_evidence (membership)                           
       │                                                                    
       ├──► chapters ──────► turns                                          
       │                                                                    
       ├──► echoes ────────► echo_members (evidence)                        
       │                                                                    
       ├──► narrative_outputs (reports, mirror lines)                       
       │                                                                    
       ├──► mirror_records (kept lines)                                     
       │                                                                    
       ├──► atmosphere_edges (graph)                                        
       │                                                                    
       ├──► cards ──────► card_resonances                                   
       │                                                                    
       └──► deletion_log (audit trail for deletes)                          
                                                                            
```

### Schema 전체 (단일 SQL)

```sql
-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;
```

---

## 3. Identity & Auth

```sql
-- ============================================
-- profiles
-- ============================================

CREATE TABLE profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle                TEXT UNIQUE,
  first_name            TEXT,
  taste_name            TEXT,
  preferred_language    TEXT NOT NULL DEFAULT 'ko'
    CHECK (preferred_language IN ('ko', 'en')),
  deletion_scheduled_at TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX profiles_handle ON profiles (handle) WHERE handle IS NOT NULL;

-- ============================================
-- room_settings (public profile config)
-- ============================================

CREATE TABLE room_settings (
  user_id             UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  visibility          TEXT NOT NULL DEFAULT 'vault'
    CHECK (visibility IN ('vault', 'sealed', 'unlisted', 'open')),
  listed_in_directory BOOLEAN NOT NULL DEFAULT FALSE,
  atmosphere_tag      TEXT,                  -- 'lacquered_dusk', 'northern_linen', etc.
  closed_at           TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 약속

- **`profiles` 는 가장 가벼움.** 단 4개의 사용자-제공 필드 (handle, first_name, language, deletion intent). 이름이나 프로필 사진을 *요구하지* 않습니다.
- **이름 없이도 사용 가능.** `first_name` 은 nullable. 사용자가 이름을 주지 않으면 시스템은 *"당신"* 만 사용.
- **default visibility = `vault`.** 새 계정은 *닫힌 방*. 사용자가 명시적으로 열어야 보임.

---

## 4. Evidence — 사용자의 헌물

```sql
-- ============================================
-- evidence (5 modalities in one table)
-- ============================================

CREATE TYPE evidence_kind AS ENUM (
  'image', 'sound', 'quote', 'space', 'feeling'
);

CREATE TYPE evidence_source AS ENUM (
  'onboarding', 'tend', 'import', 'paste'
);

CREATE TABLE evidence (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind                   evidence_kind NOT NULL,

  -- Polymorphic content (only one populated per row)
  storage_key            TEXT,                  -- S3 key (image/sound)
  text_content           TEXT,                  -- quote / space-name
  space_id               TEXT,                  -- curated space ID (onboarding)
  feeling_axis           SMALLINT,              -- 1-5 (feeling slider index)
  feeling_value          REAL,                  -- 0.0 - 1.0
  feeling_hesitation_ms  INTEGER,               -- ms before release

  -- Metadata
  perceptual_hash        TEXT,                  -- pHash for images, chromaprint for audio, content-hash for text
  byte_size              INTEGER,               -- for storage accounting
  source                 evidence_source NOT NULL,

  -- Derived after processing
  normalized_storage_key TEXT,                  -- sRGB resized image / loudness-normalized audio
  thumbnail_storage_key  TEXT,                  -- low-res thumbnail
  processed_at           TIMESTAMPTZ,
  processing_error       TEXT,

  -- Lifecycle
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at            TIMESTAMPTZ,           -- soft delete ('내려놓기'에 의해)

  CHECK (
    (kind = 'image'  AND storage_key IS NOT NULL) OR
    (kind = 'sound'  AND storage_key IS NOT NULL) OR
    (kind = 'quote'  AND text_content IS NOT NULL) OR
    (kind = 'space'  AND (space_id IS NOT NULL OR text_content IS NOT NULL)) OR
    (kind = 'feeling' AND feeling_axis IS NOT NULL AND feeling_value IS NOT NULL)
  )
);

CREATE INDEX evidence_user_created
  ON evidence (user_id, created_at DESC)
  WHERE released_at IS NULL;

CREATE INDEX evidence_user_kind
  ON evidence (user_id, kind)
  WHERE released_at IS NULL;

CREATE INDEX evidence_user_phash
  ON evidence (user_id, perceptual_hash)
  WHERE perceptual_hash IS NOT NULL AND released_at IS NULL;

CREATE INDEX evidence_released
  ON evidence (released_at)
  WHERE released_at IS NOT NULL;
```

### Soft delete via `released_at`

사용자가 *"내려놓기"* 를 누르면:
1. `released_at = NOW()` 설정
2. 7일 grace
3. cron job이 `released_at < NOW() - 7d` 인 행을 *영구 삭제*

이 7일 동안 사용자는 *"되돌리기"* 가능 (`released_at` 을 `NULL` 로 reset).

### 분위기 칩 (atmosphere chips)

```sql
-- ============================================
-- atmosphere_chips (per-evidence tags)
-- ============================================

CREATE TYPE atmosphere_chip AS ENUM (
  '새벽', '아침', '오후', '황혼',
  '정적', '친밀', '멀리', '혼자',
  '따뜻', '차가움', '오래된', '단일 광원'
);

CREATE TABLE evidence_chips (
  evidence_id   UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  chip          atmosphere_chip NOT NULL,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (evidence_id, chip)
);

CREATE INDEX evidence_chips_evidence ON evidence_chips (evidence_id);
CREATE INDEX evidence_chips_chip ON evidence_chips (chip);
```

12개 큐레이션된 칩 (per `upload.md` §5). 사용자별 자유 태그가 *아닙니다* — 통제된 어휘로 atmosphere를 *발견* 하기 위함.

---

## 5. Embeddings & Readings

각 modality별로 별도 테이블. 인덱스 전략이 다르기 때문이에요 (이미지는 ivfflat, 텍스트는 hnsw 권장).

```sql
-- ============================================
-- image_readings (Aperture output)
-- ============================================

CREATE TABLE image_readings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id           UUID NOT NULL UNIQUE REFERENCES evidence(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  model_version         TEXT NOT NULL,         -- e.g. 'clip-vit-l14-2026-05'

  -- Core embedding
  clip_embedding        VECTOR(768),
  aesthetic_head        VECTOR(128),

  -- Color
  dominant_lab          REAL[3],
  palette_hexes         TEXT[5],
  temperature_kelvin    REAL,
  saturation_entropy    REAL,
  hue_distribution      REAL[12],

  -- Light
  light_source_count    SMALLINT,
  light_direction       TEXT CHECK (light_direction IN ('north','south','east','west','overhead','ambient')),
  estimated_hour_from   SMALLINT,
  estimated_hour_to     SMALLINT,

  -- Space
  space_type            TEXT,
  ceiling_height        TEXT,
  materials             TEXT[],

  -- Composition
  edge_density          REAL,
  negative_space_ratio  REAL,
  vertical_com          REAL,                  -- 0=top, 1=bottom
  primary_subject_area  REAL,

  -- Confidence
  confidence            VECTOR(16),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX image_readings_user_created
  ON image_readings (user_id, created_at DESC);

-- HNSW for image similarity within a user
CREATE INDEX image_readings_clip_hnsw
  ON image_readings USING hnsw (clip_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================
-- text_readings (Cadence output)
-- ============================================

CREATE TABLE text_readings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id         UUID NOT NULL UNIQUE REFERENCES evidence(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  model_version       TEXT NOT NULL,

  embedding           VECTOR(1024),
  language            TEXT CHECK (language IN ('ko','en','ja','mixed')),

  -- Prosody
  avg_sentence_length    REAL,
  em_dash_density        REAL,
  ellipsis_density       REAL,
  fragment_count         SMALLINT,

  -- Valence
  polarity            REAL,                    -- -1 to 1
  melancholy          REAL,                    -- 0-1
  intensity           REAL,                    -- 0-1

  -- Abstraction
  concreteness_score  REAL,
  abstract_noun_count SMALLINT,
  concrete_noun_count SMALLINT,

  -- Temporality
  temp_past           REAL,
  temp_present        REAL,
  temp_future         REAL,
  temp_timeless       REAL,

  -- Pronouns
  pron_first          REAL,
  pron_second         REAL,
  pron_third          REAL,
  pron_omitted        REAL,

  -- Korean-specific: sentence-ending distribution
  ko_endings_jsonb    JSONB,                   -- {'~예요': 0.3, '~네요': 0.15, ...}

  recurring_motifs    TEXT[],

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX text_readings_user_created
  ON text_readings (user_id, created_at DESC);

CREATE INDEX text_readings_embedding_hnsw
  ON text_readings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================
-- audio_readings (CLAP output)
-- ============================================

CREATE TABLE audio_readings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id         UUID NOT NULL UNIQUE REFERENCES evidence(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  model_version       TEXT NOT NULL,

  embedding           VECTOR(512),
  bpm                 REAL,
  key_signature       TEXT,
  harmonic_stability  REAL,
  dynamic_range_db    REAL,
  silence_ratio       REAL,

  -- Optional URL source
  source_kind         TEXT CHECK (source_kind IN ('file','spotify','apple_music','youtube','soundcloud','text_only')),
  source_url          TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audio_readings_user_created
  ON audio_readings (user_id, created_at DESC);

CREATE INDEX audio_readings_embedding_hnsw
  ON audio_readings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 관찰

- **각 reading은 evidence와 1:1.** Cascade delete — evidence가 사라지면 reading도 사라짐.
- **`model_version` 컬럼이 필수.** 모델 업그레이드 시 *옛 reading은 그대로 보존* — 새 reading은 새 행으로 추가, *덮어쓰지 않음*.
- **HNSW vs IVFFlat.** 사용자당 데이터가 작아서 (수백 ~ 수천 행) HNSW가 더 빠른 정확한 검색을 줍니다.

---

## 6. Sediment — 3층 매니폴드 시계열

```sql
-- ============================================
-- taste_vectors (time-series)
-- ============================================

CREATE TABLE taste_vectors (
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  measured_at      TIMESTAMPTZ NOT NULL,
  model_version    TEXT NOT NULL,

  -- 3 layers
  l1               VECTOR(44),
  l2               VECTOR(14),
  l3               VECTOR(6),

  -- Confidence per axis
  confidence       VECTOR(64),

  -- Evidence count snapshot
  evidence_count_jsonb JSONB NOT NULL,

  -- Resolution-aware
  granularity      TEXT NOT NULL CHECK (granularity IN ('day', 'week', 'month')),

  PRIMARY KEY (user_id, measured_at, model_version, granularity)
);

-- TimescaleDB hypertable
SELECT create_hypertable(
  'taste_vectors',
  'measured_at',
  chunk_time_interval => INTERVAL '30 days',
  if_not_exists => TRUE
);

-- Continuous aggregate: monthly L3 means
CREATE MATERIALIZED VIEW taste_vectors_monthly
WITH (timescaledb.continuous) AS
SELECT
  user_id,
  time_bucket('1 month', measured_at) AS month,
  AVG(l3)                              AS l3_monthly_mean,
  AVG(l2)                              AS l2_monthly_mean
FROM taste_vectors
WHERE granularity = 'day'
GROUP BY user_id, month;

CREATE INDEX taste_vectors_user_recent
  ON taste_vectors (user_id, measured_at DESC);
```

### 갱신 주기

```
                                                                           
   매일 02:00 UTC                                                          
   - 어제 추가된 evidence가 있는 사용자의 L1 vector 갱신                    
   - EMA τ = 30d                                                            
                                                                           
   매주 일요일 03:00 UTC                                                    
   - 모든 사용자의 L2 vector 갱신 (지난 8주 L1 평균)                        
   - chapter boundary 감지 (delta > 0.18)                                  
                                                                           
   매월 1일 04:00 UTC                                                       
   - L3 vector 갱신 검사 (delta > 0.15 코사인 인 경우만)                    
   - L3 변화 시: Mirror 재생성, 사용자에게 조용한 이메일                    
                                                                           
   매월 1일 05:00 UTC                                                       
   - 90일 이상 된 daily L1 행을 monthly aggregate로 압축                    
   - raw daily 행 삭제                                                       
                                                                           
```

### 모델 버전 처리

```sql
-- 모델 업그레이드 후
INSERT INTO taste_vectors (user_id, measured_at, model_version, granularity, l1, l2, l3, ...)
SELECT user_id, measured_at, 'genome-v2', 'week', recompute(...)
FROM taste_vectors
WHERE model_version = 'genome-v1' AND granularity = 'week';

-- Old version remains for comparison. UI prefers latest.
```

---

## 7. Constellation — Currents

```sql
-- ============================================
-- currents
-- ============================================

CREATE TABLE currents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,             -- "옻칠한 황혼"
  name_en         TEXT,                       -- "Lacquered Dusk"

  centroid        VECTOR(64),
  strength        REAL NOT NULL CHECK (strength BETWEEN 0 AND 1),

  first_seen_at   TIMESTAMPTZ NOT NULL,
  last_touched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weeks_active    INTEGER NOT NULL DEFAULT 0,

  -- Generation provenance
  model_version   TEXT NOT NULL,
  prompt_hash     TEXT NOT NULL,             -- for cache invalidation

  retired_at      TIMESTAMPTZ
);

CREATE INDEX currents_user_active
  ON currents (user_id, last_touched_at DESC)
  WHERE retired_at IS NULL;

-- ============================================
-- current_evidence (membership table)
-- ============================================

CREATE TABLE current_evidence (
  current_id      UUID NOT NULL REFERENCES currents(id) ON DELETE CASCADE,
  evidence_id     UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  membership      REAL NOT NULL CHECK (membership BETWEEN 0 AND 1),
  is_representative BOOLEAN NOT NULL DEFAULT FALSE,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (current_id, evidence_id)
);

CREATE INDEX current_evidence_current ON current_evidence (current_id);
CREATE INDEX current_evidence_evidence ON current_evidence (evidence_id);
```

### Centroid 갱신

흐름이 새 evidence를 받으면:
1. centroid를 새 evidence의 manifold projection과 가중평균 (기존 weight `w`, 새 evidence weight `0.1`)
2. `weeks_active` 는 활성 주의 카운트 (강도가 0.5 이상이었던 주만)
3. `last_touched_at` 만 갱신

흐름 *은퇴* (`retired_at`):
- 강도가 12주 연속 0.3 미만일 때
- 또는 사용자가 명시적으로 reset 요청

---

## 8. Drift — Chapters, Turns, Echoes

```sql
-- ============================================
-- chapters (drift)
-- ============================================

CREATE TYPE chapter_granularity AS ENUM ('season', 'year', 'era');

CREATE TABLE chapters (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granularity       chapter_granularity NOT NULL,
  started_at        TIMESTAMPTZ NOT NULL,
  ended_at          TIMESTAMPTZ,                -- null = current

  name              TEXT NOT NULL,              -- "차가운 푸름 · 도시의 고독"
  l2_mean           VECTOR(14),
  l2_delta_from_prior VECTOR(14),

  -- Narrative (generated by Voice)
  opening_prose     TEXT,
  closing_observation TEXT,

  -- Atmosphere snapshot at chapter time
  dominant_hour_from  SMALLINT,
  dominant_hour_to    SMALLINT,
  dominant_palette_hexes TEXT[5],
  dominant_materials  TEXT[],
  dominant_pace_label TEXT,

  finalized_at      TIMESTAMPTZ,               -- non-null = immutable
  model_version     TEXT NOT NULL
);

CREATE UNIQUE INDEX chapters_user_current
  ON chapters (user_id)
  WHERE ended_at IS NULL;                       -- only one open chapter per user

CREATE INDEX chapters_user_started
  ON chapters (user_id, started_at DESC);

-- ============================================
-- turns (between chapters)
-- ============================================

CREATE TABLE turns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_chapter_id   UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  to_chapter_id     UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  magnitude         REAL NOT NULL,             -- cosine delta
  prose             TEXT NOT NULL,             -- "그러더니, 천천히, 빛이 돌아섰어요."
  model_version     TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX turns_user ON turns (user_id);
CREATE INDEX turns_from ON turns (from_chapter_id);
CREATE INDEX turns_to ON turns (to_chapter_id);

-- ============================================
-- echoes (recurring motifs across chapters)
-- ============================================

CREATE TABLE echoes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  motif             TEXT NOT NULL,             -- "단 하나의 창"
  frequency_prose   TEXT NOT NULL,             -- "2024년부터 줄곧"

  first_seen_at     TIMESTAMPTZ NOT NULL,
  last_seen_at      TIMESTAMPTZ NOT NULL,
  cohesion_score    REAL NOT NULL,
  span_chapters     INTEGER NOT NULL,          -- count of chapters this echo touches

  quieted_at        TIMESTAMPTZ,               -- when echo stopped recurring
  model_version     TEXT NOT NULL
);

CREATE INDEX echoes_user_active
  ON echoes (user_id, last_seen_at DESC)
  WHERE quieted_at IS NULL;

-- ============================================
-- echo_members (which evidence belongs to which echo)
-- ============================================

CREATE TABLE echo_members (
  echo_id           UUID NOT NULL REFERENCES echoes(id) ON DELETE CASCADE,
  evidence_id       UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  chapter_id        UUID REFERENCES chapters(id) ON DELETE SET NULL,
  PRIMARY KEY (echo_id, evidence_id)
);
```

### Chapters의 *immutability*

`finalized_at` 이 설정된 chapter는 *읽기 전용* 입니다. 모델이 업그레이드되어도 *과거 chapter의 prose는 다시 쓰지 않습니다* — 사용자가 명시적으로 요청하면 *새 prose를 새 컬럼에* 저장 가능 (e.g. `opening_prose_v2`). 기본 표시는 원본.

---

## 9. Voice — AI 생성 출력 저장

```sql
-- ============================================
-- narrative_outputs (cinematic reports)
-- ============================================

CREATE TYPE narrative_kind AS ENUM (
  'taste_name',     -- two-word phrase
  'portrait',       -- 250-400 word cinematic prose
  'mirror_line',    -- the keepsake sentence
  'chapter_prose',  -- chapter opening/closing
  'turn_prose',     -- between-chapter sentence
  'echo_prose',     -- echo motif description
  'weekly_email',   -- one-sentence email body
  'yearly_reflection' -- annual cinema
);

CREATE TABLE narrative_outputs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind            narrative_kind NOT NULL,

  body            TEXT NOT NULL,                -- the generated text
  body_en         TEXT,                          -- sibling English (optional)

  -- Provenance
  prompt_hash     TEXT NOT NULL,
  model_version   TEXT NOT NULL,                 -- e.g. 'claude-opus-4-7'
  input_hash      TEXT NOT NULL,                 -- hash of inputs (for idempotency)

  -- Validation
  flattery_audit_passed    BOOLEAN NOT NULL,
  falsifiability_passed    BOOLEAN NOT NULL,
  audit_notes              TEXT,                  -- if regenerated, why

  -- Lifecycle
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shown_to_user_at TIMESTAMPTZ,
  superseded_by   UUID REFERENCES narrative_outputs(id) ON DELETE SET NULL,
  archived_at     TIMESTAMPTZ
);

CREATE INDEX narrative_outputs_user_kind_recent
  ON narrative_outputs (user_id, kind, generated_at DESC)
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX narrative_outputs_idempotency
  ON narrative_outputs (user_id, kind, input_hash, model_version)
  WHERE archived_at IS NULL;

-- ============================================
-- mirror_records (the kept lines — sacred)
-- ============================================

CREATE TABLE mirror_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  narrative_id    UUID NOT NULL REFERENCES narrative_outputs(id),

  sentence        TEXT NOT NULL,
  set_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  still_true_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_at      TIMESTAMPTZ,

  -- Why this Mirror? Constitution snapshot at time of setting
  l3_at_set       VECTOR(6)
);

CREATE INDEX mirror_records_user_active
  ON mirror_records (user_id, set_at DESC)
  WHERE retired_at IS NULL;
```

### Idempotency

같은 입력 + 같은 모델 = 같은 출력 행 (재생성 비용 절약).

```sql
INSERT INTO narrative_outputs (user_id, kind, body, input_hash, model_version, ...)
VALUES (...)
ON CONFLICT (user_id, kind, input_hash, model_version) WHERE archived_at IS NULL
DO UPDATE SET shown_to_user_at = COALESCE(narrative_outputs.shown_to_user_at, NOW())
RETURNING *;
```

### 모델 업그레이드 시 prose 다시 쓰기

`drift.md` §12 의 약속: *과거의 prose는 보존*. 새 모델 출력은 `superseded_by` 로 *대체 관계만 기록*, 원본은 *archived* 가 아니라 *active*.

사용자가 "새 보이스로 다시 읽기" 명시적으로 요청 → 그때 새 행을 만들고 `shown_to_user_at` 을 새 행에 설정.

---

## 10. Atmosphere Graph

사용자 *내부* 관계 그래프 — 어떤 evidence들이 *함께 군집* 하고, *같은 팔레트를 공유* 하고, *시간적으로 가까운지*.

```sql
-- ============================================
-- atmosphere_edges (graph)
-- ============================================

CREATE TYPE edge_kind AS ENUM (
  'co_clustered',     -- 같은 미세 클러스터에 속함
  'shared_palette',   -- 색이 닮음 (cosine >= 0.85 in CIELAB)
  'shared_motif',     -- 같은 텍스트 모티프
  'temporal_adjacent',-- 7일 이내에 함께 저장됨
  'echo_member'       -- 같은 echo에 속함
);

CREATE TABLE atmosphere_edges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  from_evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  to_evidence_id   UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  kind             edge_kind NOT NULL,
  weight           REAL NOT NULL CHECK (weight BETWEEN 0 AND 1),

  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (from_evidence_id < to_evidence_id),  -- undirected, lexicographic
  UNIQUE (user_id, from_evidence_id, to_evidence_id, kind)
);

CREATE INDEX atmosphere_edges_user ON atmosphere_edges (user_id);
CREATE INDEX atmosphere_edges_from ON atmosphere_edges (from_evidence_id);
CREATE INDEX atmosphere_edges_to   ON atmosphere_edges (to_evidence_id);
CREATE INDEX atmosphere_edges_kind ON atmosphere_edges (user_id, kind);
```

### 그래프 쿼리 패턴

```sql
-- 한 evidence와 *닮은* 다른 evidence들 (다양한 관계 유형)
SELECT
  CASE WHEN from_evidence_id = $1 THEN to_evidence_id ELSE from_evidence_id END AS related_id,
  kind,
  weight
FROM atmosphere_edges
WHERE (from_evidence_id = $1 OR to_evidence_id = $1)
  AND user_id = $2
ORDER BY weight DESC
LIMIT 12;

-- 한 evidence의 *직접 + 1-hop 이웃* (그래프 확장)
WITH direct AS (
  SELECT to_evidence_id AS id FROM atmosphere_edges
  WHERE from_evidence_id = $1 AND user_id = $2
  UNION
  SELECT from_evidence_id AS id FROM atmosphere_edges
  WHERE to_evidence_id = $1 AND user_id = $2
)
SELECT DISTINCT id FROM direct
UNION
SELECT to_evidence_id FROM atmosphere_edges
WHERE from_evidence_id IN (SELECT id FROM direct) AND user_id = $2;
```

### Edge 가중치 갱신

매주 일요일 cron:
1. 새 evidence가 들어왔거나
2. 클러스터링이 재실행된 사용자
- → 그 사용자의 atmosphere_edges 를 부분 재계산

오래된 edges (90일 이상 stale) 는 자동 archived.

---

## 11. Sharing — Cards & Resonances

```sql
-- ============================================
-- cards (per sharing.md)
-- ============================================

CREATE TYPE card_kind AS ENUM (
  'mirror', 'threshold', 'genome',
  'atmosphere', 'current', 'palette',
  'kin', 'chapter'
);

CREATE TYPE card_visibility AS ENUM (
  'vault',     -- private
  'sealed',    -- sent to named recipient
  'unlisted',  -- anyone with link
  'open'       -- public at /handle/cards/...
);

CREATE TABLE cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind            card_kind NOT NULL,

  -- Content (denormalized snapshot at creation time)
  payload_jsonb   JSONB NOT NULL,             -- structure depends on kind
  inscription     TEXT,                       -- user-authored dedication line (≤ 90 chars)

  visibility      card_visibility NOT NULL DEFAULT 'vault',
  share_token     TEXT UNIQUE,                -- for unlisted URLs
  recipient_email TEXT,                       -- if sealed
  recipient_user_id UUID REFERENCES profiles(id),  -- if recipient is a user

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at         TIMESTAMPTZ,
  withdrawn_at    TIMESTAMPTZ
);

CREATE INDEX cards_user_recent
  ON cards (user_id, created_at DESC)
  WHERE withdrawn_at IS NULL;

CREATE INDEX cards_recipient
  ON cards (recipient_user_id)
  WHERE recipient_user_id IS NOT NULL AND withdrawn_at IS NULL;

CREATE UNIQUE INDEX cards_share_token
  ON cards (share_token)
  WHERE share_token IS NOT NULL AND withdrawn_at IS NULL;

-- ============================================
-- card_resonances (the only acknowledgments)
-- ============================================

CREATE TYPE resonance_kind AS ENUM (
  'dwell',       -- recipient viewed >= 30s
  'echo',        -- recipient sent a card back
  'reply'        -- recipient wrote one line
);

CREATE TABLE card_resonances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id         UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  card_owner_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind            resonance_kind NOT NULL,

  -- Echo: pointer to the card sent back
  echo_card_id    UUID REFERENCES cards(id),
  echo_from_user_id UUID REFERENCES profiles(id),

  -- Reply: the written line
  reply_text      TEXT,
  reply_from_user_id UUID REFERENCES profiles(id),

  -- Dwell: just the moment
  dwell_seconds   INTEGER,

  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (
    (kind = 'dwell' AND dwell_seconds IS NOT NULL) OR
    (kind = 'echo' AND echo_card_id IS NOT NULL) OR
    (kind = 'reply' AND reply_text IS NOT NULL)
  )
);

CREATE INDEX card_resonances_owner
  ON card_resonances (card_owner_id, occurred_at DESC);

CREATE INDEX card_resonances_card
  ON card_resonances (card_id);
```

### *Resonance는 카운트되지 않음*

`card_resonances` 테이블에 ROW가 추가될 수 있지만, **사용자에게는 카운트로 보여지지 않습니다**. UI는:
- *"이 분위기에 오래 머물렀어요"* — 단순 표시 (dwell row 1개라도, 100개라도 같은 표시)
- *"비슷한 감정의 결이 느껴졌어요"* — echo가 있다는 사실만
- *"답장이 와 있어요"* — reply 텍스트만

집계 함수 (`COUNT`, `AVG`) 는 *백엔드에서도 절대 사용 안 함* — 정책으로 둡니다.

---

## 12. Row-Level Security (RLS)

**RLS는 기본값.** 모든 테이블에 enabled.

```sql
-- ============================================
-- Enable RLS on every table
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_chips ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE taste_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE currents ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE echoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE echo_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE narrative_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirror_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE atmosphere_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_resonances ENABLE ROW LEVEL SECURITY;
```

### 표준 정책 — 자기 데이터만

```sql
-- Pattern applied to every owner-scoped table
CREATE POLICY "own_select" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Evidence (everyone with user_id column)
CREATE POLICY "own_select" ON evidence
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON evidence
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON evidence
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON evidence
  FOR DELETE USING (auth.uid() = user_id);

-- ... 같은 패턴이 image_readings, text_readings, ... 모든 user-owned 테이블에 적용
```

### 특수 정책 — Cards & Public Rooms

```sql
-- Cards: 카드 소유자는 모두, 수신자는 자기 받은 카드만
CREATE POLICY "card_owner" ON cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "card_recipient" ON cards
  FOR SELECT USING (
    auth.uid() = recipient_user_id AND visibility IN ('sealed', 'unlisted')
  );

CREATE POLICY "card_public" ON cards
  FOR SELECT USING (
    visibility = 'open'
    AND withdrawn_at IS NULL
    AND (SELECT visibility FROM room_settings WHERE user_id = cards.user_id) = 'open'
  );

CREATE POLICY "card_unlisted" ON cards
  FOR SELECT USING (
    visibility = 'unlisted'
    AND withdrawn_at IS NULL
    AND share_token IS NOT NULL
    -- App layer requires matching token in URL; RLS still requires authenticated session for this path
  );

-- Resonances: 카드 소유자만 자기 카드의 resonance 봄
CREATE POLICY "resonance_owner" ON card_resonances
  FOR SELECT USING (auth.uid() = card_owner_id);

-- 발신자만 자기가 보낸 echo/reply 봄
CREATE POLICY "resonance_self" ON card_resonances
  FOR SELECT USING (
    auth.uid() = reply_from_user_id OR auth.uid() = echo_from_user_id
  );
```

### Room — 공개 프로필

```sql
-- 공개 room은 누구나 봄 (단, listed_in_directory가 true여야 directory에 노출)
CREATE POLICY "room_open" ON room_settings
  FOR SELECT USING (
    visibility IN ('unlisted', 'open')
    AND closed_at IS NULL
  );

-- 사용자 자기 room
CREATE POLICY "room_own" ON room_settings
  FOR ALL USING (auth.uid() = user_id);
```

### Service role

서버 측 작업 (Voice 합성, 클러스터링) 은 `service_role` 키로 RLS를 우회. 단, 모든 service_role 작업은 *명시적으로 user_id를 SET LOCAL* 해야 audit log에 기록됨:

```sql
-- In edge function
SET LOCAL app.current_user = $1;  -- user being processed
-- ... do work
```

---

## 13. Storage Buckets & 미디어

### 버킷 구조

```
타입            버킷              경로                              크기
─────────────  ───────────────  ─────────────────────────────  ──────────
원본 이미지       evidence-raw     {user_id}/{evidence_id}.{ext}    최대 8MB
정규화 이미지     evidence-norm    {user_id}/{evidence_id}.webp     최대 1MB
썸네일          evidence-thumb   {user_id}/{evidence_id}.webp     최대 50KB
원본 오디오       evidence-audio   {user_id}/{evidence_id}.{ext}    최대 20MB
Genome 영상     genome-films     {user_id}/{film_id}.mp4         약 6-8MB
인쇄용 PDF       genome-print     {user_id}/{card_id}.pdf         약 200KB
```

### 버킷 RLS

```sql
-- evidence-raw: 사용자 본인만 (서버는 service_role)
CREATE POLICY "evidence_raw_owner" ON storage.objects
  FOR ALL USING (
    bucket_id = 'evidence-raw'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- evidence-norm: 자기 것 + service role
CREATE POLICY "evidence_norm_owner" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence-norm'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 같은 패턴이 thumb, audio, films, print에 적용
```

### 미디어 정규화 워크플로

1. 사용자가 업로드 → `evidence-raw` 에 즉시 저장
2. Edge function 트리거 → 정규화 작업 큐에 추가
3. Worker 가:
   - 이미지: sRGB 변환, 긴 변 ≤ 2048px, WebP 인코딩 (q=85) → `evidence-norm`
   - 썸네일: 긴 변 ≤ 480px, WebP (q=70) → `evidence-thumb`
   - 오디오: -14 LUFS 정규화, 16kHz/16bit 분석본 → 별도 버킷
4. `evidence.normalized_storage_key` 와 `evidence.thumbnail_storage_key` 갱신
5. 원본은 30일 후 삭제 (정규화본만 영구 보존, 사용자가 요청하면 원본은 다운로드 가능)

### EXIF 제거

이미지 업로드 직후 *즉시* EXIF 데이터 stripping:

```ts
// Edge function snippet
const sharp = require('sharp');
const cleaned = await sharp(buffer)
  .withMetadata({ exif: {}, icc: 'srgb' })  // strip all EXIF, keep sRGB only
  .toBuffer();
```

GPS, 카메라 모델, 촬영 시각 — 모두 제거. 정규화된 버전에만 sRGB ICC profile 만 유지.

---

## 14. 인덱스 & 성능

### 벡터 인덱스 전략

- **HNSW** (`hnsw`) — 정확도 우선, 사용자별 작은 컬렉션 (수백 ~ 수천 행)
- **IVFFLAT** (`ivfflat`) — 큰 컬렉션 (수만 ~ 수십만 행)

대부분의 Taste OS 벡터 검색은 *한 사용자 내부* 라서 HNSW가 더 좋습니다.

### 일반 인덱스

핵심 hot path:

```sql
-- 사용자의 최근 evidence
CREATE INDEX evidence_user_created_active
  ON evidence (user_id, created_at DESC)
  WHERE released_at IS NULL;

-- 사용자의 최신 taste_vector
CREATE INDEX taste_vectors_user_recent
  ON taste_vectors (user_id, measured_at DESC, granularity);

-- 사용자의 활성 currents
CREATE INDEX currents_user_active_strength
  ON currents (user_id, retired_at, strength DESC)
  WHERE retired_at IS NULL;
```

### 쿼리 성능 목표

| 쿼리 | 목표 p95 |
|---|---|
| 최근 50개 evidence 가져오기 | < 20ms |
| 한 사용자의 vector 시계열 (지난 1년 weekly) | < 50ms |
| Echo 후보 검색 (similarity scan) | < 200ms |
| 활성 currents 목록 + representative evidence | < 30ms |
| Card 한 장 + resonances | < 30ms |

---

## 15. 백업, 복구, 삭제

### 자동 백업

Supabase 기본 PITR (Point-in-Time Recovery) — 14일.
추가:
- 매일 03:00 UTC: full backup → off-site S3 (cross-region)
- 매주 일요일: schema dump → GitHub (private)

### 사용자 데이터 삭제

`drift.md` 와 `sharing.md` 의 약속을 따릅니다:

```sql
-- 1. 사용자 요청 → 즉시 'soft delete' 상태
UPDATE profiles
SET deletion_scheduled_at = NOW() + INTERVAL '30 days'
WHERE id = $1;

-- 2. 모든 카드의 visibility을 vault로 (외부 노출 즉시 차단)
UPDATE cards SET visibility = 'vault' WHERE user_id = $1;

-- 3. 30일 후, cron job:
DELETE FROM profiles
WHERE deletion_scheduled_at < NOW();
-- → CASCADE로 모든 관련 행 삭제
```

### 30일 grace 동안

- 로그인은 *되지만* 모든 surfaces가 *"30일 후 삭제 예정"* 줄 표시
- "취소" 버튼 한 번으로 grace 해제 (`deletion_scheduled_at = NULL`)

### 삭제 audit log

```sql
CREATE TABLE deletion_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_hash    TEXT NOT NULL,            -- 단방향 해시 (실제 ID 보존 안 함)
  scheduled_at    TIMESTAMPTZ NOT NULL,
  completed_at    TIMESTAMPTZ NOT NULL,
  evidence_count  INTEGER,
  reason          TEXT                       -- 'user_requested', 'inactive', 'tos_violation'
);
```

이게 유일한 *audit log* 입니다. 사용자 행동 로그가 *없는* 시스템에서 *삭제 행위* 만은 추적합니다 — 법적 컴플라이언스 때문에.

### Evidence 일부 삭제 vs Genome 보존

사용자가 원본 이미지/오디오를 삭제하고 싶다면:

```sql
-- 원본은 지우되, 임베딩과 reading은 유지
UPDATE evidence
SET storage_key = NULL,
    normalized_storage_key = NULL,
    thumbnail_storage_key = NULL
WHERE id = $1 AND user_id = auth.uid();

-- 동시에 storage bucket에서 실제 파일 삭제
DELETE FROM storage.objects
WHERE name LIKE auth.uid()::text || '/' || $1::text || '.%';
```

`image_readings` 행 (벡터 + 색채 메타) 는 *그대로 유지*. Genome은 손상 없이 계속 작동.

---

## 16. 마이그레이션 & 모델 버전 관리

### 마이그레이션 폴더 구조

```
supabase/migrations/
  20260519000000_initial_schema.sql
  20260601000000_add_atmosphere_chips.sql
  20260615000000_add_resonances.sql
  20260701000000_model_v2_embeddings.sql
  ...
```

### 모델 버전 컬럼

모든 ML 출력 테이블에 `model_version TEXT NOT NULL`. 어떤 모델로 만들어졌는지 항상 추적.

### 모델 업그레이드 절차

```
Phase 1 (Backfill)
  - 새 모델로 모든 evidence 재처리
  - 새 행 INSERT (기존 행은 그대로)
  - 새 *_readings 테이블 행 수가 2배가 됨 (구 + 신)

Phase 2 (Switch)
  - taste_vectors 새 모델 버전으로 재계산
  - currents, chapters 등 dependent objects 재생성
  - UI 가 새 model_version 의 행을 *기본 표시*

Phase 3 (Archive)
  - 30일 후, 구 model_version 행을 cold storage로 이동
  - profile에 "이전 보이스로 다시 듣기" 옵션 제공
```

### 사용자 동의

L3 vector나 Mirror line은 모델이 *바뀌었을 때* 사용자에게 *명시적으로* 물어보고 갱신:

> *"보이스가 다시 다듬어졌어요. 새 보이스로 Mirror를 다시 들어보시겠어요, 아니면 처음의 줄을 그대로 간직하시겠어요?"*

기본: *그대로 간직*. (per `drift.md` §12)

---

## 17. 용량 계획

### 한 사용자당 데이터

| 데이터 | 한 사람당 / 년 | 메모 |
|---|---|---|
| Evidence | ~500 행 | 평균 주 10 추가 |
| image_readings | ~200 행 (이미지 evidence만) | 768 + 128 vector |
| text_readings | ~150 행 | 1024 vector |
| audio_readings | ~50 행 | 512 vector |
| taste_vectors | ~52 행 (weekly) | 64 vector + confidence |
| currents | ~6 행 | 그 중 활성은 평균 3 |
| chapters | ~3 행 (season) 또는 1 (year) | 첫 1.5년은 season, 이후 year |
| echoes | ~5 행 | 평균 |
| narrative_outputs | ~20 행 | report, mirror, chapter prose |
| atmosphere_edges | ~2,000 행 | 평균 25 evidence × 약 80 edge |
| cards | ~5–20 행 | 사용자별 다양 |
| Storage | ~150MB | 정규화 이미지 + 썸네일 |

### 합산 사이즈

- 1,000 사용자 = ~5GB DB + ~150GB Storage
- 100,000 사용자 = ~500GB DB + ~15TB Storage
- 1,000,000 사용자 = ~5TB DB + ~150TB Storage

DB는 Postgres가 *충분히* 처리 (적절히 partitioned). Storage가 *주요 비용*.

### 비용 추정 (월간)

| 사용자 수 | DB (Supabase Pro) | Storage (S3) | Compute (인코딩) | Voice (Claude) | **합계 / 월** |
|---|---|---|---|---|---|
| 1,000 | $25 | $4 | $20 | $100 | **$150** |
| 100,000 | $1,200 | $400 | $2,000 | $10,000 | **$13,600** |
| 1,000,000 | $25,000 | $4,000 | $20,000 | $100,000 | **$150,000** |

100만 사용자에서 월 $150K — *광고 없이* 사용자당 $5/월로 $5M 매출. 마진 97%.

---

## 18. DB가 *저장하지 않는* 것들

마지막 확인 — *없는 것* 의 목록이 *있는 것* 만큼 중요합니다.

### 영구 거부

| 데이터 | 거부 이유 |
|---|---|
| **사용자 행동 이벤트** (click, view, dwell) | 추적 안 함. 사용자가 *간직한 결과* 만 저장. |
| **세션 정보** (session start/end, page navigation) | 세션은 *흔적* 을 남기지 않음 |
| **A/B 테스트 그룹** | A/B 테스트 자체가 *카피에는* 적용되지 않음 |
| **광고 식별자** (IDFA, GAID) | 외부 광고 시스템과 연결 안 됨 |
| **위치 데이터** (GPS, IP geo) | 사용자가 *어디 있는지* 알지 못함. IP는 보안 로그에만 (30일 후 삭제). |
| **얼굴 임베딩** | Aperture는 얼굴 인식 모델을 *사용 안 함* |
| **연락처** (이메일 주소록, 친구) | 가져오기 기능 *없음* |
| **OCR 텍스트** (스크린샷 글자) | 사용자가 *명시적으로* 인용으로 옮기지 않는 한 |
| **사용자가 *지나친* (passed) 카드/추천** | 부정 학습 *없음* |
| **다른 사용자와의 "유사도"** | 매칭 *없음*, 추천 *없음* |
| **알림 빈도 / 시간** | 알림은 주 1회 이메일 + 만남이 있을 때만 |

### 자주 요청받지만 거부

- "사용자가 어떤 화면을 가장 오래 봤어요" — 추적 안 함, 묻지 마세요
- "사용자가 어떤 시간에 자주 접속해요" — 알지 못함
- "사용자의 친구 추천" — 친구라는 개념이 없음
- "콘텐츠 트렌딩 점수" — 트렌딩 *순위* 자체가 없음

---

## 닫는 말

이 DB는 *기억* 의 기록보관소예요. 사용자가 자기 자신을 *조금씩 보여줄 때마다*, 그 증거가 *조용히 침전* 됩니다. 시간이 지나면서 정체성이 *결* 을 가져요. 그게 전부예요.

엔지니어가 이 스키마를 빌드할 때, 모든 결정의 최종 검사는 단 하나의 질문이어야 해요:

> ***이 컬럼이 *간직됨* 의 가능성을 높이는가? 아니면 *추적됨* 의 가능성을 높이는가?***

높이면 (간직됨 쪽) ship. 추적됨 쪽이면 *추가하지 않습니다*. 이게 Taste OS의 DB를 *기록보관소* 로 만드는 유일한 방법이에요.
