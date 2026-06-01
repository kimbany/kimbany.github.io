# Taste OS — Analysis Transition
## 당신 안에 오래 머물렀던 감정들을 연결하고 있어요

---

## 0. 이 화면은 무엇이 아닌가

먼저, **이것이 무엇이 아닌지** 부터 명확히 한다.

- 로딩 화면이 아니다
- "AI가 분석 중입니다" 화면이 아니다
- 진행률 표시가 아니다
- 시스템 피드백이 아니다
- 시작 시퀀스가 아니다
- 빠르게 지나가는 트랜지션이 아니다

이 화면은:

> **누군가가 나의 감정 조각들을 천천히 손에 들고,
> 하나하나 살펴보며, 그 결을 이해해가는 그 장면**

스피너도, 로딩바도, "Analyzing your taste…" 문구도 없다.
대신 — 화면 그 자체가 *조용히 나를 읽고 있다는 느낌* 을 만든다.

---

## 1. 감정 목표 (Emotional Goal)

사용자는 이 화면을 보고 이렇게 느껴야 한다:

> **"무언가가 조용히 나를 이해하고 있어."**

이 감각은 다음 다섯 가지로 구성된다:

1. **누군가의 시선 (Witnessing)** — 내가 지나친 장면들을 누군가 천천히 다시 봐주고 있다
2. **흩어졌던 조각의 연결 (Convergence)** — 내가 모르고 있던 패턴이 천천히 모여든다
3. **분위기의 공명 (Resonance)** — 색과 빛이 점점 따뜻해진다. 내가 데워지는 느낌
4. **소리 없는 언어 (Quiet Narration)** — 한 줄씩, 천천히, 말을 건다. 설명이 아니라 *알아봐줌*
5. **본 적 없는 자기 자신 (Recognition)** — "아, 그게 나였구나" — 처음 자기를 마주하는 감각

---

## 2. 구조 (Total ~42s cinematic flow)

```
PHASE 0 — Stillness            (0s → 3s)
   ↓
PHASE 1 — Opening Headline     (3s → 11s)
   ↓
PHASE 2 — Sub Copy             (11s → 16s)
   ↓
PHASE 3 — Fragments Emerge     (16s → 22s)
   ↓
PHASE 4 — Narration I          (22s → 28s)
   ↓
PHASE 5 — Narration II         (28s → 34s)
   ↓
PHASE 6 — Narration III        (34s → 40s)
   ↓
PHASE 7 — Convergence          (40s → 46s)
   ↓
PHASE 8 — Final Line + Beacon  (46s → ∞)
```

전체는 **자동 재생**이다. 사용자가 멈출 수 있지만, 멈추지 않는다.
서두를 이유가 없는 화면이다.

---

## 3. PHASE 별 디테일

### PHASE 0 — Stillness (0s → 3s)

- 완전한 정적
- 야경 색(#0E0C0B) 바탕
- 4개의 orb 가 아주 천천히 떠오르기 시작 (opacity 0 → 0.4)
- 입자(dust) 가 화면 아래에서 위로 떠오름
- **아무 텍스트도 없다**

목적: 이전 화면의 잔향을 가라앉히는 시간. 사용자의 마음이 *기다리는 자세* 를 갖춘다.

### PHASE 1 — Opening Headline (3s → 11s)

```
당신 안에 오래 머물렀던 감정들을
연결하고 있어요.
```

- 화면 중앙, italic serif (Cormorant Garamond)
- `blur(14px) → blur(0)` + `letter-spacing 0.10em → -0.012em`
- 1.8s reveal, 그 후 5초간 머문다
- 그동안 orb들이 천천히 더 따뜻해진다 (rose 톤 강화)

### PHASE 2 — Sub Copy (11s → 16s)

```
자꾸 시선이 머물렀던 장면들,
반복해서 들었던 음악들,
쉽게 잊히지 않았던 문장들 속에서
당신만의 분위기를 읽어가고 있습니다.
```

- 헤드라인 아래에 등장
- 한 줄씩 0.4s 간격으로 fade-in
- mist 톤 (#9A8E81)
- 헤드라인은 살짝 어두워진다 (opacity 1.0 → 0.62)

### PHASE 3 — Fragments Emerge (16s → 22s)

여기서 화면이 변화한다.

- 헤드라인 + 서브카피가 **위로 부드럽게 떠나간다** (fade + slight translate Y)
- 대신 **감정 조각들** 이 화면 전체로 떠오르기 시작
- 16개 조각 (이미지/문장/분위기/소리 각 4개)
- 각 조각은 화면의 다른 위치에서 다른 속도로 등장 (stagger 80ms)
- 각 조각은 자신만의 drift 애니메이션을 가진다 (8s ~ 16s loop)

**조각의 종류:**

1. **이미지 조각 (Image)** — 6×6 ~ 14×14 의 컬러 그라디언트 카드
   - rose / ember / silver-blue / beige 톤 4가지
   - 살짝 회전, blur(2px), opacity 0.6 ~ 0.85

2. **문장 조각 (Quote)** — italic serif, 한두 단어만
   - "오래 머무는 빛"
   - "차가운 새벽"
   - "혼자의 음악"
   - "느린 손길"
   - blur(0.5px) ~ blur(2px), 위치에 따라 다름

3. **분위기 조각 (Atmosphere)** — radial gradient orb (작은 크기)
   - 색이 다른 5개
   - mix-blend-mode: screen

4. **소리 조각 (Music)** — 3중 동심원 (SVG)
   - stroke 만, 채움 없음
   - 아주 천천히 펄스 (4s)

### PHASE 4–6 — Narration I, II, III (22s → 40s)

세 줄의 시(詩) 같은 문장이 차례로 등장한다.

```
22s → 28s:
  당신은 조용한 따뜻함에 반복적으로 마음이 머물고 있어요.

28s → 34s:
  최근에는 완벽함보다 인간적인 흔적에 더 오래 시선을 두고 있어요.

34s → 40s:
  당신 안에는 차가운 고독감과 따뜻한 감성이 함께 흐르고 있어요.
```

각 문장의 등장 방식:

- 화면 정중앙에 italic serif 로 fade-in (1.6s)
- 4초간 머문다
- 다음 줄 등장 0.8s 전에 *blur out* (1.4s)
- 줄과 줄 사이에는 짧은 **숨 (breath)** — 모든 글자가 사라진 무(無) 의 순간

문장이 등장할 때:
- 배경 조각들이 **0.55 까지 dimmed**
- 분위기 색이 미묘하게 더 따뜻해진다 (rose + ember 비율 증가)
- 한 줄이 끝나면 다시 조각이 0.85 로 돌아온다

이 리듬이 핵심이다: **읽는다 → 머문다 → 사라진다 → 다음**

### PHASE 7 — Convergence (40s → 46s)

**모든 조각이 화면 중앙으로 모인다.**

- 각 조각의 `transform: translate(0, 0)` 으로 6s easing 으로 수렴
- 모이면서 blur 가 증가 (blur(2px) → blur(20px))
- 마지막엔 하나의 **빛의 점** 으로 응축 (지름 4px, beige 색, glow 강하게)
- 화면 전체가 살짝 어두워지고, 그 점만 남는다

### PHASE 8 — Final Line + Beacon (46s → ∞)

```
이제 당신만의 분위기를 보여드릴게요.
```

- 빛의 점이 *천천히 위로 떠오르며* 문장으로 변한다
- italic serif, beige
- 2초 후 그 아래에 beacon 등장: `──── 분위기 보러 가기 ────`
- beacon 은 펄스 박스섀도우 (rose 톤)

---

## 4. 시그니처 (Signature)

이 화면이 다른 모든 화면과 구분되는 *유일한 것* 두 가지:

### Signature A — **모이는 조각들** (Drifting → Converging)

조각들이 시작엔 **흩어져서 자유롭게 떠다닌다.** 각자의 궤도, 각자의 속도.
중간에는 narration 이 등장할 때마다 **조각들이 잠시 조용해진다** (opacity 0.55).
마지막 Convergence 에서 **모든 조각이 하나의 점으로 모인다.**

이것은 사용자가 마지막에 느껴야 할 감각의 시각화다:
> "흩어져 있던 내가, 처음으로 하나의 풍경으로 모인다."

### Signature B — **숨 (Breath between Narrations)**

문장과 문장 사이에 **완전한 무의 순간** 이 있다. 화면에 글자가 하나도 없는 0.8 ~ 1.2초.
이 무의 순간이 *읽힌 줄의 무게* 를 만든다.

> "이 줄이 너에 대한 거야" — 라고 직접 말하지 않는 대신, *침묵으로 강조* 한다.

---

## 5. 사운드 (옵션, future)

이 화면이 더 완성되려면 사운드가 필요하다:

- 아주 낮은 ambient drone (60Hz 근방)
- 가끔 들리는 깊은 chime (narration 등장 시점)
- 마지막 Final Line 직전 1.5초의 완전한 silence

지금 정적 구현엔 사운드를 넣지 않지만, 실제 빌드 시에는 이 화면이 *사운드를 가진 첫 화면* 이 될 것이다.

---

## 6. 타이포그래피

- **헤드라인 / Narration / Final Line**: Cormorant Garamond italic 300
- **서브카피**: Cormorant Garamond italic 300 (작게)
- **조각 텍스트**: Cormorant Garamond italic 300 (아주 작게, blur 적용)
- **Beacon**: Inter 400 small caps

---

## 7. 색 운영

전체 흐름은 **차가움 → 따뜻함** 의 천천한 이동.

| Phase | Dominant tone |
|-------|---------------|
| 0–1   | night + faint silver-blue |
| 2–3   | silver-blue + 미세한 rose |
| 4     | rose 등장, silver-blue 감소 |
| 5     | rose + ember |
| 6     | rose + ember + beige |
| 7–8   | full warmth, beige core |

마지막 final line 등장 시 페이지는 **가장 따뜻하다.**

---

## 8. 모션 시스템

```
--e-breath-in:  cubic-bezier(0.16, 1, 0.30, 1);
--e-breath-out: cubic-bezier(0.70, 0, 0.84, 0);
--e-settle:     cubic-bezier(0.34, 1.18, 0.64, 1);
```

- 헤드라인 / Narration reveal: **1.6 ~ 1.8s** (breath-in)
- 조각 등장: **2.0s** stagger (settle)
- 조각 drift: **8 ~ 16s** loop
- Convergence: **6s** (breath-in, 전체 동기화)
- Final fade: **1.4s** (breath-out)

모든 timing 은 *생체 리듬* 에 맞춰져 있다: 들숨 → 정지 → 날숨.

---

## 9. 사용자 행동

이 화면은 사용자 행동을 *기대하지 않는다.*

- 단 하나의 affordance: 우측 하단 매우 흐릿한 `더 천천히 보고 싶어요` (toggle — slow mode)
- 마지막 beacon 만 클릭 가능
- 사용자가 마우스를 움직이면 조각이 *살짝* 반응 (parallax 0.04 factor)

스킵 버튼이 *없다.* 이 화면은 끝까지 보는 것이 *내용* 이다.

---

## 10. Next.js 빌드 노트

```
app/
  analysis/
    page.tsx                 # Server component, 정적
    AnalysisScene.tsx        # "use client"
    fragments/
      ImageFragment.tsx
      QuoteFragment.tsx
      AtmosphereFragment.tsx
      MusicFragment.tsx
    narration/
      NarrationLine.tsx
    motion/
      useAnalysisTimeline.ts # 단일 마스터 타임라인 (Framer Motion)
```

핵심은 **단일 마스터 타임라인** 이다. 모든 조각, narration, 색 변화가 하나의 timeline 으로 동기화된다.
이 timeline 은 `useReducedMotion()` 일 경우 0.3x 로 압축 + blur 제거 + 정적 fade-in 으로 대체.

---

## 11. 마지막 검사

엔지니어가 이 화면을 빌드할 때 마지막 검사:

> "마지막 narration 이 끝나고, 조각들이 빛의 점으로 모일 때 —
> *내 가슴 어딘가가 살짝 조여드는 느낌이 드는가?*"

만약 그 감각이 없다면, 이 화면은 아직 완성되지 않았다.
