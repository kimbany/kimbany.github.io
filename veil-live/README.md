# Veil LIVE — 실제 멀티플레이 매칭·채팅

`veil-demo`(목업)와 달리 **실제 사람끼리** 익명 매칭 + 실시간 채팅이 되는 버전입니다.
Firebase Realtime Database(`veil-chat-aad21`)를 클라이언트에서 직접 사용하며, 별도 서버 없이 GitHub Pages에서 동작합니다.

- 접속: `https://invedory.com/veil-live/`
- 데이터 경로: `veil_live/` (기존 veil-chat 데이터와 분리)

---

## ⚙️ 최초 1회 설정 (소유자만 가능)

실제로 동작시키려면 Firebase 콘솔에서 **두 가지**를 해주세요.

### 1) 익명 로그인 켜기
[Firebase 콘솔](https://console.firebase.google.com/project/veil-chat-aad21/authentication/providers)
→ **Authentication → Sign-in method → 익명(Anonymous) → 사용 설정**

### 2) 데이터베이스 보안 규칙 배포
[실시간 DB 규칙](https://console.firebase.google.com/project/veil-chat-aad21/database/veil-chat-aad21-default-rtdb/rules)
→ 이 폴더의 **`firebase-rules.json` 내용 전체를 복사**해서 규칙 편집기에 붙여넣고 **게시(Publish)**

> ⚠️ 이 규칙은 기존 veil-chat 규칙 + `veil_live` 규칙을 **합친 전체**입니다.
> (규칙 게시는 DB 전체를 덮어쓰므로 반드시 이 파일 전체를 사용하세요.)

---

## 🧪 테스트 방법

1. 위 설정을 마친 뒤 `https://invedory.com/veil-live/` 접속
2. **두 기기**(또는 폰 + PC, 또는 일반창 + 시크릿창)에서 각각 열기
3. 각자 닉네임·아바타 설정 후 **입장**
4. **양쪽 모두 "매칭하기"** 누르기 → 서로 매칭됨
5. 실시간으로 대화 → 한쪽이 나가면 상대에게 "나갔어요" 표시

---

## 🔧 동작 방식 (요약)

- **익명 로그인** → 각자 고유 uid 부여
- **매칭 큐**: `veil_live/queue/{uid}` 에 대기 등록 (연결 끊기면 자동 제거 `onDisconnect`)
- **페어링**: uid가 더 큰 쪽이 작은 쪽을 트랜잭션으로 claim → 중복 매칭 방지
- **세션**: `veil_live/sessions/{sid}` 에 멤버·프로필·메시지 저장
- **실시간 채팅**: `messages` 를 `child_added` 로 구독

## ⚠️ 현재 범위 / 한계 (테스트용 MVP)
- 규칙이 `auth != null` 로 다소 느슨함(2명 테스트용). 정식 운영 시 세션 멤버만 접근하도록 강화 필요
- 관심사 기반 기준1·2·3, 24시간 타이머, 신고/차단/친구 등은 목업(`veil-demo`)에만 있고 LIVE엔 아직 미포함 — 매칭+실시간 채팅의 실제 연결 검증이 목적
- 소수 인원(친구끼리) 테스트에 최적화. 대규모 동시접속은 서버 기반(Node+PostgreSQL, 설계 문서) 필요
