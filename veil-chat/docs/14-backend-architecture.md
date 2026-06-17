# 14. Node.js + PostgreSQL 백엔드 구조

## 1. 스택

| 영역 | 기술 |
| --- | --- |
| 런타임/언어 | Node.js + TypeScript |
| 프레임워크 | NestJS (모듈러, DI, WS 내장) — 또는 Express |
| ORM | Prisma (또는 TypeORM) |
| DB | PostgreSQL |
| 캐시/큐/실시간 | Redis (매칭 큐, 세션 TTL, Pub/Sub) |
| 실시간 | Socket.IO (Redis adapter로 수평 확장) |
| 인증 | JWT(Access/Refresh) + Passport (Google/Apple) |
| 스토리지 | AWS S3 (신고 스크린샷) |
| 푸시 | FCM / APNs |
| 스케줄 | BullMQ (세션 만료/패널티 초기화 잡) |

---

## 2. 모듈 구조 (NestJS 기준)

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── guards/       (JwtGuard, RolesGuard, PremiumGuard)
│   ├── interceptors/ (response, logging)
│   ├── filters/      (exception)
│   ├── pipes/        (validation)
│   └── utils/        (age-check, profanity-filter)
├── modules/
│   ├── auth/         (signup, login, social, refresh, password)
│   ├── users/        (status, penalty, withdraw)
│   ├── profile/      (nickname check, avatar, interests)
│   ├── interests/    (master CRUD - admin)
│   ├── matching/     (request, cancel, queue worker)
│   ├── sessions/     (chat, extend, end, leave, timer)
│   ├── messages/     (REST + WS gateway)
│   ├── friends/      (request/accept/decline)
│   ├── evaluation/   (submit)
│   ├── reports/      (submit, attachments)
│   ├── blocks/       (block/unblock)
│   ├── penalties/    (apply, sanctions)
│   ├── premium/      (subscribe, verify receipt)
│   ├── notifications/(push, device tokens)
│   └── admin/        (users, reports, stats, RBAC)
├── realtime/
│   ├── chat.gateway.ts      (Socket.IO)
│   └── match.gateway.ts
├── jobs/
│   ├── session-expiry.job.ts    (만료→expiring 전이, 모달 트리거)
│   └── penalty-reset.job.ts      (24/48h 후 초기화)
└── infra/
    ├── prisma/
    ├── redis/
    └── s3/
```

---

## 3. 핵심 컴포넌트

### 3.1 매칭 워커
- Redis Sorted Set 큐 + 워커가 페어링 (문서 11 참조)
- Lua 스크립트로 원자적 페어 제거
- 매칭 성립 → `sessions` insert + `match:found` emit

### 3.2 세션 타이머 (BullMQ)
```
세션 생성 시: expires_at = now + 24h
지연 잡 등록: delay = 24h → session-expiry.job
잡 실행: status=active → expiring, emit session:expiring (양측)
연장 합의: expires_at += 24h, 잡 재등록, extension_count++
```

### 3.3 패널티 스케줄러
```
5점 도달 → match_banned_until 설정 + penalty_reset.job(delay=ban_hours)
잡 실행: penalty_score=0, match_banned_until=null
```

### 3.4 욕설 필터 / 나이 검증
- `common/utils/profanity-filter.ts`: 정규화 + banned_words 매칭
- `common/utils/age-check.ts`: birth_date 기준 만 14세 검증(가입 파이프)

---

## 4. 실시간(Socket.IO) 게이트웨이

```
- 연결: handshake JWT 검증 → user room 조인 (user:{id})
- 세션 room: session:{id} (두 사용자)
- 이벤트: message:send/new, typing, match:join/found,
          session:expiring/extended/ended, friend:requested
- 수평 확장: @socket.io/redis-adapter 로 멀티 인스턴스 브로드캐스트
```

---

## 5. 인증 흐름

```
이메일: signup(나이검증) → 이메일 인증 → login → Access/Refresh 발급
소셜: id_token 검증(Google/Apple) → auth_providers upsert → 토큰 발급
보호 라우트: JwtGuard → (필요시) PremiumGuard / RolesGuard(admin)
```

---

## 6. 인프라 (AWS 예시)

```
[Flutter App] ─HTTPS/WSS─► [ALB] ─► [ECS Fargate (API + WS)]
                                        │
                  ┌─────────────────────┼───────────────────┐
                  ▼                     ▼                   ▼
            [RDS PostgreSQL]      [ElastiCache Redis]    [S3 (신고 이미지)]
                                        │
                                   [BullMQ Worker (ECS)]
                  ▼
            [FCM / APNs]  [관리자 웹(React) - CloudFront]
```

- 무중단 배포(롤링), 헬스체크, 오토스케일
- 로깅/모니터링: CloudWatch + (옵션) Sentry
- 시크릿: AWS Secrets Manager

---

## 7. 비기능 요구

| 항목 | 목표 |
| --- | --- |
| 메시지 지연 | < 300ms (동일 리전) |
| 매칭 처리 | 큐 페어링 1초 이내 시도 |
| 가용성 | 멀티 AZ, 무상태 API |
| 보안 | TLS, 입력검증, Rate Limit, 개인정보 최소수집 |
| 정합성 | 세션 상태 전이 트랜잭션 처리 |
