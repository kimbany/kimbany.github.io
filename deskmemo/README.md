# DeskMemo

윈도우 바탕화면에 항상 떠 있는 포스트잇 메모 앱. 기기 간 실시간 동기화 + 일정/알람 기능 포함.
**Tauri 2.x + 단일 HTML/Tailwind + Firebase** 스택.

> 설계/로드맵 전체는 [`CLAUDE.md`](./CLAUDE.md) 참고.

## 현재 상태

- ✅ **M0 — 셸**: 프레임 없는 always-on-top 보드 창, 트레이 상주, 전역 단축키
- 🟡 **M1 — 로컬 포스트잇**(부분): 색상 카드 CRUD, 드래그 이동, localStorage 저장
- ⬜ M2 Firebase 동기화 · M3 알람 · M4 다듬기 · M5 모바일 웹

## 단축키

| 동작 | 키 |
|------|-----|
| 새 메모 | `Ctrl+Alt+N` |
| 보드 보이기/숨기기 | `Ctrl+Alt+Home` |

트레이 아이콘: 좌클릭 = 보드 토글, 우클릭 = 메뉴(새 메모 / 보이기·숨기기 / 종료).
창의 `－` 버튼이나 닫기는 **종료가 아니라 숨김**이며, 실제 종료는 트레이 메뉴의 **종료**로만.

## 개발 / 빌드

### 사전 요구사항
- **Rust** (stable) + Cargo
- **Node.js** 18+
- **Windows**: Tauri 빌드 의존성([WebView2](https://developer.microsoft.com/microsoft-edge/webview2/), MSVC Build Tools)
  - macOS/Linux 빌드는 [Tauri 사전요구사항](https://tauri.app/start/prerequisites/) 참고

> ⚠️ 이 프로젝트는 **Windows에서 빌드**하는 것을 1차 타겟으로 합니다.
> WebView2 런타임이 없는 환경(일부 CI/컨테이너)에서는 `tauri dev`/`build`가 실패합니다.

### 명령
```bash
cd deskmemo
npm install          # @tauri-apps/cli, @tauri-apps/api
npm run dev          # 개발 실행 (tauri dev)
npm run build        # 설치 파일(.msi/.exe 등) 빌드 (tauri build)
```

## 구조

```
deskmemo/
├── CLAUDE.md                 # 설계/로드맵 (세션 연속성 문서)
├── package.json
├── src/                      # 프론트엔드 (웹뷰)
│   ├── index.html            # 보드 (단일 HTML)
│   └── app.js                # 메모 CRUD / 드래그 / 저장
└── src-tauri/
    ├── tauri.conf.json       # 창(프레임리스·always-on-top)/번들 설정
    ├── Cargo.toml
    ├── build.rs
    ├── capabilities/default.json   # 권한 (window, global-shortcut, notification)
    ├── icons/                # 앱/트레이 아이콘
    └── src/
        ├── main.rs           # 런처
        └── lib.rs            # 트레이 + 전역 단축키 + 창 이벤트
```

## 다음 단계 (M2 — Firebase)
1. `src/firebase.js` 추가: Firebase 초기화 + Auth
2. `app.js`의 localStorage 계층을 Firestore `onSnapshot` / `setDoc`로 교체
3. 데이터 모델은 `CLAUDE.md §5` (`users/{uid}/notes/{noteId}`) 그대로 사용
