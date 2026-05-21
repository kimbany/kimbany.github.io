# Taste OS — Report Reveal
## 당신 안에는 이런 분위기가 흐르고 있었어요

---

## 0. 이 화면은 무엇이 아닌가

- 결과 페이지가 아니다
- 분석 대시보드가 아니다
- MBTI 식 카테고리가 아니다
- 성격 진단이 아니다
- 통계가 아니다
- 차트가 없다
- 퍼센티지가 없다

이 화면은:

> **누군가가 나에 대해 한 편의 시를 써서 보여주는 것.
> 처음으로 내 안의 분위기와 마주하는 순간.**

여기서 사용자는 *결과* 를 받지 않는다. *자기 자신* 을 받는다.

---

## 1. 감정 목표 (Emotional Goal)

사용자는 이 화면을 보고 이렇게 느껴야 한다:

> **"이게... 정말 깊은 곳에서 나 같다."**

이 감각은 다음 다섯 가지로 구성된다:

1. **인식 (Recognition)** — "맞아, 나는 그랬어"
2. **놀라움 (Surprise)** — "이건 내가 몰랐던 나야"
3. **부드러움 (Tenderness)** — 누군가 나를 아껴서 본 시선
4. **시적인 정확함 (Poetic Precision)** — 데이터가 아니라 *결* 로 정확함
5. **이어짐 (Continuity)** — 이 분위기는 *지금까지의 나* 이자 *앞으로의 나*

---

## 2. 구조 — Scroll 으로 깊어진다

```
01  OPENING REVEAL          "당신 안에는 이런 분위기가 흐르고 있었어요."
02  GENOME CONSTELLATION    네 단어의 별자리
03  NARRATION I             "당신은 조용한 따뜻함 속에서..."
04  EMOTIONAL LAYER — 이끌림 당신이 이끌리는 것들
05  NARRATION II            "완벽함보다는 인간적인 흔적..."
06  EMOTIONAL LAYER — 반복   당신 안에서 반복되는 결
07  NARRATION III           "차가운 도시의 고독감 속에서도..."
08  EMOTIONAL LAYER — 반대   당신 안의 반대되는 결
09  EMOTIONAL LAYER — 조각   당신의 결을 이루는 조각들
10  ENDING REFLECTION       "당신은 계속 변하고 있습니다..."
11  SOFT CTA                "나의 감정 공간으로 이어가기"
```

각 section 은 **min-height: 100vh** 다. 한 화면에 하나의 호흡.
스크롤은 *서두르라는 신호가 아니라*, *천천히 들어오라는 초대* 다.

---

## 3. 시그니처 (Signature)

### Signature A — **스크롤이 시간이다 (Scroll as Time)**

전체 페이지는 위에서 아래로 **차가움 → 따뜻함** 의 흐름이다.
스크롤 progress 가 25% 단위로 body 의 tier 를 바꾼다:

| Scroll | Tier | Color story |
|--------|------|------------|
| 0–20%  | `tier-dawn`  | 차가운 silver-blue, 멀리서 |
| 20–45% | `tier-warming` | rose 가 막 들어오는 새벽 |
| 45–70% | `tier-noon`  | rose + ember 가 만개 |
| 70–100%| `tier-deep`  | full warmth, beige core |

스크롤은 *나를 점점 더 따뜻하게 만나는 과정* 이다.

### Signature B — **Genome Constellation**

태스트 게놈은 *태그 목록* 이 아니다. **별자리** 다.

- 네 개의 단어가 화면 안에 흩어져 있다
- 단어 사이에 **얇은 hairline** 이 천천히 그려진다 (SVG stroke-dasharray)
- 각 단어는 호흡한다 (opacity 0.78 ↔ 1.0, 4s)
- 호버하면 그 단어가 강조되고, 연결된 hairline 만 더 밝아진다

이건 정의가 아니다. *지도* 다.

---

## 4. 각 Section 디테일

### 01 — OPENING REVEAL

```
당신 안에는 이런 분위기가
흐르고 있었어요.
```

- 페이지 진입 후 정적 1.4s
- 헤드라인 blur reveal (1.8s, breath-in)
- 아래에 *작은 hairline* + sigil
- 사용자의 첫 스크롤이 다음 section 으로 모셔간다

### 02 — GENOME CONSTELLATION

```
당신의 감정 별자리

       Quiet Warmth
            ·
Urban           Emotional
Nostalgia      Minimalism
            ·
       Warm Futurism

조용한 따뜻함 · 도시의 향수 · 감정의 미니멀리즘 · 따뜻한 미래감
```

- 4개 단어가 화면 안에 정해진 위치(상하좌우 + 살짝 흐트러짐)에 자리잡음
- 단어 등장은 stagger (0.5s 간격, 1.2s reveal)
- 모두 등장한 뒤 1.6s 후 hairline 이 그려짐 (총 6개 line, 모든 단어 쌍)
- 하단에 한국어 의역 (mist 톤)

### 03 — NARRATION I

```
당신은 조용한 따뜻함 속에서
가장 오래 머무르는 사람입니다.
```

- 화면 정중앙, italic serif, 큰 사이즈
- 좌우 여백 충분히
- 위아래에 *얇은 hairline* (해당 narration 을 띄우는 액자)

### 04 — EMOTIONAL LAYER · 당신이 이끌리는 것들

```
당신이 이끌리는 것들

오래 머무는 빛
낡은 종이의 결
혼자만의 음악
느린 손길
저녁 6시의 그림자
누군가의 흔적
```

- 6개 phrase 가 세로로 쌓임 (display: flex column)
- 각 phrase 는 italic serif, fade-in 0.4s 간격
- 좌측에 1px hairline 이 항목마다 짧게 그려짐 (─)

### 05 — NARRATION II

```
완벽함보다는 인간적인 흔적에
마음이 끌리고 있어요.
```

### 06 — EMOTIONAL LAYER · 반복되는 결

```
반복되는 분위기

새벽 ─────────── 가장 자주
필름톤 ─────────── 자주
종이의 결 ─────── 종종
조명 하나 ─────── 종종
```

- "데이터처럼 보이지 않게" 가 핵심. 막대 그래프 X. 차트 X.
- 대신 *각 항목 옆에 얇은 hairline + 작은 italic 텍스트* (`자주`, `종종`)
- hairline 의 길이만 미세하게 다르다 — 정확한 수치가 아닌 *결의 강도*

### 07 — NARRATION III

```
차가운 도시의 고독감 속에서도
따뜻한 감정을 찾고 있습니다.
```

### 08 — EMOTIONAL LAYER · 반대되는 결

```
당신 안에는 함께 흐르는 결이 있어요

고독        ↔        온기
미니멀      ↔        풍성한 결
도시        ↔        자연의 호흡
새벽        ↔        해질녘
```

- 좌우로 짝을 이루는 4쌍
- 가운데에 가는 화살표 (`↔`, mist 톤)
- 각 단어는 italic serif
- 좌우 단어가 hairline 으로 부드럽게 이어짐 (배경)

### 09 — EMOTIONAL LAYER · 결을 이루는 조각들

```
당신의 결을 이루는 조각들

[ palette ]   [ texture ]   [ light ]   [ sound ]

  rose-bone     bone-paper     dusk-amber     low-drone
```

- 4개 카드, 각각 하나의 작은 시각 (그라디언트 / 텍스처 / 빛점 / 동심원)
- 카드는 *atmosphere/* 화면의 world-card 와 동일한 톤
- 호버 시 살짝 부드럽게 떠오름

### 10 — ENDING REFLECTION

```
당신은 계속 변하고 있습니다.
그리고 그 변화 속에도,
당신만의 분위기는 조용히 이어지고 있어요.
```

- 세 줄, 한 줄씩 fade-in (0.6s 간격, breath-in)
- 가장 큰 typography (clamp 32 ~ 56)
- 정중앙
- 위에 sigil 이 호흡한다

### 11 — SOFT CTA

```
        ──── 나의 감정 공간으로 이어가기 ────
```

- beacon, pulse box-shadow
- 누르면 dashboard 로 (정적 구현에선 reload)

---

## 5. 모션 시스템

```
--e-breath-in:  cubic-bezier(0.16, 1, 0.30, 1);
--e-breath-out: cubic-bezier(0.70, 0, 0.84, 0);
--e-settle:     cubic-bezier(0.34, 1.18, 0.64, 1);
```

- 모든 reveal: 1.4 ~ 1.8s breath-in
- 모든 fade-out: 1.2s breath-out
- 스크롤 progress → body tier transition: 4s ease

---

## 6. 타이포그래피

- **Opening / Narration / Ending**: Cormorant Garamond italic 300, clamp(28, 5.6vw, 56)
- **Section eyebrow**: Inter 400 small caps, 11px, mist
- **Genome word**: Cormorant Garamond italic 400, clamp(22, 3vw, 36)
- **Phrase**: Cormorant Garamond italic 300, clamp(18, 2.4vw, 26)
- **Beacon**: Inter 400, 13px

---

## 7. 사운드 (옵션, future)

이 화면은 *Analysis Transition* 의 ambient drone 이 자연스럽게 이어진다.
스크롤이 깊어질수록 chime 의 hue 가 따뜻해진다.

---

## 8. Next.js 빌드 노트

```
app/
  report/
    page.tsx
    ReportReveal.tsx                  # "use client" — orchestrates sections
    sections/
      OpeningReveal.tsx
      GenomeConstellation.tsx
      NarrationBlock.tsx
      AttractionLayer.tsx
      RhythmLayer.tsx
      ContrastLayer.tsx
      FragmentLayer.tsx
      EndingReflection.tsx
      SoftCTA.tsx
    motion/
      useScrollTier.ts                # scroll progress → tier class
      useSectionReveal.ts             # IntersectionObserver
```

핵심 hook 은 `useScrollTier()` — `window.scrollY / scrollHeight` 를 4단 tier 로 매핑.

---

## 9. 마지막 검사

엔지니어가 이 화면을 빌드할 때 마지막 검사:

> "마지막 narration ('차가운 도시의 고독감 속에서도 따뜻한 감정을 찾고 있습니다') 을 읽을 때,
> *눈가가 살짝 뜨끈해지는가?*"

만약 그 감각이 없다면, 이 화면은 아직 *결과 페이지* 다 — 아직 *시* 가 아니다.
