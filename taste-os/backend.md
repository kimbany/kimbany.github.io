# Taste OS — Supabase Backend & Vector Memory
## 데이터 플랫폼이 아니라, 안전한 감정의 기억 공간

> 이 문서는 `memory-engine.md`(무엇을 기억하는가)와 `ai-integration.md`(어떻게 이해하고 말하는가)를
> **실제로 돌아가는 Supabase 인프라**로 구현한다. 복붙 가능한 마이그레이션 · RLS · 벡터 RPC · 서버 액션 · 엣지 함수.

---

## 0. 원칙

> *"모든 행(row)은 한 사람의 감정 조각이다. 기본값은 언제나 *비공개* 이고, 통제권은 언제나 *사용자* 에게 있다."*

- **Private by default**: 모든 테이블 RLS on. `auth.uid()` 외엔 한 줄도 못 본다.
- **Ownership**: 사용자가 자기 기억을 *내보내고, 놓아주고, 삭제* 할 수 있다.
- **Minimal exposure**: 원본은 사용자 소유 버킷. DB엔 임베딩 + 짧은 결만.
- **No engagement tables**: 클릭/세션/퍼널 추적 테이블은 *존재하지 않는다.*

---

## 1. 디렉터리 구조

```
supabase/
  migrations/
    0001_extensions.sql
    0002_profiles_auth.sql
    0003_memory_core.sql        # fragments, edges, clusters, snapshots, identity
    0004_narrations_timeline.sql
    0005_vector_rpc.sql         # 검색 함수
    0006_rls_policies.sql
    0007_storage.sql
  functions/
    embed/index.ts              # 엣지: OpenAI 임베딩
    narrate/index.ts            # 엣지: 스트리밍 narration
    analyze-image/index.ts      # 엣지: vision 분위기 해석
  config.toml

src/
  lib/supabase/
    server.ts                   # 서버 컴포넌트/액션 클라이언트
    client.ts                   # 브라우저 클라이언트
    admin.ts                    # service-role (엣지 전용)
  server/actions/
    memory.ts                   # ingest / release / list
    narrate.ts
    atmosphere.ts
  types/db.ts                   # supabase gen types
```

---

## 2. AUTHENTICATION

### 2.1 제공자

Supabase Auth — 감정적으로 *조용한* 진입:

- **Email** (magic link 우선 — 비밀번호 마찰 제거)
- **Google** OAuth
- **Apple** OAuth
- **Anonymous** 온보딩 세션 → 나중에 영구 계정으로 *승격(link)*

```toml
# supabase/config.toml (발췌)
[auth]
site_url = "https://tasteos.app"
additional_redirect_urls = ["https://tasteos.app/auth/callback"]

[auth.email]
enable_signup = true
enable_confirmations = true        # magic link

[auth.external.google]
enabled = true
[auth.external.apple]
enabled = true

# 익명 온보딩 — 로그인 없이 분위기를 먼저 경험
[auth]
enable_anonymous_sign_ins = true
```

### 2.2 익명 → 영구 계정 승격 (감정 연속성의 핵심)

익명으로 쌓은 기억이 *끊기지 않고* 계정에 이어진다. Supabase 는 동일 `user.id` 를 유지하므로 데이터 마이그레이션이 필요 없다.

```ts
// 익명 시작 (온보딩 첫 화면)
const { data } = await supabase.auth.signInAnonymously();

// 나중에 같은 user.id 를 유지한 채 영구 계정으로 승격
await supabase.auth.updateUser({ email });             // magic link
// 또는 OAuth 연결
await supabase.auth.linkIdentity({ provider: "google" });
```

> 사용자는 "가입" 을 강요받지 않는다. 분위기를 먼저 만나고, *원할 때* 자기를 이어붙인다. user.id 가 그대로라 모든 fragment/narration 이 자연히 따라온다.

### 2.3 프로필 (0002)

```sql
-- 0002_profiles_auth.sql
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_anonymous boolean default true,
  -- 동의 설정: 기본은 '묻기'에 가깝게 보수적
  consent      jsonb not null default
                 '{"remember_images":false,"remember_writing":false,
                   "use_ai_vision":false,"local_only":false}'::jsonb,
  locale       text default 'ko',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 신규 가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, is_anonymous)
  values (new.id, coalesce((new.raw_app_meta_data->>'provider') = 'anonymous', true));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

## 3. EMOTIONAL MEMORY CORE (0003)

`memory-engine.md` 스키마의 *최종 마이그레이션 형태*.

```sql
-- 0001_extensions.sql
create extension if not exists vector;
create extension if not exists "pgcrypto";

-- 0003_memory_core.sql ─────────────────────────────────

-- 3.1 기억의 원자 단위
create table public.memory_fragments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  modality      text not null
                  check (modality in ('image','quote','music','atmosphere','reflection','writing')),
  source_ref    text,                       -- storage object path (원본은 버킷)
  caption       text,                       -- 짧은 결 ("새벽의 빛")
  emotion_text  text,                       -- 임베딩에 들어간 감정 언어
  embedding     vector(1024),               -- null = local-only (서버에 좌표 없음)
  tone          text check (tone in ('warm','cool','mixed','neutral')),
  warmth        real check (warmth between 0 and 1),
  salience      real not null default 0.5,
  is_local_only boolean not null default false,
  created_at    timestamptz default now(),
  released_at   timestamptz                 -- 망각 권리
);

-- 3.2 멀티모달 메모리 그래프
create table public.memory_edges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  from_id    uuid not null references public.memory_fragments(id) on delete cascade,
  to_id      uuid not null references public.memory_fragments(id) on delete cascade,
  relation   text not null
               check (relation in ('resonates','echoes','contrasts','evolves_into','recurs_with')),
  weight     real not null default 0.5,
  updated_at timestamptz default now(),
  unique (from_id, to_id, relation)
);

-- 3.3 분위기 클러스터 (동적 진화)
create table public.emotional_clusters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  centroid     vector(1024) not null,
  theme_ko     text,                         -- "조용한 따뜻함"
  member_count int default 0,
  recurrence   real default 0,
  first_seen   timestamptz default now(),
  last_seen    timestamptz default now(),
  is_dormant   boolean default false
);

-- 3.4 분위기 진화 스냅샷 (주 단위)
create table public.atmosphere_snapshots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  period_start  date not null,
  centroid      vector(1024) not null,
  dominant_tone text,
  label_ko      text,
  warmth        real,
  dispersion    real,
  created_at    timestamptz default now(),
  unique (user_id, period_start)
);

-- 3.5 장기 정체성 (느린 EMA)
create table public.identity_memory (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  identity_vector vector(1024) not null,
  continuity      real,
  warmth_trend    real,
  updated_at      timestamptz default now()
);

-- ── 인덱스 ──
create index idx_frag_user_time on public.memory_fragments (user_id, created_at desc)
  where released_at is null;
create index idx_frag_embedding on public.memory_fragments
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index idx_cluster_embedding on public.emotional_clusters
  using ivfflat (centroid vector_cosine_ops) with (lists = 50);
create index idx_edges_user on public.memory_edges (user_id, relation, weight desc);
create index idx_snap_user on public.atmosphere_snapshots (user_id, period_start);
```

---

## 4. AI NARRATION & TIMELINE (0004)

```sql
-- 0004_narrations_timeline.sql ─────────────────────────

-- 4.1 AI narration 저장 (근거 추적 가능)
create table public.ai_narrations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  mode        text not null
                check (mode in ('resonant','nostalgic','evolving','contradictory','report')),
  text        text not null,                 -- "당신은 조용한 따뜻함 속에서..."
  evidence    uuid[] not null default '{}',  -- 근거 fragment/snapshot id
  surface     text,                          -- 'daily'|'home'|'evolution'|'report'
  created_at  timestamptz default now(),
  -- 같은 결의 narration 중복 방지 (조용한 반복 회피)
  dedup_key   text
);
create index idx_narr_user on public.ai_narrations (user_id, created_at desc);
create unique index idx_narr_dedup on public.ai_narrations (user_id, dedup_key)
  where dedup_key is not null;

-- 4.2 타임라인 이벤트 (분위기 변화의 기록)
create table public.timeline_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null
                check (kind in ('atmosphere_shift','warmth_change','theme_recur',
                                'theme_emerge','theme_dormant','season_marker')),
  label_ko    text,
  from_label  text,
  to_label    text,
  warmth      real,
  occurred_at timestamptz default now()
);
create index idx_timeline_user on public.timeline_events (user_id, occurred_at desc);

-- 4.3 감정 공명 이력 (좋아요가 아니라 '닿음'의 기록)
create table public.resonance_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  fragment_id uuid references public.memory_fragments(id) on delete cascade,
  kind        text check (kind in ('dwelt','returned','kept')),  -- 머묾/되돌아옴/간직
  created_at  timestamptz default now()
);
create index idx_reson_user on public.resonance_history (user_id, created_at desc);
```

> **추적하지 않는 것**: 클릭률, 세션 길이, 퍼널, 리텐션 코호트. `resonance_history` 는 *감정의 닿음* 만 기록하고, 그것은 salience 를 부드럽게 올리는 데만 쓰인다(랭킹/광고 아님).

---

## 5. VECTOR RETRIEVAL RPC (0005)

클라이언트는 임베딩을 던지고 *가장 가까운 결* 을 받는다. RLS 안에서 안전하게.

```sql
-- 0005_vector_rpc.sql ──────────────────────────────────

-- 5.1 감정 유사도 검색 (resonant recall)
create or replace function public.match_fragments(
  query_embedding vector(1024),
  match_count int default 8,
  similarity_threshold float default 0.7
)
returns table (id uuid, caption text, emotion_text text, tone text,
               warmth real, similarity float)
language sql stable security invoker          -- invoker = 호출자의 RLS 적용
as $$
  select f.id, f.caption, f.emotion_text, f.tone, f.warmth,
         1 - (f.embedding <=> query_embedding) as similarity
  from public.memory_fragments f
  where f.user_id = auth.uid()                 -- 자기 기억만
    and f.released_at is null
    and f.embedding is not null
    and 1 - (f.embedding <=> query_embedding) > similarity_threshold
  order by f.embedding <=> query_embedding
  limit match_count;
$$;

-- 5.2 휴면 테마 다시 떠올리기 (nostalgic recall)
create or replace function public.dormant_clusters(reawaken_days int default 21)
returns table (id uuid, theme_ko text, last_seen timestamptz, recurrence real)
language sql stable security invoker as $$
  select c.id, c.theme_ko, c.last_seen, c.recurrence
  from public.emotional_clusters c
  where c.user_id = auth.uid()
    and c.last_seen < now() - (reawaken_days || ' days')::interval
    and c.member_count >= 3                    -- 한때 의미 있던 결만
  order by c.recurrence desc, c.last_seen asc
  limit 5;
$$;

-- 5.3 가장 강한 대비쌍 (contradictory recall)
create or replace function public.strongest_contrast()
returns table (cool_theme text, warm_theme text, weight real)
language sql stable security invoker as $$
  select c1.theme_ko, c2.theme_ko, e.weight
  from public.memory_edges e
  join public.emotional_clusters c1 on false  -- (실제 구현: contrasts 엣지의 양끝 테마 join)
  join public.emotional_clusters c2 on false
  where e.user_id = auth.uid() and e.relation = 'contrasts'
  order by e.weight desc
  limit 1;
$$;

-- 5.4 진화 궤적 (evolving recall → evolution/ 의 계절)
create or replace function public.atmosphere_trajectory()
returns table (period_start date, label_ko text, warmth real, dominant_tone text)
language sql stable security invoker as $$
  select period_start, label_ko, warmth, dominant_tone
  from public.atmosphere_snapshots
  where user_id = auth.uid()
  order by period_start asc;
$$;
```

호출 예 (TS):

```ts
const { data } = await supabase.rpc("match_fragments", {
  query_embedding: queryVec,    // number[1024]
  match_count: 8,
  similarity_threshold: 0.72,
});
```

---

## 6. RLS — PRIVATE BY DEFAULT (0006)

```sql
-- 0006_rls_policies.sql ────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.memory_fragments    enable row level security;
alter table public.memory_edges        enable row level security;
alter table public.emotional_clusters  enable row level security;
alter table public.atmosphere_snapshots enable row level security;
alter table public.identity_memory     enable row level security;
alter table public.ai_narrations       enable row level security;
alter table public.timeline_events     enable row level security;
alter table public.resonance_history   enable row level security;

-- 공통 정책: 자기 행만 (SELECT/INSERT/UPDATE/DELETE)
-- 예시: memory_fragments (나머지 테이블도 동일 패턴)
create policy "own_select" on public.memory_fragments
  for select using (auth.uid() = user_id);
create policy "own_insert" on public.memory_fragments
  for insert with check (auth.uid() = user_id);
create policy "own_update" on public.memory_fragments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on public.memory_fragments
  for delete using (auth.uid() = user_id);

create policy "own_profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
```

> 무거운 쓰기(클러스터 재계산, 스냅샷)는 **service-role 키를 가진 엣지 함수** 가 수행하되, 항상 `user_id` 를 명시적으로 스코프한다. service-role 은 RLS 를 우회하므로 코드 레벨에서 두 번 검증.

---

## 7. STORAGE — 사용자 소유 원본 (0007)

```sql
-- 0007_storage.sql
insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)        -- 비공개 버킷
on conflict do nothing;

-- 사용자별 폴더만 접근: memories/{user_id}/...
create policy "own_objects_read" on storage.objects
  for select using (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "own_objects_write" on storage.objects
  for insert with check (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "own_objects_delete" on storage.objects
  for delete using (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

- 원본 이미지/스크린샷은 `memories/{userId}/{uuid}.webp` 에. 서명 URL(짧은 만료)로만 접근.
- **암호화**: at-rest 는 Supabase 기본 암호화. 추가로 민감 reflection 텍스트는 앱단에서 envelope 암호화 후 저장(사용자 단위 키).
- Vision 분석 후 원본은 *보관하지 않음* 옵션(consent) — `atmosphere_text` 만 남기고 객체 삭제.

---

## 8. 클라이언트 & 서버 액션 (Next.js App Router)

### 8.1 Supabase 클라이언트

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (xs) => xs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)),
    }}
  );
}
```

### 8.2 Ingest 서버 액션 (consent gate 내장)

```ts
// src/server/actions/memory.ts
"use server";
import { supabaseServer } from "@/lib/supabase/server";

export async function ingestMemory(input: {
  modality: "image" | "quote" | "music" | "atmosphere" | "reflection" | "writing";
  sourceRef?: string;        // storage path
  emotionText: string;       // 이미 감정 언어로 번역됨 (ai-integration §2)
  caption?: string;
  tone?: "warm" | "cool" | "mixed" | "neutral";
  warmth?: number;
}) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");

  // consent 확인
  const { data: profile } = await supabase
    .from("profiles").select("consent").eq("id", user.id).single();
  const consent = profile?.consent ?? {};
  const localOnly = !!consent.local_only;

  // 로컬 전용이면 임베딩을 서버에 두지 않는다
  let embedding: number[] | null = null;
  if (!localOnly) {
    embedding = await embedViaEdge(input.emotionText);   // 엣지 함수 호출 §9
  }

  const { data, error } = await supabase
    .from("memory_fragments")
    .insert({
      user_id: user.id,
      modality: input.modality,
      source_ref: input.sourceRef ?? null,
      emotion_text: input.emotionText,
      caption: input.caption ?? null,
      tone: input.tone ?? null,
      warmth: input.warmth ?? null,
      embedding,
      is_local_only: localOnly,
    })
    .select("id")
    .single();
  if (error) throw error;

  // 그래프/클러스터 증분 갱신은 백그라운드 큐로
  await enqueue("link_and_cluster", { fragmentId: data.id, userId: user.id });
  return data.id;
}

// 망각 권리
export async function releaseMemory(fragmentId: string) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  await supabase.from("memory_fragments")
    .update({ released_at: new Date().toISOString(), embedding: null })
    .eq("id", fragmentId).eq("user_id", user.id);
  await enqueue("recompute_identity", { userId: user.id });
}
```

---

## 9. EDGE FUNCTIONS

### 9.1 임베딩 (`functions/embed`)

```ts
// supabase/functions/embed/index.ts (Deno)
import OpenAI from "npm:openai";
const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req) => {
  const { text } = await req.json();
  const res = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text,
    dimensions: 1024,
  });
  return Response.json({ embedding: res.data[0].embedding });
});
```

### 9.2 스트리밍 narration (`functions/narrate`)

```ts
// supabase/functions/narrate/index.ts (Deno) — SSE
import OpenAI from "npm:openai";
const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req) => {
  const { mode, evidenceText } = await req.json();
  const stream = await openai.chat.completions.create({
    model: "gpt-4.1", temperature: 0.75, stream: true,
    messages: [
      { role: "system", content: NARRATION_SYSTEM_PROMPT },  // ai-integration §7
      { role: "user", content: evidenceText },
    ],
    store: false,
  });
  const body = new ReadableStream({
    async start(c) {
      const enc = new TextEncoder();
      for await (const ch of stream) {
        const t = ch.choices[0]?.delta?.content;
        if (t) c.enqueue(enc.encode(`data: ${JSON.stringify({ token: t })}\n\n`));
      }
      c.close();
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
});
```

> 엣지 함수만 `OPENAI_API_KEY` 와 service-role 을 안다. 브라우저엔 절대 노출되지 않는다.

---

## 10. RETRIEVAL PIPELINE (end-to-end)

```
화면 요청 (예: daily/)
  │
  ▼
server action: getDailyAtmosphere(userId)
  │  1) identity_memory 조회 → query vector
  │  2) rpc match_fragments(query, 8)         ← resonant recall
  │  3) atmosphere_trajectory() (warmth_trend)
  │  4) buildEvidence() → evidenceText
  ▼
edge: narrate(mode='resonant', evidenceText)  ← SSE 스트림
  │
  ▼
ai_narrations insert (dedup_key 로 중복 회피) + 화면에 토큰 스트리밍
```

```ts
// 향수 다시 떠올리기 (조용히, push 아님)
export async function nostalgicResurface() {
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("dormant_clusters", { reawaken_days: 21 });
  if (!data?.length) return null;          // 없으면 아무 일도 안 일어남
  return data[0];                          // "한동안 잊고 있던 새벽의 결"
}
```

---

## 11. 백그라운드 잡 (스케일)

| 잡 | 트리거 | 내용 |
|----|--------|------|
| `link_and_cluster` | fragment insert 후 | ANN top-k → edges 증분, 클러스터 배정 |
| `weekly_snapshot` | cron (주 1회/유저) | atmosphere_snapshots + timeline_events |
| `recompute_identity` | release/주간 | identity EMA, continuity, warmth_trend |
| `recluster` | cron (월) | HDBSCAN 재클러스터링, 휴면 표시 |

- 큐: Supabase `pg_cron` + `pgmq`(메시지 큐) 또는 외부(QStash). 실시간 경로엔 무거운 연산 없음.
- 벡터 검색은 ivfflat(수만 행). 그 이상은 사용자 샤딩 또는 전용 벡터 DB(Qdrant) 이전 경로 마련.

```sql
-- pg_cron 예: 매주 일요일 03:00 스냅샷 큐잉
select cron.schedule('weekly_snapshots', '0 3 * * 0', $$
  select pgmq.send('jobs', json_build_object('type','weekly_snapshot','user_id', id)::text)
  from public.profiles where is_anonymous = false;
$$);
```

---

## 12. 데이터 소유권 · 내보내기 · 삭제

```ts
// 전체 기억 내보내기 (투명한 거울)
export async function exportMyMemory() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const [frags, narr, snaps, timeline] = await Promise.all([
    supabase.from("memory_fragments").select("*").eq("user_id", user!.id),
    supabase.from("ai_narrations").select("*").eq("user_id", user!.id),
    supabase.from("atmosphere_snapshots").select("*").eq("user_id", user!.id),
    supabase.from("timeline_events").select("*").eq("user_id", user!.id),
  ]);
  return { fragments: frags.data, narrations: narr.data,
           snapshots: snaps.data, timeline: timeline.data };
}

// 계정 삭제 → on delete cascade 로 모든 감정 데이터 소멸 + 버킷 정리
```

GDPR/사용자 권리: export(이동권), release(개별 망각), delete(완전 삭제) 모두 제공. 삭제는 cascade + 버킷 객체 정리 잡.

---

## 13. 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # 엣지 함수 전용, 절대 클라이언트 금지
OPENAI_API_KEY=                   # 엣지 함수 전용
MEMORY_ENCRYPTION_KEK=            # envelope 암호화 키 (KMS 권장)
```

---

## 14. 마지막 검사

> "사용자가 '내 기억 전부 지워줘' 라고 했을 때 —
> *한 번의 동작* 으로, *흔적 없이*, *되묻지 않고* 사라지는가?
> 그리고 그 사실을 사용자가 *처음부터 알고 있어서, 안심하고 기억을 맡겼는가?*"

그렇다면 이건 데이터 플랫폼이 아니라 *안전한 감정의 기억 공간* 이다.
안전함은 암호화에서만 오지 않는다. *언제든 떠날 수 있다는 확신* 에서 온다.
