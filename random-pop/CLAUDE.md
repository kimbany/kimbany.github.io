# 랜덤픽! — 프로젝트 컨텍스트

> 이 파일은 세션 간 컨텍스트 보존용입니다. 새 세션에서 작업을 이어갈 때 먼저 읽으세요.

## 프로젝트 개요

**랜덤픽!** 은 "뭐 하지/뭐 먹지/뭐 보지" 고민될 때 카테고리만 누르면 랜덤으로 추천을 받는 모바일 우선 PWA입니다. 빌드 도구 없이 정적 파일로만 구성되며, GitHub Pages에 그대로 올려서 배포하고 폰 홈화면에 설치할 수 있습니다.

- 배포 위치: `kimbany.github.io/random-pop/`
- 목적: 결정 장애를 줄여주는 가볍고 귀여운 랜덤 추천 도구

## 기술 스택 / 코딩 컨벤션

- 순수 **HTML + CSS + Vanilla JavaScript** (프레임워크/번들러/TypeScript 일절 사용 안 함)
- 외부 의존성은 **Google Fonts(Gaegu, Gowun Dodum)만** 허용
- 모든 추천 데이터는 `app.js` 안에 **하드코딩** (외부 JSON 분리 안 함)
- 지금은 **정적 데이터만** 사용. API 호출 코드 없음 (추후 확장 예정)
- 모듈 분리 없이 `app.js` **단일 파일**로 데이터 + 로직 관리

## 파일 구조와 역할

```
random-pop/
├── index.html              # 메인 페이지 (구조 + 모든 CSS 인라인 <style>)
├── app.js                  # 추천 데이터(data, idData) + 모든 로직
├── manifest.json           # PWA 설정 (이름, 색상, 아이콘, standalone)
├── sw.js                   # Service Worker (오프라인 캐싱)
├── icon-192.png            # 앱 아이콘 192x192
├── icon-512.png            # 앱 아이콘 512x512
├── icon-512-maskable.png   # 마스커블 아이콘 512x512 (안전영역 80%)
├── make_icons.py           # Pillow 아이콘 생성 스크립트 (재생성용)
├── CLAUDE.md               # 이 파일
└── README.md               # GitHub Pages 배포 가이드 (한국어)
```

## 데이터 추가/수정 방법 (`app.js`)

`app.js` 상단의 `data` 객체와 `idData` 객체만 수정하면 됩니다.

- **할일(todo)**: 평탄 배열. `{ main, sub }`
- **서브 필터 있는 카테고리(game/menu/book/movie/snack)**: `{ 서브키: [ {main, sub}, ... ] }` 형태. 새 서브 필터를 추가하면 `SUBS` 매핑과 함께 추가해야 함.
- **노래(music)**: 각 항목에 `q`(YouTube 검색어) 필드 필수 → 결과 카드의 "YouTube에서 재생" 버튼이 이 값을 사용.
- **아이디/닉네임(idData)**: `adj`(한글 형용사), `noun`(한글 명사), `eng`(영문 형용사), `engNoun`(영문 명사) 배열에서 랜덤 조합 생성.

서브 필터 라벨/순서는 `app.js`의 `SUBS` 객체에서 관리합니다. 데이터만 추가하면 UI는 자동 반영됩니다.

## Service Worker 캐시 갱신 방법 ⚠️

데이터나 코드를 수정한 뒤 배포할 때는 **반드시 `sw.js`의 `CACHE_NAME` 버전을 올려야** 사용자에게 변경분이 반영됩니다.

```js
// sw.js
const CACHE_NAME = 'randompick-v1';  // → 'randompick-v2'로 올리기
```

올리지 않으면 사용자 기기에 캐시된 옛 버전이 계속 표시됩니다. 새 SW는 `activate` 시 옛 캐시를 자동 삭제합니다.

## GitHub Pages 배포 흐름

1. 이 폴더의 파일들을 저장소에 커밋/푸시
2. 저장소 Settings → Pages에서 소스 브랜치 지정 (보통 `main`)
3. `https://<user>.github.io/random-pop/` 로 접속
4. 모바일에서 "홈 화면에 추가"로 설치
5. 자세한 내용은 `README.md` 참고

## 향후 확장 계획

지금은 정적 하드코딩 데이터이지만, 추후 실제 API 연동 예정:

- **노래**: YouTube Data API로 실제 재생/썸네일
- **책**: 알라딘 / 카카오 책 검색 API로 표지·실시간 베스트셀러
- **영화**: TMDB API로 포스터·평점·최신작
- **메뉴**: 위치 기반 주변 식당 연동 가능성

확장 시에도 "API 키가 없거나 오프라인이면 정적 데이터로 폴백" 원칙 유지.

## 완료 기준 체크리스트

- [x] 8개 카테고리 모두 작동, 매번 다른 결과
- [x] 노래 탭 YouTube 버튼 → 검색 결과 새 창
- [x] 폰에서 "홈 화면에 추가" 가능 (manifest + SW)
- [x] standalone 전체화면 실행
- [x] 오프라인(비행기 모드)에서도 작동
- [x] 모든 탭 영역 최소 44px
- [x] iOS/Android 메타 태그 + 설치 배너
