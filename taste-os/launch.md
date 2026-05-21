# Taste OS — Beta Launch
## 조용히 감정의 공간을 여는 일

> 스타트업 런칭이 아니다. 그로스 해킹이 아니다. 참여 최적화가 아니다.
> 이 문서는 지금까지 만든 모든 화면·시스템(`hero/`·`entry/`·`onboarding/`·`analysis/`·`report-reveal/`·`home/`·`daily/`·`evolution/`·`sharing/`·`memory/`·`narration/`·`sound/` + `memory-engine.md`·`ai-integration.md`·`backend.md`·`narration.md`·`motion-sound.md`)을 *조용한 베타* 로 세상에 여는 계획이다.

---

## 0. 런칭의 한 줄

> *"문을 크게 여는 게 아니라, 살짝 열어두고 — 들어온 사람이 *오래 머물고 싶게* 만든다."*

지표는 가입자 수가 아니라 *다시 돌아온 사람의 마음* 이다.

---

## 1. FIRST USER EXPERIENCE (첫 인상의 안무)

첫 방문자의 90초가 전부를 결정한다. 순서:

```
beta/ (초대/대기)  ──▶  hero/ 또는 entry/ (입장, ~12s 호흡)
   ──▶  onboarding/ (이미지·음악·인용·분위기·성찰, 각 화면 자기 호흡)
   ──▶  analysis/ (모이는 입자, ~42s cinematic)
   ──▶  report-reveal/ (당신 안에는 이런 분위기가...)   ← 첫 절정
   ──▶  home/ (조용한 방 — 돌아올 자리)
```

원칙:
- **첫 화면에 기능 설명 0개.** 설명 대신 *공기*.
- 스킵 가능하되 강요하지 않음 (온보딩 각 화면에 "이번엔 지나갈게요").
- 첫 Taste Report 는 *선물처럼* 도착 — 로딩이 아니라 의식(ritual).
- 첫 세션 끝에 사용자가 *자기 카드 하나* 를 손에 쥔다 (sharing/).

---

## 2. EMOTIONAL QA CHECKLIST (감정 QA)

기능 QA 가 아니라 *감정* QA. 각 항목은 "되는가" 가 아니라 "느껴지는가".

- [ ] **몰입**: 첫 30초에 "다른 AI 제품과 다르다" 가 느껴지는가
- [ ] **narration 톤**: 모든 문장이 `narration.md` 의 결인가 (번역체·자기계발·느낌표 0)
- [ ] **페이싱**: 어디서도 *서두른다* 는 느낌이 없는가 (200ms 미만 전환 없음)
- [ ] **분위기 연속성**: 화면 사이 색/공기가 *끊기지 않고 흐르는가*
- [ ] **모션 감정성**: 움직임이 *호흡* 인가, 애니메이션인가
- [ ] **메모리 일관성**: 온보딩에서 고른 것이 report/home 에 *결로* 이어지는가
- [ ] **침묵**: quiet space 가 *빈 곳* 이 아니라 *여백* 으로 느껴지는가
- [ ] **첫 리포트**: 다 읽고 났을 때 *눈가가 뜨끈* 한가 (report-reveal §9 검사)

QA 방식: *소리 내어 읽기* + *눈 감고 듣기(sound on)* + *모르는 사람에게 보여주고 첫 마디 관찰*.

---

## 3. MOBILE EXPERIENCE QA

- [ ] 스크롤이 *부드럽게 늦춰지는가* (reveal 이 스크롤 양이 아니라 도착으로 트리거)
- [ ] orb/dust 수 감소 후에도 *대기감* 이 유지되는가
- [ ] 터치엔 parallax/tilt off, 자동 drift 는 유지
- [ ] 분위기 색이 디바이스 간 동일 (sRGB, theme-color 메타)
- [ ] safe-area(노치) 대응, `viewport-fit=cover`
- [ ] 세로/가로 전환 시 레이아웃이 *깨지지 않고 흐르는가*
- [ ] 오디오: 모바일은 기본 off + 짧은 chime 위주 (저전력)

---

## 4. PERFORMANCE POLISH

| 항목 | 목표 | 방법 |
|------|------|------|
| 모션 부드러움 | 60fps | `transform`/`opacity`/`filter` 만 애니메이트 (리플로우 0) |
| GPU | 합성 레이어 | `will-change`, orb/grain `mix-blend` GPU 경로 |
| 입자 | 과부하 없음 | 화면 폭별 count, 모바일 축소 |
| streaming narration | 체감 지연 0 | SSE + 문장 단위 호흡(생성보다 표현이 느림) |
| 이미지 | LCP↓ | `next/image`, webp, blur placeholder, lazy |
| 폰트 | FOIT 방지 | `display=swap`, preconnect (이미 적용) |
| 메모리 전환 | 끊김 0 | WAAPI, RAF, 정리(teardown) |

목표 수치: LCP < 2.5s, CLS < 0.05, INP < 200ms — *단, 수치보다 체감 호흡이 우선*.

---

## 5. EMOTIONAL RETENTION (중독이 아니라 공명)

> **중독을 위해 최적화하지 않는다.** 알림 폭격·스트릭·배지·FOMO 전부 없음.

대신 *의미 있는 재방문* 을 위해 설계:

| 추적(사적) | 의미 |
|-----------|------|
| 재방문 *간격* | 강박이 아니라 *그리움* 의 리듬인가 |
| 간직한 narration | 어떤 문장이 마음에 남았는가 (스크린샷 포함) |
| 타임라인 재방문 | 자기 변화를 다시 보러 오는가 |
| 공유한 카드 | 어떤 결을 남에게 건넸는가 |
| home/ 머문 시간 | 머무름이 *평온* 인가 (스크롤 깊이 아님) |

핵심: 이 데이터는 *제품을 다정하게 만드는 데만* 쓰인다 (`backend.md` resonance_history — 좋아요 아님). 광고/랭킹/푸시 타깃 절대 금지.

**재방문을 부르는 장치 (조용한 것들):**
- `daily/` 의 매일 다른 공기 (강요 없이, 들어오면 거기 있음)
- nostalgic recall — "한동안 잊고 있던 결" 이 *조용히* 화면에 (push 아님)
- `evolution/` 의 계절 — 시간이 쌓일수록 깊어짐

---

## 6. PRIVATE BETA FLOW (조용한 초대)

```
beta/ (대기의 공기)
   ├─ 초대 코드 있음  → 문이 열린다 → entry/
   └─ 초대 코드 없음  → 자리를 맡아둠 (waitlist) → 조용한 확인
```

- **waitlist atmosphere**: 카운트다운·"X명 대기 중"·긴급성 *없음*. 그저 *조용한 약속*.
- **초대 메시지**: "준비되면, 가장 조용한 시간에 문을 열어둘게요." (마케팅 카피 아님)
- **초대는 소수씩**: 한 번에 수백 명이 아니라, *공기가 유지될 만큼만*.
- **온보딩 초대**: 가입이 아니라 *입장*. 익명으로 먼저 경험, 원할 때 이어붙임(`backend.md` 익명→영구 승격).

---

## 7. DEPLOYMENT ARCHITECTURE

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  Vercel       │     │  Supabase (prod)     │     │  OpenAI       │
│  Next.js App  │────▶│  Postgres + pgvector │     │  gpt-4.1/4o   │
│  (App Router) │     │  Auth (email/OAuth)  │     │  embeddings   │
│  Edge runtime │     │  Storage (private)   │     │  vision       │
└──────┬───────┘     │  Edge Functions      │────▶│              │
       │             │  (embed/narrate/...)  │     └──────────────┘
       │             └─────────────────────┘
       ▼
  View Transitions + Framer Motion + ./sound/ambient.js
```

**환경 관리:**
```
# Vercel (prod / preview 분리)
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY   # 클라이언트
# Supabase Edge Functions secrets (서버 전용)
OPENAI_API_KEY / SUPABASE_SERVICE_ROLE_KEY / MEMORY_ENCRYPTION_KEK
```

배포 단계:
1. `supabase db push` (migrations 0001–0007) + RLS 검증
2. `supabase functions deploy embed narrate analyze-image` + secrets 설정
3. Vercel: prod 도메인 + preview(브랜치) + ISR/edge 설정
4. OpenAI: 조직 *학습 옵트아웃*, rate limit, 비용 알림, `store:false` 확인
5. 스모크: 익명 입장 → 온보딩 → 분석 → 리포트 → home 전 경로 1회 통과
6. 롤백 플랜: Vercel 즉시 롤백, Supabase migration down 스크립트 준비

---

## 8. FEEDBACK SYSTEM (감정의 반응을 모은다)

설문이 아니라 *결의 흔적* 을 모은다:

- **감정 반응**: 리포트 끝 한 줄 — "지금 마음이 어떤가요" (자유 입력, 선택)
- **간직한 순간**: 어떤 narration 을 스크린샷/저장했는가 (이미지 export 빈도)
- **공명 피드백**: sharing/ 의 "조용한 결의 응답" 패턴
- **다시 본 것**: 가장 자주 돌아오는 화면/문장
- **모르는 사람 테스트**: 첫 마디 녹취 (정성)

수집 원칙: 모두 *익명·동의 기반·최소*. "별점" 없음. 숫자로 환원하지 않음.

```ts
// 가벼운, 동의 기반 반응 수집 (engagement 추적 아님)
async function collectReflection(text: string) {
  if (!text?.trim()) return;
  await supabase.from("beta_reflections")
    .insert({ user_id: (await getUser()).id, text, created_at: new Date() });
}
```

---

## 9. ATMOSPHERE CONSISTENCY CHECK (출시 직전 최종 통일성)

전 화면을 *한 호흡으로* 훑으며:

- [ ] 모든 화면이 같은 팔레트(night/coal/bone/mist/beige/rose/ember/silver-blue)
- [ ] 같은 폰트(Cormorant Garamond italic + Noto Serif KR + Inter)
- [ ] 같은 easing 3종, reveal blur 패턴 동일
- [ ] sigil(◜) 좌상단, grain, orbs, dust 모든 화면에 존재
- [ ] narration 톤이 전 화면 일관 (한 사람이 말하는 목소리)
- [ ] CTA 가 전부 `beacon` 형태 (────  라벨  ────)
- [ ] 화면 간 이동이 *끊기지 않고* 흐름 (daily↔evolution↔home↔sharing↔memory)
- [ ] 침묵(quiet space)이 모든 긴 화면에 최소 1회

---

## 10. SOFT LAUNCH PHILOSOPHY

런칭의 톤 자체가 제품이다:

- **calm**: 출시 트윗에 느낌표 없음. "조용히 열었습니다." 정도.
- **artistic**: 랜딩은 기능 목록이 아니라 *한 장면*.
- **intimate**: 대규모 PR 대신, 결이 맞는 사람에게 *손으로 건네듯*.
- **memorable**: 한 문장만 기억돼도 된다 — "당신은 계속 변하고 있습니다."
- **quietly different**: 트렌드 AI 미학(네온·glassmorphism·로봇 보이스)과 정반대.

---

## 11. 런칭 체크리스트 (요약)

- [ ] FUX 전 경로 호흡 검수 (§1)
- [ ] 감정 QA 통과 (§2) — 소리내어 읽기/눈감고 듣기/타인 테스트
- [ ] 모바일 QA (§3) + 성능 목표 (§4)
- [ ] retention = 공명 (§5), 중독 장치 0개 확인
- [ ] private beta flow + 초대 소수씩 (§6)
- [ ] 배포(Vercel/Supabase/edge/OpenAI) + 스모크 + 롤백 (§7)
- [ ] 피드백 = 결의 흔적, 익명·동의 (§8)
- [ ] 분위기 통일성 최종 (§9)
- [ ] soft launch 톤 (§10)

---

## 12. 마지막 검사

> "초대받은 사람이 첫날 밤 Taste OS 를 닫으면서 —
> *'내일 또 들어와봐야지'* 가 아니라 *'그 문장, 계속 생각나네'* 라고 느끼는가?
> 그리고 일주일 뒤, *알림 하나 없이* 스스로 다시 문을 여는가?"

그렇다면 이건 테크 제품의 런칭이 아니라 — *조용한 감정의 공간이 세상에 열린 것* 이다.
