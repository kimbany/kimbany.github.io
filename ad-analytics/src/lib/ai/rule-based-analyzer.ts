/**
 * 규칙 기반 분석기 (AI API 미연결 시 사용하는 mock AI).
 * 입력은 집계된 PerformanceAnalysisContext 뿐이며, 원인은 지표 분해(ROAS = CVR × 객단가 / CPC)로
 * 추정하고 모두 "가능성 / 확인 필요" 형태로 표현한다.
 */
import type { AIAnalysisResult, InsightItem, PerformanceAnalysisContext, RecommendedAction } from "@/types/ai";
import type { MetricKey } from "@/types/analytics";
import { formatChange, formatRoas, formatWon } from "@/lib/utils/format";

type Ctx = PerformanceAnalysisContext;
type CtxAlert = Ctx["alerts"][number];

const THRESHOLD = 12;

function describe(ch: number | null | undefined, up = "상승", down = "하락"): string {
  if (ch == null) return "비교 불가";
  if (Math.abs(ch) < 5) return "비슷한 수준";
  return `${Math.abs(ch).toFixed(0)}% ${ch > 0 ? up : down}`;
}

const CHECKS = {
  cvr: ["상품 판매가격 변동", "쿠폰 / 할인 혜택 종료 여부", "배송비 정책", "재고 / 품절 여부", "랜딩페이지 · 상세페이지 오류", "프로모션 종료 여부"],
  cpc: ["입찰가 변경 이력", "경쟁사 광고 노출 증가 여부", "품질지수 / 광고 순위 변화", "자동입찰 설정 변경 여부"],
  ctr: ["소재 노출 기간 (소재 피로도)", "광고 문구 / 썸네일 변경 여부", "노출 위치 · 지면 변화", "타겟 오디언스 설정 변경"],
  aov: ["판매 상품 구성 변화 (저가 상품 비중)", "세트 / 묶음 상품 노출 여부", "할인율 변경"],
  spend: ["일 예산 / 입찰 전략 변경 이력", "확장된 타겟 · 키워드의 성과", "자동 예산 최적화 설정"],
  tracking: ["전환 추적(픽셀 / 전환 스크립트) 정상 수집 여부", "어트리뷰션 집계 지연 여부"],
};

function causesAndChecks(a: CtxAlert): { causes: string[]; checks: string[]; actions: string[] } {
  const d = a.drivers;
  const causes: string[] = [];
  const checks = new Set<string>();
  const actions: string[] = [];
  const g = (k: MetricKey) => d[k] ?? null;

  if ((g("cvr") ?? 0) <= -THRESHOLD) {
    const ctrStable = Math.abs(g("ctr") ?? 0) < THRESHOLD;
    causes.push(
      ctrStable
        ? `CTR은 ${describe(g("ctr"))}이지만 CVR이 ${describe(g("cvr"))}했습니다. 따라서 광고 클릭 이후 구매 과정(가격·혜택·상세페이지)에서 성과가 감소했을 가능성이 있습니다.`
        : `CVR이 ${describe(g("cvr"))}했습니다. 클릭 이후 구매 전환 단계에서도 성과가 감소했을 가능성이 있습니다.`,
    );
    CHECKS.cvr.forEach((c) => checks.add(c));
    actions.push("상품 가격 · 혜택 · 재고 상태 확인", "랜딩페이지 / 상세페이지 점검");
  }
  if ((g("cpc") ?? 0) >= THRESHOLD) {
    causes.push(`CPC가 ${describe(g("cpc"))}했습니다. 경쟁 입찰 증가 또는 입찰가 · 품질지수 변화로 클릭 단가가 높아졌을 가능성이 있습니다.`);
    CHECKS.cpc.forEach((c) => checks.add(c));
    actions.push("입찰가 조정 및 저효율 키워드 · 지면 입찰 하향");
  }
  if ((g("ctr") ?? 0) <= -THRESHOLD) {
    causes.push(`CTR이 ${describe(g("ctr"))}했습니다. 소재 피로도 증가 또는 노출 위치 · 타겟 변화 가능성이 있어 확인이 필요합니다.`);
    CHECKS.ctr.forEach((c) => checks.add(c));
    actions.push("저효율 광고 소재 확인 및 교체", "신규 소재 A/B 테스트");
  }
  if ((g("aov") ?? 0) <= -THRESHOLD) {
    causes.push(`객단가가 ${describe(g("aov"), "증가", "감소")}했습니다. 저가 상품 위주 판매 또는 할인 적용 영향일 수 있습니다(확인 필요).`);
    CHECKS.aov.forEach((c) => checks.add(c));
    actions.push("상품 구성 · 세트 상품 노출 점검");
  }
  if ((g("spend") ?? 0) >= 30 && (g("conversions") ?? 0) < 10) {
    causes.push(`광고비가 ${describe(g("spend"), "증가", "감소")}했지만 전환은 ${describe(g("conversions"), "증가", "감소")}입니다. 증액분이 추가 전환으로 이어지지 않고 있을 가능성이 있습니다.`);
    CHECKS.spend.forEach((c) => checks.add(c));
    actions.push("증액된 예산의 효율 점검 후 저효율 세트 · 키워드 예산 축소");
  }
  if (!causes.length) {
    causes.push("CTR · CPC · CVR 의 변화가 크지 않아 데이터만으로 원인을 특정하기 어렵습니다. 전환 집계 지연 또는 일시적 변동 가능성도 확인이 필요합니다.");
    actions.push("1~2일 추가 관찰 후 동일 추세 시 세부 소재 · 키워드 단위 점검");
  }
  CHECKS.tracking.forEach((c) => checks.add(c));
  return { causes, checks: [...checks].slice(0, 10), actions };
}

function toActions(list: string[]): RecommendedAction[] {
  return [...new Set(list)].slice(0, 4).map((action, i) => ({ priority: i + 1, action }));
}

function insightFromAlert(a: CtxAlert): InsightItem {
  const base = {
    id: `ins_${a.id}`,
    severity: a.severity,
    title: `${a.scope.label} ${a.title}`,
    problem: a.related?.length ? `${a.message} (함께 감지: ${a.related.map((r) => r.title).join(", ")})` : a.message,
    relatedAlertId: a.id,
    platform: a.scope.platform,
    campaign: a.scope.campaign,
  };
  if (a.severity === "positive") {
    const d = a.drivers;
    const improved = (["ctr", "cvr", "cpc", "aov"] as MetricKey[])
      .filter((k) => d[k] != null && (k === "cpc" ? (d[k] as number) <= -8 : (d[k] as number) >= 8))
      .map((k) => `${k.toUpperCase() === "AOV" ? "객단가" : k.toUpperCase()} ${formatChange(d[k])}`);
    return {
      ...base,
      possibleCauses: [
        improved.length
          ? `${improved.join(", ")} 변화가 개선에 기여한 것으로 보입니다.`
          : "퍼널 지표 전반이 고르게 개선된 것으로 보입니다.",
        "최근 변경한 소재 · 타겟 · 입찰 설정이 효과를 낸 것인지 확인이 필요합니다.",
      ],
      checks: ["최근 변경 이력 (소재 / 타겟 / 입찰)", "성과 상승이 특정 상품 · 소재에 집중되는지 여부", "재고 충분 여부 (증액 전)"],
      recommendedActions: toActions(["성과 요인 유지 및 예산 10~20% 단계적 증액 테스트", "성과 좋은 소재 · 키워드를 유사 캠페인으로 확장", "증액 후 3일간 ROAS 유지 여부 모니터링"]),
    };
  }
  const { causes, checks, actions } = causesAndChecks(a);
  return { ...base, possibleCauses: causes, checks, recommendedActions: toActions(actions) };
}

function zeroConversionInsight(ctx: Ctx): InsightItem | null {
  const zero = ctx.alerts.filter((a) => a.title.includes("전환 없음"));
  const kw = ctx.wastefulKeywords.filter((k) => k.conversions === 0);
  const prod = ctx.wastefulProducts.filter((p) => p.conversions === 0);
  if (!zero.length && !kw.length && !prod.length) return null;
  const items = [...kw.map((k) => `키워드 '${k.name}' ${formatWon(k.spend)}`), ...prod.map((p) => `상품 '${p.name}' ${formatWon(p.spend)}`)];
  const wasted = [...kw, ...prod].reduce((s, e) => s + e.spend, 0);
  return {
    id: "ins_zero_conversion",
    severity: wasted >= 200_000 ? "critical" : "warning",
    title: "전환 없는 키워드 / 상품 광고비 발생",
    problem: `선택 기간 동안 전환 없이 광고비가 발생한 항목이 ${Math.max(items.length, zero.length)}건 있습니다${wasted ? ` (합계 약 ${formatWon(wasted)})` : ""}.`,
    possibleCauses: [
      items.length ? `대상: ${items.slice(0, 5).join(", ")}` : "상세 대상은 Keyword / Product Analysis 에서 확인하세요.",
      "검색 의도와 상품이 맞지 않는 키워드이거나, 상품 페이지 경쟁력이 낮을 가능성이 있습니다.",
    ],
    checks: ["검색어 리포트 (실제 유입 검색어)", "키워드-랜딩 상품 일치 여부", "상품 가격 경쟁력", "전환 추적 정상 여부"],
    recommendedActions: toActions(["전환 없는 키워드 입찰가 하향 또는 일시 중지", "제외 키워드 등록 검토", "해당 상품 상세페이지 · 가격 점검"]),
  };
}

export function analyzeWithRules(ctx: Ctx): AIAnalysisResult {
  const t = ctx.totals;
  const negatives = ctx.alerts.filter((a) => a.severity !== "positive" && !a.title.includes("전환 없음"));
  const positives = ctx.alerts.filter((a) => a.severity === "positive");
  const issues: InsightItem[] = [
    ...negatives.slice(0, 5).map(insightFromAlert),
    ...[zeroConversionInsight(ctx)].filter((x): x is InsightItem => !!x),
    ...positives.slice(0, 2).map(insightFromAlert),
  ];

  const crit = ctx.alerts.filter((a) => a.severity === "critical").length;
  const warn = ctx.alerts.filter((a) => a.severity === "warning").length;
  const best = [...ctx.platforms].filter((p) => p.current.spend > 0).sort((a, b) => (b.current.roas ?? 0) - (a.current.roas ?? 0))[0];
  const summary = [
    `선택 기간 광고비 ${formatWon(t.current.spend)}(${formatChange(t.changes.spend)}), 광고 매출 ${formatWon(t.current.revenue)}(${formatChange(t.changes.revenue)}), ROAS ${formatRoas(t.current.roas)}(${formatChange(t.changes.roas)})입니다.`,
    best ? `ROAS 기준 가장 효율이 좋은 채널은 ${best.label}(${formatRoas(best.current.roas)})입니다.` : "",
    crit + warn > 0 ? `확인이 필요한 이상징후는 Critical ${crit}건, Warning ${warn}건입니다.` : "임계값을 넘는 이상징후는 발견되지 않았습니다.",
  ]
    .filter(Boolean)
    .join(" ");

  const all = issues.filter((i) => i.severity !== "positive").flatMap((i) => i.recommendedActions.map((a) => a.action));
  const pos = issues.filter((i) => i.severity === "positive").flatMap((i) => i.recommendedActions.map((a) => a.action));
  return {
    summary,
    issues,
    recommendedActions: [...new Set([...all, ...pos])].slice(0, 5).map((action, i) => ({ priority: i + 1, action })),
    source: "rule-based",
    generatedAt: new Date().toISOString(),
  };
}
