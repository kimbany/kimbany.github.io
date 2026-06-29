# CLAUDE.md — 데스크탑 포스트잇 앱 (SMemo형)

> Claude Code 세션 연속성용 문서. 이 파일을 읽고 바로 이어서 작업한다.
> 프로젝트 코드네임: **DeskMemo**

---

## 1. 프로젝트 한 줄 요약

윈도우 바탕화면에 항상 떠 있는 포스트잇 메모 앱. 기기 간 실시간 동기화 + 일정/알람 기능 포함. Tauri 2.x + 단일 HTML/Tailwind + Firebase 스택.

## 2. 핵심 기능 (우선순위 순)

1. **포스트잇 메모** — 바탕화면 위 프레임 없는 카드, 색상별, 드래그 이동, 새 메모 단축키(Ctrl+Alt+N)
2. **기기 간 동기화** — Firebase 로그인 후 PC↔PC↔(추후 모바일웹) 실시간 동기화
3. **일정·알람** — 메모에 알람 시각 지정, 앱이 트레이에 상주 중이면 지정 시각에 데스크탑 알림

## 3. 기술 스택 (확정)

| 영역 | 선택 | 비고 |
|------|------|------|
| 데스크탑 셸 | Tauri 2.x | CalcTalk에서 쓴 것과 동일 |
| UI | 단일 HTML + Tailwind CSS (CDN) | 기존 프로젝트 컨벤션 유지 |
| 데이터/동기화 | Firebase Firestore + Auth | 실시간 리스너 |
| 전역 단축키 | tauri-plugin-global-shortcut | |
| 트레이 상주 | Tauri tray API | |
| 알림 | tauri-plugin-notification | |
| 창 제어 | Tauri WindowBuilder | always-on-top, decorations:false |

> ⚠️ 동기화는 Firebase로만 한다. (SMemo의 Smmgr.exe 그리드 트래픽 같은 백그라운드 업로드 절대 넣지 않음 — 사용자 데이터만 오감)
>
> 📌 **알려진 보완 필요 (구현 시 반영)**:
> - Tailwind CDN(`cdn.tailwindcss.com`)은 오프라인 데스크탑 앱에서 깨질 수 있음 → **M4에서 로컬 번들로 교체**.
> - Firestore `enablePersistence()`는 deprecated → **`persistentLocalCache` / `initializeFirestore({localCache})`** 사용.

## 4. 디렉터리 구조 (현재)

```
deskmemo/
├── CLAUDE.md                  # 이 파일
├── README.md
├── SETUP.md                   # Firebase 셋업 가이드 (M2)
├── package.json
├── firebase.json / .firebaserc / firestore.indexes.json   # Firebase 프로젝트 설정
├── src/                       # 프론트엔드 (웹뷰)
│   ├── index.html             # 메인 포스트잇 보드 (단일 HTML, type=module)
│   ├── app.js                 # 메모 CRUD, 드래그, 로컬/클라우드 저장 전환
│   ├── firebase.js            # Firebase 초기화 + 구글 로그인 + Firestore 동기화
│   ├── firebase-config.example.js   # config 템플릿(복사 → firebase-config.js)
│   └── (firebase-config.js)   # 실제 설정값, .gitignore (커밋 안 됨)
└── src-tauri/
    ├── tauri.conf.json        # 창/권한/번들 설정
    ├── Cargo.toml
    ├── build.rs
    ├── firestore.rules        # Firestore 보안 규칙 (users/{uid}/notes 본인만)
    ├── capabilities/
    │   └── default.json       # 권한 (window, global-shortcut, notification)
    ├── icons/                 # 앱/트레이 아이콘
    └── src/
        ├── main.rs            # 런처
        └── lib.rs             # 트레이, 단축키, 창 이벤트
```

> **설계 결정 (확정)**: 포스트잇 표시 방식은 **A — 하나의 보드 창 안에 카드들**로 시작.
> (구현 단순, 동기화/관리 쉬움. 핵심 동작 검증 후 B = 메모별 독립 창 옵션 재검토.)

## 5. 데이터 모델 (Firestore)

```
users/{uid}/notes/{noteId}
  - text: string
  - color: string            # "yellow" | "pink" | "blue" | "green" | "gray"
  - x, y: number             # 보드 내 위치 (px)
  - pinned: boolean          # 항상 위 고정
  - alarmAt: timestamp | null # 알람 시각
  - alarmFired: boolean      # 중복 알림 방지
  - createdAt, updatedAt: timestamp
  - order: number            # 정렬용
```

- 실시간 리스너: `onSnapshot`으로 notes 구독 → UI 자동 갱신
- 오프라인 대비: Firestore 오프라인 영속성 켜기 (`persistentLocalCache`, 위 §3 참고)
- 현재 프론트(`app.js`)는 동일 형태를 **localStorage**에 저장 중 → M2에서 Firestore로 교체

## 6. 단축키 (기본값, 환경설정에서 변경 가능하게)

| 동작 | 키 |
|------|-----|
| 새 메모 | Ctrl+Alt+N |
| 보드 보이기/숨기기 | Ctrl+Alt+Home |
| 환경설정 | Ctrl+Alt+F9 (⬜ 미구현) |

> 현재 Ctrl+Alt+N / Ctrl+Alt+Home 동작. 환경설정 단축키는 M4.

## 7. 알람 동작 명세

- 앱은 종료해도 **트레이에 상주**(close → hide, 트레이 메뉴의 '종료'로만 실제 종료) ✅ 구현됨
- 프론트에서 1분 간격(또는 30초) 타이머로 `alarmAt <= now && !alarmFired`인 메모 검사
- 조건 충족 시 `tauri-plugin-notification`으로 알림 → `alarmFired = true` 업데이트
- 동기화 환경이라 **여러 기기에서 중복 알림** 가능 → 처음 발화한 기기가 `alarmFired`를 true로 쓰면 다른 기기 onSnapshot으로 막힘 (onSnapshot 전파 지연으로 race 가능, 1차는 허용 / 추후 보완)

## 8. 작업 순서 (마일스톤)

- [x] **M0 — 셸 띄우기**: Tauri 2.x 프로젝트 생성, 프레임 없는 always-on-top 창, 트레이 아이콘, Ctrl+Alt+N 단축키 ✅
- [~] **M1 — 로컬 포스트잇**: 색상 카드 CRUD, 드래그 이동, 위치 저장(localStorage) — *기본 동작 구현, 다듬기 남음*
- [~] **M2 — Firebase 동기화**: 구글 로그인 + Firestore onSnapshot 양방향 동기화 **코드 구현** — *Firebase Console 셋업(사용자) + 2대 PC 검증 남음. `SETUP.md` 참고*
- [ ] **M3 — 알람**: alarmAt 지정 UI, 스케줄러, notification 발화
- [ ] **M4 — 다듬기**: 환경설정(단축키/시작프로그램 등록), 색상/폰트, Tailwind 로컬 번들, 오프라인 영속성
- [ ] **M5 (선택) — 모바일 웹**: 같은 Firebase로 읽기/쓰기 웹앱 (GitHub Pages)

## 9. 의사결정 / 열린 질문

1. ✅ 포스트잇 표시 방식 → **A (보드 카드)로 확정**
2. ✅ Firebase 프로젝트 → **신규 생성 `deskmemo`로 확정** (taste-os 재사용 시 보안 규칙 충돌·격리 상실. taste-os `firestore.rules`는 화이트리스트+catch-all deny라 notes 서브컬렉션이 막힘)
3. ✅ 로그인 방식 → **구글 로그인으로 확정** (`signInWithPopup`; 데스크탑에서 막히면 시스템 브라우저+루프백으로 보강, SETUP.md 참고)
4. ⬜ 시작프로그램 자동 등록을 기본 on으로 둘지 — *M4*

## 10. 참고 / 컨벤션

- 기존 프로젝트 컨벤션: 단일 HTML, Tailwind, Firebase, GitHub Pages 배포 — 동일하게 유지
- 빌드/배포: Tauri build → 윈도우 설치 파일(.msi/.exe). 코드사이닝은 추후
- **하지 말 것**: 백그라운드 업로드 트래픽, 번들된 스폰서 프로그램, 사용자 동의 없는 상주 프로세스

---

### 다음 세션 시작 시 Claude Code에게

> "CLAUDE.md 읽고 진행. M2 코드는 구현됨 → 사용자가 `SETUP.md`대로 Firebase Console 셋업 후 윈도우에서 검증 필요.
>  검증되면 M3(알람)로: `app.js`에 alarmAt 지정 UI + 1분 타이머 스케줄러, `tauri-plugin-notification` 발화, `alarmFired` 갱신.
>  남은 보완: (a) 로그인 시 로컬→클라우드 마이그레이션, (b) 데스크탑 구글 로그인이 팝업으로 안 되면 루프백 방식(SETUP.md)."
