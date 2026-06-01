# Taste OS — Sharing Studio
## 당신의 분위기는 말보다 더 많은 것을 전하고 있습니다

---

## 0. 이 화면은 무엇이 아닌가

- 소셜 미디어가 아니다
- 피드가 아니다
- 좋아요 / 댓글 / 팔로워가 없다
- 참여 유도 메커니즘이 없다
- 바이럴 디자인이 아니다
- 중독적 인터랙션이 아니다

이 화면은:

> **자기 자신의 한 조각을 — 설명 없이 — 조용히 건네는 자리.
> 영화 같은 감정의 엽서를 한 장 띄워 보내는 일.**

여기서 사용자는 *콘텐츠를 게시* 하지 않는다. *분위기를 건넨다.*

---

## 1. 감정 목표

> **"이건 나에 대한 깊은 무언가를, 조용히 표현해줘."**

1. **표현 (Expression)** — 설명하지 않아도 전해지는 결
2. **친밀함 (Intimacy)** — 모두에게가 아니라, *누군가에게*
3. **예술성 (Artistry)** — 프로필 카드가 아니라 *한 편의 초상*
4. **잔잔함 (Calm)** — 숫자도, 알림도, 경쟁도 없다
5. **공명 (Resonance)** — 좋아요 대신 *조용한 결의 응답*

---

## 2. 구조

```
01  OPENING          당신의 분위기는 말보다 더 많은 것을 전하고 있습니다.
02  TASTE CARD        살아있는 감정의 카드 (centerpiece)
03  STYLE PICKER      4개 atmosphere 중 나를 고르기
04  CINEMATIC EXPORT  이미지로 저장 · 움직이는 카드 · 분위기 링크
05  EMOTIONAL RESONANCE  좋아요 대신, 조용한 결의 응답
06  SOFT CONTINUATION    "나의 감정 기록 이어가기"
```

---

## 3. 시그니처

### Signature A — **살아있는 Taste Card**

화면 중앙의 거대한 카드. 프로필이 아니라 *초상화* 다.

- aspect 4/5, 화면 폭의 절반
- 내부에 layer 가 있다: drifting gradient blob + grain + sigil + 타이포
- **마우스를 따라 3D tilt** (rotateX/rotateY, 최대 ±8deg)
- tilt 에 따라 내부 광택(specular)이 미세하게 움직인다
- 카드 자체가 천천히 호흡한다 (scale 1.0 ↔ 1.008)

이 카드는 *정보* 가 아니라 *살아있는 분위기* 다.

### Signature B — **Atmosphere Morph**

4개 atmosphere 를 고르면 카드가 *부드럽게 변신* 한다.

- gradient cross-fade (1.2s)
- 이름 / narration / palette 가 blur-out → blur-in
- 배경 page 의 ambient 도 함께 따라온다

이건 *카드 교체* 가 아니라 *분위기가 흐르는 것* 이다.

---

## 4. Section 디테일

### 01 — OPENING

```
당신의 분위기는
말보다 더 많은 것을 전하고 있습니다.

설명하지 않아도,
당신만의 감정은 조용히 전해질 수 있어요.
```

### 02 — TASTE CARD

카드 구성:

```
┌─────────────────────┐
│  ◜ (sigil)          │
│                     │
│                     │
│     Quiet Warmth    │  ← genome (en)
│     조용한 따뜻함     │  ← genome (ko)
│                     │
│  완벽함보다 인간적인   │  ← narration
│  흔적에 마음이 머무는  │
│  사람.               │
│                     │
│  rose · ember · beige│ ← atmosphere
│  ● ● ●              │  ← palette
│      TASTE OS       │  ← wordmark
└─────────────────────┘
```

### 03 — STYLE PICKER

```
어떤 공기로 전할까요

[ Quiet Warmth ]  [ Urban Nostalgia ]
[ Emotional Minimalism ]  [ Warm Futurism ]
```

- 4개 선택지, 현재 선택은 밑줄 hairline
- 선택 시 카드가 morph

**4개 카드:**

| ID | EN | KO | 팔레트 | narration |
|----|----|----|--------|-----------|
| quiet-warmth | Quiet Warmth | 조용한 따뜻함 | rose · ember · beige | 완벽함보다 인간적인 흔적에 마음이 머무는 사람. |
| urban-nostalgia | Urban Nostalgia | 도시의 향수 | silver-blue · sand · rose | 차가운 거리에서도 따뜻한 장면을 모으는 사람. |
| emotional-minimalism | Emotional Minimalism | 감정의 미니멀리즘 | bone · mist · beige | 적은 것 안에서 가장 깊은 결을 보는 사람. |
| warm-futurism | Warm Futurism | 따뜻한 미래감 | silver-blue · beige · ember | 단정한 빛 속에도 감정을 잃지 않는 사람. |

### 04 — CINEMATIC EXPORT

```
이 분위기를 어떻게 간직할까요

[ 이미지로 저장 ]   [ 분위기 링크 복사 ]   [ 움직이는 카드 ]
```

- **이미지로 저장**: 카드를 canvas 로 렌더 → PNG 다운로드 (실제 동작)
- **분위기 링크 복사**: clipboard 에 링크 복사 + 조용한 확인
- **움직이는 카드**: 카드의 ambient 모션을 강조하는 토글 (live preview)
- export 직후 *현상되는 느낌* 의 확인 메시지 ("당신의 카드를 담았어요.")

### 05 — EMOTIONAL RESONANCE

```
이 분위기를 받은 사람들이 남긴 조용한 결

─ 이 분위기에 오래 머물렀어요.
─ 조용히 공감되는 감정이 있었어요.
─ 왠지 설명할 수 없는 익숙함이 느껴졌어요.
```

- 좋아요 수, 아바타, 시간 표시 *없음*
- 그저 *조용한 결의 응답* 세 줄
- 숫자가 없는 것이 의도다

### 06 — SOFT CONTINUATION

```
──── 나의 감정 기록 이어가기 ────
```

- 클릭 → ../home/

---

## 5. 모션

| Element | Motion |
|---------|--------|
| Taste Card | 3D tilt (mouse), breath (scale), 내부 blob drift |
| Card morph | gradient cross-fade 1.2s, text blur swap |
| Style picker | underline hairline slide |
| Export confirm | "현상되는" fade-in 1.6s |
| Section reveals | IntersectionObserver blur-to-clear |

---

## 6. 타이포그래피

- **Opening**: Cormorant Garamond italic 300, clamp(28, 5.2vw, 52)
- **Card genome (en)**: Cormorant Garamond italic 400, clamp(24, 3vw, 34)
- **Card genome (ko)**: Cormorant Garamond italic 300, 16px
- **Card narration**: Cormorant Garamond italic 300, clamp(16, 2vw, 20)
- **Wordmark**: Inter 500 small caps, 10px, letter-spacing 0.3em
- **Beacon**: Inter 400, 13px

---

## 7. 데이터 (Next.js)

```ts
type TasteCard = {
  id: string;
  en: string; ko: string;
  narration: string;
  atmosphere: string;
  palette: [string, string, string];
  gradient: string;
};
```

Export 는 `useCardExport()` — `html-to-image` 또는 canvas 로 카드 DOM → PNG.
Resonance 는 서버에서 *익명의 조용한 응답 문구* 만 받아온다. 좋아요 카운트 없음.

---

## 8. 조용한 소셜 철학

이 화면의 모든 결정은 하나의 질문에서 나온다:

> *"이게 사용자를 다시 돌아오게 만드는가 — 중독시켜서가 아니라, 다정해서?"*

- 알림 없음
- 카운트 없음
- 랭킹 없음
- "더 보기" 없음

전해지는 것은 *나의 한 조각* 이고, 돌아오는 것은 *조용한 결의 응답* 뿐이다.

---

## 9. 마지막 검사

> "사용자가 이 카드를 누군가에게 보낼 때 —
> *부끄럽지 않고, 오히려 자기 자신을 들킨 듯 다정한 기분* 이 드는가?
> 그리고 좋아요가 없는데도, *서운하지 않은가?*"

만약 그 두 감각이 있다면, 이건 *공유 도구* 가 아니라 *감정의 엽서* 다.
