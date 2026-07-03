# DeskMemo — Firebase 셋업 (M2)

동기화를 켜려면 Firebase 프로젝트를 **신규로** 만들고 구글 로그인을 활성화해야 합니다.
코드는 이미 준비돼 있고, 아래 셋업과 `firebase-config.js` 입력만 하면 됩니다.

> 결정: **신규 프로젝트** (taste-os 재사용 안 함 — 보안 규칙/사용량 격리), **구글 로그인**.

---

## 1. Firebase 프로젝트 생성

1. https://console.firebase.google.com → **프로젝트 추가**
2. 이름: `deskmemo` (프로젝트 ID가 `deskmemo`가 아니어도 됨 — 실제 ID를 메모)
3. Google 애널리틱스는 꺼도 됨

## 2. 웹 앱 등록 + config 복사

1. 프로젝트 개요 → **</>(웹)** 아이콘으로 앱 추가, 닉네임 `deskmemo-desktop`
2. 표시되는 `firebaseConfig` 값 복사
3. 이 폴더에서:
   ```bash
   cp src/firebase-config.example.js src/firebase-config.js
   ```
   그리고 `src/firebase-config.js`에 복사한 값 붙여넣기
   (이 파일은 `.gitignore`에 있어 커밋되지 않음)

## 3. 구글 로그인 활성화

1. 빌드 → **Authentication** → 시작하기
2. **Sign-in method** 탭 → **Google** 사용 설정 → 지원 이메일 선택 → 저장
3. **Settings → 승인된 도메인(Authorized domains)** 확인:
   - `localhost` 가 있는지 확인 (개발용)
   - 데스크탑 앱(WebView2)에서 팝업이 막히면(`auth/unauthorized-domain`) 아래 *데스크탑 로그인 주의* 참고

## 4. Firestore 생성 + 보안 규칙 배포

1. 빌드 → **Firestore Database** → 데이터베이스 만들기 → **프로덕션 모드** → 위치 선택(예: asia-northeast3 서울)
2. 보안 규칙 배포 (둘 중 하나):
   - **콘솔에서**: `src-tauri/firestore.rules` 내용을 Firestore → 규칙 탭에 붙여넣고 게시, 또는
   - **CLI로**:
     ```bash
     npm i -g firebase-tools
     firebase login
     # .firebaserc 의 "default": "deskmemo" 를 실제 프로젝트 ID로 맞추기
     firebase deploy --only firestore:rules
     ```

규칙 요지: `users/{uid}/notes/**` 는 **본인만** 읽기/쓰기, 그 외 전부 거부.

## 5. 실행

```bash
npm install
npm run dev
```

우측 상단 **로그인** 버튼 → 구글 계정 선택 → 메모가 Firestore에 저장되고
다른 기기에서 같은 계정으로 로그인하면 실시간 동기화됩니다.

---

## 데스크탑 로그인 주의 (Tauri + 구글)

`signInWithPopup` 은 Windows WebView2에서 별도 인증 창으로 열려 **대개 동작**합니다.
만약 막히면(`auth/unauthorized-domain`, 빈 팝업 등) 표준 대안은 **시스템 브라우저 + 루프백**:

1. 시스템 브라우저로 구글 OAuth 열기 (`redirect_uri=http://localhost:<port>`)
2. 로컬 루프백 서버로 `id_token` 수신
3. `GoogleAuthProvider.credential(idToken)` → `signInWithCredential(auth, cred)`

이 보강 흐름은 필요해질 때 `firebase.js` + `src-tauri`(루프백 커맨드)에 추가합니다.
먼저 팝업 방식으로 테스트해보고 결과를 알려주세요.

## 동작 모드 요약

| 상태 | 저장소 | 비고 |
|------|--------|------|
| `firebase-config.js` 없음 | localStorage | 로컬 전용, 로그인 버튼 숨김 |
| 설정됨 · 로그아웃 | localStorage | 로컬 전용 |
| 설정됨 · 구글 로그인 | Firestore | `users/{uid}/notes` 실시간 동기화 |

> 로그인 전 로컬 메모 → 클라우드 자동 마이그레이션은 아직 없음(M2 보완 예정).
> 로그인하면 클라우드 메모가 표시되고, 로컬 메모는 로그아웃 시 다시 보입니다.
