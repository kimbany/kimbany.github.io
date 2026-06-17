# 07. API 설계

> Base URL: `https://api.veil.app/v1`
> 인증: `Authorization: Bearer <JWT>` (Access 15분 / Refresh 14일)
> 응답 포맷: `{ "success": true, "data": {...}, "error": null }`

---

## 1. 인증 (Auth)

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | `/auth/signup` | 이메일 회원가입 (생년월일 14세 검증) |
| POST | `/auth/login` | 이메일 로그인 |
| POST | `/auth/social` | Google/Apple 로그인 |
| POST | `/auth/refresh` | 토큰 재발급 |
| POST | `/auth/logout` | 로그아웃 |
| POST | `/auth/password/forgot` | 비밀번호 재설정 메일 |
| POST | `/auth/password/reset` | 비밀번호 재설정 |

**POST /auth/signup**
```json
// req
{ "email": "a@b.com", "password": "****", "birthDate": "2008-05-01" }
// 14세 미만 → 422
{ "success": false, "error": { "code": "AGE_RESTRICTED", "message": "만 14세 이상만 가입 가능합니다." } }
```

---

## 2. 온보딩 / 프로필

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/profile/me` | 내 프로필 조회 |
| POST | `/profile/nickname/check` | 닉네임 중복+욕설 검사 |
| PUT | `/profile` | 닉네임/상태메시지/아바타 수정 |
| GET | `/interests` | 관심사 마스터 목록 |
| PUT | `/profile/interests` | 관심사 설정(최소 3개) |

**PUT /profile/interests**
```json
{ "interestIds": [1, 3, 7] }   // 3개 미만 → 422 MIN_INTERESTS
```

---

## 3. 매칭 (Matching)

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | `/match/request` | 매칭 시작(큐 진입). mode=similar/different |
| DELETE | `/match/request` | 매칭 취소(카운트다운/대기 중) |
| GET | `/match/status` | 현재 매칭 상태 폴링(또는 WS) |

**POST /match/request**
```json
// req
{ "mode": "similar" }
// 무료 동시 2명 초과 → 403
{ "error": { "code": "MATCH_LIMIT", "message": "무료 사용자는 최대 2명까지 동시 매칭이 가능합니다." } }
// 패널티 매칭 금지 → 403
{ "error": { "code": "MATCH_BANNED", "data": { "until": "2026-06-18T09:00:00Z" } } }
```
> 서버는 5초 카운트다운 이후 클라이언트가 호출하거나, 카운트다운을 서버 타이머로 관리.

---

## 4. 세션 / 채팅

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/sessions` | 진행중/친구/종료 목록 (type 쿼리) |
| GET | `/sessions/:id` | 세션 상세(남은시간 포함) |
| GET | `/sessions/:id/messages` | 메시지 페이징 |
| POST | `/sessions/:id/messages` | 메시지 전송 (REST 폴백) |
| POST | `/sessions/:id/extend` | 연장 동의 |
| POST | `/sessions/:id/end` | 종료 |
| POST | `/sessions/:id/leave` | 나가기(그냥 나가기) |
| DELETE | `/sessions/:id` | 종료된 기록 삭제 |
| PUT | `/sessions/:id/settings` | 채팅방 알림/미리보기 설정 |

**GET /sessions/:id 응답 예**
```json
{ "id": "...", "status": "active", "extensionCount": 1,
  "expiresAt": "2026-06-18T10:00:00Z", "remainingSeconds": 84210,
  "isFriend": false, "canBefriend": false,
  "peer": { "nickname": "달빛토끼", "avatarType": "character", "avatarKey": "rabbit01", "bgColor": "#FFD8E4" } }
```

**POST /sessions/:id/extend**
```json
// 양측 합의 시 expiresAt +24h, extensionCount++
{ "data": { "agreedBoth": true, "extensionCount": 2, "expiresAt": "..." } }
```

---

## 5. 친구 (Friends)

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | `/sessions/:id/friend-request` | 친구 신청(3회 연장 후) |
| POST | `/friends/:requestId/accept` | 수락 |
| POST | `/friends/:requestId/decline` | 거절 |
| GET | `/friends` | 친구 목록 |
| DELETE | `/friends/:id` | 친구 삭제 |

---

## 6. 평가 (Evaluation)

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | `/sessions/:id/evaluate` | 상대 평가 제출 |

```json
{ "funScore": 4, "mannerScore": 5, "wantAgain": true,
  "comment": "즐거웠어요", "noRematch": false }
// noRematch=true → 자동 차단 + 재매칭 금지
```

---

## 7. 신고 / 차단 (Report / Block)

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | `/reports` | 신고 제출 (사유+설명+첨부) |
| POST | `/reports/upload` | 스크린샷 업로드(최대 5장) |
| POST | `/blocks` | 차단 |
| DELETE | `/blocks/:userId` | 차단 해제 |
| GET | `/blocks` | 차단 목록 |

```json
// POST /reports
{ "reportedId": "...", "sessionId": "...", "reason": "ad",
  "description": "광고 도배", "attachmentIds": ["...", "..."] }
```

---

## 8. 설정 / 알림

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET/PUT | `/settings/notifications` | 전체/채팅/미리보기 토글 |
| POST | `/devices` | 푸시 토큰 등록 |
| GET | `/me/penalty` | 패널티 현황 |
| POST | `/me/withdraw` | 회원 탈퇴 |

---

## 9. 프리미엄 (Premium)

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/premium/plans` | 요금제 목록 |
| POST | `/premium/subscribe` | 구독(스토어 영수증 검증) |
| POST | `/premium/restore` | 복원 |
| GET | `/premium/status` | 구독 상태 |

---

## 10. WebSocket (실시간)

> 네임스페이스 `/ws` · 인증: 연결 시 JWT 핸드셰이크

### Client → Server
| 이벤트 | payload |
| --- | --- |
| `message:send` | `{ sessionId, content }` |
| `message:read` | `{ sessionId, messageId }` |
| `typing` | `{ sessionId, isTyping }` |
| `match:join` | `{ mode }` |
| `match:cancel` | `{}` |

### Server → Client
| 이벤트 | payload |
| --- | --- |
| `message:new` | `{ sessionId, message }` |
| `match:found` | `{ sessionId, peer }` |
| `session:expiring` | `{ sessionId }` — 연장/종료 모달 트리거 |
| `session:extended` | `{ sessionId, expiresAt, extensionCount }` |
| `session:ended` | `{ sessionId, reason }` |
| `friend:requested` | `{ requestId, from }` |
| `penalty:applied` | `{ score, sanction }` |

---

## 11. 공통 에러 코드

| code | HTTP | 의미 |
| --- | --- | --- |
| `AGE_RESTRICTED` | 422 | 14세 미만 |
| `NICKNAME_TAKEN` | 409 | 닉네임 중복 |
| `NICKNAME_FORBIDDEN` | 422 | 욕설 닉네임 |
| `MIN_INTERESTS` | 422 | 관심사 3개 미만 |
| `MATCH_LIMIT` | 403 | 동시 매칭 초과 |
| `MATCH_BANNED` | 403 | 패널티 매칭 금지 |
| `SESSION_EXPIRED` | 410 | 만료된 세션 |
| `NOT_FRIEND_ELIGIBLE` | 409 | 친구 전환 조건 미충족 |
| `BLOCKED` | 403 | 차단 관계 |
