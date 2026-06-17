# 08. ERD (Entity Relationship Diagram)

## 1. Mermaid ERD

```mermaid
erDiagram
    USERS ||--|| PROFILES : has
    USERS ||--o{ AUTH_PROVIDERS : authenticates
    USERS ||--o{ USER_INTERESTS : selects
    INTERESTS ||--o{ USER_INTERESTS : categorizes
    USERS ||--o{ MATCH_REQUESTS : requests
    USERS ||--o{ SESSIONS : "user_a"
    USERS ||--o{ SESSIONS : "user_b"
    SESSIONS ||--o{ MESSAGES : contains
    SESSIONS ||--o{ SESSION_EXTENSIONS : extends
    SESSIONS ||--o{ CHAT_SETTINGS : configures
    SESSIONS ||--o{ EVALUATIONS : evaluated_in
    SESSIONS ||--o| FRIENDSHIPS : converts_to
    USERS ||--o{ EVALUATIONS : "rater"
    USERS ||--o{ BLOCKS : "blocker"
    USERS ||--o{ BLOCKS : "blocked"
    USERS ||--o{ REPORTS : "reporter"
    USERS ||--o{ REPORTS : "reported"
    REPORTS ||--o{ REPORT_ATTACHMENTS : attaches
    USERS ||--o{ PENALTIES : receives
    USERS ||--o{ PENALTY_SANCTIONS : sanctioned
    USERS ||--o{ DEVICES : owns
    USERS ||--o{ FRIENDSHIPS : "user_a"
    USERS ||--o{ FRIENDSHIPS : "user_b"

    USERS {
        uuid id PK
        varchar email UK
        date birth_date
        varchar status
        boolean is_premium
        int penalty_score
        int penalty_strike
        timestamptz match_banned_until
    }
    PROFILES {
        uuid user_id PK_FK
        varchar nickname UK
        varchar status_message
        varchar avatar_type
        varchar avatar_key
        varchar background_color
        numeric manner_score
    }
    INTERESTS {
        int id PK
        varchar code UK
        varchar label
        boolean is_active
    }
    USER_INTERESTS {
        uuid user_id PK_FK
        int interest_id PK_FK
    }
    SESSIONS {
        uuid id PK
        uuid user_a_id FK
        uuid user_b_id FK
        varchar match_mode
        varchar status
        int extension_count
        timestamptz expires_at
        boolean is_friend
        varchar ended_reason
    }
    SESSION_EXTENSIONS {
        uuid id PK
        uuid session_id FK
        int round
        boolean user_a_agreed
        boolean user_b_agreed
        boolean resolved
    }
    MESSAGES {
        uuid id PK
        uuid session_id FK
        uuid sender_id FK
        text content
        varchar type
        boolean is_read
    }
    CHAT_SETTINGS {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        boolean notify_enabled
        boolean preview_enabled
    }
    EVALUATIONS {
        uuid id PK
        uuid session_id FK
        uuid rater_id FK
        uuid ratee_id FK
        int fun_score
        int manner_score
        boolean want_again
        boolean no_rematch
    }
    FRIENDSHIPS {
        uuid id PK
        uuid session_id FK
        uuid user_a_id FK
        uuid user_b_id FK
        varchar status
        uuid requested_by
    }
    BLOCKS {
        uuid id PK
        uuid blocker_id FK
        uuid blocked_id FK
        varchar reason
    }
    REPORTS {
        uuid id PK
        uuid reporter_id FK
        uuid reported_id FK
        uuid session_id FK
        varchar reason
        varchar status
    }
    REPORT_ATTACHMENTS {
        uuid id PK
        uuid report_id FK
        varchar file_url
    }
    PENALTIES {
        uuid id PK
        uuid user_id FK
        varchar type
        int points
    }
    PENALTY_SANCTIONS {
        uuid id PK
        uuid user_id FK
        int strike
        int ban_hours
        timestamptz ends_at
    }
    DEVICES {
        uuid id PK
        uuid user_id FK
        varchar platform
        varchar push_token
    }
    AUTH_PROVIDERS {
        uuid id PK
        uuid user_id FK
        varchar provider
        varchar provider_uid
    }
    MATCH_REQUESTS {
        uuid id PK
        uuid user_id FK
        varchar match_mode
        varchar status
    }
```

---

## 2. 관계 요약

| 관계 | 카디널리티 | 설명 |
| --- | --- | --- |
| users ↔ profiles | 1:1 | 사용자당 프로필 1 |
| users ↔ interests | N:M | user_interests 경유 |
| users ↔ sessions | 1:N (a/b 양방향) | 한 세션에 두 사용자 |
| sessions ↔ messages | 1:N | 세션 내 메시지 |
| sessions ↔ extensions | 1:N (최대 3) | 연장 라운드 |
| sessions ↔ friendships | 1:0..1 | 친구 전환 시 1건 |
| users ↔ blocks | 1:N (양방향) | 차단 관계 |
| users ↔ reports | 1:N (양방향) | 신고자/피신고자 |
| reports ↔ attachments | 1:N (최대 5) | 스크린샷 |
| users ↔ penalties | 1:N | 패널티 이력 |

---

## 3. 핵심 무결성 규칙

- `sessions.extension_count` 는 0~3 (CHECK)
- `blocks(blocker_id, blocked_id)` UNIQUE — 중복 차단 방지
- `evaluations` 은 (session_id, rater_id) UNIQUE — 세션당 1회 평가
- `user_interests` 최소 3행 — 애플리케이션 레벨 검증
- `friendships.status` 가 accepted 일 때만 `sessions.is_friend=true`
