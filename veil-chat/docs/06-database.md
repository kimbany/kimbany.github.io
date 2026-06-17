# 06. DB 테이블 설계 (PostgreSQL)

> 명명: 테이블 `snake_case` 복수형, PK `id (uuid)`, 공통 `created_at`, `updated_at`.
> 시간은 `timestamptz`. 삭제는 가급적 `deleted_at` 소프트 삭제.

---

## 1. 사용자/인증

### users
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | 사용자 ID |
| email | varchar(255) unique | 이메일 |
| password_hash | varchar(255) null | 이메일 가입 시 |
| birth_date | date | 생년월일 (만14세 검증) |
| status | varchar(20) | active/suspended/banned/withdrawn |
| is_premium | boolean | 프리미엄 여부 |
| premium_until | timestamptz null | 구독 만료 |
| penalty_score | int default 0 | 현재 패널티 점수 |
| penalty_strike | int default 0 | 5점 누적 횟수(1,2…) |
| match_banned_until | timestamptz null | 매칭 금지 해제 시각 |
| created_at / updated_at / deleted_at | timestamptz | |

### auth_providers (소셜 로그인)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid FK→users | |
| provider | varchar(20) | google/apple/email |
| provider_uid | varchar(255) | 소셜 식별자 |
| created_at | timestamptz | |
| | | unique(provider, provider_uid) |

### password_resets
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid FK | |
| token_hash | varchar(255) | |
| expires_at | timestamptz | |
| used_at | timestamptz null | |

---

## 2. 프로필/관심사

### profiles
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| user_id | uuid PK FK→users | 1:1 |
| nickname | varchar(20) unique | 중복불가/욕설필터 |
| status_message | varchar(100) | 상태메시지 |
| avatar_type | varchar(20) | avatar/icon/character |
| avatar_key | varchar(50) | 선택 자원 키 |
| background_color | varchar(7) | hex 색상 |
| manner_score | numeric(4,2) default 50 | 평가 누적 매너점수 |
| created_at / updated_at | timestamptz | |

### interests (마스터)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | int PK | |
| code | varchar(30) unique | game/movie/music… |
| label | varchar(30) | 게임/영화… |
| is_active | boolean | 노출 여부 |
| sort_order | int | 정렬 |

### user_interests (N:M)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| user_id | uuid FK | |
| interest_id | int FK | |
| | | PK(user_id, interest_id) |

---

## 3. 매칭/세션

### match_requests (매칭 큐)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid FK | |
| match_mode | varchar(10) | similar/different |
| status | varchar(15) | waiting/matched/cancelled/expired |
| matched_session_id | uuid null | |
| created_at | timestamptz | |
| matched_at | timestamptz null | |

> 실제 대기 큐는 Redis Sorted Set으로 운영, 본 테이블은 이력/감사용.

### sessions (1:1 대화 세션)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| user_a_id | uuid FK→users | |
| user_b_id | uuid FK→users | |
| match_mode | varchar(10) | similar/different |
| status | varchar(15) | active/expiring/ended/friend |
| extension_count | int default 0 | 연장 횟수(0~3) |
| expires_at | timestamptz | 현재 만료 시각 |
| is_friend | boolean default false | 친구 전환 여부 |
| ended_reason | varchar(20) null | normal/left/reported/blocked/declined |
| created_at / ended_at | timestamptz | |

### session_extensions
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| session_id | uuid FK | |
| round | int | 1~3 |
| user_a_agreed | boolean | |
| user_b_agreed | boolean | |
| resolved | boolean | 양측 합의 완료 |
| created_at | timestamptz | |

### friendships
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| session_id | uuid FK | 전환 출처 |
| user_a_id / user_b_id | uuid FK | |
| status | varchar(15) | pending/accepted/declined |
| requested_by | uuid FK | 신청자 |
| created_at / accepted_at | timestamptz | |

---

## 4. 메시지

### messages
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| session_id | uuid FK | |
| sender_id | uuid FK→users | |
| content | text | 텍스트 (사진/음성 없음) |
| type | varchar(15) | text/system |
| is_read | boolean default false | |
| created_at | timestamptz | |
| | | index(session_id, created_at) |

### chat_settings (채팅방별 알림)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| session_id | uuid FK | |
| user_id | uuid FK | |
| notify_enabled | boolean default true | |
| preview_enabled | boolean default true | |
| | | unique(session_id, user_id) |

---

## 5. 평가/차단/신고

### evaluations
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| session_id | uuid FK | |
| rater_id | uuid FK→users | 평가자 |
| ratee_id | uuid FK→users | 피평가자 |
| fun_score | int | 1~5 (즐거움) |
| manner_score | int | 1~5 (예의) |
| want_again | boolean | 재대화 의향 |
| comment | varchar(500) null | 추가 의견 |
| no_rematch | boolean default false | 다시 만나고 싶지 않음 |
| created_at | timestamptz | |

### blocks
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| blocker_id | uuid FK | |
| blocked_id | uuid FK | |
| reason | varchar(20) | manual/no_rematch/report |
| created_at | timestamptz | |
| | | unique(blocker_id, blocked_id) |

### reports
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| reporter_id | uuid FK | |
| reported_id | uuid FK | |
| session_id | uuid FK null | |
| reason | varchar(20) | abuse/sexual/ad/scam/hate/spam/etc |
| description | varchar(1000) | |
| status | varchar(15) | pending/reviewing/resolved/rejected |
| admin_note | text null | |
| handled_by | uuid null | 관리자 |
| created_at / handled_at | timestamptz | |

### report_attachments (스크린샷, 최대 5장)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| report_id | uuid FK | |
| file_url | varchar(500) | S3 경로 |
| created_at | timestamptz | |

---

## 6. 패널티

### penalties
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid FK | |
| type | varchar(25) | leave/cancel_abuse/false_report/misconduct |
| points | int | 부여 점수 |
| source_id | uuid null | 관련 세션/신고 |
| created_at | timestamptz | |

### penalty_sanctions (제재 이력)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid FK | |
| strike | int | 1차/2차… |
| ban_hours | int | 24/48… |
| starts_at / ends_at | timestamptz | |
| reset_at | timestamptz | 점수 초기화 시각 |

---

## 7. 운영/기타

### admins
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| email | varchar(255) unique | |
| password_hash | varchar(255) | |
| role | varchar(20) | super/operator/viewer |

### devices (푸시 토큰)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid FK | |
| platform | varchar(10) | ios/android |
| push_token | varchar(255) | |
| global_notify | boolean | 전체 알림 |
| chat_notify | boolean | 채팅 알림 |

### banned_words (욕설 필터 사전)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | int PK | |
| word | varchar(50) | |
| severity | int | 1~3 |

---

## 8. 주요 인덱스 전략

- `users(email)`, `profiles(nickname)` unique
- `messages(session_id, created_at)` — 채팅 페이징
- `sessions(status, expires_at)` — 만료 배치 스캔
- `sessions(user_a_id), sessions(user_b_id)` — 내 대화 조회
- `blocks(blocker_id, blocked_id)` — 매칭 풀 제외
- `reports(status, created_at)` — 어드민 큐
- `match_requests(status)` — 대기열 감사
