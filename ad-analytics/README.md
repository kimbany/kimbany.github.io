# Ad Insight — 광고 통합 분석

Meta · 네이버 쇼핑검색광고 · 네이버 파워링크 보고서를 업로드해 공통 형식으로 변환하고,
날짜 / 채널 / 캠페인 / 상품 / 키워드별 성과, 이전 기간 대비 변화, 이상징후, AI 개선 제안,
일간·주간·월간 보고서를 제공하는 내부용 광고 운영 의사결정 웹사이트입니다.

설계 문서: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 실행

```bash
cd ad-analytics
npm install
npm run dev        # http://localhost:3000
npm run build      # 프로덕션 빌드
npm run start
```

처음 실행하면 **샘플(mock) 데이터(최근 60일, 몽프루이 · 귤타민)** 로 모든 화면을 확인할 수 있습니다.
실제 보고서를 업로드한 뒤에는 Settings 에서 샘플 데이터를 끄세요.

업로드 테스트용 파일: `public/samples/` (Data Management 화면에서도 내려받을 수 있습니다)

## AI 연동 (선택)

```bash
cp .env.example .env.local
# ANTHROPIC_API_KEY=... 입력
```

- 키가 없으면 AI Insights 는 내장 규칙 기반 분석기로 동작합니다.
- API Key 는 서버 API Route(`/api/ai/analyze`)에서만 사용되며 클라이언트 번들에 포함되지 않습니다.
- AI 에는 원본 파일이 아닌 **집계값 · 변화율 · Alert** 만 전송됩니다 (AI Insights 화면에서 전송 데이터 확인 가능).

## 데이터 저장

1차 버전은 브라우저 `localStorage` 에 저장합니다 (업로드 파일은 외부로 전송되지 않음).
Supabase / PostgreSQL 로 옮길 때는 `src/lib/db/repository.ts` 인터페이스를 구현하고
`src/lib/db/index.ts` 의 `getRepository()` 만 교체하면 됩니다.

## 개발용 검증 스크립트

```bash
npm run typecheck
npm run check:analytics   # mock 데이터로 Alert / Insight 결과 출력
npm run check:parsers     # 샘플 파일 파싱 · 오류 케이스 검증
npm run samples           # public/samples 재생성
```

## 배포 참고

`/api/ai/analyze` 서버 라우트가 있으므로 GitHub Pages(정적 호스팅)가 아닌
Vercel 등 Node.js 런타임이 있는 환경에 배포해야 합니다.

## 알려진 사항

- `xlsx`(SheetJS) npm 0.18.5 는 알려진 보안 권고(프로토타입 오염 / ReDoS)가 있습니다. 파일은 사용자의 브라우저에서만
  파싱되므로 영향 범위는 제한적이지만, 가능하면 SheetJS 공식 CDN 배포판(0.20.x)으로 교체하는 것을 권장합니다.
