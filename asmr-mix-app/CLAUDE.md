# ASMR Mix App — CLAUDE.md

이 파일은 Claude Code(또는 다른 AI 에이전트)가 새 세션을 시작할 때 **가장 먼저 읽는** 프로젝트 컨텍스트 문서입니다. 모든 결정사항·데이터 스키마·큐레이션 리스트가 여기에 기록됩니다. 큰 변경이 생기면 반드시 이 문서를 같이 업데이트하세요.

---

## 1. 프로젝트 개요

- **이름**: ASMR Mix App (가칭)
- **플랫폼**: iOS 17+ (네이티브)
- **언어/UI**: Swift 5.9+, SwiftUI
- **타깃 사용자**: 수면·집중·명상용 ASMR 사운드를 직접 믹스해서 듣고 싶은 한국 사용자
- **차별점**:
  1. **한국형 사운드 9종 큐레이션** (해외 ASMR 앱에 없는 한옥 처마 빗소리, 매미, 풍경 등)
  2. **다중 트랙 실시간 믹싱** (최대 5개 동시 + 개별 볼륨)
  3. **재생 모드 다양화** (동시 / 순차 / 랜덤)
  4. **사용 통계** (가장 많이 들은 사운드/믹스, 일별 사용 시간)
- **수익 모델 (v1.0 기준)**: 무료 + 인앱(프리미엄 사운드 팩, 무광고)

---

## 2. 아키텍처 결정사항

| 영역 | 선택 | 이유 |
|---|---|---|
| UI | SwiftUI | iOS17+ 타깃이라 충분히 성숙. 미리보기 빠름 |
| 패턴 | MVVM | SwiftUI와 자연스럽게 맞물림 |
| 저장 | SwiftData (iOS17+) | CoreData 대비 보일러플레이트 적음. Codable과 궁합 |
| 오디오 | AVAudioEngine + 다중 AVAudioPlayerNode | 트랙별 볼륨/이펙트 제어 필요 |
| 차트 | Apple Charts 프레임워크 | 통계 화면용. 외부 의존성 없음 |
| 의존성 관리 | SPM (Swift Package Manager) | 표준. CocoaPods 사용 안 함 |
| 미디어 제어 | MPNowPlayingInfoCenter + MPRemoteCommandCenter | 잠금화면 컨트롤 표준 |
| 백그라운드 | UIBackgroundModes = audio | Info.plist에 반드시 추가 |

### 라이브러리 사용 정책
- **외부 의존성 최소화**. 표준 프레임워크로 가능한 것은 외부 라이브러리를 쓰지 않습니다.
- 차후 다음만 후보로 고려: Lottie(애니메이션), Sentry(크래시 로깅), RevenueCat(인앱결제 추상화).

### 미지원 / 보류 사항
- iPad 전용 UI: v1.0은 iPhone 우선. iPad는 단순 확대로 동작.
- watchOS / CarPlay: v2.0+ 검토.
- Android: 검토 안 함.

---

## 3. 폴더 구조

```
asmr-mix-app/
├── App/                  # 앱 진입점, SceneDelegate
├── Models/               # 데이터 모델 (Sound, Mix, MixSound, PlaybackSession)
├── Views/                # SwiftUI 뷰
│   ├── Home/
│   ├── SoundPicker/
│   ├── Playback/
│   └── Statistics/
├── ViewModels/           # 각 화면별 ViewModel
├── Services/
│   ├── AudioEngine/      # AVAudioEngine 래퍼
│   ├── Storage/          # SwiftData 어댑터
│   ├── Timer/            # 타이머 + 페이드아웃
│   └── SoundLibrary/     # sounds_metadata.json 로더
├── Resources/
│   ├── sounds_metadata.json
│   ├── SampleSounds/     # *.m4a (개발용. 실제 파일은 라이선스 확보 후 교체)
│   └── Colors.xcassets
└── Utils/
```

---

## 4. 데이터 모델

모든 모델은 `Identifiable`, `Codable`, `Hashable` 채택. SwiftData 영속화 대상에는 `@Model` 추가.

### `Sound`
사운드 메타데이터. `sounds_metadata.json`에서 로드.
```swift
struct Sound: Identifiable, Codable, Hashable {
    let id: String              // "rain_window"
    let title: String           // "빗소리 (창문)"
    let category: Category      // .nature / .ambient / .asmrTrigger / .tonal
    let filename: String        // "rain_window.m4a"
    let durationSeconds: Int    // 루프 단위 길이
    let frequencyBand: FrequencyBand  // .low / .mid / .high — 믹스 호환성 추천 용도
    let isKoreanSpecific: Bool
    let scenarios: [Scenario]   // .sleep / .focus / .meditation / .relax
    let isPremium: Bool         // v1.0은 모두 false
}
```

### `Mix`
사용자가 저장한 사운드 조합.
```swift
@Model
final class Mix {
    @Attribute(.unique) var id: String      // UUID
    var name: String                        // "비 오는 카페"
    var sounds: [MixSound]                  // 1~5개
    var playbackMode: PlaybackMode          // .simultaneous / .sequential / .random
    var defaultTimerSeconds: Int?           // nil = 무한
    var defaultFadeOutSeconds: Int          // 기본 30
    var createdAt: Date
    var lastPlayedAt: Date?
    var playCount: Int
    var isFavorite: Bool
}
```

### `MixSound`
믹스 내 개별 트랙 (사운드 ID + 그 트랙의 볼륨).
```swift
struct MixSound: Identifiable, Codable, Hashable {
    let id: String              // UUID (트랙 자체 식별자)
    let soundId: String         // Sound.id 참조
    var volume: Float           // 0.0 ~ 1.0
    var pan: Float              // -1.0(L) ~ 1.0(R), 기본 0
}
```

### `PlaybackSession`
사용 통계용 로그. 세션 종료 시점에 기록.
```swift
@Model
final class PlaybackSession {
    @Attribute(.unique) var id: String
    var mixId: String?                      // 즉석 믹스면 nil
    var soundIds: [String]                  // 실제 재생된 사운드들
    var startedAt: Date
    var endedAt: Date
    var durationSeconds: Int                // endedAt - startedAt
    var endReason: EndReason                // .userStopped / .timerExpired / .interrupted
    var scenario: Scenario?                 // 사용자가 설정 시
}
```

### Enum 정의
```swift
enum Category: String, Codable { case nature, ambient, asmrTrigger, tonal, korean }
enum FrequencyBand: String, Codable { case low, mid, high }
enum Scenario: String, Codable { case sleep, focus, meditation, relax }
enum PlaybackMode: String, Codable { case simultaneous, sequential, random }
enum EndReason: String, Codable { case userStopped, timerExpired, interrupted }
```

---

## 5. 한국 시장 특화 사항 (사운드 9종)

해외 ASMR 앱(Calm, Endel, BetterSleep)에 **없거나 부족한** 한국 정서 사운드입니다. v1.0 출시 차별화 포인트.

| ID | 이름 | frequencyBand | 시나리오 | 비고 |
|---|---|---|---|---|
| `rain_hanok` | 한옥 처마 빗소리 | mid | sleep, relax | 처마 끝에서 떨어지는 물방울 강조 |
| `cicada_summer` | 매미 소리 (한여름) | high | focus, relax | 7~8월 한국 매미. 노스탤지어 |
| `temple_wind_chime` | 사찰 풍경 소리 | high | meditation, relax | 산사 처마 풍경 |
| `ondol_firewood` | 구들방 장작 타는 소리 | low | sleep, relax | 한옥 아궁이 |
| `greenhouse_rain` | 비닐하우스 빗소리 | mid | sleep, focus | 한국 농촌 특유 |
| `han_river` | 한강 강물 소리 | low | relax, focus | 강변 분위기 |
| `temple_bell_dawn` | 산사 새벽 종소리 | low | meditation | 28회 타종 패턴 |
| `frog_chorus` | 시골 개구리 합창 | mid | sleep | 논두렁 여름밤 |
| `tea_pouring` | 차 따르는 소리 | high | meditation, focus | 한식당/다도 |

**중요**: 위 사운드는 모두 자체 녹음/라이선스 확보가 필요. 출시 전 저작권 정리 필수.

---

## 6. 사운드 큐레이션 리스트 (총 30종)

한국 특화 9 + 글로벌 표준 21 = 30개.

### 글로벌 표준 21종

**Nature (10)**
| ID | 이름 | band | scenarios |
|---|---|---|---|
| `rain_window` | 빗소리 (창문) | mid | sleep, focus |
| `rain_heavy` | 폭우 | mid | sleep, focus |
| `rain_light` | 가벼운 비 | mid | sleep, relax |
| `thunder` | 천둥 | low | sleep |
| `ocean_calm` | 잔잔한 파도 | low | sleep, relax |
| `ocean_strong` | 거센 파도 | mid | focus |
| `stream` | 시냇물 | high | focus, meditation |
| `waterfall` | 폭포 | mid | focus |
| `forest_birds` | 숲 새소리 | high | relax, focus |
| `wind_leaves` | 나뭇잎 바람 | mid | sleep, relax |

**Ambient (4)**
| ID | 이름 | band | scenarios |
|---|---|---|---|
| `white_noise` | 화이트 노이즈 | mid | focus, sleep |
| `pink_noise` | 핑크 노이즈 | mid | sleep |
| `brown_noise` | 브라운 노이즈 | low | focus, sleep |
| `space_ambient` | 우주 앰비언트 | low | meditation, sleep |

**ASMR Triggers (5)**
| ID | 이름 | band | scenarios |
|---|---|---|---|
| `fireplace` | 모닥불 | low | sleep, relax |
| `cafe_ambient` | 카페 잡음 | mid | focus |
| `library_ambient` | 도서관 잡음 | low | focus |
| `keyboard_typing` | 키보드 타이핑 | high | focus |
| `page_turning` | 페이지 넘기는 소리 | high | focus, relax |

**Tonal (2)**
| ID | 이름 | band | scenarios |
|---|---|---|---|
| `tibetan_bowl` | 티벳 싱잉볼 | low | meditation |
| `binaural_528hz` | 528Hz 바이노럴 | mid | meditation, focus |

### 믹스 호환성 가이드
- 동일 frequencyBand 사운드는 **2개 이내**로 섞을 것을 추천 (저주파끼리 겹치면 진흙처럼 들림).
- 추천 패턴: `low + mid + high` 1개씩 조합.
- UI에서 사용자가 같은 band를 3개 이상 고르면 부드럽게 경고만 표시 (강제 차단 X).

---

## 7. UX/UI 원칙

- **다크모드 우선**. OLED 트루블랙(`#000000`) 지원.
- 컬러 액센트: 차분한 인디고/보라 계열 (수면 친화). 채도 낮게.
- 모든 인터랙티브 요소 터치 영역 **최소 44pt** (HIG 준수).
- `cornerRadius` 12~16. 큰 폰트(SF Pro Display, 18pt 이상이 본문).
- 텍스트 최소화, 아이콘 + 짧은 라벨.
- 재생 중 화면(NowPlayingView)은 **OLED 번인 방지**용 자동 어둡게 모드 토글 제공.
- **햅틱**: 재생/정지/타이머 만료 시 `UIImpactFeedbackGenerator(.soft)` 사용. 과하지 않게.

### 화면 목록 (v1.0)
1. `HomeView` — 추천 믹스 + 내 믹스 + (자리만)커뮤니티
2. `SoundPickerView` — 기본/내 사운드/(자리만)커뮤니티 탭
3. `PlaybackSetupView` — 모드/타이머/페이드아웃
4. `NowPlayingView` — 재생 중 화면
5. `StatisticsView` — 통계
6. `SettingsView` — 환경설정

탭바: 홈 / 사운드 / 통계 / 설정.

---

## 8. 기술 제약 및 주의사항

### 오디오
- `AVAudioSession` 카테고리 `.playback` + 옵션 `.mixWithOthers` (다른 앱 사운드와 공존).
- 백그라운드 재생: `Info.plist`에 `UIBackgroundModes = ["audio"]`.
- 인터럽션(전화 등) 대응: `AVAudioSession.interruptionNotification` 구독, 재개 시 자연스러운 페이드인.
- 라우트 변경(이어폰 빠짐): `AVAudioSession.routeChangeNotification`으로 자동 일시정지.
- **시뮬레이터 한계**: 백그라운드 재생/잠금화면 컨트롤은 **실기기에서만 정확히 검증** 가능.

### 성능
- 동시 트랙 5개를 초과하지 않을 것 (배터리·CPU·사용성 문제).
- 사운드 파일은 모두 `.m4a (AAC)`. 평균 길이 5~10분 루프. 파일당 1MB 이하 목표.
- 앱 번들 크기: 30개 사운드 합계 30MB 이내 목표. 초과 시 일부를 On-Demand Resources로 분리.

### 접근성
- VoiceOver 라벨 모두 한국어로 제공.
- Dynamic Type 지원.

---

## 9. 명명 규칙

- **Sound ID**: `snake_case` 영문 (예: `rain_hanok`). 다국어 확장 대비.
- **Swift 타입**: `UpperCamelCase`.
- **Swift 변수/함수**: `lowerCamelCase`.
- **파일명**: 타입과 동일 (`Sound.swift`, `AudioEngine.swift`).
- **JSON 키**: `camelCase` (Codable 기본값과 정합).

---

## 10. 출시 전 체크리스트 (참고)

- [ ] 사운드 30종 모두 라이선스 확보 및 문서화
- [ ] App Store 심사 가이드 4.2(최소 기능성) 통과 — 단순 음원 재생이 아닌 믹싱 가치 명확화
- [ ] 개인정보 처리방침 / 이용약관 (한국어)
- [ ] App Tracking Transparency 미사용 (트래킹 없음으로 시작)
- [ ] 인앱결제 v1.0에서는 미포함 권장 (심사 단순화)
- [ ] 실기기 백그라운드 재생 8시간 연속 테스트

---

## 11. 결정사항 로그

큰 결정이 생길 때마다 **여기 아래에 누적**해주세요. 절대 덮어쓰지 마세요. 형식:
```
### YYYY-MM-DD — 짧은 제목
컨텍스트: 왜 이 결정을 내렸는지
결정: 무엇을 어떻게
영향: 어디에 영향을 주는지
```

### 2026-06-16 — 초기 컨텍스트 문서 작성
- 컨텍스트: iOS 네이티브 ASMR Mix App 신규 프로젝트 시작.
- 결정: SwiftUI + MVVM + SwiftData + AVAudioEngine 스택 채택. 사운드 30종(한국 9 + 글로벌 21) 큐레이션 확정.
- 영향: 모든 후속 프롬프트(1~5)가 이 문서를 기반으로 동작.

---

## 12. 새 세션 시작 시 체크리스트 (AI 에이전트용)

새 Claude Code 세션이 열리면 다음을 순서대로 확인하세요.
1. 이 문서를 처음부터 끝까지 읽기.
2. `git log --oneline -20`으로 최근 작업 파악.
3. 진행 중인 TODO나 미완료 작업이 있는지 확인.
4. 다음에 할 일을 1~2줄로 사용자에게 제안.
