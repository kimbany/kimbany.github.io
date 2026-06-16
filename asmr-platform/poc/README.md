# Multitrack + Background PoC

ASMR Creator Platform v1.0의 **가장 위험한 가정**을 검증하는 최소 Flutter 앱입니다.

## 검증 목표

| # | 검증 항목 | 합격 기준 |
|---|---|---|
| 1 | 4트랙 동시 재생 | 4개 사운드가 동시에 들리고, 각 슬라이더로 볼륨이 즉시 바뀜 |
| 2 | 백그라운드 재생 | 앱을 백그라운드로 보내거나 화면을 꺼도 4개 트랙이 계속 재생 |
| 3 | 잠금화면 컨트롤 | 잠금화면에 1줄 "4-Track ASMR Mix"가 보이고, 재생/정지 버튼이 동작 |
| 4 | 페이드 인/아웃 | 트랙 토글 시 1초 페이드로 자연스럽게 등장·사라짐 |
| 5 | 8시간 연속 재생 | 충전기 연결, 화면 끔, 다른 앱 사용 중에도 끊김 없이 8시간 |

## 사전 준비

1. Flutter 3.22+ 설치 (`flutter --version`)
2. `assets/sounds/` 폴더에 다음 4개 파일을 직접 넣으세요. **저작권 확보된 파일만 사용**:
   - `rain.mp3` (또는 `.wav`/`.ogg`) — 빗소리
   - `fire.mp3` — 모닥불
   - `wind.mp3` — 바람
   - `stream.mp3` — 시냇물

   임시 테스트용은 [Freesound.org](https://freesound.org)에서 CC0 라이선스 파일을 받아도 됩니다.
3. iOS 빌드: Xcode 15+ + 실기기(시뮬레이터는 잠금화면 검증 불가)
4. Android 빌드: Android 8.0+ 실기기 권장

## 실행

```bash
cd asmr-platform/poc
flutter pub get
flutter run
```

## iOS 설정 (반드시 수동 추가)

`ios/Runner/Info.plist`에 다음 추가:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
</array>
<key>NSMicrophoneUsageDescription</key>
<string>녹음 PoC용 (v1.0 본 기능에서 사용 예정)</string>
```

## Android 설정 (반드시 수동 추가)

`android/app/src/main/AndroidManifest.xml`의 `<manifest>` 아래에 추가:

```xml
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"/>
```

`<application>` 아래에 추가:

```xml
<service
  android:name="com.ryanheise.audioservice.AudioService"
  android:foregroundServiceType="mediaPlayback"
  android:exported="true">
  <intent-filter>
    <action android:name="android.media.browse.MediaBrowserService"/>
  </intent-filter>
</service>

<receiver
  android:name="com.ryanheise.audioservice.MediaButtonReceiver"
  android:exported="true">
  <intent-filter>
    <action android:name="android.intent.action.MEDIA_BUTTON"/>
  </intent-filter>
</receiver>
```

## 검증 절차 (수동)

1. 앱 실행 → 4개 트랙 모두 켜고 슬라이더로 음량 조절. 모두 동시에 들리는지 귀로 확인.
2. 홈버튼 → 백그라운드 진입. 소리 계속 나는지 확인.
3. 잠금. 잠금화면에 미디어 세션 한 줄이 보이는지, 재생/정지 동작하는지.
4. 다른 앱(예: 카카오톡) 켜고 30분 사용 → 끊김 없는지.
5. 충전기 연결 후 화면 끄고 **8시간 방치** → 아침에 여전히 재생 중인지 + 배터리 소모 확인.

## 실패 시 대응

| 증상 | 추정 원인 | 다음 액션 |
|---|---|---|
| 트랙 1개만 들림 | flutter_soloud 미초기화 또는 핸들 누락 | `lib/main.dart`의 `_loadSound()` 로그 확인 |
| 백그라운드 진입 시 소리 끊김 | iOS Info.plist / Android Manifest 누락 | 위 "설정" 섹션 재확인 |
| 잠금화면 컨트롤 안 보임 | audio_service의 MediaItem 미설정 또는 Android 서비스 등록 누락 | Manifest의 `<service>` 블록 확인 |
| 8시간 안에 멈춤 | OS의 절전 모드 또는 메모리 회수 | foregroundServiceType=mediaPlayback 재확인. 그래도 실패하면 native 모듈 분리 검토 |

## 다음 단계

- 모든 검증 항목 합격 → CLAUDE.md §13에 "PoC 통과" 결정 기록 후 본격 개발 진입
- 검증 항목 1~3 실패 → native 모듈(iOS=AVAudioEngine, Android=Oboe)로 믹싱 엔진 교체 검토. 비용·기간 재산정 필요
