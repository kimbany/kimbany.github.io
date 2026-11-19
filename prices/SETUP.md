# 과일 가격 장부 — 서버(Firebase) 설정

주소: https://invedory.com/prices/
보기는 누구나, 수정 · 추가 · 삭제는 오른쪽 위 **수정하기** → PIN.
알바 시급 관리와는 **다른 Firebase 프로젝트**를 씁니다.

## 1. 프로젝트 만들기
1. https://console.firebase.google.com → 구글 로그인.
2. **+ 프로젝트 만들기** (또는 "Firebase 프로젝트 시작하기").
3. 이름: `price-book` → 약관 체크 → 계속.
4. Google 애널리틱스: **사용 안 함** → 프로젝트 만들기 → 완료되면 계속.

## 2. 웹 앱 등록 → 설정값
1. 프로젝트 첫 화면의 **`</>`** (웹) 아이콘.
2. 앱 닉네임 `price-book`, Firebase 호스팅은 체크하지 않음 → **앱 등록**.
3. 나오는 `const firebaseConfig = { ... }` 를 복사 → Claude 에게 보내거나 `prices/index.html` 의 `PB_FIREBASE_CONFIG = null` 자리에 넣습니다.

## 3. 로그인(PIN 용) 켜기
1. 왼쪽 **빌드 → Authentication → 시작하기**.
2. **Sign-in method → 이메일/비밀번호 → 사용 설정** 켜고 저장 (이메일 링크는 끔).
3. **설정 → 승인된 도메인 → 도메인 추가** → `invedory.com`.

## 4. 데이터베이스 + 규칙
1. 왼쪽 **빌드 → Firestore Database → 데이터베이스 만들기**.
2. 버전이 나오면 **Standard**, 위치 **asia-northeast3 (Seoul)**, **프로덕션 모드**로 만들기.
3. **규칙** 탭 → 내용을 지우고 `prices/firestore.rules` 를 붙여 넣고 **게시**.

## 5. 처음 들어가기
1. https://invedory.com/prices/ → **수정하기** → **PIN 만들기** (숫자 4~6자리).
2. "서버가 비어 있어요" → **시트 데이터 넣기** (제품 23개 · 판매처 3곳 · 휘프레쉬).

## 자주 묻는 것
| 상황 | 해결 |
|---|---|
| "서버 규칙이 아직 적용되지 않았어요" | 4-3 규칙 게시를 확인하세요. |
| "이메일/비밀번호 로그인을 켜 주세요" | 3-2 를 확인하세요. |
| PIN 을 잊었어요 | Authentication → 사용자에서 `editor@price-book.local` 삭제, Firestore → `price_book/main/meta/pin` 삭제 → 새로고침 후 새 PIN. **기록은 그대로입니다.** |

## 저장 위치
`price_book/main/` 아래 `products` · `brands` · `vendors` · `materials` · `history` · `config/main` · `meta/pin`

## 비용
무료(Spark) 요금제: 하루 읽기 5만 · 쓰기 2만 · 저장 1GB. 이 용도로는 비용이 들지 않습니다.
