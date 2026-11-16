# 알바 시급 관리 — 서버(Firebase) 설정

서버 설정을 마치면 **어느 컴퓨터 · 휴대폰에서 열어도 같은 데이터**를 봅니다.
설정 전에는 기록이 각 브라우저에만 저장됩니다 (기기마다 다름).

처음 한 번만 하면 되고, 10분 정도 걸립니다. 비용은 들지 않습니다 (무료 요금제로 충분).

---

## 1. Firebase 프로젝트 만들기

1. https://console.firebase.google.com 에 구글 계정으로 들어갑니다.
2. **프로젝트 추가** → 이름은 `alba-pay` 처럼 아무거나 → Google 애널리틱스는 **사용 안 함** → 만들기.

> 알바생 연락처 같은 개인정보가 들어가므로, 다른 서비스와 섞지 않게 **새 프로젝트**를 권장합니다.

## 2. 웹 앱 등록 → 설정값 복사

1. 프로젝트 첫 화면에서 **`</>` (웹)** 아이콘을 누릅니다.
2. 앱 닉네임 `alba-pay` → **앱 등록** (Firebase 호스팅은 체크하지 않음).
3. 화면에 나오는 `const firebaseConfig = { ... }` 안의 값(apiKey, authDomain, projectId …)을 복사해 둡니다.
   → 이 값을 Claude 에게 보내 주거나, `alba-pay/index.html` 위쪽 `ALBA_FIREBASE_CONFIG = null` 자리에 넣습니다.

## 3. 로그인 방식 켜기 (PIN 용)

1. 왼쪽 메뉴 **빌드 → Authentication → 시작하기**.
2. **Sign-in method** 탭 → **이메일/비밀번호** → **사용 설정** 켜기 → 저장.
   (아래 '이메일 링크'는 꺼 둡니다)
3. **설정** 탭 → **승인된 도메인**에 `invedory.com` 이 있는지 확인하고, 없으면 추가합니다.

> PIN 은 `owner@alba-pay.local` 이라는 내부용 계정의 비밀번호로 저장됩니다. 실제 메일 주소가 아닙니다.

## 4. 데이터베이스 만들기 + 보안 규칙

1. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기**.
2. 위치: **asia-northeast3 (서울)** → **프로덕션 모드**로 시작.
3. **규칙** 탭을 열고, 내용을 모두 지운 뒤 이 폴더의 `firestore.rules` 내용을 붙여 넣고 **게시**합니다.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner() {
      return request.auth != null && request.auth.token.email == 'owner@alba-pay.local';
    }
    match /alba_pay_public/{doc} {
      allow read: if true;
      allow write: if isOwner();
    }
    match /alba_pay/{document=**} {
      allow read, write: if isOwner();
    }
  }
}
```

## 5. 처음 들어가기

1. https://invedory.com/alba-pay/ 를 엽니다. 위에 **☁ 서버 저장 · 모든 기기 공유** 가 보이면 서버 모드입니다.
2. **PIN 만들기** 화면에서 PIN 을 정합니다. 이 PIN 을 모든 기기에서 씁니다.
3. 그 컴퓨터에 예전 기록(로컬 모드 시절)이 있으면 "서버로 옮길까요?" 라고 묻습니다 → **확인**.
   다른 컴퓨터에도 따로 적은 기록이 있었다면, 그 컴퓨터에서 처음 들어갈 때 "합칠까요?" 라고 한 번 더 묻습니다.

---

## 자주 묻는 것

| 상황 | 해결 |
|---|---|
| PIN 을 잊었어요 | 콘솔 → Authentication → 사용자에서 `owner@alba-pay.local` **삭제**, Firestore → `alba_pay_public` → `meta` 문서 **삭제** → 새로고침하면 새 PIN 을 만들 수 있습니다. **기록은 그대로 남습니다.** |
| "이메일/비밀번호 로그인을 켜 주세요" | 3번을 확인하세요. |
| 들어가자마자 "서버와 연결이 끊겼습니다" | 4번 규칙을 **게시**했는지, 규칙 속 이메일이 `owner@alba-pay.local` 인지 확인하세요. |
| 여러 번 틀려서 막혔어요 | Firebase 가 자동으로 잠시 막은 것입니다. 몇 분 뒤 다시 하세요. |

## 데이터가 저장되는 곳

- `alba_pay/main` — 설정 · 알바생 목록
- `alba_pay/main/months/{YYYY-MM}` — 그 달 근무 기록
- `alba_pay_public/meta` — PIN 을 만들었는지 여부만 (누구나 읽기 가능, 다른 내용 없음)

## 비용

Firebase 무료(Spark) 요금제 한도: 하루 읽기 5만 · 쓰기 2만 · 저장 1GB.
알바생 수십 명 · 몇 년 치 기록도 한도의 1% 안쪽이라 **비용이 들지 않습니다.**
