# 운동 다마고치 — 모바일 앱 (Capacitor)

`fitness-tamagotchi/` 의 웹 게임을 **Capacitor** 로 감싸 안드로이드/iOS 네이티브 앱으로
빌드하기 위한 프로젝트입니다. **웹 파일은 이 프로젝트가 아니라 한 단계 위
`../fitness-tamagotchi/` 폴더가 그대로 유일한 소스**이고, Capacitor 가 빌드 시
앱 안으로 번들합니다. 따라서 게임 로직을 수정하고 싶으면
`../fitness-tamagotchi/` 안의 파일만 고치면 됩니다.

## 헬스 데이터 연동

- **Android**: Google [Health Connect](https://developer.android.com/health-and-fitness/guides/health-connect)
- **iOS**: Apple [HealthKit](https://developer.apple.com/documentation/healthkit)
- 사용 플러그인: [`capacitor-health`](https://github.com/mley/capacitor-health) (양 플랫폼 통합 API)

읽어오는 항목:
- 운동 시간 동안의 평균 심박수 (`heart-rate`)
- 활동 칼로리 (`active-calories`)
- (필요 시) 걸음수, 운동 기록

이 데이터는 EXP 계산식에 반영됩니다 (`logic.js`):

```
EXP = floor(분 × 2 × 강도) + floor(칼로리 / 10)
강도 = 심박 < 100 → 1.0  (저강도)
       100 ~ 140 → 1.5  (중강도)
       140+      → 2.0  (고강도)
```

헬스 데이터가 없으면(웹 또는 권한 거부) 강도 1.0, 칼로리 0 으로 대체되어
**기존 시간만 측정 EXP** 와 동일하게 작동합니다.

---

## 폴더 구조

```
fitness-tamagotchi-app/
├── package.json              ← Capacitor 의존성
├── capacitor.config.json     ← appId / appName / webDir
├── .gitignore                ← node_modules, build/, Pods/ 등 제외
├── README.md                 ← (이 파일)
├── android/                  ← npx cap add android 로 생성된 Android 프로젝트
│   └── app/src/main/
│       ├── AndroidManifest.xml  ← Health Connect 권한·rationale 포함
│       └── assets/public/       ← 빌드 시 webDir 이 복사되는 곳 (수정 X)
└── node_modules/             ← npm install 후 생성 (gitignore 됨)

../fitness-tamagotchi/       ← 실제 게임 소스 (수정은 여기서)
```

---

## 첫 빌드 가이드 (Android)

### 사전 준비
1. **Android Studio** 설치 (Hedgehog 이상 권장)
2. **Android SDK** 설치 (Android 14, API 34 권장)
3. **JDK 21** 설치 (Android Studio 내장 JBR 사용 가능)
4. **Health Connect** 앱이 설치된 안드로이드 13+ 실기기 또는 에뮬레이터
   - 안드로이드 14+ 에서는 시스템에 기본 포함
   - 13 이하는 Play Store 에서 "Health Connect" 설치 필요

### 빌드 단계

```bash
cd fitness-tamagotchi-app

# 1. 의존성 설치
npm install

# 2. 웹 자산을 안드로이드 프로젝트로 동기화 (게임 코드 수정 후 매번 실행)
npm run sync

# 3. Android Studio 로 열기
npm run open:android
```

Android Studio 가 열리면:
1. Gradle sync 완료될 때까지 대기
2. 상단 툴바에서 디바이스 선택 → ▶ Run
3. 첫 실행 시 앱이 설치되고 실행됨
4. 운동 종료 시 Health Connect 권한 다이얼로그가 뜸 → 모두 허용

### 게임 코드를 바꿨을 때

```bash
# fitness-tamagotchi/ 안의 .html / .css / .js 수정 후
npm run sync
# 그리고 Android Studio 에서 다시 ▶ Run
```

---

## 첫 빌드 가이드 (iOS — Mac 필요)

```bash
cd fitness-tamagotchi-app
npm install
npx cap add ios          # 처음 한 번만
npm run sync
npm run open:ios
```

Xcode 가 열리면:
1. Signing & Capabilities → 본인 Apple ID 팀 선택
2. **+ Capability → HealthKit** 추가
3. `Info.plist` 에 다음 두 키 추가:
   - `NSHealthShareUsageDescription` — "운동 데이터로 EXP 를 계산하기 위해 사용합니다"
   - `NSHealthUpdateUsageDescription` — (당장은 read 전용이지만 추가 안 하면 빌드 거부)
4. 실기기 선택 → ▶ Run (HealthKit 은 시뮬레이터에서 데이터가 비어있으니 실기기 권장)

---

## 잘 안 될 때

| 증상 | 원인 / 해결 |
|---|---|
| Android Studio 가 SDK 못 찾음 | `local.properties` 에 `sdk.dir=...` 추가하거나 Android Studio 의 SDK Manager 에서 설치 |
| 운동 종료 시 심박수 안 잡힘 | 실기기에 Apple Watch / Galaxy Watch 등이 페어링되어 운동 기록을 만들고 있어야 함. 우리 앱 타이머만 돌리고 시계 운동 기록이 없으면 데이터 없음 |
| Health Connect 권한 다이얼로그 안 뜸 | 안드로이드 13 이하인지 확인 → Health Connect 앱이 Play Store 에서 따로 설치돼 있어야 함 |
| 웹 변경사항이 앱에 반영 안 됨 | `npm run sync` 잊었거나 Android Studio 에서 Clean Build 필요 |

---

## 출시 (나중에)

- **Google Play**: $25 일회성 등록비, signed AAB 업로드
- **App Store**: $99/년 Apple Developer Program, TestFlight → App Store
- **개인정보처리방침** 페이지 필수 (헬스 데이터 다루기 때문에 반드시 명시)
- 두 스토어 모두 헬스 데이터 사용 사유를 심사에서 검토함 — `capacitor.config.json`
  의 `appName` 과 일치하는 설명 작성 필요
