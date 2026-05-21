# Taste OS — Identity Evolution
## 당신은 생각보다 많은 계절을 지나오고 있었습니다

---

## 0. 이 화면은 무엇이 아닌가

- 분석이 아니다
- 생산성 타임라인이 아니다
- 무드 트래킹이 아니다
- 수치화된 자기 관찰이 아니다
- 그래프가 아니다

이 화면은:

> **지나온 감정의 계절들을 천천히 다시 걷는 산책.
> 내 안의 공기가 어떻게 변해왔는지, 그리고 무엇이 그대로 이어졌는지를 보는 자리.**

여기서 사용자는 *진행률* 을 보지 않는다. *자기 자신의 계절* 을 본다.

---

## 1. 감정 목표

> **"내가 어떤 사람이 되어가고 있었는지, 조용히 볼 수 있어."**

1. **향수 (Nostalgia)** — "그때의 나는 그런 공기였구나"
2. **변화의 인식 (Seeing Change)** — 어제와 오늘 사이의 거리
3. **이어짐 (Continuity)** — 변했지만 *끊기지 않은* 결
4. **부드러움 (Tenderness)** — 과거의 자신에게 보내는 다정함
5. **현재로의 귀환 (Return)** — 결국 *지금의 나* 로 돌아온다

---

## 2. 구조 — 계절을 걸어 내려간다

```
01  OPENING               당신은 생각보다 많은 계절을 지나오고 있었습니다.
02  SEASON · 2024         차가운 도시의 고독감
03  EVOLUTION NARRATION   "예전보다 조금 더 따뜻한 것들에..."
04  SEASON · 2025         조금 더 따뜻해진 공기
05  EVOLUTION NARRATION   "완벽함보다는 인간적인 흔적 속에서..."
06  SEASON · 2026         인간적인 흔적 속 안정감
07  QUIET REFLECTION      의도적인 침묵
08  SOFT CONTINUATION     "지금의 나로 돌아가기"
```

각 계절은 *하나의 방* 이다. 스크롤은 *그 방을 지나 다음 방으로 걸어가는 일* 이다.

---

## 3. 시그니처

### Signature A — **계절이 흐르며 공기가 데워진다 (Era Warming)**

전체 페이지는 위에서 아래로 **차가움 → 따뜻함** 의 흐름이다.
스크롤이 각 계절에 들어설 때마다 body 의 era 가 바뀐다:

| Section | Era | Atmosphere |
|---------|-----|------------|
| Opening | `era-cold` | 깊은 silver-blue, 멀리서 |
| 2024    | `era-cold` | 차가운 도시, 회청색 |
| 2025    | `era-warming` | rose 가 막 스며드는 공기 |
| 2026    | `era-warm` | rose + ember + beige, 인간적인 온기 |
| Continuation | `era-warm` | 가장 따뜻한 현재 |

이건 *연도별 막대 그래프* 가 아니다. *공기가 데워지는 과정* 이다.

### Signature B — **유령 같은 연도 (Ghost Year)**

각 계절 뒤에 거대한 연도 숫자가 *기억의 잔상처럼* 떠 있다.

- `2024` `2025` `2026` — 화면 폭의 절반을 차지하는 거대한 numeral
- opacity 0.04 ~ 0.07, 매우 흐릿함 (blur)
- 계절에 들어서면 천천히 fade-in + 살짝 scale
- 마우스 parallax 로 아주 미세하게 떠다님

숫자가 *데이터* 가 아니라 *기억의 배경* 이 된다.

---

## 4. Section 디테일

### 01 — OPENING

```
당신은 생각보다 많은 계절을
지나오고 있었습니다.

시간 속에서 당신의 분위기는 조금씩 변해왔고,
그 변화 속에도 당신만의 감정은 조용히 이어지고 있어요.
```

- 헤드라인 blur reveal (1.8s)
- 서브카피 두 줄, fade-in
- 작은 스크롤 큐

### 02 / 04 / 06 — SEASON CHAMBERS

각 계절의 구성:

```
            [ 2024 ← 유령 연도, 배경에 거대하게 ]

   첫 번째 계절 · 2024
   ───────────────
   차가운 도시의 고독감

   [ 떠다니는 memory fragment 4–5개 ]

   그해의 당신은, 차가움 속에서
   자기만의 거리를 두고 있었어요.
```

- min-height: 100vh
- 거대한 ghost 연도 (배경)
- eyebrow ("첫 번째 계절 · 2024")
- 계절 이름 (큰 italic serif)
- 그 계절의 memory fragments 가 천천히 drift
- 마지막에 짧은 reflective 한 줄

**계절별 톤:**

| 연도 | 이름 | 팔레트 | 톤 |
|------|------|--------|-----|
| 2024 | 차가운 도시의 고독감 | silver-blue / 회청 / 차가운 sand | cool |
| 2025 | 조금 더 따뜻해진 공기 | rose / silver-blue / sand | mixed |
| 2026 | 인간적인 흔적 속 안정감 | rose / ember / beige | warm |

### 03 / 05 — EVOLUTION NARRATION

계절 사이에 *변화* 를 짚는 한 문장.

```
03 (2024 → 2025):
   예전보다 조금 더 따뜻한 것들에
   오래 시선이 머물고 있어요.

05 (2025 → 2026):
   완벽함보다는 인간적인 흔적 속에서
   안정감을 느끼기 시작했어요.
```

- 화면 정중앙, italic serif, 큰 사이즈
- 위아래에 가는 hairline (액자)
- 이 narration 이 *두 계절을 잇는 다리* 다

추가로 2026 안에 또 하나:
```
   차가운 고독감 속에서도 점점 더
   부드러운 감정을 발견하고 있습니다.
```

### 07 — QUIET REFLECTION

```


        ·

   여기까지, 당신이 지나온 계절들이에요.
   잠시 바라봐 주세요.

        ·


```

- 의도적인 침묵 (min-height: 60vh)
- 점 + 한 줄 + 점
- 명상적, 인터랙션 없음

### 08 — SOFT CONTINUATION

```
──── 지금의 나로 돌아가기 ────

이 모든 계절이, 지금의 당신을 만들었어요.
```

- beacon, ceremonial pulse
- 클릭 → ../home/ (현재의 방으로 귀환)

---

## 5. 모션

| Element | Motion |
|---------|--------|
| Ghost year | fade-in + scale on enter (2.4s), parallax drift |
| Season name | blur reveal (1.8s breath-in) |
| Memory fragments | 10–16s drift loop, dissolve on enter |
| Narration | reveal on enter (1.6s) |
| Era transition | background morph 4s ease |

전부 *느리다.* 계절은 서두르지 않는다.

---

## 6. 타이포그래피

- **Opening / Narration**: Cormorant Garamond italic 300, clamp(28, 5.2vw, 52)
- **Season name**: Cormorant Garamond italic 400, clamp(30, 5.6vw, 56)
- **Ghost year**: Cormorant Garamond 300, clamp(160, 36vw, 480), opacity 0.05
- **Eyebrow**: Inter 400 small caps 11px mist
- **Reflective line**: Cormorant Garamond italic 300, clamp(17, 2.4vw, 22)
- **Beacon**: Inter 400, 13px

---

## 7. 데이터 (Next.js)

```ts
type EvolutionState = {
  seasons: {
    year: number;
    chapterKo: string;        // "첫 번째 계절"
    name: string;             // "차가운 도시의 고독감"
    palette: string[];
    tone: 'cool' | 'mixed' | 'warm';
    fragments: MemoryFragment[];
    reflection: string;       // 짧은 한 줄
  }[];
  transitions: string[];      // 계절 사이의 narration
};
```

`useEraScroll()` — 스크롤 위치 → era 클래스 (cold/warming/warm).

---

## 8. 마지막 검사

> "마지막 계절(2026)에 도착했을 때,
> 첫 계절(2024)의 차가움이 *그립게* 느껴지는가?
> 그리고 '지금의 나로 돌아가기' 를 누르고 싶어지는가 — *집에 가듯이?*"

만약 그 감각이 없다면, 이 화면은 아직 *타임라인* 이다. *계절* 이 아니다.
