# Taste OS — Identity Home
## 조용한 감정의 방으로 돌아오기

---

## 0. 이 화면은 무엇이 아닌가

- 대시보드가 아니다 (전통적 의미의)
- 분석 인터페이스가 아니다
- 생산성 도구가 아니다
- 카드 그리드가 아니다
- SaaS 홈이 아니다

이 화면은:

> **자기 자신을 위한 작은 방.
> 들어서면 공기가 익숙하고, 가구 하나하나가 자신을 기억하는 공간.**

이 방은 *데이터를 보여주지 않는다.* *공기를 보여준다.*

---

## 1. 감정 목표 (Emotional Goal)

사용자는 이 방에 들어올 때마다 이렇게 느껴야 한다:

> **"이 공간은 내가 어떻게 변해가고 있는지를 조용히 알고 있어."**

이 감각은 다섯 가지로 구성된다:

1. **알아봐줌 (Being Known)** — 처음 보는 화면이 아니다. *나를 알아본다.*
2. **돌아옴 (Returning)** — 떠난 사람이 다시 찾는 익숙한 자리
3. **느린 변화 (Slow Drift)** — 어제와 오늘이 미세하게 다른 공기
4. **머무름 (Stillness)** — 클릭할 게 많지 않다. 머무르는 것 자체가 *내용*
5. **이어짐 (Continuity)** — 과거의 나 → 지금의 나 → 다음의 나

---

## 2. 구조

```
01  ATMOSPHERE ORB         거대한 살아있는 분위기 구
02  DAILY ATMOSPHERE       오늘의 결 (한 줄)
03  VISUAL MEMORY SPACE    떠다니는 감정의 조각들
04  EMOTIONAL REFLECTIONS  세 줄의 잔잔한 narration
05  EVOLUTION PREVIEW      과거의 분위기들 (점의 행렬)
06  QUIET SPACE            의도적인 빈 자리
07  SOFT CONTINUATION      "나의 변화 이어보기"
```

각 section 은 자기 호흡을 가진다. 다음 section 으로 가는 것은 *재촉이 아니라 초대* 다.

---

## 3. 시그니처 (Signature)

### Signature A — **시간을 아는 공기 (Time-aware Air)**

페이지는 사용자가 들어온 시간을 안다:

| 시간 | Tier | Atmosphere |
|------|------|------------|
| 05–10시 | `time-dawn` | silver-blue + 옅은 rose (새벽 빛) |
| 10–17시 | `time-day` | beige + 부드러운 warmth (낮의 빛) |
| 17–21시 | `time-dusk` | ember + rose (해질녘) |
| 21–05시 | `time-night` | deep rose + 깊은 어둠 |

같은 사용자가 다른 시간에 들어오면, *같은 방이지만 다른 공기* 다.

### Signature B — **살아있는 Atmosphere Orb**

페이지 상단을 지배하는 **하나의 거대한 호흡하는 구.**

- 지름 280px (모바일 220px)
- radial gradient: 현재 atmosphere 의 톤
- 4초 호흡 (opacity 0.78 ↔ 1.0, scale 1.0 ↔ 1.04)
- 안에 italic serif 로 현재 Genome word: *Quiet Warmth*
- 마우스를 올리면 살짝 더 밝아진다 (호버 = 공명)

이건 데이터가 아니다. *살아있는 무언가* 다.

---

## 4. Section 디테일

### 01 — ATMOSPHERE ORB (Hero)

```
        ◯ ← Atmosphere Orb (breathing)
       Quiet Warmth
   조용한 따뜻함 속에서 머무르고 있어요

   ──── 어제 22:14에 다녀가셨어요
```

- 화면 상단 hero (min-height: 90vh)
- Orb 가 중앙, 위 / 아래에 작은 italic 텍스트
- 가장 아래에 *마지막 방문 시간* (mist, 매우 작게)

### 02 — DAILY ATMOSPHERE

```
오늘의 결

오늘은 조용한 따뜻함이
오래 머무르고 있어요.

──

최근 당신은 차가운 고독감보다
인간적인 온기에 더 끌리고 있어요.
```

- 두 단락, 사이에 hairline 한 줄
- italic serif, mist 와 beige 가 교대
- *변하는 텍스트* — 시간/요일에 따라 다른 결의 narration

### 03 — VISUAL MEMORY SPACE

```
당신이 머물렀던 결들

[ 작은 그라디언트 카드들이 살짝 떠다님 ]
```

- 한 영역 (480px height) 안에서 8–12개 *memory fragment* 가 천천히 drift
- 각 fragment 는 작은 카드 (이미지 색감 / 텍스처 / 빛의 조각)
- 호버하면 살짝 떠오름 + 옆에 작은 italic 캡션 ("새벽의 결", "그날의 빛")
- 클릭 시 *visual echo* — 그 fragment 가 잠시 페이지 전체로 fade-in (1.6s)
- 이건 갤러리가 아니다. **떠다니는 기억** 이다.

### 04 — EMOTIONAL REFLECTIONS

```
조용한 알아챔

당신은 완벽함보다 인간적인 흔적 속에서
더 깊은 안정감을 느끼고 있어요.

예전보다 조금 더 따뜻한 공기를
오래 바라보고 있습니다.

이번 주의 당신은
조금 더 자기 자신에 머무르고 있어요.
```

- 세 줄의 narration, 한 줄씩 fade-in
- 좌측에 1px hairline (각 줄마다)
- 줄과 줄 사이 충분한 공백 (40px)

### 05 — ATMOSPHERE EVOLUTION PREVIEW

```
당신의 분위기는 이렇게 흘러왔어요

   ·    ·    ◯    ◯    ●
 4주전 3주전 2주전 지난주 이번주

silver-blue → rose → ember → ember+beige → rose+ember
```

- 가로 5개의 작은 atmosphere orb (이전 → 현재, 오른쪽이 가장 큰 = 지금)
- 각 orb 의 색이 그 주의 dominant tone
- 아래에 작은 italic 텍스트 (mist) 로 시점
- 차트가 아니다. *시간의 분위기 산책* 이다.

### 06 — QUIET SPACE

```


            ·

         잠시,
   여기서 멈춰가세요.

            ·


```

- 의도적인 빈 section (min-height: 60vh)
- 화면 정중앙에 가는 점 하나, 그 아래 italic 한 줄
- 위아래에 *완전한 여백*
- 이게 "콘텐츠가 없는 것" 처럼 보이지만, *이게 콘텐츠* 다.

### 07 — SOFT CONTINUATION

```
──── 나의 변화 이어보기 ────

그동안 흘러온 결을 따라가 볼게요.
```

- beacon, ceremonial pulse
- 아래에 작은 italic 한 줄

---

## 5. 모션 시스템

| Element | Motion |
|---------|--------|
| Atmosphere Orb | 4s breath (opacity + scale) |
| Memory fragments | 8–14s drift loop, parallax 0.04 factor |
| Reflection lines | reveal on enter (1.6s breath-in) |
| Evolution dots | breath at 4–6s with stagger |
| Section reveals | IntersectionObserver, blur-to-clear |

전체적으로 *느림이 미덕* 이다. 사용자가 빨리 스크롤해도, 페이지는 자기 속도를 지킨다.

---

## 6. 타이포그래피

- **Genome word (Hero)**: Cormorant Garamond italic 400, clamp(28, 4vw, 38)
- **Section eyebrow**: Inter 400 small caps, 11px, mist 0.78
- **Daily / Reflection lines**: Cormorant Garamond italic 300, clamp(22, 3vw, 28)
- **Quiet space line**: Cormorant Garamond italic 300, clamp(18, 2.4vw, 22)
- **Beacon**: Inter 400, 13px

---

## 7. 데이터 (Next.js 빌드)

```ts
type HomeState = {
  user: { lastVisitAt: Date };
  currentAtmosphere: {
    genome: 'Quiet Warmth' | 'Urban Nostalgia' | 'Emotional Minimalism' | 'Warm Futurism';
    translationKo: string;
    dominantTone: 'warm' | 'cool' | 'mixed';
    paletteId: string;
  };
  dailyAtmosphere: { primaryLine: string; secondaryLine: string };
  memoryFragments: Fragment[];
  reflections: string[];
  evolution: { weekOffset: number; tone: string; paletteId: string }[];
};
```

`getServerTimeOfDay()` 가 페이지 진입 시 시간대를 판별, body 에 `time-*` 클래스를 부여.

---

## 8. 컴포넌트 구조

```
app/home/
  page.tsx
  HomeScene.tsx                # "use client"
  sections/
    AtmosphereHero.tsx
    DailyAtmosphere.tsx
    VisualMemorySpace.tsx
    EmotionalReflections.tsx
    EvolutionPreview.tsx
    QuietSpace.tsx
    SoftContinuation.tsx
  components/
    AtmosphereOrb.tsx          # the breathing centerpiece
    MemoryFragment.tsx
    EvolutionDot.tsx
  motion/
    useTimeOfDay.ts            # → 'dawn'|'day'|'dusk'|'night'
    useFragmentDrift.ts
```

---

## 9. 마지막 검사

엔지니어가 이 화면을 빌드할 때 마지막 검사:

> "사용자가 매일 같은 시간에 이 화면을 열어도 — *조금씩 다른 공기* 가 느껴지는가?
> 그리고 **클릭할 게 거의 없는데도** 거기 머무르고 싶은가?"

만약 그 두 가지 감각이 없다면, 이 화면은 아직 *대시보드* 다. 아직 *방* 이 아니다.
