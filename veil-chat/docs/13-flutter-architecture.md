# 13. Flutter 앱 구조

## 1. 아키텍처 개요

- 패턴: **Feature-first + Clean Architecture (presentation / domain / data)**
- 상태관리: **Riverpod** (+ `riverpod_generator`)
- 라우팅: **go_router** (탭/딥링크)
- 네트워크: **Dio** (인터셉터로 JWT/리프레시)
- 실시간: **socket_io_client** (또는 web_socket_channel)
- 로컬: **flutter_secure_storage**(토큰), **Hive/Isar**(캐시)
- 모델: **freezed** + **json_serializable**

---

## 2. 디렉터리 구조

```
lib/
├── main.dart
├── app/
│   ├── app.dart                # MaterialApp.router
│   ├── router.dart             # go_router (탭/가드)
│   └── theme.dart
├── core/
│   ├── network/                # dio, interceptors, ws client
│   ├── storage/                # secure storage, cache
│   ├── error/                  # failure, exceptions
│   ├── utils/                  # validators(나이/욕설), formatters(타이머)
│   └── constants/
├── features/
│   ├── auth/
│   │   ├── data/   (datasource, repository_impl, dto)
│   │   ├── domain/ (entity, repository, usecase)
│   │   └── presentation/ (screens, widgets, providers)
│   ├── onboarding/             # 닉네임/상태/아바타/관심사
│   ├── matching/               # 조건 선택, 카운트다운, 큐
│   ├── chat/                   # 목록, 채팅방, 타이머, 연장
│   ├── friends/                # 친구 목록/신청
│   ├── evaluation/             # 평가 화면
│   ├── report/                 # 신고/차단
│   ├── profile/                # 내 정보 편집
│   ├── notification/           # 알림 설정
│   └── premium/                # 구독
└── shared/
    ├── widgets/                # 아바타, 칩, 타이머 뱃지
    └── models/
```

---

## 3. 레이어 책임

| 레이어 | 책임 |
| --- | --- |
| presentation | 화면 + Riverpod Provider(상태) |
| domain | Entity, UseCase, Repository 인터페이스 (순수 Dart) |
| data | DTO, DataSource(REST/WS), Repository 구현 |

---

## 4. 핵심 상태 관리 예 (Riverpod)

```dart
// 세션 타이머 (남은 시간 카운트다운)
@riverpod
Stream<Duration> sessionRemaining(SessionRemainingRef ref, String sessionId) async* {
  final session = await ref.watch(sessionProvider(sessionId).future);
  var remaining = session.expiresAt.difference(DateTime.now());
  while (remaining.inSeconds > 0) {
    yield remaining;
    await Future.delayed(const Duration(seconds: 1));
    remaining -= const Duration(seconds: 1);
  }
  yield Duration.zero; // → 연장/종료 모달 트리거
}

// 매칭 카운트다운(5초)
@riverpod
class MatchCountdown extends _$MatchCountdown {
  Timer? _timer;
  @override
  int build() => 5;
  void start(VoidCallback onComplete) {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      state = state - 1;
      if (state <= 0) { t.cancel(); onComplete(); }
    });
  }
  void cancel() => _timer?.cancel();
}
```

---

## 5. 실시간 처리

```dart
// WS 이벤트 → Provider 상태 갱신
socket.on('message:new', (data) => ref.read(chatProvider(sid).notifier).addMessage(...));
socket.on('match:found', (data) => router.go('/chat/${data['sessionId']}'));
socket.on('session:expiring', (data) => ref.read(sessionProvider).showExtendDialog());
socket.on('session:extended', (data) => ref.refresh(sessionProvider(sid)));
```

- 재연결: 백오프 + 연결 시 미수신 메시지 동기화(`GET messages?after=`)
- 백그라운드: FCM/APNs 푸시로 알림(미리보기 설정 반영)

---

## 6. 라우팅 가드

```
- 미인증 → /login
- 인증 O + 온보딩 미완료 → /onboarding
- 매칭 금지 상태 → 매칭 탭에서 안내 배너
- 탭 셸: ShellRoute(매칭/대화/설정)
```

---

## 7. 화면 ↔ 기능 매핑

| 화면 ID | feature |
| --- | --- |
| A-*, O-* | auth, onboarding |
| M-* | matching |
| C-* | chat, friends |
| E-*, R-* | evaluation, report |
| S-* | profile, notification, premium |

---

## 8. 테스트 전략

- 단위: UseCase, Validator(나이/욕설), 점수 포맷터
- 위젯: 카운트다운, 타이머 뱃지, 평가 폼
- 통합: 매칭→채팅→연장→평가 플로우(모킹 WS)
