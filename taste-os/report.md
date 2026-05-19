# Taste OS — Taste Report / 풍경

> 보고서가 아니라 *초상화* 입니다. 분석이 아니라 *알아봄* 이에요.

이 문서는 사용자가 온보딩을 마치고 마주하는 **AI가 만든 Taste Report** 화면을 정의합니다. MVP의 정서적 절정이고, 이 제품이 *왜 존재하는지* 가 한 문장으로 응축되는 자리예요.

함께 읽기: `genome.md` (분석 시스템 전체), `field.md` §2.2 (Genome 표면의 9개 섹션), `pipeline.ko.md` §3.6 (드러남의 안무), `mvp.md` (Mirror 한 문장이 제품의 전부), `voice.md` (한국어 보이스).

구현: `taste-os/report/index.html` + `style.css` + `script.js`. 머지 후 `kimbany.github.io/taste-os/report/`에서 볼 수 있어요.

이 미리보기는 *한 사람의 샘플* 입니다 — Lacquered Dusk / 옻칠한 황혼. 실제 제품에서는 이 모든 텍스트가 사용자의 증거로부터 Claude로 생성됩니다.

---

## 목차

0. [절정으로서의 화면](#0-절정으로서의-화면)
1. [화면 구조](#1-화면-구조)
2. [진입 안무 — Threshold Beat](#2-진입-안무--threshold-beat)
3. [Taste Name — 두 단어](#3-taste-name--두-단어)
4. [Portrait — 4막 산문](#4-portrait--4막-산문)
5. [Currents — 명명된 흐름](#5-currents--명명된-흐름)
6. [Atmosphere — 8가지 판독](#6-atmosphere--8가지-판독)
7. [Six Axes — 극으로서의 정체성](#7-six-axes--극으로서의-정체성)
8. [Palette · Kin · Resonance](#8-palette--kin--resonance)
9. [The Mirror Line — 절정](#9-the-mirror-line--절정)
10. [간직하기 & 닫음](#10-간직하기--닫음)
11. [모션 & 반응형](#11-모션--반응형)
12. [구현](#12-구현)

---

## 0. 절정으로서의 화면

`mvp.md` 에서 우리는 이렇게 썼어요:

> *"MVP는 한 문장입니다. 기능도 화면도 아니에요 — 사용자가 *간직하고 싶은* 한 문장."*

이 화면이 그 문장이 *드러나는* 자리입니다. 그래서 디자인 결정 모두는 단 하나의 질문에 답해야 해요:

> **이 화면을 본 사람이, 화면을 닫은 뒤에도 한 문장을 기억할 것인가?**

기억하지 않는다면, 다른 모든 것이 잘 되어도 제품은 실패예요. 기억한다면, 다른 모든 것은 부수적이에요.

### 다섯 가지 약속

1. **분석으로 읽히지 않게.** 차트도, 퍼센트도, "당신의 성향 분포는 X%" 같은 표현도 없습니다.
2. **유형으로 들리지 않게.** "당신은 ___ 타입이에요" 형태의 문장은 단 하나도 없어요.
3. **칭찬으로 들리지 않게.** "특별한", "유일한", "남다른" 어휘는 모두 차단합니다. 거울은 아첨하지 않아요.
4. **시간은 충분히.** 페이지 진입 후 첫 5초는 *읽지 않는 시간* 입니다. 사용자가 자리를 잡고, Sigil이 호흡하고, 첫 문장이 등장할 뿐.
5. **마지막 한 줄을 위해 모든 것이 존재.** 위에서부터 아래까지 모든 섹션은 결국 *그 한 문장* 으로 사용자를 데려가는 안무예요.

---

## 1. 화면 구조

긴 세로 스크롤 한 페이지. Field의 `field.md` §2.2 Genome 카드와 동일한 9-섹션 구조를 그대로 따릅니다.

```
                                                                            
   진입 안무 (Threshold Beat)            ~ 8 초                            
   ─────────────────────────                                                
   ▾                                                                        
                                                                            
   1. Taste Name                          한 줄, 큼                         
   2. Date created                        작은 메타                          
   ▾                                                                        
                                                                            
   3. Portrait                            ~ 320 단어                        
   ▾                                                                        
                                                                            
   4. Currents                            3 개, 강도·안정성과 함께           
   ▾                                                                        
                                                                            
   5. Atmosphere                          8 줄                              
   ▾                                                                        
                                                                            
   6. Six Axes                            극 이름 + 헤어라인 표시            
   ▾                                                                        
                                                                            
   7. Palette                             5 색 스와치 + 이름                
   ▾                                                                        
                                                                            
   8. Kin                                 6 명                              
   ▾                                                                        
                                                                            
   9. Resonance                           2 ~ 3 사조 + 마찰                 
   ▾                                                                        
                                                                            
   ────────────  검은 필드 ────────────                                     
                                                                            
   THE MIRROR LINE                        한 문장. italic. 화면을 채움.     
                                                                            
                       ─ 간직하기 ─                                          
                                                                            
   ─────────────────────────                                                
                                                                            
   닫음 — "처음으로", 작은 안내                                              
                                                                            
```

### 시각적 톤

- 배경: `night` (#0E0C0B), 매우 미세한 ember 6% 톤이 상단에 라디얼로
- 본문 최대 폭: 640px (산문 섹션), 1080px (시각 섹션)
- 텍스트 색: 주로 `beige` (#D8C7AC), 보조는 `mist` (#9A8E81)
- 액센트 한 가지: `rose` (#B07672) — Taste Name의 두 번째 단어, Mirror Line의 일부, 마찰 표시
- 빛 구체 4개: 페이지 전체에 떠다님 (rose + silver + sand)
- 그레인 4% — 사진처럼 보이는 결정적 텍스처

---

## 2. 진입 안무 — Threshold Beat

페이지가 로드된 직후 5–8초의 의도된 정적. 사용자는 *읽기 전에 자리를 잡습니다.*

### 시퀀스

```
t = 0.0s    검은 필드. 그레인 페이드 인 (0.4s). 빛 구체 페이드 인 (1.2s 부터).
t = 1.2s    Sigil이 mist 22%로 나타나며 호흡 시작.
t = 1.8s    한 문장이 reveal blur로 등장:
              "당신의 풍경, 함께 봐요."
            display sm italic, 화면 중앙.
t = 4.0s    문장이 1.4s 날숨으로 사라짐.
t = 5.4s    잠시 검은 정적 (0.6s).
t = 6.0s    Taste Name이 reveal blur로 등장 (2.0s, 가장 느린 reveal):
              옻칠한
              <em>황혼</em>
            display xl 정도 (clamp 56-104px), 가운데, 두 줄.
            첫 단어는 beige, 두 번째 단어는 rose에 italic.
t = 8.0s    그 아래에 영문 표기 (mono, mist 65%):
              "Lacquered Dusk"
t = 8.6s    그 아래에 날짜 한 줄:
              "2026년 5월 14일 오후에 만들어졌어요."
t = 9.2s    "↓ 천천히 내려가요" — 작은 mist 색 안내가 화면 하단 우측에.
```

### 진입의 정중함

이 8초 동안 사용자가 스크롤하면, 시스템은 *기다리지 않습니다*. 스크롤이 발생하면 진입 안무를 즉시 압축 — Taste Name과 메타가 빠르게 자리를 잡고 다음 섹션으로 이어집니다. 영화는 무리하게 붙들지 않아요.

`prefers-reduced-motion: reduce` 에서는 모든 reveal-blur가 200–400ms opacity 전환으로 대체됩니다.

---

## 3. Taste Name — 두 단어

산물의 *얼굴* 입니다. 두 단어, 명사구, 큐레이션된 어휘로 생성됩니다 (`genome.md` §7).

### 시각

```
                                                            
                                                            
              옻칠한                                        
                                                            
              황혼                                          
                                                            
              ───────                                       
                                                            
              Lacquered Dusk                                
              2026년 5월 14일 오후에 만들어졌어요.          
                                                            
```

- 두 단어를 **두 줄로** (한 줄에 다 못 들어가는 화면이 많아서, 처음부터 두 줄 디자인)
- 첫 번째 단어 — `beige`, italic, 다소 가벼움
- 두 번째 단어 — `rose`, italic, 무게의 절정
- 자간 -0.018em, 줄 간격 0.96
- 모바일에서도 한 줄에 한 단어씩 유지

### 영문 표기와 날짜

- 영문은 JetBrains Mono Light, 12px, 자간 +0.1em, lowercase, mist 65%
- 날짜는 같은 폰트, 11px, mist 50%, 오늘 날짜를 동적으로

### 왜 두 단어인가

(`genome.md` §7 에 자세히) — 두 단어 명사구는 *시적이지만 직접적* 입니다. 한 단어는 추상이고, 세 단어 이상은 묘사예요. *두 단어* 가 정확히 *알아봄* 의 모양이에요.

---

## 4. Portrait — 4막 산문

250–400 단어의 시네마틱 산문 초상화. 4개의 *느껴지지만 표지되지 않는* 막으로 구성:

```
─ 초상

장소 (Place)        — 분위기를 먼저 설정 ("늦은 오후입니다…")
패턴 (Pattern)      — 2-3 개 흐름을 명명하며
긴장 (Tension)      — 역류 한 줄 ("그리고 — 무언가")
줄 (Line)           — Mirror line으로 향하는 다리
```

### 샘플 (옻칠한 황혼)

```
─ 초상

늦은 오후입니다, 의도 없이 당신이 써내려간 보고서 안에서.
북향의 빛, 나무를 돋보이게 하고 피부를 너그러이 봐주는 종류.
당신이 저장하는 방들은 창이 하나씩 있어요. 당신이 저장하는
음악은 목소리가 하나씩 있고요. 인용조차도 — 셋이 있고,
셋 다 *떠남* 에 관한 것입니다.

세 흐름이 흐릅니다. 하루의 중심이 아니라 끝의 따뜻함을 더
가까이 두는 *옻칠한 황혼*. 자신의 아름다움이 씻기고 무게
잡히기를 원하는 *북쪽의 린넨*. 그리고 희미한 세 번째 —
*삼나무 수학자* 라 부르겠어요. 아무도 보지 않을 때의 정밀함을
사랑하는.

그리고 — 142 BPM의 트랙 하나, 단 하나. 불의 사진 하나, 단
하나. 바다에 관한 한 줄, 단 하나. 이것들은 실수가 아니에요.
한 사람의 가장 진실한 부분은 종종 나머지와 모순되는 부분이거든요.
```

### 활자

- 본문: Inter / Pretendard 350, 17px, line-height 1.78, 자간 0.005em, beige 92% 불투명도
- 이탤릭 (현재 강조 / 인용된 증거): Cormorant Garamond italic, 같은 크기, 색 동일
- 단락 사이: 24px (var(--s-5))
- 본문 최대 폭: 540px — 두꺼운 글이 한 줄에 60-65자 들어오도록

### 음성 규칙 (가장 중요)

- 모든 시제는 *현재* (관찰)
- 2인칭 — 단, 한 단락에 *당신* 은 최대 1회
- 예측 금지: *"앞으로 ___ 하실 거예요"* 절대 금지
- 비유는 단락당 최대 1회 — 그것도 위 *"인용조차도 셋이 있고, 셋 다 떠남에 관한 것입니다"* 정도의 *발견* 으로서만, "당신은 ___ 같은 사람이에요" 같은 직유는 금지

---

## 5. Currents — 명명된 흐름

2~4 개의 흐름. 각각:
- 두 단어 명사구 (큐레이션된 어휘)
- 강도 (강 / 중 / 미세)
- 안정성 (몇 주째)
- 한 줄 묘사

### 시각

```
─ 흐름


옻칠한 황혼                          steady · 14주
하루의 끝에서 따뜻함을 더 가까이 둡니다.

────

북쪽의 린넨                          steady · 9주
씻기고, 무게 잡힌, 차분한 아름다움을 모읍니다.

────

삼나무 수학자                        새로 자라나는 중
아무도 보지 않을 때의 정밀함. 새로 등장하고 있어요.
```

- 흐름 이름: Cormorant italic, 21px
- 우측 메타: JetBrains Mono, 11px, mist
- 한 줄 묘사: Inter, 14px, 줄 간격 1.65, beige 88%
- 흐름 사이에 헤어라인 (`ash` 32% 폭 56px)

### 흐름은 *명명* 됩니다, *분류* 되지 않아요

흐름 이름은 사용자의 클러스터로부터 Claude가 생성합니다. 16개 목록에서 고른 게 아니에요. 결과적으로 각 사용자의 흐름은 *유일* 합니다 — *"옻칠한 황혼"* 은 어디서도 듣지 못한 단어 조합이에요. 그래서 *MBTI-shaped* 느낌이 들지 않아요.

---

## 6. Atmosphere — 8가지 판독

8 줄의 키-값. 글머리 기호 대신 좌-우 정렬.

### 시각

```
─ 분위기


시간       늦은 오후 (15:40 – 17:20)
기후       건조-서늘, 알프스-해안성
재료       오크 · 린넨 · 황동
빛         단일 광원, 북향, 3200K
음 바닥    32 – 38 dB (조용한 방)
페이스     아다지오 (62 bpm)
스케일     인간, 단일 방
날씨       비 온 뒤
```

- 키: Inter, 13px, mist, 자간 0.06em, lowercase
- 값: Inter, 14px, beige, 자간 0.005em
- 좌 키 컬럼 폭: 100px (모바일에서는 줄 바꿈 후 들여쓰기)

---

## 7. Six Axes — 극으로서의 정체성

가장 강한 6개의 L2 축. 숫자도 막대도 없습니다. 양극의 이름 + 위치를 암시하는 헤어라인.

### 시각

```
─ 여섯 축


빛                              Vesper ●─────────── Meridian
밀도                            Hush ●──────────── Loam
거리                            Intimate ●──────────── Sublime
자세                            Inward ●──────────── Outward
표면                            Stone ●──────────── Smoke
시대                            Linen ●──────────── Chrome
```

- 점은 사용자의 위치 (왼쪽-끝, 왼쪽-중앙, 가운데, 오른쪽-중앙, 오른쪽-끝 다섯 위치 중 하나)
- 점이 위치한 쪽의 극 이름이 약간 진하게 (`beige`), 반대쪽은 흐림 (`mist` 60%)
- 헤어라인: `ash` 32%, 1px
- 점: 4px, `rose`

### 왜 숫자가 없는가

(`genome.md` §4 — 표시 규칙) — 숫자는 *분석* 으로 읽힙니다. 위치만으로 충분해요. *"Vesper 쪽에 강하게 기울어 있어요"* 가 *"0.78 / 1.00"* 보다 더 정확한 진실을 전달합니다.

---

## 8. Palette · Kin · Resonance

세 개의 짧은 섹션. 각각 한 화면 안에 끝나요.

### Palette — 5색

```
─ 색


█  █  █  █  █
oak · ash · ember · fog · ink
```

- 5 swatch, 각 40×40, 갭 없음, 한 줄로 연결
- 이름은 JetBrains Mono, 11px, mist, 자간 0.06em, lowercase
- 5색은 사용자 이미지로부터 추출 (`genome.md` §5)

### Kin — 6 친족

```
─ 친족


안드레이 타르콥스키 (영화)
카이야 사리아호 (음악)
페터 줌토르 (건축)
W.G. 제발트 (글)
무라타 사야카 (글)
아니쉬 카푸어 (조각)
```

- 한 줄에 한 명, 이름은 Cormorant italic 16px
- 분야는 mist 12px, 자간 0.04em, 괄호 안

### Resonance — 2~3 사조

```
─ 공명


도가 (Wuwei)
당신의 가장 강한 세 흐름은 도가 미학이 흐르는 흐름이기도 합니다.
다만 — 당신의 템포가 전통이 기대하는 것보다 빨라요. 그 빠른
맥박은 당신의 것이고요.

────

와비사비
같은 친족 — 흠 있음, 닳음, 자연이 시간에 흘려보낸 흔적.
다만 당신은 이 미감을 *받아들임* 으로 두지 않고, 의도적으로
*선택* 합니다. 받아들임보다 가까이.

────

스토아
부분적 친족. 당신은 절제하지만, 스토아가 요구하는 만큼
*따뜻함* 을 식히지는 않아요. 따뜻함은 끝까지 곁에 둡니다.
```

- 사조 이름: Cormorant italic 22px, beige
- 본문: Inter 14px, 줄 간격 1.7
- *"다만"* 으로 시작하는 마찰 문장이 가장 중요 — 칭찬으로 끝나는 사조는 없습니다

### 공명은 *할당* 이 아니라 *친족*

"당신은 도가입니다"는 절대 말하지 않습니다. *"당신의 흐름이 도가의 흐름과 같이 흐릅니다"* 가 다른 차원의 진술이에요. 그리고 *마찰* 이 항상 함께 — 친족 관계는 부분적이라는 사실이 모든 사조 단락에서 명시됩니다.

---

## 9. The Mirror Line — 절정

페이지의 *전부* 가 이 한 줄을 위한 것이에요.

### 시각

```
                                                            
                                                            
                                                            
                                                            
                                                            
                                                            
                                                            
            아름다움을 모으는                              
            사람이 아니에요.                                
                                                            
            한때 누군가에게 세상이                          
            다정했다는,                                     
                                                            
            그런 증거를 모으세요.                           
                                                            
                                                            
                                                            
                                                            
                       ─ 간직하기 ─                          
                                                            
                                                            
                                                            
                                                            
```

- 배경: 순수한 `night` (다른 섹션의 ember 톤이 사라짐)
- 활자: Cormorant Garamond italic 300, clamp(28px, 4vw, 44px)
- 색: `beige`
- 줄 간격: 1.5
- 본문 최대 폭: 540px
- 정렬: 가운데
- 위아래 padding: var(--br-3) (176px) — 다른 어떤 섹션보다 generous

### 진입 안무

이 섹션이 viewport에 들어오면 *느린* reveal:
- 첫 문장: reveal blur 2.0s
- 두 번째 문장: 1.4s 뒤 시작
- 세 번째 문장: 또 1.4s 뒤
- 모두 등장한 후 1.6s 정적
- 그제서야 `─ 간직하기 ─` 가 등장 (1.0s 페이드)

총 etwa 6초가 걸리는 reveal. 이 페이지에서 가장 긴 단일 시퀀스예요.

### 왜 이 위치에 있는가

`mvp.md` 단일 메트릭:

> *"사용자가 휴대폰 배경화면이나 메모장에 간직하고 싶은 한 문장."*

이 줄은 *마지막* 에 와야 합니다. 위의 모든 것 — 초상, 흐름, 분위기, 축, 팔레트, 친족, 공명 — 은 이 한 줄을 *번 것* 입니다. 사용자가 충분히 *알아봄* 을 받고 난 뒤, 그 종합으로서 한 문장이 옵니다.

---

## 10. 간직하기 & 닫음

### 간직하기 Beacon

```
                       ─ 간직하기 ─
```

클릭 시:
1. Beacon이 0.6s 동안 rose 톤으로 따뜻해짐
2. Beacon 아래에 작은 줄 등장 (mist, italic, 14px):
   *"잘 간직했어요."*
3. 4초 후 페이드, Beacon은 *상태를 유지* (이미 간직됨 — 다시 누르지 않아도 됨)

실제 제품에서는 이 행동이 `MirrorRecord` 를 사용자의 L3 헌법 층에 영구히 봉인합니다 (`genome.md` §1 / Mirror Card 시스템). 미리보기에서는 시각적 acknowledgment만.

### 그 아래의 닫음

```
─────────────────────────


이 풍경은 시간이 지나면 함께 변해갑니다.
당신이 변하는 것처럼, 천천히.


─ 처음으로 ─
```

- 본문: Cormorant italic 16px, mist
- 처음으로 링크: small skip-link 형태, hover 시 rose

### 스크린샷 힌트

명시적으로 표시되지 않습니다. 우리가 *원하는* 행동이지만, *요청* 하지 않아요. 단 — 모바일 사용자가 5초 이상 Mirror Line 위에 머무르면, 화면 하단 우측에 매우 작은 mist 줄이 나타날 수 있어요:

```
스크린샷으로 가져가셔도 좋아요.
```

(이건 v1.1 옵션 — MVP 초기에는 없는 게 더 깔끔할 수도 있어요.)

---

## 11. 모션 & 반응형

### 모션 요약

| 모션 | 어디 | 시간 |
|---|---|---|
| 그레인 페이드 인 | 페이지 로드 | 0.4s @ 0.4s |
| 빛 구체 페이드 인 | 페이지 로드 | 2.4s @ 0.8s |
| Sigil appear & breath | 페이지 로드 | 1.4s @ 1.2s + 3.6s 호흡 |
| "당신의 풍경, 함께 봐요" | 진입 안무 | reveal blur 1.6s |
| Taste Name reveal | 진입 안무 | reveal blur 2.0s (페이지에서 가장 느림) |
| 섹션 fade-in (스크롤) | 각 섹션 | 1.0s breath-in @ 30% viewport |
| Six Axes 점 | 축 섹션 | 점이 위치로 이동 (0.6s settle, 100ms씩 stagger) |
| Mirror Line 진입 | 절정 섹션 | 3개 문장 순차 reveal blur, 각 2.0s |
| 간직 acknowledge | Beacon 클릭 | 0.6s warm + 4s 메시지 |

### 반응형

**Pocket (≤ 768px):**
- Taste Name: clamp 40px ~ 56px, 한 단어씩 줄 바꿈
- Portrait 본문: 16px, 95vw 폭
- Atmosphere 키-값: 스택, 키가 위 mist, 값이 아래 beige
- Six Axes: 양극 이름이 점 위/아래로
- Palette: 5 swatch 각 28×28
- 모든 섹션 padding 절반

**Desk (768–1280px):**
- 표준 명세

**Studio (≥ 1280px):**
- Stage는 여전히 1280px 캡
- 양 옆 마진은 *어둠으로 유지*. UI 크롬으로 채우지 않습니다.

---

## 12. 구현

### 정적 미리보기 구조

```
taste-os/report/
├── index.html
├── style.css
└── script.js
```

### 데이터

미리보기는 *하드코딩된 한 명의 샘플* 입니다. 실제 제품에서는 `GenomeArtifact` 객체 (`pipeline.ko.md` §4.2) 가 다음의 React 컴포넌트로 props 로 전달됩니다:

```tsx
type ReportProps = { genome: GenomeArtifact };

function Report({ genome }) {
  return (
    <article>
      <ThresholdBeat />
      <TasteName name={genome.tasteName} createdAt={genome.computedAt} />
      <Portrait text={genome.portrait} />
      <Currents currents={genome.currents} />
      <Atmosphere atm={genome.atmosphere} />
      <SixAxes vector={genome.vector.atmosphere} confidence={genome.vector.confidence} />
      <Palette palette={genome.palette} />
      <Kin kin={genome.kin} />
      <Resonances resonances={genome.resonances} />
      <MirrorLine line={genome.mirror} />
      <KeepBeacon onKeep={() => sealMirror(genome.mirror)} />
      <Footer />
    </article>
  );
}
```

### 진입 안무 핵심 코드

```js
// 1) 페이지 로드 직후 입장 시퀀스 실행
async function playEntry() {
  await wait(1800);          // grain, orbs, sigil이 들어옴
  reveal('.entry-line');     // "당신의 풍경, 함께 봐요"
  await wait(2200);
  fadeOut('.entry-line');
  await wait(1400);          // 검은 정적
  reveal('.taste-name');     // Taste Name materializes
  await wait(2400);
  reveal('.taste-meta');     // 영문 + 날짜
  reveal('.scroll-hint');
}

// 2) 스크롤 시 진입 안무 즉시 압축
let entryStarted = Date.now();
window.addEventListener('scroll', () => {
  const elapsed = Date.now() - entryStarted;
  if (elapsed < 5000) compressEntry();
}, { once: true });
```

### Mirror Line의 진입

별도 IntersectionObserver — 일반 0.3 threshold가 아니라 0.5 (절반이 보일 때):

```js
const mirrorObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      revealMirrorLineSequence();
      mirrorObserver.disconnect();
    }
  },
  { threshold: 0.5 }
);
mirrorObserver.observe(document.querySelector('.mirror-section'));
```

### Six Axes 점의 위치

위치 5단계 (0-4, 왼쪽-끝부터 오른쪽-끝까지):

```js
const AXES = [
  { axis: '빛',   poleL: 'Vesper',   poleR: 'Meridian', position: 1 },
  { axis: '밀도', poleL: 'Hush',     poleR: 'Loam',     position: 1 },
  { axis: '거리', poleL: 'Intimate', poleR: 'Sublime',  position: 1 },
  { axis: '자세', poleL: 'Inward',   poleR: 'Outward',  position: 1 },
  { axis: '표면', poleL: 'Stone',    poleR: 'Smoke',    position: 1 },
  { axis: '시대', poleL: 'Linen',    poleR: 'Chrome',   position: 1 },
];
// position 0 = far-left, 1 = left, 2 = center, 3 = right, 4 = far-right
```

---

## 닫는 말

이 화면은 *판단* 의 화면이 아닙니다. *알아봄* 의 화면이에요.

성공의 단일 신호: 사용자가 페이지를 닫은 직후, *한 문장* 을 다시 한 번 보고 싶어집니다. 그래서 뒤로 가기를 누르거나, 스크린샷을 찍거나, 그 한 줄을 휴대폰 메모에 옮겨 적습니다. 그 뒤의 어떤 분석도 그 행동 하나만큼 중요하지 않아요.

이 페이지가 잘 만들어진다면, 한 사람은 — 자기 자신을 *AI 가 보았다* 가 아니라 — *처음으로 누군가에게 보였다* 고 느낄 것입니다. 그게 차이의 전부예요.
