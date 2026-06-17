# 11. 매칭 알고리즘

## 1. 개요

매칭은 **랜덤 기반**이되, 사용자가 선택한 **관심사 일치/불일치** 모드에 따라
후보 점수를 조정해 우선순위를 둔다. 실시간 대기열은 **Redis Sorted Set**으로 운영한다.

```
[매칭 요청] → 5초 카운트다운 → [큐 진입]
   → 매처(Matcher) 워커가 주기적/이벤트 기반으로 페어링
   → 세션 생성 → 양측 알림(match:found)
```

---

## 2. 큐 자료구조 (Redis)

```
key: match:queue:{mode}      # mode = similar | different
member: userId
score: enqueuedAt (epoch ms) # 오래 기다린 사용자 우선

추가 메타: match:user:{userId} = { interests:[...], isPremium, enqueuedAt }
```

- 프리미엄 우선 큐: 별도 키 `match:queue:{mode}:premium` 를 먼저 스캔하거나,
  score 에 가중치(우선순위 보정값)를 적용.

---

## 3. 후보 필터 (Hard Filter)

매칭 후보에서 **반드시 제외**:

1. 본인
2. `blocks` 관계(양방향 어느 쪽이든)
3. 재매칭 금지(no_rematch) 상대
4. 이미 진행 중 세션이 있는 상대(중복 매칭 방지)
5. 패널티 매칭 금지 상태 사용자(애초에 큐 진입 불가)
6. (옵션) 직전 N건 매칭 상대(연속 동일인 방지)

```sql
-- 후보 제외 핵심 조건
NOT EXISTS (SELECT 1 FROM blocks
            WHERE (blocker_id=:me AND blocked_id=:cand)
               OR (blocker_id=:cand AND blocked_id=:me))
```

---

## 4. 관심사 점수 (Soft Score)

두 사용자의 관심사 집합 A, B에 대해 **자카드 유사도** 사용:

```
similarity = |A ∩ B| / |A ∪ B|     # 0.0 ~ 1.0
```

### 모드별 점수

| 모드 | 목표 | 점수식(높을수록 우선) |
| --- | --- | --- |
| similar (일치) | 겹치는 사람 우선 | `score = similarity` |
| different (불일치) | 다른 사람 우선 | `score = 1 - similarity` |

### 최종 우선순위 = 가중 합

```
finalScore =  w1 * modeScore
            + w2 * waitFactor      # 오래 기다릴수록 ↑ (기아 방지)
            + w3 * mannerFactor    # 매너점수 정규화(건강한 매칭)
            + w4 * premiumBoost    # 프리미엄 우선

기본 가중치: w1=0.5, w2=0.3, w3=0.1, w4=0.1
waitFactor = min(1, waitedSeconds / 60)
```

> **랜덤 요소**: 동점/근접 후보 중에서는 무작위로 선택해 "랜덤 매칭" 본질 유지.
> 상위 K명(예: 5명) 후보 풀에서 랜덤 픽 → 결정론적 편향 방지.

---

## 5. 매칭 워커 의사코드

```python
def match_worker(mode):
    queue = redis.zrange(f"match:queue:{mode}", 0, -1)   # 대기 순
    for me in queue:
        if not redis.exists(me): continue                 # 취소/만료
        meMeta = load_meta(me)

        candidates = []
        for other in queue:
            if other == me: continue
            if hard_filter_fail(me, other): continue
            s = final_score(meMeta, load_meta(other), mode)
            candidates.append((other, s))

        if not candidates: continue
        candidates.sort(key=lambda x: -x[1])
        topK = candidates[:5]
        partner = random.choice(topK)[0]                  # 랜덤성 유지

        # 원자적 페어링 (둘 다 큐에서 제거)
        if atomic_remove_pair(mode, me, partner):
            session = create_session(me, partner, mode)
            notify_both(session)                          # match:found
```

- **원자성**: Lua 스크립트로 두 멤버 동시 제거(경쟁 조건 방지).
- **트리거**: 신규 enqueue 이벤트 + 주기 폴링(예: 1초) 혼합.

---

## 6. 카운트다운(5초) 처리

- 클라이언트가 5초 카운트다운 표시, 취소 시 큐 미진입
- 또는 서버가 `match:pending`(TTL 5s)으로 관리 → 만료 후 큐 이동
- 취소(`DELETE /match/request`)는 `match:pending`/큐에서 즉시 제거

---

## 7. 매칭 실패/대기 처리

| 상황 | 처리 |
| --- | --- |
| 후보 없음(대기 지속) | 대기 유지 + 일정 시간 후 "잠시 후 다시" 안내 |
| 장시간 미매칭 | waitFactor 상승으로 필터 완화(점수 임계 하향) |
| 동시 요청 폭주 | 워커 수평 확장 + 모드별 샤딩 |

---

## 8. 공정성·건강성 보정

- **기아 방지**: 오래 기다린 사용자 점수 가산(waitFactor)
- **매너 반영**: 신고 다발/저매너 사용자는 노출 빈도 하향(소프트)
- **에코챔버 완화**: different 모드 제공으로 다양성 확보
- **반복 매칭 방지**: 최근 매칭 상대 쿨다운(예: 24h)
