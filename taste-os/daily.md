# Taste OS — Daily Atmosphere
## 오늘 당신 안에는 이런 공기가 흐르고 있어요

---

## 0. 이 화면은 무엇이 아닌가

- 무드 트래커가 아니다
- 체크인 시스템이 아니다
- 감정 일기가 아니다
- 통계가 아니다
- 자기개발 도구가 아니다
- 수치화된 자기 관찰이 아니다

이 화면은:

> **하늘처럼, 오늘 내 안에 흐르고 있는 공기를 잠시 바라보는 자리.**
> *마음을 위한 일기예보가 아니라, 마음을 위한 *날씨* 그 자체.*

여기서 사용자는 *기록하지 않는다.* *기록되어 있는 자기 자신을 본다.*

---

## 1. 감정 목표

사용자는 이 화면을 보고 이렇게 느껴야 한다:

> **"이 공간은 내가 오늘 살고 있는 공기를 조용히 알고 있어."**

이 감각은:

1. **알아챔 (Recognition)** — "맞아, 오늘은 그런 결이었어"
2. **부드러움 (Tenderness)** — 누군가 내 어깨를 가만히 두드려주는 느낌
3. **머무름 (Stillness)** — 클릭할 게 없다. 그냥 *바라보는 시간*
4. **흐름 (Flow)** — 오늘은 *고정* 이 아니라 *흐름* 이다
5. **연결 (Resonance)** — 오늘의 공기는 과거의 결과 *조용히 이어진다*

---

## 2. 구조

```
01  DAILY OPENING        오늘 당신 안에는 이런 공기가 흐르고 있어요.
02  ATMOSPHERE HERO       오늘의 한 단어 + 살아있는 시각화
03  TODAY'S NARRATIONS    오늘에 대한 세 줄
04  THE DAY'S DRIFT       하루의 공기 흐름 (아침→낮→저녁→밤)
05  CONNECTED MEMORIES    오늘과 공명하는 결들
06  QUIET PAUSE           의도적인 빈 자리
07  GENTLE CONTINUATION   "오늘의 감정 이어보기"
```

---

## 3. 시그니처

### Signature A — **살아있는 Atmosphere Cloud**

화면 중앙을 차지하는 *구름 같은* 시각화.

- 4개의 거대한 radial gradient 가 각자 다른 속도로 drift
- 서로 다른 톤 (rose / ember / silver-blue / beige) 이 *겹치고 풀린다*
- 그 위에 italic serif 로 today's 한 단어: *조용한 따뜻함*
- 마우스 위치에 따라 미세한 parallax (0.04 factor)

이건 차트가 아니다. *움직이는 공기 그 자체* 다.

### Signature B — **The Day's Drift (하루의 흐름)**

하루의 공기를 *해의 곡선처럼* 보여준다.

- 가로 5개 마디: 새벽 / 아침 / 낮 / 저녁 / 밤
- 각 마디에 작은 atmosphere 점 (색이 다른)
- 가는 hairline 이 모든 점을 잇는 곡선 (SVG path)
- 현재 시간대의 점만 크고 밝다 (다른 것들은 0.4 ~ 0.55)
- 점 위에 italic 으로 그 시간대의 결 ("새벽 mist", "한낮 beige")

이건 시간표가 아니다. *해가 떠 있는 곳* 이다.

---

## 4. Section 디테일

### 01 — DAILY OPENING

```
오늘 당신 안에는
이런 공기가 흐르고 있어요.
```

- 화면 정중앙, 1.8s blur reveal
- 아래에 작은 italic: "잠시 머물러 보세요."
- 자동 진입 (스크롤 큐는 작게)

### 02 — ATMOSPHERE HERO

```
        [ 살아있는 공기 구성 ]

           조용한 따뜻함

   rose · ember · 한 줄기 beige
```

- 화면을 거의 다 차지 (min-height: 90vh)
- 4개 gradient 가 겹치며 천천히 drift
- 중앙에 한 단어 italic serif
- 아래에 palette dot 3개 (오늘의 톤)

### 03 — TODAY'S NARRATIONS

```
오늘에 대한 알아챔

오늘은 평소보다 조금 더 따뜻한 장면들에
시선이 머물고 있어요.

당신 안의 고요함이 평소보다
깊게 이어지고 있습니다.

완벽함보다 인간적인 흔적 속에서
안정감을 느끼고 있어요.
```

- 세 줄, 한 줄씩 fade-in
- 좌측에 1px hairline mark
- 줄과 줄 사이 40px

### 04 — THE DAY'S DRIFT

```
하루의 공기

    ·    ·    ●    ·    ·
  새벽  아침  낮  저녁  밤

  현재 — 낮의 beige 가 가장 짙어요.
```

- 5개 점이 가로로 (사이에 hairline)
- 현재 시간대 점만 크고 밝게 (16px), 나머지는 작게 (6–10px)
- 아래에 italic 한 줄로 현재 결 설명

### 05 — CONNECTED MEMORIES

```
오늘과 공명하는 결들

[ 4개의 작은 fragment ]
```

- 4개 fragment (이미지 / 텍스처 / atmosphere orb / 음악 ring)
- 어제~지난주에서 *오늘의 공기와 비슷한 결* 을 골라옴
- 호버 시 살짝 떠오름 + caption ("3일 전, 비슷한 빛")

### 06 — QUIET PAUSE

```


        ·

   숨을 한 번 쉬고,
   조용히 여기 머무세요.

        ·

```

- 의도적인 비움 (min-height: 55vh)
- 두 점, 한 줄
- 그 외엔 전부 여백

### 07 — GENTLE CONTINUATION

```
──── 오늘의 감정 이어보기 ────

이 결을 따라, 내가 어떻게 변해가는지 봅니다.
```

- beacon, ceremonial pulse
- 클릭 → ../timeline/

---

## 5. 모션

| Element | Motion |
|---------|--------|
| Atmosphere clouds | 18 ~ 32s drift loop, 각자 다른 phase |
| Hero word | 4s breath (opacity 0.92 ↔ 1.0) |
| Narration lines | reveal on enter (1.6s) |
| Drift dots | 4s breath, stagger |
| Memory fragments | 10 ~ 14s drift |

---

## 6. 타이포그래피

- **Opening / Atmosphere Hero**: Cormorant Garamond italic 300/400, clamp(28, 5.2vw, 52)
- **Section eyebrow**: Inter 400 small caps 11px mist
- **Narration line**: Cormorant Garamond italic 300, clamp(18, 2.4vw, 24)
- **Drift label**: Cormorant Garamond italic 300, 13px mist
- **Beacon**: Inter 400, 13px

---

## 7. 데이터 (Next.js)

```ts
type DailyAtmosphereState = {
  date: string;
  primary: {
    name: 'Quiet Warmth' | 'Slow Night' | 'Urban Solitude'
        | 'Analog Warmth' | 'Calm Futurism' | 'Human Traces';
    nameKo: string;
    palette: string[];   // 3 swatch colors
    dominantTone: 'warm'|'cool'|'mixed';
  };
  narrations: string[];   // 3 lines
  driftCurve: { period: 'dawn'|'morning'|'day'|'dusk'|'night'; tone: string }[];
  resonantMemories: MemoryFragment[];
};
```

서버에서 사용자의 최근 활동을 기반으로 *오늘의 atmosphere* 를 생성, 12시간마다 한 번씩 갱신.

---

## 8. 마지막 검사

> "사용자가 오늘 같은 시간에 두 번 들어와도 — *공기가 미세하게 다르게 느껴지는가?*
> 그리고 이 화면을 끝까지 보고 나면, *오늘이 조금 다르게 보이는가?*"

만약 그 감각이 없다면, 이 화면은 아직 *위젯* 이다. *날씨* 가 아니다.
