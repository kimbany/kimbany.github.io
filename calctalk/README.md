# CalcTalk

계산기로 위장한 비밀 채팅 데스크톱 앱 (Tauri 2.x).

평소엔 100% 진짜 계산기. 숨겨진 시퀀스(`7777=`)를 입력하면 기록 영역이
비밀 채팅으로 변신하고, 메시지는 계산식으로 위장됩니다.

> 이 앱은 **시각적 위장 앱**이지 암호화 보안 앱이 아닙니다. Firebase에는 평문이
> 저장됩니다. 목적은 "앱의 존재 자체를 옆사람에게 들키지 않는 것".

---

## 구조

```
calctalk/
├── src-tauri/        # Rust 백엔드 (창/단축키/스토어)
│   ├── src/          # lib.rs, main.rs, commands.rs, shortcuts.rs, window.rs
│   ├── icons/        # 계산기 아이콘 (직접 넣어야 함 → icons/README.md)
│   ├── capabilities/ # Tauri 권한
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/              # 프론트엔드 (Vanilla HTML/CSS/JS)
│   ├── index.html    # 계산기 메인
│   ├── setup.html    # 첫 설치 설정
│   ├── styles/       # calculator-win.css / calculator-mac.css / chat.css
│   └── js/           # calculator, sequence, veil, series-pool, chat,
│                     # panic, firebase-init, auth, store, os, main
├── database.rules.json  # Firebase RTDB 보안 규칙
└── package.json
```

---

## 빠른 미리보기 (브라우저, 빌드 없이)

프론트엔드 로직(계산기·시퀀스·채팅 변신·위장·패닉)은 브라우저에서 바로 확인 가능.
Firebase 미설정 시 채팅은 **로컬 데모 모드**(에코)로 동작합니다.

```bash
cd calctalk/src
python3 -m http.server 5173
# http://localhost:5173/  (처음엔 setup.html로 이동 → 닉네임/스타일 입력)
```

확인 순서:
1. 일반 계산 (사칙연산, 키보드 입력) 동작
2. `7 7 7 7 =` → 0.3초 뒤 기록 영역이 채팅으로 변신
3. 디스플레이에 타이핑 → `Enter`로 전송 → 메시지가 계산식으로 표시
4. 메시지 탭 → 3초간 평문 → 자동 재위장
5. `ESC` → 즉시 계산기로 복귀, 다시 `7777=` 하면 이어서

> ES 모듈 + Firebase CDN을 쓰므로 `file://` 직접 열기는 안 되고 로컬 서버 필요.

---

## 데스크톱 빌드 (Tauri)

### 사전 준비
- **Rust** (https://rustup.rs)
- **Node.js** 18+
- OS별 빌드 의존성: https://tauri.app/start/prerequisites/
  - 윈도우: Microsoft C++ Build Tools + WebView2
  - 맥: Xcode Command Line Tools

### 아이콘 생성 (최초 1회)
```bash
npx @tauri-apps/cli icon path/to/calculator.png   # 1024px PNG 하나
```

### 개발 실행
```bash
cd calctalk
npm install
npm run dev      # = tauri dev
```

### 배포 빌드
```bash
npm run build    # = tauri build
# 윈도우: src-tauri/target/release/bundle/{msi,nsis}/
# 맥:     src-tauri/target/release/bundle/{dmg,macos}/
```

> 코드 사이닝을 안 하면 "확인되지 않은 개발자" 경고가 뜹니다(본인용이면 무시 가능).

---

## Firebase 설정

1. Firebase 콘솔에서 프로젝트 생성 → **Realtime Database** 생성
2. **Authentication → 익명 로그인** 활성화
3. `src/js/firebase-init.js`의 `firebaseConfig`를 본인 값으로 교체
4. RTDB 보안 규칙에 `database.rules.json` 내용 적용

미설정 상태에서도 계산기 + 채팅 UI(로컬 데모)는 정상 작동합니다.

---

## 위장/시퀀스 동작 요약

| 동작 | 트리거 |
|------|--------|
| 채팅 진입 | `7777=` (설정에서 변경 가능) |
| 채팅 해제 | `0000=` / `ESC` / `Ctrl+Q`(맥 `Cmd+Q`) |
| 자동 위장 | 포커스 상실 5초 / 마우스 창 밖 15초 (설정 조정 가능) |
| 탭 투 리빌 | 메시지 탭 → 3초 평문 → 재위장 (한 번에 하나) |

위장 매핑(메시지→계산식)은 `tauri-plugin-store`(브라우저는 localStorage)로
디바이스에만 저장되어, 같은 메시지는 항상 같은 계산식으로 보입니다.

---

## 현재 범위 (MVP)

구현됨: 진짜 계산기(윈도우/맥 스타일) · 키보드 입력 · 시퀀스 감지 ·
채팅 변신 UI · Firebase 송수신(+로컬 데모) · 계산식 시리즈 위장(스타일당 5개) ·
탭 투 리빌 · 패닉(ESC/Ctrl+Q/포커스/마우스) · 6자리 초대 코드 · 첫 설치 설정.

Phase 2 예정: 사용자 정의 시퀀스 UI 고도화 · PIN 보안층 · 시리즈 풀 확장
(스타일당 30개) · 길이 매칭 · 위장 알림 · 자동 업데이트.
