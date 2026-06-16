# ASMR Creator Platform — CLAUDE.md

이 문서는 **AI 에이전트(Claude Code 등)가 새 세션을 열 때 가장 먼저 읽는 단일 진입점**입니다. 모든 결정사항·범위·데이터 스키마·v2.0 이연 항목이 여기에 누적됩니다. 큰 결정이 생길 때마다 §13(결정사항 로그)에 추가하세요. **절대 과거 항목을 덮어쓰지 마세요.**

> 참고: 이전 단일 사용자용 iOS Mix App 문서(`asmr-mix-app/CLAUDE.md`)는 이 프로젝트의 전신(prequel)이지만, 본 프로젝트는 범위·기술스택·아키텍처가 모두 달라 **해당 문서를 직접 참조하지 않습니다.**

---

## 1. 프로젝트 정체성

- **제품명**: ASMR Creator Platform (가칭, "ASMR 유튜브")
- **한 줄 정의**: 누구나 ASMR을 **제작·공유**하고 다른 제작자를 **구독·발견**할 수 있는 모바일 크리에이터 플랫폼.
- **타깃**: 한국 내 ASMR 청취자 + 잠재 제작자(녹음 가능한 일반인 포함).
- **궁극 비전(참고)**: 제작 + 공유 + 구독 + 커뮤니티 + 수익화 + 2차 창작 로열티를 모두 지원하는 양면 마켓.
- **v1.0 현실 범위**: 위 비전 중 **제작 + 공유 + 발견 + 기본 커뮤니티**까지. 수익화·로열티·AI는 v2.0+로 명시 이연. (§3, §4 참고)

---

## 2. 핵심 원칙 (Non-negotiable)

1. **양면 마켓의 콜드 스타트는 기술이 아니라 콘텐츠가 푼다.** v1.0은 "초기 제작자 100명·시드 ASMR 200개" 확보가 출시 조건. 기능 개수가 아닌 **첫 공급량**이 GO/NO-GO 판정 기준.
2. **모든 사운드 자산은 라이선스가 명시되어야 한다.** 기본 사운드 30종(§7)은 자체 녹음 또는 CC0/구매 확보. 사용자 업로드는 약관에 "본인 권리" 동의 + 신고 처리.
3. **수익화 기능은 v1.0에 절대 넣지 않는다.** 결제·정산·세무·앱스토어 IAP 30% 수수료·환불 등 복잡도가 1인분 이상. v1.0 사용자 검증 후 §4 로드맵대로 단계 진입.
4. **개인정보 최소 수집.** 이메일 + 닉네임만 필수. 실명·전화번호 v1.0에서 받지 않음.
5. **AI 기능은 v1.0에서 0개.** "AI 자동 제작·추천"은 사용자 데이터가 없는 상태에서 가치가 0. v2.0 이후.

---

## 3. v1.0 범위 (확정)

### 포함 (Must)
| 기능 | 설명 | 우선순위 |
|---|---|---|
| **기본 제작 모드** | 사운드 N개를 순차 재생 + 각 트랙 시간 지정 | P0 |
| **디테일 제작 모드** | 그룹 단위 동시 재생 + 타임라인 에디터 | P0 |
| **사운드 녹음** | 마이크 녹음 → 내 사운드로 저장 | P0 |
| **음원 편집** | 자르기 / 반복 / 볼륨 / 페이드 인·아웃 | P0 |
| **백그라운드 재생** | 잠금화면 컨트롤, 이어폰 버튼, 수면 타이머, 페이드아웃 종료 | P0 |
| **믹스 저장·공유** | 제목/설명/썸네일/카테고리/태그 + 공개범위(비공개/링크/전체) | P0 |
| **카테고리·태그** | 자연/사람/귀청소/생활/수면/기타 + 자유 태그 | P0 |
| **검색** | 제목/제작자/태그/설명 + 정렬(최신/인기/좋아요) | P0 |
| **보관함 + 그룹** | 저장/즐겨찾기, 사용자 정의 그룹 | P0 |
| **컬렉션** | 보관함 상위. 공개 가능한 큐레이션 | P1 |
| **기본 커뮤니티** | 좋아요 / 댓글 / 답글 / 북마크 | P0 |
| **랭킹** | 일간/주간/월간 인기 (단순 점수, 추천 알고리즘 X) | P1 |
| **제작자 페이지** | 닉네임·소개·작품 리스트 (구독 v2.0) | P0 |
| **신고·관리** | 부적절 콘텐츠 신고 + 관리자 모더레이션 큐 | P0 |

### 제외 (v2.0 이연 — 명시적으로 v1.0에 절대 안 넣음)
- 제작자 **구독** + 구독 피드 + 알림 → v2.0
- **수익화** (포인트/크레딧/현금 판매) → v2.1
- **2차 창작 로열티 시스템** → v2.2 (이게 가장 어려움. §11 리스크)
- **AI 추천** + **AI 자동 제작** → v3.0 (사용자 데이터 누적 후)
- **고급 노이즈 제거**(서버 사이드) → v2.0
- 인앱결제, 전자금융업 신고 관련 일체 → 별도 트랙

### v1.5 후보 (출시 후 2~3개월 내 우선 검토)
- 제작자 구독 + 알림(가장 자주 요청될 것)
- 이어듣기/플레이백 히스토리
- 다국어(영어 최우선)

---

## 4. v2.0 이후 로드맵 (참고용 · 비확정)

- **v2.0**: 구독·알림·고급 편집(노이즈 제거 등)
- **v2.1**: 무료/유료 공개 분리 + Apple IAP 연동 + 크리에이터 정산(KYC 포함)
- **v2.2**: 2차 창작 시스템 + 로열티 자동 분배 — **이 시점 전에 음악·저작권 변호사 자문 필수**
- **v3.0**: AI 추천 + AI 자동 제작
- **vX**: 웹(브라우저) 청취 클라이언트, CarPlay/Android Auto

---

## 5. 기술 스택 (확정)

| 영역 | 선택 | 이유 |
|---|---|---|
| 모바일 앱 | **Flutter (Dart)** | iOS+Android 단일 코드베이스. 초기 인력 효율 최우선 |
| 백엔드 BaaS | **Firebase** | Auth·Firestore·Storage·Functions·FCM 통합. 초기 운영비 거의 0 |
| 인증 | Firebase Auth | Apple/Google 소셜 로그인 우선 |
| DB | Firestore | NoSQL. 스키마는 §8 참고. **랭킹·집계는 Functions로 비동기 갱신** |
| 파일 저장 | Firebase Storage | 사용자 업로드 오디오 + 썸네일. CDN 자동 |
| 서버 로직 | Cloud Functions (Node 20) | 신고 처리, 랭킹 점수 갱신, 검색 인덱스 동기화 |
| 검색 | **Algolia** (또는 Typesense) | Firestore의 텍스트 검색이 약함. Functions로 변경분 동기화 |
| 푸시 | FCM | v2.0 알림 진입 시 활성 |
| 결제 | **v1.0 미사용**. v2.1에서 Apple/Google IAP + RevenueCat |
| 분석 | Firebase Analytics + Crashlytics | 무료, 충분 |

### Flutter 핵심 패키지
- 재생: `just_audio` + `just_audio_background` (잠금화면/백그라운드)
- 오디오 라우팅: `audio_session`
- 녹음: `record` (또는 `flutter_sound`)
- 편집(자르기/페이드/노이즈): `ffmpeg_kit_flutter` (저작권 LGPL 빌드 사용)
- 상태관리: **Riverpod** (Provider 2세대. BLoC보다 학습곡선 완만)
- 라우팅: `go_router`

### 다중 트랙 실시간 믹싱 — **알려진 리스크**
Flutter 단독으로는 다중 `just_audio` 인스턴스를 동시 재생하는 정도까지만 안정적이고, 트랙별 실시간 이펙트·정밀 동기화·페이드 처리는 native 모듈이 필요합니다.
- **v1.0 절충안**: 동시 재생 트랙 **최대 4개**, 이펙트는 페이드 인/아웃만. 정밀 동기화는 보장하지 않음(±50ms 허용).
- **v1.0 PoC 1순위**: "4개 트랙 동시 재생 + 백그라운드 + 잠금화면 컨트롤"이 Flutter 기본 스택에서 안정적인지 검증. 안 되면 native 모듈(iOS=AVAudioEngine, Android=Oboe) Method Channel로 분리.

### 미선택 / 보류
- React Native: Flutter 대신 RN을 쓰지 않습니다. 단일 결정.
- 자체 호스팅 백엔드(K8s 등): v1.0 절대 안 함.
- WebRTC, P2P 스트리밍: 해당 없음.

---

## 6. 폴더 구조 (모노레포)

```
asmr-platform/
├── app/                          # Flutter 앱
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app/                  # 진입점, 라우팅, 테마
│   │   ├── features/             # 기능 단위 (feature-first)
│   │   │   ├── auth/
│   │   │   ├── home/
│   │   │   ├── sound_library/    # 기본 사운드 + 내 사운드
│   │   │   ├── recording/        # 녹음
│   │   │   ├── editor/           # 음원 편집
│   │   │   ├── mix_creator/      # 기본/디테일 제작 모드
│   │   │   ├── playback/         # 재생, 잠금화면, 타이머
│   │   │   ├── mix_detail/       # 상세 + 댓글
│   │   │   ├── library/          # 보관함 + 그룹 + 컬렉션
│   │   │   ├── search/
│   │   │   ├── ranking/
│   │   │   └── creator_page/
│   │   ├── core/
│   │   │   ├── audio/            # AudioEngine 추상화
│   │   │   ├── network/
│   │   │   ├── storage/
│   │   │   └── utils/
│   │   └── models/               # Firestore <-> Dart 모델
│   ├── ios/
│   ├── android/
│   └── pubspec.yaml
├── functions/                    # Firebase Cloud Functions (TypeScript)
│   ├── src/
│   │   ├── ranking/              # 일·주·월 랭킹 점수 집계
│   │   ├── moderation/           # 신고 처리
│   │   ├── search_sync/          # Algolia 동기화
│   │   └── index.ts
│   └── package.json
├── firestore.rules               # 보안 규칙
├── storage.rules
├── firebase.json
├── docs/
│   ├── sounds_seed.json          # 기본 사운드 30종 메타데이터
│   ├── data-model.md             # ERD
│   └── decisions/                # ADR (Architecture Decision Record)
└── CLAUDE.md                     # 이 파일
```

---

## 7. 기본 사운드 라이브러리 (시드 30종)

서비스 출시 시점에 **이미 들어 있어야 하는 큐레이션**. 자체 녹음/라이선스 확보 필수. 사용자 업로드와 분리해서 `sounds/seed/` 컬렉션에 저장.

### 한국 특화 (9종, **차별화 핵심**)
| ID | 이름 | band | scenarios |
|---|---|---|---|
| `rain_hanok` | 한옥 처마 빗소리 | mid | sleep, relax |
| `cicada_summer` | 매미 소리 (한여름) | high | focus, relax |
| `temple_wind_chime` | 사찰 풍경 소리 | high | meditation |
| `ondol_firewood` | 구들방 장작 | low | sleep |
| `greenhouse_rain` | 비닐하우스 빗소리 | mid | sleep, focus |
| `han_river` | 한강 강물 | low | relax |
| `temple_bell_dawn` | 산사 새벽 종소리 | low | meditation |
| `frog_chorus` | 시골 개구리 합창 | mid | sleep |
| `tea_pouring` | 차 따르는 소리 | high | meditation |

### 글로벌 표준 (21종)
- **Nature(10)**: rain_window, rain_heavy, rain_light, thunder, ocean_calm, ocean_strong, stream, waterfall, forest_birds, wind_leaves
- **Ambient(4)**: white_noise, pink_noise, brown_noise, space_ambient
- **ASMR Triggers(5)**: fireplace, cafe_ambient, library_ambient, keyboard_typing, page_turning
- **Tonal(2)**: tibetan_bowl, binaural_528hz

**호환성 가이드**: 동일 `frequencyBand` 사운드는 2개 이내 권장(저주파 겹침 시 진흙처럼 들림). UI 경고는 표시하되 차단 X.

---

## 8. 데이터 모델 (Firestore)

NoSQL이므로 **읽기 패턴 우선 설계**. 집계 필드(좋아요 수 등)는 비정규화로 저장하고 Cloud Functions가 갱신.

### 컬렉션 개요
- `users/{userId}` — 프로필
- `sounds/{soundId}` — 기본 + 사용자 업로드 사운드 메타데이터
- `mixes/{mixId}` — 완성된 ASMR 작품
- `mixes/{mixId}/comments/{commentId}` — 댓글 (서브컬렉션)
- `mixes/{mixId}/likes/{userId}` — 좋아요 (서브컬렉션, 존재 여부로 판정)
- `collections/{collectionId}` — 사용자가 큐레이션한 컬렉션
- `users/{userId}/library/{itemId}` — 개인 보관함 (서브컬렉션)
- `users/{userId}/library_groups/{groupId}` — 보관함 그룹
- `reports/{reportId}` — 신고

### `users/{userId}`
```json
{
  "id": "uid_firebase",
  "nickname": "숲속감성",
  "bio": "비오는 밤이 좋아요",
  "profileImageUrl": "https://...",
  "createdAt": "2026-06-16T...",
  "stats": {
    "mixCount": 12,
    "totalPlays": 4320,
    "totalLikes": 230,
    "followerCount": 0
  }
}
```

### `sounds/{soundId}`
```json
{
  "id": "rain_hanok",
  "title": "한옥 처마 빗소리",
  "type": "seed | user_upload",
  "ownerId": null,             // seed면 null
  "category": "nature",
  "tags": ["빗소리", "한옥"],
  "audioUrl": "gs://.../rain_hanok.m4a",
  "durationSeconds": 480,
  "frequencyBand": "mid",
  "isKoreanSpecific": true,
  "license": "platform_owned | user_owned",
  "createdAt": "..."
}
```

### `mixes/{mixId}`
```json
{
  "id": "uuid",
  "ownerId": "uid",
  "title": "비오는 겨울밤 오두막",
  "description": "...",
  "thumbnailUrl": "...",
  "category": "sleep",
  "tags": ["수면", "빗소리"],
  "visibility": "public | unlisted | private",
  "tracks": [
    {
      "groupIndex": 0,
      "durationSeconds": 900,
      "sounds": [
        { "soundId": "ondol_firewood", "volume": 0.8, "fadeInSec": 5, "fadeOutSec": 5 },
        { "soundId": "rain_hanok",     "volume": 0.6, "fadeInSec": 5, "fadeOutSec": 5 }
      ]
    },
    { "groupIndex": 1, "durationSeconds": 1200, "sounds": [...] }
  ],
  "playbackMode": "sequential",
  "stats": {
    "playCount": 0,
    "likeCount": 0,
    "commentCount": 0,
    "saveCount": 0
  },
  "ranking": {
    "scoreDaily": 0.0,
    "scoreWeekly": 0.0,
    "scoreMonthly": 0.0,
    "updatedAt": "..."
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `mixes/{mixId}/comments/{commentId}`
```json
{
  "id": "...",
  "authorId": "uid",
  "authorNickname": "닉네임",  // 비정규화 (탈퇴 사용자 표시용)
  "body": "...",
  "parentCommentId": null,       // null이면 최상위, 값 있으면 답글
  "likeCount": 0,
  "createdAt": "..."
}
```

### `collections/{collectionId}`
```json
{
  "id": "...",
  "ownerId": "uid",
  "title": "비오는 날 추천",
  "description": "...",
  "mixIds": ["...", "..."],
  "visibility": "public | private",
  "stats": { "saveCount": 0, "likeCount": 0 }
}
```

### `users/{userId}/library/{itemId}`
보관함은 `mixId`만 저장. 그룹 매핑은 `groupId` 필드로.
```json
{ "mixId": "...", "groupId": "groupA_or_null", "savedAt": "..." }
```

### `users/{userId}/library_groups/{groupId}`
```json
{ "title": "수면용", "order": 0, "createdAt": "..." }
```

### `reports/{reportId}`
```json
{
  "targetType": "mix | comment | user",
  "targetId": "...",
  "reason": "copyright | inappropriate | spam | etc",
  "reporterId": "uid",
  "status": "pending | resolved | dismissed",
  "createdAt": "..."
}
```

---

## 9. UX 원칙

- **다크모드 우선**. OLED 트루블랙.
- 액센트 컬러: 차분한 인디고/보라(수면 친화).
- 모든 터치 영역 **최소 44pt** (HIG/Material 동시 준수).
- 큰 폰트, 큰 간격, 미니멀.
- 재생 중 화면(NowPlayingView)은 OLED 번인 방지 자동 어둡게 모드 토글.
- 햅틱: 재생/정지/타이머 종료 시에만. 과하지 않게.
- **첫 실행 온보딩 3페이지**: "듣기", "직접 만들기", "공유하기" — 가치를 즉시 보여줌.

### 화면 목록 (v1.0)
1. 홈(피드+추천+랭킹 미니)
2. 사운드 라이브러리(기본/내 녹음)
3. 녹음
4. 음원 편집
5. 믹스 제작(기본 모드/디테일 모드 토글)
6. 믹스 상세(댓글 포함)
7. 재생 중(NowPlaying)
8. 보관함(+그룹)
9. 컬렉션 상세
10. 검색
11. 랭킹
12. 제작자 페이지
13. 내 페이지(설정 포함)

---

## 10. 백엔드/보안 핵심

- **Firestore Security Rules** 필수. 모든 컬렉션은 기본 deny.
  - `mixes`: 본인만 write. read는 `visibility=public` 또는 `ownerId=request.auth.uid`.
  - 좋아요/북마크: 본인 docId만 write.
  - 신고: 인증된 사용자만 create, 본인 신고 read.
- **Storage Rules**: 업로드 파일 크기 제한(예: 50MB/파일, m4a/mp3만).
- **Rate Limiting**: 댓글·좋아요 Cloud Functions에서 사용자별 분당 N회 제한.
- **모더레이션**:
  - v1.0은 사용자 신고 → 관리자 수동 처리. 자동 모더레이션 없음.
  - 업로드 시 클라이언트에서 약관 동의 모달(저작권 본인 책임 명시).

---

## 11. 알려진 큰 리스크 (반드시 인지)

| # | 리스크 | 영향 | v1.0 대응 |
|---|---|---|---|
| R1 | 양면 마켓 콜드 스타트 | 출시 후 콘텐츠 없어 죽음 | 시드 ASMR 200개 사전 확보. 제작자 100명 베타 모집 |
| R2 | Flutter 다중 트랙 정밀 동기화 한계 | 핵심 기능 품질 저하 | PoC로 조기 검증(§5). 실패 시 native 모듈 |
| R3 | 사운드 저작권 | 출시 차단 / 소송 | 시드 30종 자체 확보. 약관에 사용자 업로드 권리 명시 |
| R4 | App Store/Google Play 심사 | 출시 지연 | 단순 음원 재생 아닌 "믹싱 가치" 강조. UGC 모더레이션 정책 첨부 |
| R5 | 사용자 업로드 부적절 콘텐츠 | 플랫폼 평판 | 신고 → 24시간 내 검토 운영. 관리자 도구 v1.0 포함 |
| R6 | Firestore 비용 폭증 | 운영비 부담 | 랭킹·집계는 비동기 배치. 무한 스크롤 페이징. 인덱스 점검 |
| R7 | 수익화 진입 시 한국 전금업/세무 | v2.1 차단 | v1.0 진입 안 함. v2.0 후반에 변호사·세무사 자문 트랙 분리 |

---

## 12. 출시 GO/NO-GO 기준 (v1.0)

- [ ] 시드 ASMR **200개 이상** 사전 업로드
- [ ] 베타 제작자 **100명 이상** 모집
- [ ] 4개 트랙 동시 재생 + 백그라운드 8시간 실기기 검증
- [ ] 잠금화면 컨트롤 iOS/Android 모두 동작
- [ ] 사운드 시드 30종 라이선스 문서화
- [ ] 약관·개인정보처리방침 한국어 확정
- [ ] 신고 처리 SOP 문서화 및 1명 이상 운영 담당 지정
- [ ] App Store/Google Play 심사 통과 (사전 review 권장)

---

## 13. 결정사항 로그 (누적, 절대 덮어쓰지 말 것)

형식:
```
### YYYY-MM-DD — 짧은 제목
컨텍스트 / 결정 / 영향
```

### 2026-06-16 — 프로젝트 정체성 및 v1.0 범위 확정
- 컨텍스트: 사용자가 25개 기능 전체 비전 제시. 즉시 구현 시 6~12개월·다인 팀 필요.
- 결정: v1.0은 "제작·공유·발견·기본 커뮤니티"로 압축. 수익화·구독·AI·2차 창작 로열티는 v2.0+로 명시 이연.
- 영향: 데이터 모델·아키텍처·앱스토어 심사·법무 부담 모두 v1.0에서 단순화. 출시 6개월 내 가능.

### 2026-06-16 — 기술 스택 확정
- 컨텍스트: Flutter vs RN, Firebase vs AWS 후보.
- 결정: Flutter + Firebase. 검색은 Algolia 보조.
- 영향: 단일 코드베이스로 iOS/Android 출시. 초기 운영비 0에 가까움. 다중 트랙 정밀 동기화는 PoC 1순위로 별도 검증.

### 2026-06-16 — 시드 콘텐츠 30종 큐레이션
- 컨텍스트: 양면 마켓 콜드 스타트 위험.
- 결정: 한국 특화 9종 + 글로벌 표준 21종 = 30종을 v1.0 시작 전에 자체 확보.
- 영향: 시드 ASMR 200개 사전 업로드의 기반. 라이선스 문서화 작업이 별도 트랙으로 발생.

---

## 14. 새 세션 시작 체크리스트 (AI 에이전트용)

1. 이 문서를 처음부터 끝까지 읽기.
2. `git log --oneline -20`로 최근 작업 확인.
3. `docs/decisions/` 디렉토리에 새 ADR이 있는지 확인.
4. `pubspec.yaml`·`functions/package.json` 변경 여부 확인.
5. 사용자에게 "지금 어디 단계인지" 1~2줄로 보고하고 다음 작업 제안.

**큰 변경 시 절차**: 사용자에게 영향 범위 먼저 보고 → 합의 → §13에 결정 기록 → 코드 변경.
