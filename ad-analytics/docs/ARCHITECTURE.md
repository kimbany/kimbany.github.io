# Ad Insight — 설계 문서

> Meta · 네이버 쇼핑검색광고 · 네이버 파워링크 데이터를 통합해
> **숫자 → 변화 → 문제 → 원인 후보 → 액션** 흐름으로 보여주는 내부용 광고 운영 의사결정 도구.

---

## 1. 전체 프로젝트 구조

```
ad-analytics/
├─ src/
│  ├─ app/                         # Next.js App Router (페이지 = UI 조립만 담당)
│  │  ├─ layout.tsx                # 공통 Layout (AppShell)
│  │  ├─ dashboard/ daily/ channels/ campaigns/[id]/ products/ keywords/
│  │  ├─ insights/ reports/ data/ settings/
│  │  └─ api/ai/analyze/route.ts   # 서버 전용 AI 분석 API (API Key 는 서버 환경변수)
│  ├─ components/
│  │  ├─ ui/                       # shadcn/ui 스타일 기본 컴포넌트 (button, card, table, dialog …)
│  │  ├─ layout/                   # Sidebar, Header, AppShell
│  │  ├─ filters/                  # DateRangeSelector, BrandFilter, PlatformFilter, CampaignFilter, FilterBar
│  │  ├─ dashboard/                # KpiCard, KpiGrid, PlatformSnapshotCard
│  │  ├─ charts/                   # SpendRevenueChart, PerformanceTrendChart, ChannelShareChart, EntityBarChart
│  │  ├─ tables/                   # DataTable(범용 정렬), ChannelComparisonTable, CampaignTable, ProductTable, KeywordTable
│  │  ├─ alerts/                   # AlertCard, AlertList, SeverityBadge
│  │  ├─ insights/                 # InsightCard, InsightSummaryItem
│  │  ├─ reports/                  # ReportSummary
│  │  ├─ data-upload/              # FileUploader, FilePreview, ColumnMapper, DuplicateDialog, UploadHistoryTable
│  │  ├─ campaigns/                # CampaignDetail
│  │  └─ common/                   # EmptyState, LoadingState, ErrorBoundary, DataGuard, ChangeIndicator, MultiSelect …
│  ├─ lib/
│  │  ├─ parsers/                  # 플랫폼 adapter + 공통 변환 (meta.ts, naver-shopping.ts, naver-powerlink.ts …)
│  │  ├─ analytics/                # 순수 함수 분석 로직 (metrics, period, compare, aggregate, segments, anomalies, insight-context, report)
│  │  ├─ ai/                       # analyzePerformance(클라이언트 엔트리), rule-based-analyzer(mock AI), prompt, schema, providers/anthropic
│  │  ├─ db/                       # AdDataRepository 인터페이스 + LocalStorageRepository (→ Supabase/PostgreSQL 교체 지점)
│  │  ├─ mock/                     # 최근 60일 realistic mock 데이터 생성기 (이상징후 주입)
│  │  ├─ config/                   # platforms, metrics, navigation, default-settings(Alert 기준)
│  │  └─ utils/                    # format(한국식 숫자), date, id, cn
│  ├─ hooks/use-analytics.ts       # 필터 + 데이터 → 분석 범위 (useAnalyticsScope / useAlerts / useInsights)
│  ├─ store/                       # zustand: filter-store, data-store, settings-store
│  └─ types/                       # ad-data, analytics, alerts, ai, settings, upload, report
├─ public/samples/                 # 업로드 테스트용 샘플 보고서 (Meta CSV, 네이버 쇼핑 CSV(EUC-KR), 파워링크 XLSX)
├─ scripts/                        # 개발용 검증 스크립트 (check-analytics, check-parsers, make-samples)
└─ docs/ARCHITECTURE.md
```

원칙
- **분석 로직은 컴포넌트 밖** (`lib/analytics`) — 모든 함수는 입력 → 출력 순수 함수라 서버/워커/테스트에서 재사용 가능.
- **플랫폼별 로직은 adapter 로 분리** (`lib/parsers/<platform>.ts`) — 공통 변환(`normalize.ts`)은 플랫폼을 모른다.
- **저장소는 인터페이스 뒤에** (`lib/db/repository.ts`) — 화면/스토어는 구현체를 모른다.

## 2. 페이지 구조

| 경로 | 페이지 | 핵심 질문 | 상단 필터 |
|---|---|---|---|
| `/dashboard` | Dashboard | 얼마 썼고 얼마 벌었나? 어디가 좋고 어디가 문제인가? | 기간 + 브랜드/플랫폼/캠페인 |
| `/daily` | Daily Analysis | 특정 날짜는 전일·최근 7일 평균 대비 어땠나? | 브랜드/플랫폼/캠페인 (날짜는 페이지 내) |
| `/channels` | Channel Analysis | 채널 간 효율·비중·추이 비교 | 전체 |
| `/campaigns` | Campaign Analysis | 캠페인 정렬·검색, Top/목표 미달 | 전체 |
| `/campaigns/[id]` | Campaign Detail | 날짜별 추이, 광고그룹·소재/상품/키워드, 캠페인 Alert | 전체 |
| `/products` | Product Analysis | 광고비↑ 매출↓ / 전환 없는 상품은? | 전체 |
| `/keywords` | Keyword Analysis | High Performing / Wasteful 키워드 | 전체 |
| `/insights` | AI Insights | 문제 → 가능한 원인 → 확인사항 → 권장 액션 | 전체 |
| `/reports` | Reports | 일간·주간·월간 경영진 보고서 (Print/PDF) | 브랜드/플랫폼/캠페인 (기간은 보고서별) |
| `/data` | Data Management | 업로드 → Preview → Mapping → 중복 처리 → 이력 | 없음 |
| `/settings` | Settings | 브랜드, 비교 방식, 목표 ROAS, Alert 기준 | 없음 |

## 3. TypeScript 데이터 모델 (`src/types`)

```ts
type PlatformId = "meta" | "naver_shopping" | "naver_powerlink"; // 확장: google_ads, kakao_ads, coupang_ads

interface AdRecord {
  id: string; sourceFileId: string;                 // 업로드 파일 단위 삭제용
  // 필수 차원 (없으면 "")
  date: string; platform: PlatformId; brand: string;
  campaign: string; adGroup: string; ad: string; product: string; keyword: string;
  // 필수 지표
  spend: number; impressions: number; clicks: number; conversions: number; revenue: number;
  // 선택
  reach?; frequency?; videoViews?; addToCart?; landingPageViews?; orders?;
  device?; placement?; creative?;
  extra?: Record<string, string | number>;          // 아직 모델에 없는 원본 필드 보관
}

interface MetricSummary extends BaseMetrics {        // 집계 결과
  ctr; cpc; cvr; cpa; roas; cpm; aov: number | null;  // 분모 0 → null → 화면에 "-"
}

interface Alert { severity: "critical"|"warning"|"positive"; scope; metric; basis;
  current; baseline; changePct; message; detail; related[]; currentMetrics; baselineMetrics }

interface PerformanceAnalysisContext { ... }        // AI 입력 (집계값만)
interface AIAnalysisResult { summary; issues: InsightItem[]; recommendedActions; source }
interface InsightItem { problem; possibleCauses[]; checks[]; recommendedActions[] }
interface AppSettings { brands; comparisonMode; targetRoas; alertThresholds; useSampleData }
interface UploadRecord { fileName; platform; brand; dataStartDate; dataEndDate; rowCount; status }
```

자동 계산 지표 (`lib/analytics/metrics.ts` — `safeDivide` 로 0 나눗셈 방지)

| 지표 | 공식 |
|---|---|
| CTR | clicks / impressions × 100 |
| CPC | spend / clicks |
| CVR | conversions / clicks × 100 |
| CPA | spend / conversions |
| ROAS | revenue / spend × 100 |
| CPM | spend / impressions × 1000 |

## 4. Parser 구조 (`src/lib/parsers`)

```
File ─▶ file-reader.readSpreadsheet()   CSV(UTF-8 → EUC-KR 자동) / XLS / XLSX, 상단 제목행 건너뛰고 헤더 행 자동 탐지
     ─▶ mapping.autoMapColumns()        alias 우선순위 매칭 (정확 일치 → 단위 괄호 제거 후 일치)
     ─▶ <ColumnMapper/> 사용자 수정
     ─▶ normalize.normalizeRows()       날짜·숫자 파싱, 합계행 제외, 파일 내 동일키 합산, 오류 수집
     ─▶ PlatformParser.postProcess()    플랫폼별 보정 (쇼핑: 소재 → product, orders 기본값 등)
     ─▶ AdRecord[]
```

- `PlatformParser` = `{ platform, fields(alias), requiredFields, recommendedFields, postProcess, guide }`
- 공통 alias 는 `common-fields.ts`, 플랫폼은 `withAliases({...})` 로 필요한 필드만 override.
- 신규 플랫폼: `lib/parsers/google-ads.ts` 작성 → `registry.ts` 등록 → `config/platforms.ts` 정의.
- 오류 메시지: 지원하지 않는 파일 형식 / 필수 컬럼을 찾을 수 없습니다 / 날짜 형식을 인식할 수 없습니다 / 숫자 데이터 형식이 올바르지 않습니다.
- 중복 판정 키 (`dedupeKeyOf`): platform + brand + date + campaign + adGroup + ad + product + keyword (+ device, placement).

## 5. Analytics 구조 (`src/lib/analytics`)

| 파일 | 주요 함수 |
|---|---|
| `metrics.ts` | `calculateMetrics`, `summarize`, `safeDivide`, `averageMetrics`, `summarizeDailyAverage` |
| `period.ts` | `resolveDateRange`(프리셋), `getComparisonRange`(previous / previousMonthSameDays / previousMonthFull) |
| `compare.ts` | `pctChange` ((c-p)/p×100, p=0 → null), `comparePeriods`, `sentimentOf`(지표 극성) |
| `filters.ts` | `applyDimensionFilters`, `filterByRange`, `campaignKeyOf` |
| `aggregate.ts` | `aggregateByDate`(빈 날짜 0 채움), `aggregateByPlatform/Campaign/AdGroup/Ad/Product/Keyword` |
| `segments.ts` | `classifyProducts`, `classifyKeywords`, Top/Underperforming/Wasteful, `bestAndWorstChannel`, `problemChannel` |
| `anomalies.ts` | `detectAnomalies` — 기준(이전 기간·전일·7일 평균·전주·전월) × 대상(전체·플랫폼·캠페인·상품·키워드) × 규칙 |
| `insight-context.ts` | `generateInsightContext` — AI 입력용 집계 컨텍스트 |
| `report.ts` | `reportPeriod`, `buildReport` — 일간/주간/월간 보고서 데이터 |

이상징후 탐지 원칙
- 규칙은 `settings.alertThresholds` 에서 읽는다 (하드코딩 없음).
- 표본이 작으면 평가하지 않는다 (최소 일 광고비, 최소 클릭/전환).
- 같은 대상·같은 방향의 Alert 는 대표 1건 + `related` 로 묶어 중복 노출을 막는다.

AI 연동
- 클라이언트 `analyzePerformance(ctx)` → `POST /api/ai/analyze` (집계 컨텍스트만 전송, 200KB 제한).
- 서버에 `ANTHROPIC_API_KEY` 가 있으면 Claude(구조화 출력: zod 스키마), 없거나 실패하면 `analyzeWithRules`(규칙 기반 mock AI)로 대체.
- 원인은 `ROAS = CVR × 객단가 / CPC` 분해로 추정하고, 항상 "가능성 / 확인 필요"로 표현.

## 6. 주요 컴포넌트 구조

```
AppShell
├─ Sidebar
├─ Header ─ FilterBar ─ DateRangeSelector · BrandFilter · PlatformFilter · CampaignFilter
└─ ErrorBoundary ─ Page
     ├─ DataGuard (LoadingState / EmptyState)
     ├─ KpiGrid ─ KpiCard ─ ChangeIndicator
     ├─ SpendRevenueChart · PerformanceTrendChart · ChannelShareChart · EntityBarChart
     ├─ DataTable ─ ChannelComparisonTable · CampaignTable · ProductTable · KeywordTable
     ├─ AlertList ─ AlertCard ─ SeverityBadge
     ├─ InsightCard · InsightSummaryItem
     ├─ ReportSummary
     └─ FileUploader · FilePreview · ColumnMapper · DuplicateDialog · UploadHistoryTable
```

## 7. 상태 관리 방식

| 스토어 (zustand) | 내용 | 영속성 |
|---|---|---|
| `filter-store` | 기간 프리셋/사용자 지정, 브랜드, 플랫폼, 캠페인 | 세션 메모리 |
| `data-store` | 업로드 레코드, 업로드 이력, 샘플 레코드, import/delete/중복 검사 | `AdDataRepository` |
| `settings-store` | 브랜드, 비교 방식, 목표 ROAS, Alert 기준, 샘플 데이터 on/off | `AdDataRepository` |

- 페이지는 `useAnalyticsScope()` 하나로 `scoped`(차원 필터) / `current`(선택 기간) / `previous`(비교 기간)를 받고,
  `useMemo` 안에서 `lib/analytics` 함수를 호출해 화면용 데이터를 만든다.
- 샘플 데이터는 저장하지 않고 메모리에서 생성(오늘 기준 최근 60일, seeded).
- DB 교체: `lib/db/index.ts` 의 `getRepository()` 만 Supabase 구현체로 바꾸면 스토어/화면 수정 없음.

## 8. 개발 순서 (진행 상태)

| STEP | 내용 | 상태 |
|---|---|---|
| 1 | 프로젝트 세팅, 폴더 구조, Layout · Sidebar · Header, Mock Data | ✅ |
| 2 | Dashboard (KPI, Spend/Revenue, 채널 비교, Key Alerts, Key Insights) | ✅ |
| 3 | Daily / Channel / Campaign(+Detail) | ✅ |
| 4 | Product / Keyword | ✅ |
| 5 | CSV · XLSX 업로드, Preview, Column Mapping | ✅ |
| 6 | 공통 변환 + Meta / Naver Shopping / Naver Powerlink Parser | ✅ |
| 7 | 기간 비교, 집계, 이상징후 탐지 | ✅ |
| 8 | AI Insights (규칙 기반 + Claude 연동 구조) | ✅ |
| 9 | Reports (일간·주간·월간, Print/PDF) | ✅ |
| 10 | Settings / Threshold 설정 | ✅ |

다음 단계 후보: Supabase Repository 구현, 서버 측 PDF 생성, Google/Kakao/Coupang parser, 사용자 인증.
