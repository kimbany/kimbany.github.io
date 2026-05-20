# CLAUDE.md — ASMR Mix App

이 문서는 Claude Code가 매 세션 시작 시 읽는 프로젝트 컨텍스트입니다.
새 세션은 항상 이 파일을 먼저 읽고 작업 맥락을 복구하세요.

---

## 1. 프로젝트 개요

**ASMR Mix App** — 여러 ASMR/환경음 트랙을 동시에 믹스해 재생하고, 타이머와
페이드아웃으로 수면·집중·명상을 돕는 앱.

- 핵심 가치: "내가 만드는 나만의 사운드 믹스"
- 타깃: 수면 보조, 집중(공부/작업), 명상·이완
- 톤: 미니멀, 어두운 톤, 다크모드 우선

### 1.1 플랫폼 — 웹으로 결정 (2026-05-20)

이 저장소는 **GitHub Pages 정적 웹 사이트**(`kimbany.github.io`)이므로 **웹 앱**으로
진행하기로 결정. 구현체는 `asmr/index.html` (단일 파일, Web Audio API로 모든 소리를
실시간 합성 — 별도 오디오 파일 불필요).

> 본 문서의 데이터 모델/큐레이션/UX 원칙은 **플랫폼 무관**하게 적용됩니다.
> 플랫폼별 기술 결정은 §6 참조.

---

## 2. 데이터 모델

플랫폼과 무관한 논리 모델. 구현 시 각 플랫폼 관용구로 매핑(Swift struct +
Codable / TypeScript interface 등). 모든 엔티티는 고유 `id`와 직렬화 가능.

### Sound (사운드 메타데이터)
| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 영문 snake_case 고유 ID (예: `rain_window`) |
| `title` | string | 표시명 (한국어, 예: "빗소리 (창문)") |
| `category` | string | `nature` / `urban` / `white_noise` / `human` / `korean` 등 |
| `filename` | string | 오디오 파일명 (예: `rain_window.m4a`) |
| `durationSeconds` | int | 루프 길이(초) |
| `frequencyBand` | string | `low` / `mid` / `high` — 믹싱 호환성 판단용 |
| `isKoreanSpecific` | bool | 한국 시장 특화 사운드 여부 |
| `scenarios` | string[] | `sleep` / `focus` / `meditation` / `relax` 중 1~2개 |

### Mix (사용자 믹스)
| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 고유 ID |
| `name` | string | 믹스 이름 |
| `sounds` | MixSound[] | 포함 사운드 + 볼륨 구성 |
| `playbackMode` | string | `simultaneous` / `sequential` / `random` |
| `createdAt` | date | 생성 시각 |
| `isFavorite` | bool | 즐겨찾기 |

### MixSound (믹스 내 트랙 구성)
| 필드 | 타입 | 설명 |
|---|---|---|
| `soundId` | string | 참조하는 Sound.id |
| `volume` | float | 0.0 ~ 1.0 |
| `order` | int | 순차 모드 재생 순서 |

### PlaybackSession (재생 기록 — 통계용)
| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 고유 ID |
| `mixId` | string? | 사용한 믹스 (즉석 믹스면 null) |
| `soundIds` | string[] | 실제 재생된 사운드들 |
| `startedAt` | date | 시작 시각 |
| `durationSeconds` | int | 실제 재생 길이 |
| `completedNaturally` | bool | 타이머 종료 여부 |

---

## 3. 사운드 큐레이션 (기본 30개)

명명 규칙: **영문 snake_case ID**, 표시명은 한국어.
`frequencyBand`는 믹싱 시 같은 대역이 겹치면 탁해지므로 분산 조합 권장.

### 3.1 한국 시장 특화 사운드 (9개, `isKoreanSpecific: true`)
원본 기획의 "한국 시장 특화 사항" 큐레이션. 한국 사용자에게 친숙한 정서적 환경음.

1. `rain_hanok` — 한옥 처마 빗소리
2. `temple_bell` — 산사 풍경(風磬) 소리
3. `cicada_summer` — 한여름 매미 소리
4. `convenience_store` — 편의점 매장 소음
5. `subway_seoul` — 지하철 객실 소음
6. `pojangmacha` — 포장마차 분위기
7. `country_night` — 시골 밤 풀벌레
8. `pension_fireplace` — 펜션 장작 난로
9. `study_cafe` — 스터디카페 백색소음

### 3.2 글로벌 표준 사운드 (21개, 경쟁앱 분석 기반)
Nature: `rain_window`, `rain_forest`, `thunder`, `ocean_waves`, `stream_creek`,
`waterfall`, `wind_trees`, `birdsong`, `crickets`
Fire/Cozy: `fireplace`, `campfire`
Urban/Ambience: `cafe_chatter`, `train_ride`, `airplane_cabin`, `keyboard_typing`
White/Color noise: `white_noise`, `pink_noise`, `brown_noise`, `fan_hum`
Human: `heartbeat`, `breathing`

> 위 30개는 메타데이터만 우선 정의(`Resources/sounds_metadata.json` 등). 실제
> 오디오 파일은 추후 동일 파일명으로 추가. 파일이 없으면 로딩 시 **경고만** 띄우고
> 앱은 계속 동작해야 함.

---

## 4. 핵심 기능 (오디오 엔진 요구사항)

PoC에서 가장 먼저 검증해야 할 항목:

1. 3개 이상 트랙 **동시 재생** (최대 5개)
2. 트랙별 **실시간 개별 볼륨** 조절
3. 트랙 추가/제거 시 **페이드인/아웃** (끊김 없음)
4. **백그라운드 재생** (앱이 백그라운드여도 지속)
5. **잠금화면 컨트롤** (재생/일시정지)
6. 타이머 종료 시 **페이드아웃 후 자동 정지**

타이머 프리셋: 15분 / 30분 / 1시간 / 2시간 / 8시간 / ∞
페이드아웃: 0~120초 슬라이더

---

## 5. UX 원칙

- 다크모드 우선, OLED 트루블랙 지원
- 모든 터치 영역 최소 44pt(웹은 44px 기준)
- 큰 폰트, 부드러운 곡선(cornerRadius 12~16)
- 미니멀, 어두운 톤
- 한국어 우선(Korean-first) — UI 카피·문서 모두 한국어

### 주요 화면
- **Home**: 인사말 + 오늘의 추천 믹스 + 내 믹스 그리드 + (v2) 커뮤니티
- **SoundPicker**: 탭(기본/내 사운드/커뮤니티) + 카테고리 칩 + 사운드 그리드
- **PlaybackSetup**: 재생 모드 + 타이머 프리셋 + 페이드아웃
- **NowPlaying**: 남은 시간 + 트랙별 볼륨 + 마스터 볼륨 + 재생 컨트롤
- **Statistics**: 주간 사용 시간 + TOP 사운드/믹스 + 일별 막대 차트

---

## 6. 기술 결정 기록 (ADR)

> 큰 결정이 생길 때마다 여기에 추가. 결정을 바꿔야 하면 영향 코드도 함께 정리.

- **플랫폼: 웹으로 결정** (2026-05-20, §1.1 참조).
- **웹 구현**: 단일 HTML 파일 `asmr/index.html`. 빌드 도구·프레임워크 없이 순수
  HTML/CSS/JS. Web Audio API로 모든 소리를 절차적으로 합성(오디오 파일 불필요).
  - 트랙별 볼륨/페이드: GainNode + `linearRampToValueAtTime`
  - 잠금화면 컨트롤: MediaSession API
  - 믹스 저장: localStorage (`asmr_mixes` 키)
- **iOS 보류**: 추후 네이티브가 필요하면 SwiftUI + AVAudioEngine로 별도 진행.

---

## 7. 작업 규칙

- 큰 변경/음성 인터페이스 등 중대한 변경은 **사용자 확인 후** 진행.
- 사운드 ID는 일관된 snake_case 영문.
- 작업 단계 완료 시 무엇을 만들었는지 **간단히** 요약(장황한 설명 금지).
- 중요한 결정사항은 이 문서 §6에 기록.
- 개발 브랜치: `claude/initial-project-setup-X5i8S`.
