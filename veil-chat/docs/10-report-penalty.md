# 10. 신고 / 패널티 로직

## 1. 신고 플로우 (상세)

```
[채팅방] 나가기 버튼
   ▼
[팝업] 1.신고 후 나가기  2.그냥 나가기  3.취소
   │
 (1) 신고 후 나가기
   ▼
[자동 차단] blocks(reason=report)
   ▼
[신고 화면]
   · 사유: 욕설/성희롱/광고/사기/혐오 발언/스팸/기타
   · 추가 설명 (텍스트)
   · 스크린샷 첨부 (최대 5장)
   ▼
[제출] → reports(status=pending) + report_attachments
   ▼
[허위신고 경고문 노출] → 운영자 검토 큐 진입
```

> 신고는 **대화 중 언제든** 가능(나가기 외 메뉴에서도 진입 가능).

---

## 2. 신고 처리 상태 머신

```
pending ──(운영자 확인)──► reviewing
reviewing ──(위반 확인)──► resolved   → 피신고자 패널티/제재
reviewing ──(사유 불충분)──► rejected  → 허위신고 시 신고자 패널티
```

| 상태 | 의미 |
| --- | --- |
| pending | 접수, 미처리 |
| reviewing | 운영자 검토 중 |
| resolved | 위반 인정 → 제재 |
| rejected | 기각 (허위 시 신고자 패널티) |

---

## 3. 패널티 점수 체계

| 행위 | 부여 점수(예시) |
| --- | --- |
| 무단 나가기(그냥 나가기) | +1 |
| 반복 매칭 취소 (임계 초과) | +1 |
| 허위 신고 (rejected 확정) | +2 |
| 비매너 행동 (신고 인정) | +2~+5 (경중) |
| 중대 위반(성희롱·불법) | 즉시 정지 (별도) |

> **패널티 점수 상한: 5점** (5점 도달 시 제재 발동 후 정책에 따라 초기화)

---

## 4. 패널티 누적 → 제재 로직

```
on penalty_added(user, points):
    user.penalty_score += points
    if user.penalty_score >= 5:
        user.penalty_strike += 1
        if user.penalty_strike == 1:
            ban_hours = 24
        elif user.penalty_strike == 2:
            ban_hours = 48
        else:
            ban_hours = 48 * (penalty_strike - 1)   # 단계적 가중(정책)
        user.match_banned_until = now() + ban_hours
        record penalty_sanctions(strike, ban_hours, ends_at)
        user.penalty_score = 0     # 점수 리셋
        schedule reset after ban_hours
```

| 누적 | 제재 | 초기화 |
| --- | --- | --- |
| 5점 (1차) | **24시간 매칭 금지** | 24시간 후 |
| 5점 (2차) | **48시간 매칭 금지** | 48시간 후 |
| 5점 (3차 이상) | 가중(예: 96시간) | 종료 후 |

- 매칭 금지 중 `POST /match/request` → `MATCH_BANNED` (남은 시간 반환)
- 채팅(진행 중 세션)은 금지 대상 아님 — **신규 매칭만 차단**

---

## 5. 매칭 취소 남용 방지

```
반복 취소 카운트(슬라이딩 윈도우, 예: 1시간):
  취소 횟수 >= 임계(예 5회) → penalty +1, 카운터 리셋
```
- 카운트다운 5초 내 취소는 **1회까지는 무료**(오조작 보호), 그 이상 누적 카운트.

---

## 6. 허위 신고 패널티

- 신고가 `rejected` 로 확정되고, **악의/반복 패턴**으로 판단되면 신고자에게 +2
- 신고 안내문으로 사전 고지 (어뷰징 억제)

---

## 7. 차단/재매칭 금지와의 관계

| 액션 | 효과 |
| --- | --- |
| 평가 "다시 만나고 싶지 않음" | blocks(no_rematch) + 매칭 풀 제외 |
| 신고 후 나가기 | blocks(report) + 신고 |
| 수동 차단 | blocks(manual) |
| 차단 해제 | blocks 삭제 → 재매칭 가능 |

> 차단은 **양방향 매칭 제외**: 매칭 시 `blocks` 어느 방향이라도 존재하면 후보 제외.

---

## 8. 운영자 처리 가이드 (요약)

1. 신고 큐(오래된/중대 사유 우선) 확인
2. 채팅 로그 + 스크린샷 검토
3. 위반 → resolved + 패널티/정지 / 미충족 → rejected
4. 중대·반복 위반 → 일시정지(suspended) 또는 영구정지(banned)
5. 처리 결과 `admin_note` 기록 (감사 추적)
