# 🎲 랜덤픽!

고민될 때 카테고리만 누르면 랜덤으로 추천해주는 모바일 우선 PWA입니다.
할일·게임·메뉴·책·영화·간식·노래·닉네임 8가지를 즉석에서 뽑아줘요.
빌드 도구 없이 정적 파일로만 만들어서 GitHub Pages에 그대로 올리면 끝, 폰 홈화면에 앱처럼 설치할 수 있어요.

> 데모: `https://<내아이디>.github.io/random-pop/`

---

## 📁 구성 파일

| 파일 | 역할 |
|------|------|
| `index.html` | 메인 페이지 (구조 + 모든 스타일) |
| `app.js` | 추천 데이터 + 동작 로직 (전부 여기에 들어있음) |
| `manifest.json` | PWA 설정 (앱 이름·색상·아이콘) |
| `sw.js` | 오프라인 캐싱용 Service Worker |
| `icon-192.png` / `icon-512.png` / `icon-512-maskable.png` | 앱 아이콘 |
| `make_icons.py` | 아이콘 다시 만들 때 쓰는 스크립트 (배포엔 불필요) |

---

## 🚀 GitHub Pages 배포 가이드 (비개발자용)

### 1. 새 저장소 만들기

1. [github.com](https://github.com) 로그인 → 우측 상단 **`+` → New repository**
2. **Repository name**에 원하는 이름 입력 (예: `random-pop`)
3. **Public** 선택 → **Create repository**

> 💡 이미 `<아이디>.github.io` 저장소가 있다면 그 안에 `random-pop` 폴더로 넣어도 됩니다.
> 그러면 주소가 `https://<아이디>.github.io/random-pop/` 가 돼요.

### 2. 파일 업로드

#### 방법 A — 웹에서 드래그앤드롭 (가장 쉬움)

1. 만든 저장소 페이지에서 **Add file → Upload files** 클릭
2. 이 폴더의 파일들(`index.html`, `app.js`, `manifest.json`, `sw.js`, 아이콘 3개, `README.md`)을 **통째로 끌어다 놓기**
3. 아래 **Commit changes** 버튼 클릭

#### 방법 B — git 명령어

```bash
git clone https://github.com/<내아이디>/random-pop.git
cd random-pop
# 이 폴더의 파일들을 복사해 넣은 뒤
git add .
git commit -m "랜덤픽 PWA 추가"
git push origin main
```

### 3. GitHub Pages 켜기

1. 저장소 상단 **Settings** 탭
2. 왼쪽 메뉴 **Pages**
3. **Source**를 **Deploy from a branch**로 두고, Branch를 **`main` / `(root)`** 로 선택 → **Save**
4. 1~2분 뒤 `https://<내아이디>.github.io/random-pop/` 로 접속하면 끝!

---

## 📲 폰에 앱처럼 설치하기

### iPhone (Safari)

1. Safari로 사이트 접속 (⚠️ 크롬 말고 **Safari**여야 설치돼요)
2. 하단 **공유 버튼** `[↑]` 탭
3. **홈 화면에 추가** 선택 → **추가**
4. 홈 화면 아이콘으로 실행하면 전체화면(앱처럼) 떠요

### Android (Chrome)

1. Chrome으로 사이트 접속
2. 하단/상단에 뜨는 **"홈화면에 추가"** 배너 탭
   (또는 우측 상단 **⋮ 메뉴 → 앱 설치 / 홈 화면에 추가**)
3. **설치** 누르면 끝

설치하면 비행기 모드(오프라인)에서도 정상 작동합니다.

---

## 🌐 커스텀 도메인(서브도메인) 연결

`pick.내도메인.com` 같은 주소로 쓰고 싶다면:

1. 저장소 루트에 **`CNAME`** 파일을 만들고, 내용에 도메인만 한 줄 적기
   ```
   pick.내도메인.com
   ```
2. 도메인 등록처(가비아·Cloudflare 등) DNS 설정에서 **CNAME 레코드** 추가
   ```
   이름(Host):  pick
   값(Target):  <내아이디>.github.io
   ```
3. GitHub **Settings → Pages → Custom domain**에 도메인 입력 → **Save**
4. **Enforce HTTPS** 체크 (인증서 발급에 몇 분~수십 분 걸릴 수 있어요)

> 루트 도메인(`내도메인.com`)을 쓰려면 CNAME 대신 A 레코드(GitHub Pages IP 4개)를 등록해야 합니다.

---

## ✏️ 추천 데이터 수정하기

모든 데이터는 **`app.js` 맨 위 `data` 객체**에 들어있어요. 텍스트 에디터로 열어서 고치면 됩니다.

```js
const data = {
  todo: [
    { main: "할 일 텍스트", sub: "설명 한 줄" },   // ← 이런 줄을 추가/수정
    // ...
  ],
  music: {
    kpop: [
      { main: "곡명", sub: "아티스트", q: "유튜브 검색어" },  // 노래는 q 필수!
    ],
  },
};
```

- **할일**은 그냥 목록(배열)이라 줄만 추가하면 됩니다.
- **게임·메뉴·책·영화·간식**은 서브 필터별로 나뉘어 있어요 (예: `korean`, `western`…).
- **노래**는 각 항목에 `q`(유튜브 검색어)를 꼭 넣어야 "YouTube에서 재생" 버튼이 작동해요.
- **닉네임**은 `idData`의 단어 목록을 늘리면 조합이 더 다양해져요.

수정 후 파일을 다시 업로드(커밋)하면 반영됩니다.

---

## ⚠️ Service Worker 캐시 갱신 주의사항

PWA는 빠른 실행을 위해 파일을 폰에 **캐시(저장)**해 둡니다.
그래서 데이터를 고쳐서 올려도 **사용자에겐 옛날 화면이 그대로 보일 수 있어요.**

해결: 파일을 수정해서 배포할 때마다 **`sw.js`의 버전 숫자를 올리세요.**

```js
// sw.js
const CACHE_NAME = "randompick-v1";   // → "randompick-v2" 로 변경
```

이렇게 하면 다음 접속 시 새 버전을 받아오고 옛 캐시는 자동으로 삭제됩니다.

> 테스트 중에 바뀐 게 안 보이면: 브라우저 새로고침(강력 새로고침) 또는
> 개발자도구 → Application → Service Workers → **Unregister** 후 재접속.

---

## 🔮 향후 계획

지금은 정해진 목록에서 뽑지만, 나중에 실제 API를 붙일 수 있어요.

- 노래 → YouTube Data API (실시간 인기곡·썸네일)
- 책 → 알라딘 / 카카오 책 검색 API (실시간 베스트셀러)
- 영화 → TMDB API (포스터·평점)

확장하더라도 "오프라인/키 없을 땐 기본 목록으로 폴백" 원칙은 유지할 예정입니다.

---

라이선스: 자유롭게 가져다 쓰세요. 🎲
