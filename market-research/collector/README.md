# 네이버쇼핑 수집기 (방식 B · 크롬 화면 수집)

네이버 쇼핑 검색 API가 2026-07-31 종료돼서, **내 PC의 진짜 크롬으로** 네이버쇼핑
검색 화면을 열어 상품 순위·가격을 긁어 **Firebase**에 저장하는 스크립트예요.
대시보드(`invedory.com/market-research/`)는 Firebase를 읽어 순위추적·가격경쟁력을 보여줍니다.

```
[이 스크립트 (내 PC)] → 네이버쇼핑 → 상품목록 → Firebase(Firestore)
                                                      ↓
                              [대시보드] 어제 vs 오늘 비교 표시
```

---

## 처음 1번만 (설치)

### 1. Node.js 설치
https://nodejs.org 에서 **LTS** 버전 설치 (이미 있으면 건너뛰기).
설치 확인 — 명령 프롬프트(검은 창)에서:
```
node -v
```
숫자(v18 이상)가 나오면 OK.

### 2. 이 폴더로 이동 후 패키지 설치
`market-research/collector/` 폴더를 통째로 내 PC에 내려받은 뒤, 그 폴더에서:
```
npm install
npx playwright install chromium
```

### 3. serviceAccount.json 준비 (Firebase 저장용 열쇠)
1. https://console.firebase.google.com → 프로젝트 **fruit-monitor** 선택
2. 좌측 톱니바퀴 ⚙ → **프로젝트 설정**
3. 상단 탭 **서비스 계정**
4. **새 비공개 키 생성** 버튼 → `.json` 파일 다운로드
5. 그 파일을 이 폴더에 **`serviceAccount.json`** 이름으로 저장

> ⚠ 이 파일은 비밀번호 같은 거예요. 깃/카톡 등에 올리지 마세요. (`.gitignore`로 막아둠)

### 4. config.json 작성
`config.example.json` 을 복사해 **`config.json`** 으로 만들고, `keywords` 를 내 키워드로:
```json
{
  "keywords": ["감홍사과", "샤인머스캣 2kg", "성주 참외"],
  "topN": 40,
  "myMall": "내스마트스토어상호"
}
```
- `myMall` 에 내 스토어 상호를 넣으면 내 상품이 몇 위인지 자동 표시돼요.

---

## 매번 (수집 실행)

이 폴더에서:
```
node collect.js
```
크롬 창이 뜨고 키워드를 하나씩 검색하며 긁어서 Firebase에 저장해요.
끝나면 대시보드 **순위추적** 탭에서 바로 확인됩니다.

### 저장 없이 테스트만 (처음 동작 확인용)
```
node collect.js --dry
```
Firebase에 저장하지 않고, 긁은 결과만 `raw/` 폴더에 남겨요.
**잘 안 긁히면 `raw/` 안의 JSON 파일을 저에게 보내주세요. 파서를 그 구조에 맞게 고쳐드릴게요.**

---

## 매일 자동 실행 (선택)

### Windows (작업 스케줄러)
1. 시작 → "작업 스케줄러" 실행
2. **기본 작업 만들기** → 이름: `네이버수집` → 트리거: **매일** 오전 9시
3. 동작: **프로그램 시작**
   - 프로그램: `node`
   - 인수: `collect.js`
   - 시작 위치: 이 폴더 경로 (예: `C:\Users\나\collector`)

### Mac/Linux (cron)
```
0 9 * * *  cd /path/to/collector && /usr/local/bin/node collect.js >> collect.log 2>&1
```

---

## 자주 겪는 문제

| 증상 | 원인 / 해결 |
|---|---|
| `⚠ 봇 확인 화면 감지` | 네이버가 자동화 의심. 잠시 후 재시도, 키워드 수 줄이기, 창을 띄운 채(기본값) 실행 |
| `⚠ 상품 0개` | 파싱 실패. `raw/` JSON 파일을 Claude에게 전달 → 파서 수정 |
| `serviceAccount.json 없음` | 위 3번 단계 수행 (또는 `--dry`로 저장 없이 테스트) |
| 크롬이 안 뜸 | `npx playwright install chromium` 다시 실행 |

---

## 저장되는 데이터 구조 (참고)

Firestore `trk` 컬렉션, 문서 ID = `{키워드}__{날짜}`:
```
trk / "감홍사과__2026-10-27"
  { kw, date, snap: { date, keyword, items: [
      { pid, rank, title, mall, price, link, image, catalog, ad, reviews, ours }
  ] } }
```
대시보드의 순위추적/가격경쟁력(네이버 채널)이 이 구조를 읽습니다.
