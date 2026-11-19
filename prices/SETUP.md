# 과일 가격 장부 — 서버 설정

주소: https://invedory.com/prices/

- **보기**는 로그인 없이 누구나 됩니다.
- **수정 · 추가 · 삭제**는 오른쪽 위 **수정하기** → PIN 을 넣어야 됩니다.
- 데이터는 알바 시급 관리와 같은 Firebase 프로젝트(`alba-pay-82d7c`)의 `price_book/` 아래에 저장됩니다.
  알바 기록(`alba_pay/`)과는 규칙으로 나뉘어 있어서 서로 보이지 않습니다.

## 처음 한 번: 규칙 게시 (1분)

1. https://console.firebase.google.com → `alba-pay` 프로젝트 → **Firestore Database → 규칙** 탭.
2. 내용을 모두 지우고 `alba-pay/firestore.rules` 파일 내용을 그대로 붙여 넣고 **게시**.
   (기존 알바 규칙에 `price_book` 부분이 더해진 것입니다. 알바 규칙은 그대로입니다.)

이메일/비밀번호 로그인과 `invedory.com` 승인 도메인은 알바 시급 관리 때 이미 켜 두었으므로 따로 할 일이 없습니다.

## 처음 들어가기

1. https://invedory.com/prices/ 를 엽니다.
2. **수정하기** → **PIN 만들기** (숫자 4~6자리). 수정하는 모든 사람이 이 PIN 을 씁니다.
3. 위에 "서버가 비어 있어요" 가 보이면 **시트 데이터 넣기** → 스프레드시트에서 옮긴 제품 23개 · 판매처 3곳 · 업체(휘프레쉬)가 들어갑니다.

## 자주 묻는 것

| 상황 | 해결 |
|---|---|
| "서버 규칙이 아직 적용되지 않았어요" | 위 규칙 게시를 했는지 확인하세요. |
| PIN 을 잊었어요 | 콘솔 → Authentication → 사용자에서 `editor@price-book.local` 삭제, Firestore → `price_book/main/meta/pin` 문서 삭제 → 새로고침하면 새 PIN 을 만들 수 있습니다. **기록은 그대로 남습니다.** |
| 수정하고 나서 | 공용 컴퓨터라면 **잠그기**를 누르세요. 브라우저를 닫으면 자동으로 잠깁니다. |

## 데이터가 저장되는 곳

`price_book/main/` 아래:
`products` (제품 · 단가 · 판매처별 가격), `brands` (판매처), `vendors` (업체), `materials` (부자재),
`history` (단가 · 업체 · 발송 방식 · 판매가 변동 기록), `config/main` (구분 · 등급 · 기본 택배비), `meta/pin` (PIN 을 만들었는지)

## 비용

Firebase 무료(Spark) 요금제: 하루 읽기 5만 · 쓰기 2만 · 저장 1GB. 제품 수백 개 · 기록 수천 건이어도 한도 안이라 비용이 들지 않습니다.
