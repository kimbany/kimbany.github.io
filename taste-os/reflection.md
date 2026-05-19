# Taste OS — Reflection / 늦은 밤의 자기 만남

> 설문조사가 아닙니다. *늦은 밤 혼자 노트북 앞에 앉아 있는* 자리.
> 사용자가 질문을 따라 갈수록 — *페이지가 더 깊이 따뜻해집니다*.

이 문서는 Taste OS 온보딩의 **감정적 성찰 질문 화면** 단독 사양입니다. 다른 온보딩 화면들 (`images/`, `music/`, `quotes/`, `atmosphere/`) 과 같은 3-상태 구조를 따르되, 이 화면만의 *두 가지 시그니처*:

1. **질문이 진행될수록 페이지 분위기가 *점진적으로 따뜻해짐*** — 감정의 깊이 시각화
2. **사용자가 타이핑하면 위의 질문이 *살짝 흐려짐*** — focus-pull (영화적 초점 이동)

함께 읽기: `atmosphere.md` (자매 화면 — 비슷한 *분위기 누적* 패턴), `voice.md` (한국어 보이스), `motion.md` (모션 시스템).

구현: `taste-os/reflection/index.html` + `style.css` + `script.js`.

---

## 목차

0. [철학 — 질문은 거울이 아니다](#0-철학--질문은-거울이-아니다)
1. [세 가지 상태](#1-세-가지-상태)
2. [State A — Emotional Intro](#2-state-a--emotional-intro)
3. [State B — Six Questions](#3-state-b--six-questions)
4. [6 개의 질문 — 깊어지는 순서](#4-6-개의-질문--깊어지는-순서)
5. [시그니처 1 — 질문이 진행될수록 페이지가 깊어짐](#5-시그니처-1--질문이-진행될수록-페이지가-깊어짐)
6. [시그니처 2 — Focus Pull (타이핑 → 질문 흐려짐)](#6-시그니처-2--focus-pull-타이핑--질문-흐려짐)
7. [Textarea 디자인 — 일기장 같은 자리](#7-textarea-디자인--일기장-같은-자리)
8. [Skip — 부끄러움 없는 통과](#8-skip--부끄러움-없는-통과)
9. [State C — *분석으로의 만남*](#9-state-c--분석으로의-만남)
10. [Next.js + Framer Motion 구현](#10-nextjs--framer-motion-구현)
11. [정적 미리보기](#11-정적-미리보기)

---

## 0. 철학 — 질문은 거울이 아니다

심리 검사나 설문조사는 *사용자를 분류* 하기 위해 질문합니다. *"당신은 1-7 중 몇입니까?"*. 이 화면은 *완전히 반대*:

> ***질문은 사용자가 *자기에게 더 정직해지는* 도구이지, *시스템이 사용자를 분류하는* 도구가 아니다.***

여섯 개의 질문은 *답을 수집* 하기 위해 있지 않아요. 답이 *생기는 과정에서* — 사용자가 *늦은 밤 혼자 노트북 앞에 앉아* *자기 안의 무언가를 발견* 하는 *자리* 를 만들기 위해 있습니다.

### 한 줄 약속

> ***답을 쓰지 않아도 좋아요. 질문을 *읽는 것만으로* 충분합니다.***

이를 위해:
- 모든 질문은 *건너뛸 수 있음* — *"이번엔 지나갈게요"*
- 강제 답변 없음
- 글자 수 제한 명시 없음 (있지만 표시하지 않음)
- *"X 개를 답하세요"* 같은 카운터 없음

### 어떤 기분을 만들고 싶은가

> ***"내가 나에게 *조금 더 솔직해지고 있다*."***

이 페이지를 끝낸 사용자가 *시스템이 자기를 알아보았다* 가 아닌 — *자기가 자기를 알아보았다* 고 느꼈으면 함.

---

## 1. 세 가지 상태

```
                                                                            
   STATE A · Emotional Intro                    ~6 초                       
   ─────────────────────────────────────                                    
                                                                            
   "우리는 생각보다 많은 감정을                                              
    지나쳐 살아갑니다."                                                     
                                                                            
   잠시 멈춰서,                                                              
   당신 안에 오래 남아 있던                                                  
   감정들을 바라봐주세요.                                                    
                                                                            
   ──── 시작하기 ────                                                       
                                                                            
       │                                                                    
       ▼                                                                    
                                                                            
   STATE B · Six Questions (one at a time)        ~3-10 분 / 사용자 페이스   
   ─────────────────────────────────────                                    
                                                                            
   당신은 어떤 순간에                                                        
   가장 자기다워지나요?                                                      
                                                                            
   ──────────                                                                
                                                                            
   답을 천천히 쓰셔도 좋아요.                                                
                                                                            
                                                                            
   ──── 다음 질문으로 ────       이번엔 지나갈게요                          
                                                                            
   (← Q1 → Q2 → Q3 → Q4 → Q5 → Q6 ─ 각 질문 transition 1.4s)                  
                                                                            
   * 페이지의 분위기가 Q1 (차가움) → Q6 (가장 따뜻함) 로 점진 변화           
                                                                            
       │ (Q6 완료 또는 skip)                                                  
       ▼                                                                    
                                                                            
   STATE C · Transition to Analysis              ~8 초                     
   ─────────────────────────────────────                                    
                                                                            
   "여기까지 함께 머물러 주셔서 고마워요."                                   
                                                                            
   "이제, 당신을 천천히 만나볼게요."                                         
                                                                            
       → (real app: AI 분석 화면)                                            
                                                                            
```

---

## 2. State A — Emotional Intro

`atmosphere/` 와 같은 6초 시퀀스, 카피만 다름.

### 시퀀스

```
t = 0.0s    검은 화면. ambient (orbs, grain, sigil) fade in
t = 1.5s    ★ Headline reveal blur (1.8s)
              "우리는 생각보다 많은 감정을"
              "지나쳐 살아갑니다."
t = 3.8s    Hairline draws
t = 4.4s    Sub copy 3-line staggered reveal:
              "잠시 멈춰서,"
              "당신 안에 오래 남아 있던"
              "감정들을 바라봐주세요."
t = 6.4s    CTA: "──── 시작하기 ────"
```

### 카피

| 슬롯 | 한국어 |
|---|---|
| Headline | 우리는 생각보다 많은 감정을<br/>지나쳐 살아갑니다. |
| Sub line 1 | 잠시 멈춰서, |
| Sub line 2 | 당신 안에 오래 남아 있던 |
| Sub line 3 | 감정들을 바라봐주세요. |
| CTA | ──── 시작하기 ──── |

---

## 3. State B — Six Questions

여섯 질문을 *한 번에 하나씩* 표시. 각 질문이 *자기의 화면* 을 가짐.

### 화면 구성

```
                                                                            
   ◌                                                                       
                                                                            
                                                                            
                                                                            
                                                                            
                                                                            
              당신은 어떤 순간에                                            
              가장 자기다워지나요?                                          
                                                                            
                                                                            
              ────                                                          
                                                                            
                                                                            
              [textarea — italic, underline only, expanding]               
                                                                            
                                                                            
                                                                            
              ──── 다음 질문으로 ────                                       
                                                                            
                          이번엔 지나갈게요                                  
                                                                            
                                                                            
                                                                            
```

### 요소

1. **질문** — display italic, large, 가운데 정렬
2. **헤어라인** — 32px wide, 질문과 답 사이
3. **Textarea** — 일기장 같은 minimal 스타일 (§7)
4. **다음 질문 버튼** — Beacon
5. **건너뛰기 링크** — *"이번엔 지나갈게요"* (skip-link 스타일, mist 색)

### 진행

- 사용자가 *"다음 질문으로"* 클릭 → 1.4s 페이드 아웃 → 0.6s 정적 → 1.0s 페이드 인
- 또는 *"이번엔 지나갈게요"* → 답 *빈 채로* 다음 질문
- 마지막 (Q6) 에서는 버튼 label 이 *"이제 당신의 분위기를 천천히 이해해볼게요"* 로 변함

### *카운터 없음, 진행률 없음*

- *"3 / 6"* 표시 *없음*
- 진행률 바 *없음*
- 사용자가 *몇 번째 질문* 인지 *명시적으로* 알 수 없음

진행은 **페이지의 분위기 변화로만 인지** (§5).

---

## 4. 6 개의 질문 — 깊어지는 순서

질문 순서가 *의도된 감정의 흐름*: 자기 인식 → 머무름 → 취약함 → 안식 → 변화 → 그리움.

### Q1 — 자기 인식

```
질문:        당신은 어떤 순간에 가장 자기다워지나요?
placeholder: 천천히 생각해보셔도 좋아요.
atmosphere:  cold (silver-blue dominant)
```

### Q2 — 머무름

```
질문:        최근 오래 마음에 남았던 장면이 있나요?
placeholder: 떠오르는 그대로 적어보세요.
atmosphere:  warming-1 (silver-blue + 미세 rose)
```

### Q3 — 취약함 (가장 깊은 질문)

```
질문:        사람들에게 쉽게 설명할 수 없는 감정이 있나요?
placeholder: 정확하지 않아도 괜찮아요.
atmosphere:  warming-2 (rose 등장, mid-cool)
```

### Q4 — 안식

```
질문:        당신은 어떤 공기 속에서 편안함을 느끼나요?
placeholder: 어떤 빛, 어떤 시간, 어떤 온도.
atmosphere:  warm-1 (rose 강화)
```

### Q5 — 변화

```
질문:        예전보다 달라졌다고 느끼는 감정이 있나요?
placeholder: 더 따뜻해진 부분, 더 식어진 부분.
atmosphere:  warm-2 (rose + ember)
```

### Q6 — 그리움 (가장 따뜻한 질문)

```
질문:        지금 당신이 가장 그리워하는 분위기는 무엇인가요?
placeholder: 그리움도 결의 일부예요.
atmosphere:  full warmth (rose + ember + warm central radial)
```

### 6 질문의 *정서적 호*

```
                                                                  
   Q1                Q2              Q3                          
   자기다움          머무름          취약함                       
   ───────          ───────         ───────                      
   "어떤 순간"      "어떤 장면"      "어떤 감정"                   
                                                                  
   →                →               →                            
                                                                  
   Q4               Q5              Q6                           
   안식             변화            그리움                        
   ───────          ───────         ───────                      
   "어떤 공기"      "어떤 다름"      "어떤 분위기"                  
                                                                  
   전체 호:  자기 인식  →  외부 관찰  →  내면 인정                    
            →  자기 환경  →  시간의 흐름  →  그리움의 인정          
                                                                  
```

이 6 질문이 *함께* — *자기 자신을 만나는 짧은 영화* 의 구조.

---

## 5. 시그니처 1 — 질문이 진행될수록 페이지가 깊어짐

**가장 결정적인 시각 시그니처.** Q1 에서 Q6 까지, 페이지의 ambient 가 *점진적으로 따뜻해지고 깊어짐*.

### 6 단계 atmosphere

각 질문이 자신만의 *atmosphere tier* 를 가짐:

```css
/* Q1: cold (silver-blue dominant) */
body.q-1 .orb-2 { opacity: 1.0; }
body.q-1::before {
  background: radial-gradient(ellipse at 50% 0%, rgba(143, 160, 172, 0.04), transparent 60%);
}

/* Q2: warming-1 (subtle rose appears) */
body.q-2::before {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(143, 160, 172, 0.04), transparent 60%),
    radial-gradient(ellipse at 30% 100%, rgba(176, 118, 114, 0.03), transparent 50%);
}

/* Q3: warming-2 (rose dominant, silver fading) */
body.q-3::before {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(143, 160, 172, 0.02), transparent 60%),
    radial-gradient(ellipse at 30% 100%, rgba(176, 118, 114, 0.05), transparent 50%);
}

/* Q4: warm-1 (rose + center warmth) */
body.q-4::before {
  background:
    radial-gradient(ellipse at 30% 100%, rgba(176, 118, 114, 0.06), transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(217, 166, 108, 0.03), transparent 60%);
}

/* Q5: warm-2 (rose + ember) */
body.q-5::before {
  background:
    radial-gradient(ellipse at 30% 100%, rgba(176, 118, 114, 0.07), transparent 50%),
    radial-gradient(ellipse at 70% 50%, rgba(217, 166, 108, 0.05), transparent 60%);
}

/* Q6: full warmth (rose + ember + center) */
body.q-6::before {
  background:
    radial-gradient(ellipse at 30% 100%, rgba(176, 118, 114, 0.09), transparent 50%),
    radial-gradient(ellipse at 70% 50%, rgba(217, 166, 108, 0.06), transparent 60%),
    radial-gradient(ellipse at 50% 50%, rgba(176, 118, 114, 0.04), transparent 50%);
}
```

### 모든 변화는 2초 transition

```css
body::before { transition: background 2s ease; }
.orb { transition: opacity 2s ease; }
```

사용자가 *질문이 변하면서 페이지가 깊어지는 것* 을 *알아채지만 의식적으로 알아채지 않게*.

### 빛 구체도 함께 변화

```css
body.q-1 .orb-1 { opacity: 0.65; }
body.q-3 .orb-1 { opacity: 0.85; }
body.q-6 .orb-1 { opacity: 1.10; }
```

질문이 깊어질수록 *주변 빛* 도 함께 깊어짐.

### 왜 *6 단계* 인가

3-4 단계는 *너무 거침* (사용자가 변화를 못 느낌).
8 단계는 *너무 미세* (단계가 의미 없어짐).
*6 단계* — 각 질문에 *하나의 단계*. *질문 하나 = 분위기 한 단계*.

---

## 6. 시그니처 2 — Focus Pull (타이핑 → 질문 흐려짐)

이 페이지만의 또 다른 시그니처. **사용자가 textarea 에 타이핑하면 — 위의 질문이 *살짝 흐려짐***. 영화적 *초점 이동*.

### 동작

```
사용자 타이핑 시작
  ↓
1.2s transition 으로 질문 opacity 0.85 → 0.55
질문이 *읽는 자리* 에서 *배경* 으로 물러남
                     ↓
                  textarea 가 *주된 자리* 가 됨
                     ↓
사용자 3 초 이상 타이핑 멈추면
  ↓
질문 opacity 0.55 → 0.85 으로 복귀
질문이 *다시 읽혀짐* — re-reading the prompt
```

### CSS

```css
.question-screen .question-text {
  opacity: 0.92;
  transition: opacity 1.2s ease, filter 1.2s ease;
}

.question-screen.is-typing .question-text {
  opacity: 0.55;
  filter: blur(0.5px);
}
```

### JS

```js
let typingTimeout;
textarea.addEventListener('input', () => {
  questionScreen.classList.add('is-typing');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    questionScreen.classList.remove('is-typing');
  }, 3000);
});
```

### 효과의 *시* 적 의미

- 사용자가 *읽을 때*: 질문이 *또렷*
- 사용자가 *쓸 때*: 질문이 *물러나고*, 사용자의 *답* 이 주된 자리
- 사용자가 *멈출 때*: 질문이 *다시 또렷* — *다시 한 번 읽고 또 쓸 수 있게*

이게 *대화의 리듬* 의 시각화. *"읽기 → 쓰기 → 다시 읽기 → 다시 쓰기"*.

영화의 *focus pull* 과 같은 디자인 — 카메라가 *foreground 과 background 사이를 부드럽게 이동*.

---

## 7. Textarea 디자인 — 일기장 같은 자리

### 활자

```css
.answer-input {
  font-family: var(--font-text);
  font-style: italic;
  font-weight: 350;
  font-size: clamp(16px, 1.8vw, 20px);
  line-height: 1.85;
  letter-spacing: 0.005em;
  color: var(--c-beige);
  text-align: center;
}
```

본문체 (Inter italic) — 질문은 *display serif italic*. 두 글꼴의 대화 같은 *높이 차이* — 질문은 *낭송조*, 답은 *일기조*.

### 시각 — *minimal 한 일기장*

```css
.answer-input {
  width: 100%;
  max-width: 480px;
  min-height: 80px;
  background: transparent;
  border: 0;                                /* 전체 보더 없음 */
  border-bottom: 1px solid var(--c-bone);   /* 밑줄만 */
  border-color: rgba(68, 62, 55, 0.4);
  padding: 20px 8px;
  resize: none;
  outline: none;
  transition: border-color 0.8s ease;
}

.answer-input:focus {
  border-bottom-color: rgba(176, 118, 114, 0.4);
}

.answer-input::placeholder {
  color: var(--c-mist);
  opacity: 0.4;
  font-style: italic;
}
```

### Auto-expand — 사용자가 *글이 끊긴다* 고 느끼지 않게

```js
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

textarea.addEventListener('input', () => autoResize(textarea));
```

### 글자 수 제한 — *있지만 표시하지 않음*

서버 저장 시 500자 cap. 하지만 UI 는 *카운터 없음* — *productivity* 의 시각화 피함.

### Spellcheck — *비활성*

```html
<textarea spellcheck="false" autocapitalize="off">
```

빨간 밑줄이 *명상의 톤* 을 깨뜨림. 사용자가 *틀려도 괜찮은* 자리.

### 커서 — *호흡하듯*

```css
.answer-input {
  caret-color: var(--c-rose);
}
```

기본 검은 caret 대신 *rose* — 사용자의 *입력 위치* 도 *방의 분위기와 같은 톤*.

---

## 8. Skip — 부끄러움 없는 통과

각 질문의 *우측 하단* 에 *"이번엔 지나갈게요"* 링크.

```css
.skip-link {
  font-family: var(--font-text);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--c-mist);
  opacity: 0.5;
  padding: 8px 12px;
  transition: opacity 0.7s ease, color 0.7s ease;
}

.skip-link:hover { color: var(--c-rose); opacity: 1; }
```

### Skip 의 카피

```
이번엔 지나갈게요
```

*"건너뛰기"* / *"Skip"* / *"Next"* 가 아닌 — *"이번엔 지나갈게요"*.

*이번엔* 이 중요 — *나중에* 라는 *공간* 을 열어둠. *영원히 건너뛰는* 게 아니라 *지금만 멀리 가는* 행동.

### Skip 의 행위

1. textarea 비어 있는 채로 다음 질문으로
2. 사용자가 *부끄러워하지 않도록* — *"이 질문은 답을 안 적으셨네요"* 같은 메시지 *없음*
3. 마지막에 *답한 질문* 만 시스템이 분석에 사용 (real app)

### Skip 카피 변형 — 마지막 질문 (Q6)

Q6 에서는 skip 카피가 변함:

```
Q1-Q5:   이번엔 지나갈게요
Q6:      답하지 않아도 괜찮아요
```

마지막 질문이라 *"이번엔"* 이 의미 없음. *"답하지 않아도 괜찮아요"* — 더 *최종적인* 부드러움.

---

## 9. State C — *분석으로의 만남*

`atmosphere/` 의 State C 와 *비슷한 톤*, 더 *intimate*.

### 시퀀스 (8초)

```
t = 0.0s    "다음 질문으로" → "이제 당신의 분위기를 천천히 이해해볼게요" 변환된 CTA warm
t = 0.5s    Q6 화면 fade out (1.4s)
              orbs, grain 유지
t = 2.0s    검은 정적 + backdrop blur
t = 2.4s    첫 문장 reveal blur (1.6s)
              "여기까지 함께 머물러 주셔서 고마워요."
t = 4.0s    hold + fade
t = 6.0s    두 번째 문장 reveal blur
              "이제, 당신을 천천히 만나볼게요."
t = 8.4s    real app: AI 분석 화면으로 / demo: Intro 복귀
```

### 두 문장의 무게

| | 의미 |
|---|---|
| *"여기까지 함께 머물러 주셔서 고마워요."* | *함께 머물렀음* 을 honoring — 사용자가 *답하지 않고도 머문* 부분도 포함 |
| *"이제, 당신을 천천히 만나볼게요."* | *당신을* 만나겠다는 약속 — *분석* 이 아닌 *만남* |

다른 자매 화면들과의 비교:

```
images/      → "이제, 다음으로." (수평 이동)
music/       → "이제, 다음 감정으로." (수평)
quotes/      → "이제, 다음 분위기로." (수평)
atmosphere/  → "이제, 당신의 풍경을 만들어볼게요." (수직 — 건축)
reflection/ → "이제, 당신을 천천히 만나볼게요." (수직 — 만남)  ★ 이 페이지
```

*"풍경을 만들어볼게요"* 는 *시스템이 무언가를 짓는* 약속. *"당신을 만나볼게요"* 는 *시스템이 사용자에게 다가가는* 약속. 더 *친밀*.

### Forward CTA 의 비대칭성

Q1~Q5 의 버튼: *"다음 질문으로"* (간단, 절제)

Q6 의 버튼: ***"이제 당신의 분위기를 천천히 이해해볼게요"*** (시적, 무거운)

Q6 에서 버튼이 *시적으로 길어짐* — *마지막 질문이 끝났다* 는 신호이자 *분석으로의 전환* 의 약속.

---

## 10. Next.js + Framer Motion 구현

### 10.1 디렉토리 구조

```
app/
  onboarding/
    reflection/
      page.tsx
components/
  reflection/
    Reflection.tsx              ← 메인 (3 상태 + 6 질문 인덱스)
    IntroState.tsx
    QuestionScreen.tsx          ← 단일 질문 화면
    AnswerInput.tsx             ← textarea (auto-expand)
    ForwardBeat.tsx
data/
  questions.ts                  ← 6 질문 + atmosphere tier
hooks/
  useTypingFocus.ts             ← focus pull 로직
```

### 10.2 `data/questions.ts`

```ts
export type Question = {
  id: string;
  text: string;
  placeholder: string;
  tier: number;          // 1-6 (atmosphere tier)
};

export const QUESTIONS: Question[] = [
  {
    id: 'self',
    text: '당신은 어떤 순간에\n가장 자기다워지나요?',
    placeholder: '천천히 생각해보셔도 좋아요.',
    tier: 1,
  },
  {
    id: 'lingering',
    text: '최근 오래 마음에 남았던\n장면이 있나요?',
    placeholder: '떠오르는 그대로 적어보세요.',
    tier: 2,
  },
  {
    id: 'unspoken',
    text: '사람들에게 쉽게 설명할 수 없는\n감정이 있나요?',
    placeholder: '정확하지 않아도 괜찮아요.',
    tier: 3,
  },
  {
    id: 'comfort',
    text: '당신은 어떤 공기 속에서\n편안함을 느끼나요?',
    placeholder: '어떤 빛, 어떤 시간, 어떤 온도.',
    tier: 4,
  },
  {
    id: 'change',
    text: '예전보다 달라졌다고 느끼는\n감정이 있나요?',
    placeholder: '더 따뜻해진 부분, 더 식어진 부분.',
    tier: 5,
  },
  {
    id: 'longing',
    text: '지금 당신이 가장 그리워하는\n분위기는 무엇인가요?',
    placeholder: '그리움도 결의 일부예요.',
    tier: 6,
  },
];
```

### 10.3 `hooks/useTypingFocus.ts`

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export function useTypingFocus(textareaRef: React.RefObject<HTMLTextAreaElement>) {
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    function onInput() {
      setIsTyping(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
    }

    ta.addEventListener('input', onInput);
    return () => {
      ta.removeEventListener('input', onInput);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [textareaRef]);

  return isTyping;
}
```

### 10.4 `components/reflection/QuestionScreen.tsx`

```tsx
'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '@/data/questions';
import { useTypingFocus } from '@/hooks/useTypingFocus';

export function QuestionScreen({
  question,
  answer,
  onChange,
  onNext,
  onSkip,
  isLast,
}: {
  question: Question;
  answer: string;
  onChange: (text: string) => void;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTyping = useTypingFocus(textareaRef);

  function handleResize() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  return (
    <motion.div
      className={`question-screen ${isTyping ? 'is-typing' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0 }}
    >
      <motion.h2
        key={question.id + '-q'}
        className="question-text"
        initial={{ opacity: 0, filter: 'blur(14px)' }}
        animate={{ opacity: isTyping ? 0.55 : 0.92, filter: 'blur(0)' }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.30, 1] }}
      >
        {question.text.split('\n').map((line, i) => (
          <span key={i} className="block">{line}</span>
        ))}
      </motion.h2>

      <hr className="hairline-mid" />

      <textarea
        ref={textareaRef}
        className="answer-input"
        value={answer}
        onChange={(e) => {
          onChange(e.target.value);
          handleResize();
        }}
        placeholder={question.placeholder}
        spellCheck={false}
        autoCapitalize="off"
        rows={2}
      />

      <div className="question-actions">
        <button
          className={`beacon ${isLast ? 'beacon-final' : ''}`}
          onClick={onNext}
        >
          <span className="dash">────</span>
          <span className="beacon-label">
            {isLast ? '이제 당신의 분위기를 천천히 이해해볼게요' : '다음 질문으로'}
          </span>
          <span className="dash">────</span>
        </button>

        <button className="skip-link" onClick={onSkip}>
          {isLast ? '답하지 않아도 괜찮아요' : '이번엔 지나갈게요'}
        </button>
      </div>
    </motion.div>
  );
}
```

### 10.5 `components/reflection/Reflection.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTIONS } from '@/data/questions';
import { IntroState } from './IntroState';
import { QuestionScreen } from './QuestionScreen';
import { ForwardBeat } from './ForwardBeat';

type Phase = 'intro' | 'questions' | 'forward';

export function Reflection() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(QUESTIONS.map(() => ''));

  const currentQuestion = QUESTIONS[questionIndex];
  const isLastQuestion = questionIndex === QUESTIONS.length - 1;

  // Update atmosphere tier based on current question
  useEffect(() => {
    if (phase !== 'questions') return;
    const body = document.body;
    body.className = body.className.replace(/q-\d+/g, '');
    body.classList.add(`q-${currentQuestion.tier}`);
  }, [phase, currentQuestion?.tier]);

  function next() {
    if (isLastQuestion) {
      setPhase('forward');
      setTimeout(() => router.push('/analysis'), 9400);
    } else {
      setQuestionIndex((i) => i + 1);
    }
  }

  return (
    <>
      {phase === 'intro' && <IntroState onStart={() => setPhase('questions')} />}

      {phase === 'questions' && (
        <QuestionScreen
          question={currentQuestion}
          answer={answers[questionIndex]}
          onChange={(text) => {
            const newAnswers = [...answers];
            newAnswers[questionIndex] = text;
            setAnswers(newAnswers);
          }}
          onNext={next}
          onSkip={next}
          isLast={isLastQuestion}
        />
      )}

      {phase === 'forward' && <ForwardBeat />}
    </>
  );
}
```

---

## 11. 정적 미리보기

```
taste-os/reflection/
├── index.html
├── style.css
└── script.js
```

머지 후 `kimbany.github.io/taste-os/reflection/`:

1. **State A** — Intro 6초
2. ***"시작하기"*** 클릭
3. **State B** — Q1 등장:
   - 질문 읽기 (또렷)
   - textarea 에 *천천히* 답을 쓰면 — **질문이 살짝 흐려짐** (focus pull)
   - 3 초 멈추면 — **질문이 다시 또렷해짐**
   - 답을 다 적었거나 비워두고 *"다음 질문으로"* 클릭
4. **Q2 → Q3 → Q4 → Q5 → Q6** 순서로 진행:
   - 각 질문 transition 1.4s fade-out + 1.0s fade-in
   - **페이지의 분위기가 점진적으로 따뜻해짐**:
     - Q1 (silver-blue) → Q3 (rose 등장) → Q6 (full warmth)
5. **Q6 에서**:
   - 버튼 카피가 *"이제 당신의 분위기를 천천히 이해해볼게요"* 로 변함
   - skip 카피가 *"답하지 않아도 괜찮아요"* 로 변함
6. **클릭 후 State C** — 분석 톤 Threshold Beat (8초)

특히 *Q1 에서 Q6 까지 끝까지 진행* 한 후 — 마지막 화면이 *처음 화면과 *얼마나 다른 분위기* 인지* 비교해보세요. 같은 페이지인데 *완전히 다른 방* 같습니다. 그게 *질문을 따라간 사람의 변화* 의 시각화.

---

## 닫는 말

이 페이지의 진짜 디자인 의도:

> ***사용자가 6 번째 질문을 끝낼 때 — *자기에게 조금 더 솔직해졌다* 고 느끼는 것.***

이를 위해:
- 질문이 *시인 같은* 톤 — 정답을 묻지 않음
- 답이 *없어도 되는* 모든 질문
- 질문 사이의 *호흡 시간* (1.4s fade out + 0.6s 정적 + 1.0s fade in)
- *Focus pull* — 사용자가 *읽고 → 쓰고 → 다시 읽고* 의 리듬
- *Atmosphere shift* — 사용자가 *질문을 따라 깊어지는 것* 의 시각화

엔지니어가 이 화면을 빌드할 때 마지막 검사:

> ***사용자가 textarea 에 타이핑할 때 위의 질문이 *살짝 흐려지는가*?***

만약 *no* — focus pull 시그니처가 빠진 것. 그건 *대화의 리듬* 이 없는 *설문조사 폼* 임.

이 *focus pull* 이 작동할 때 — 이 페이지는 *질문 폼* 이 아닌 *늦은 밤 자기와의 대화* 가 됩니다.
