# 설문조사 사이트 - 파이어베이스 설정 가이드

딱 한 번만 설정하면 됩니다. 10분 정도 걸려요.
모든 과정은 **dajoeuna.official** 구글 계정으로 진행하세요.

---

## 1단계. 파이어베이스 프로젝트 만들기

1. https://console.firebase.google.com 접속 → **dajoeuna.official** 계정으로 로그인
2. **프로젝트 추가** 클릭
3. 프로젝트 이름 입력 (예: `my-survey`) → 계속
4. 구글 애널리틱스는 **사용 안 함**으로 꺼도 됩니다 → **프로젝트 만들기**

## 2단계. 웹 앱 등록하고 설정값 복사하기

1. 프로젝트 첫 화면에서 **`</>` (웹)** 아이콘 클릭
2. 앱 닉네임 입력 (예: `survey`) → **앱 등록**
   - "Firebase 호스팅 설정"은 체크하지 마세요 (깃허브 페이지를 쓰니까 필요 없어요)
3. 화면에 나오는 `firebaseConfig = { ... }` 부분을 복사
4. 이 폴더의 **`firebase-config.js`** 파일을 열어서, `"여기에-붙여넣기"`라고 된 부분을 복사한 값으로 교체

예시 (완성된 모습):

```js
window.firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXX",
  authDomain: "my-survey.firebaseapp.com",
  projectId: "my-survey",
  storageBucket: "my-survey.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## 3단계. Firestore 데이터베이스 만들기

1. 왼쪽 메뉴 **빌드 → Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. 위치: `asia-northeast3 (서울)` 선택 → 다음
4. **프로덕션 모드**로 시작 → 만들기

## 4단계. 보안 규칙 설정 (중요!)

1. Firestore 화면 상단의 **규칙** 탭 클릭
2. 내용을 전부 지우고 아래 규칙을 붙여넣기 → **게시** 클릭

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /surveys/{surveyId} {
      // 설문 내용은 누구나 읽을 수 있음 (응답자가 봐야 하니까)
      allow read: if true;
      // 설문 만들기/수정/삭제는 로그인한 주인만
      allow create: if request.auth != null
                    && request.resource.data.ownerUid == request.auth.uid;
      allow update, delete: if request.auth != null
                            && resource.data.ownerUid == request.auth.uid;

      match /responses/{responseId} {
        // 응답 제출은 누구나 (익명 응답)
        allow create: if true;
        // 응답 열람/삭제는 설문 주인만
        allow read, delete: if request.auth != null
          && get(/databases/$(database)/documents/surveys/$(surveyId)).data.ownerUid == request.auth.uid;
      }
    }
  }
}
```

## 5단계. 구글 로그인 켜기

1. 왼쪽 메뉴 **빌드 → Authentication** 클릭 → **시작하기**
2. **Google** 선택 → **사용 설정** 켜기 → 지원 이메일 선택 → 저장

## 6단계. 허용 도메인 추가

1. Authentication 화면의 **설정 탭 → 승인된 도메인** 클릭
2. **도메인 추가**를 눌러 아래 두 개를 추가:
   - `invedory.com`
   - `kimbany.github.io`

## 끝! 사용 방법

- **관리자 페이지** (설문 만들기/결과 보기):
  https://invedory.com/survey/
- 설문을 만들면 **공유 링크**가 자동으로 복사돼요. 카톡 등으로 보내면 끝!
- 응답하는 사람은 **로그인 없이** 바로 답할 수 있어요.
- 결과 페이지에서 그래프로 보고 **CSV(엑셀) 다운로드**도 가능해요.

## 문제가 생기면

| 증상 | 확인할 것 |
|------|-----------|
| "파이어베이스 설정이 필요해요" 화면이 계속 나옴 | `firebase-config.js`에 값을 제대로 붙여넣었는지, 깃허브에 푸시했는지 |
| 로그인 팝업이 안 뜨거나 에러 | 5단계(구글 로그인), 6단계(승인된 도메인) 확인 |
| "불러오기 실패" / "권한 없음" 에러 | 4단계 보안 규칙을 게시했는지 확인 |
| 응답 제출이 안 됨 | 3단계 Firestore를 만들었는지, 4단계 규칙 확인 |
