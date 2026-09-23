# 체험단 플랫폼 — 설치 가이드

네이버 브랜드커넥트 방식의 체험단 모집·선정 사이트예요.

| 페이지 | 주소 | 누가 쓰나요 |
|---|---|---|
| 체험단 신청 | `index.html` | 크리에이터 (구글 로그인) |
| 관리자 | `admin.html` | 나 (관리자 계정만) |

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

## 2. 관리자 계정 지정하기

`firebase-config.js` 파일을 열면 아래 부분이 있어요.

```js
window.ADMIN_EMAILS = [
  "dajoeuna.official@gmail.com"
];
```

여기 적힌 구글 계정만 `admin.html`에 들어갈 수 있어요.
관리자를 추가하려면 **여기와 아래 4번 보안 규칙 두 곳 모두**에 이메일을 넣어 주세요.

사이트 이름도 같은 파일에서 바꿀 수 있어요.

```js
window.SITE_NAME = "몽프루이 체험단";
```

---

## 3. 파이어베이스 준비 (이미 해두신 것)

기존 `dajoeuna-survey` 프로젝트를 그대로 쓰고 있어요. 아래 두 가지만 확인해 주세요.

- **Authentication → Sign-in method → Google** 사용 설정 ✅
- **Authentication → 설정 → 승인된 도메인**에 사이트 주소 추가
  (예: `dajoeunaofficial-sys.github.io`)

---

## 4. 보안 규칙 넣기 (중요!)

파이어베이스 콘솔 → **Firestore Database → 규칙** 탭 → 아래 내용으로 **전부 교체** 후 **게시**.

> ⚠️ 첫 줄의 이메일을 본인 관리자 계정으로 맞춰 주세요. (2번의 `ADMIN_EMAILS`와 같아야 해요)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null
        && request.auth.token.email in ['dajoeuna.official@gmail.com'];
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

1. `admin.html` 접속 → 관리자 계정으로 로그인
2. **설정** 탭에서 「신청 시 기본 유의사항」을 작성하고 저장
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
| 관리자 페이지에서 "관리자 계정이 아니에요" | 2번 `ADMIN_EMAILS`에 로그인한 이메일이 있는지 |
| "권한이 없어요" 메시지 | 4번 보안 규칙을 **게시**했는지, 규칙 속 이메일이 맞는지 |
| 로그인 팝업이 안 뜸 | 3번 승인된 도메인에 사이트 주소를 넣었는지 |
| 주소 검색 창이 안 열림 | 광고 차단 확장 프로그램을 잠시 꺼 보세요 (다음 우편번호 서비스 사용) |
| 사진이 안 올라감 | 이미지 파일인지 확인 (자동으로 1:1로 잘라 저장돼요) |

## 참고

- 제품 사진은 별도 저장소 없이 **파이어스토어에 직접 저장**해요. 자동으로 800×800으로 줄이기 때문에 추가 설정이 필요 없어요.
- 한 사람은 같은 캠페인에 **한 번만** 신청할 수 있어요. (모집 기간 안에는 취소 후 재신청 가능)
- 주소 검색은 **다음(카카오) 우편번호 서비스**를 쓰며, 별도 키 발급이 필요 없어요.
