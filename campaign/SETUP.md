# 체험단 플랫폼 — 설치 가이드

네이버 브랜드커넥트 방식의 체험단 모집·선정 사이트예요.

| 페이지 | 주소 | 누가 쓰나요 |
|---|---|---|
| 체험단 신청 | `index.html` | 크리에이터 (구글 로그인) |
| 관리자 | `admin.html` | 나 (핀번호 로그인) |

---

## 1. 파일 올리기

압축을 풀어서 나온 파일을 깃허브 저장소에 그대로 올리면 끝이에요.

```
index.html          체험단 신청 페이지
admin.html          관리자 페이지
style.css
common.js
app.js
admin.js
firebase-config.js  ← 설정값 (이미 입력돼 있어요)
```

---

## 2. 관리자 핀번호

관리자 페이지는 **핀번호**로 들어가요. 구글 로그인은 필요 없어요.

- **처음 핀번호: `1021`**
- 들어간 뒤 **설정 → 관리자 핀번호 변경**에서 언제든 바꿀 수 있어요 (숫자 4~8자리)

> 💡 핀번호는 화면에서만 검사하는 게 아니라 **파이어베이스 서버에서 검사**해요.
> 그래서 주소를 아는 사람이라도 핀번호 없이는 신청자 정보를 볼 수 없어요.

`firebase-config.js`에서 사이트 이름도 바꿀 수 있어요.

```js
window.SITE_NAME = "몽프루이 체험단";
```

⚠️ 같은 파일의 `ADMIN_LOGIN_EMAIL`은 핀번호를 검사하기 위한 내부용 이름이에요.
실제로 메일이 가는 주소가 아니고, **바꾸면 핀번호가 초기화되니 그대로 두세요.**

---

## 3. 파이어베이스 로그인 방식 켜기 ⭐ 새로 추가된 단계

파이어베이스 콘솔 → **Authentication → Sign-in method** 에서 **두 가지**를 켜 주세요.

| 항목 | 용도 |
|---|---|
| **이메일/비밀번호** | 관리자 핀번호 로그인 (⭐ 새로 켜야 해요) |
| **Google** | 체험단 신청자 로그인 |

「이메일/비밀번호」를 누르고 **사용 설정**만 켜면 돼요.
(아래 '이메일 링크' 항목은 꺼 두세요)

그리고 **Authentication → 설정 → 승인된 도메인**에 사이트 주소가 있는지 확인해 주세요.
(예: `invedory.com`)

---

## 4. 보안 규칙 넣기 (중요!)

파이어베이스 콘솔 → **Firestore Database → 규칙** 탭 → 아래 내용으로 **전부 교체** 후 **게시**.

> ⚠️ 규칙 안의 `admin@mongfruit.local`은 `firebase-config.js`의 `ADMIN_LOGIN_EMAIL`과 **똑같아야** 해요.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 핀번호로 로그인한 관리자
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == 'admin@mongfruit.local';
    }

    // 내 프로필 — 본인과 관리자만
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      allow read: if isAdmin();
    }

    // 캠페인 — 누구나 보기, 등록·수정은 관리자만
    match /campaigns/{cid} {
      allow read: if true;
      allow create, delete: if isAdmin();
      // 신청자 수 카운트만 로그인 사용자가 올릴 수 있음
      allow update: if isAdmin()
        || (request.auth != null
            && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['applicantCount']));

      // 신청 내역 — 본인 것만, 관리자는 전체
      match /applications/{uid} {
        allow create, update, delete: if request.auth != null && request.auth.uid == uid;
        allow read: if request.auth != null && request.auth.uid == uid;
        allow read, update: if isAdmin();
      }
    }

    // 공지 / 설정 — 누구나 보기, 쓰기는 관리자만
    match /notices/{id}   { allow read: if true; allow write: if isAdmin(); }
    match /settings/{id}  { allow read: if true; allow write: if isAdmin(); }
  }
}
```

---

## 5. 처음 사용 순서

1. `admin.html` 접속 → 핀번호 **1021** 입력 (첫 로그인 때 관리자 계정이 자동으로 만들어져요)
2. **설정** 탭에서 **핀번호를 1021에서 바꾸고**, 「신청 시 기본 유의사항」도 작성해 저장
3. **캠페인 등록** 탭에서 캠페인 작성 → 등록하기 → 확인 화면에서 **확정하기**
   - 확정을 누르지 않으면 「미노출 중」으로 보관돼요. (캠페인 관리에서 언제든 공개 가능)
4. `index.html` 주소를 크리에이터에게 공유
5. 신청이 들어오면 **캠페인 관리 → 신청자 조회·선정**에서
   미선정 → 1차 후보 → 최종 대상자 순으로 선정
6. **진행관리** 탭에서 배송 정보 확인 + 콘텐츠 URL 기록

---

## 자주 묻는 것

| 증상 | 확인할 것 |
|---|---|
| "이메일/비밀번호 로그인을 켜 주세요" | 3번에서 **이메일/비밀번호**를 사용 설정했는지 |
| 핀번호를 잊어버렸어요 | 콘솔 → Authentication → Users 에서 `admin@mongfruit.local` 계정을 **삭제**하면, 다시 `1021`로 들어올 수 있어요 |
| "권한이 없어요" 메시지 | 4번 보안 규칙을 **게시**했는지, 규칙 속 이메일이 맞는지 |
| 신청자 구글 로그인 팝업이 안 뜸 | 3번 승인된 도메인에 사이트 주소를 넣었는지 |
| 주소 검색 창이 안 열림 | 광고 차단 확장 프로그램을 잠시 꺼 보세요 (다음 우편번호 서비스 사용) |
| 사진이 안 올라감 | 이미지 파일인지 확인 (자동으로 1:1로 잘라 저장돼요) |

## 참고

- 제품 사진은 별도 저장소 없이 **파이어스토어에 직접 저장**해요. 자동으로 800×800으로 줄이기 때문에 추가 설정이 필요 없어요.
- 한 사람은 같은 캠페인에 **한 번만** 신청할 수 있어요. (모집 기간 안에는 취소 후 재신청 가능)
- 주소 검색은 **다음(카카오) 우편번호 서비스**를 쓰며, 별도 키 발급이 필요 없어요.
