/**
 * 이상징후 탐지.
 * AI 가 임의로 판단하지 않도록, 모든 Alert 는 여기서 숫자 비교만으로 생성된다.
 *
 * 비교 기준(ComparisonBasis)
 *  - previousPeriod : 선택 기간 vs 비교 기간 (Dashboard 기준)
 *  - prevDay        : 선택 기간 마지막 날 vs 그 전날
 *  - avg7d          : 선택 기간 마지막 날 vs 직전 7일 일평균
 *  - prevWeek       : 선택 기간 vs 7일 전 동일 기간 (기간 ≤ 7일일 때)
 *  - prevMonth      : 선택 기간 vs 전월 동일 날짜 구간
 */
import type { AdRecord } from "@/types/ad-data";
import type { Alert, AlertScope, AlertSeverity, ComparisonBasis } from "@/types/alerts";
import type { DateRange, MetricKey, MetricSummary } from "@/types/analytics";
import type { AlertThresholds } from "@/types/settings";
import { METRICS } from "@/lib/config/metrics";
import { platformLabel } from "@/lib/config/platforms";
import { addDays, formatRange } from "@/lib/utils/date";
import { formatChange, formatMetric, formatWon } from "@/lib/utils/format";
import { stableHash } from "@/lib/utils/id";
import { aggregateByKeyword, aggregateByProduct } from "./aggregate";
import { pctChange } from "./compare";
import { campaignKeyOf } from "./filters";
import { accumulate, averageMetrics, calculateMetrics, emptyAccumulator, type Accumulator } from "./metrics";
import { rangeLength, shiftRange, shiftRangeMonths } from "./period";

export const BASIS_LABELS: Record<ComparisonBasis, string> = {
  previousPeriod: "이전 기간 대비",
  prevDay: "전일 대비",
  avg7d: "최근 7일 평균 대비",
  prevWeek: "전주 동일 기간 대비",
  prevMonth: "전월 동일 기간 대비",
};

export const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, positive: 2 };
const SCOPE_ORDER: Record<AlertScope["type"], number> = { total: 0, platform: 1, campaign: 2, product: 3, keyword: 4 };

const RULE_TITLES: Record<string, string> = {
  roas_drop: "ROAS 급락",
  cpc_rise: "CPC 급등",
  cvr_drop: "CVR 급락",
  ctr_drop: "CTR 급락",
  revenue_drop: "매출 급감",
  cpa_rise: "CPA 급증",
  spend_rise: "광고비 급증",
  conversions_drop: "전환 급감",
  roas_up: "ROAS 개선",
  cvr_up: "CVR 개선",
  cpa_down: "CPA 개선",
  spend_surge: "광고비 증가 대비 전환 정체",
  zero_conversion: "광고비 발생 + 전환 없음",
  cpa_surge_conv_growth: "전환 증가했지만 CPA 급증",
};

export interface DetectAnomaliesInput {
  /** 브랜드/플랫폼/캠페인 필터가 적용된 전체 기간 레코드 (lookback 을 위해 날짜 필터는 적용하지 않음) */
  records: AdRecord[];
  range: DateRange;
  comparisonRange: DateRange;
  thresholds: AlertThresholds;
}

interface ScopeSeries {
  key: string;
  scope: AlertScope;
  byDate: Map<string, Accumulator>;
}

interface Window {
  basis: ComparisonBasis;
  current: MetricSummary;
  baseline: MetricSummary;
  currentLabel: string;
  baselineLabel: string;
  /** 비교 창의 일수 (노이즈 판정용) */
  days: number;
}

function sumWindow(byDate: Map<string, Accumulator>, range: DateRange): Accumulator {
  const acc = emptyAccumulator();
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) {
    const v = byDate.get(d);
    if (v) accumulate(acc, v);
  }
  return acc;
}

function buildScopes(records: AdRecord[], lookbackStart: string, end: string): ScopeSeries[] {
  const scopes = new Map<string, ScopeSeries>();
  const add = (key: string, scope: AlertScope, r: AdRecord) => {
    let s = scopes.get(key);
    if (!s) scopes.set(key, (s = { key, scope, byDate: new Map() }));
    let acc = s.byDate.get(r.date);
    if (!acc) s.byDate.set(r.date, (acc = emptyAccumulator()));
    accumulate(acc, r);
  };
  for (const r of records) {
    if (r.date < lookbackStart || r.date > end) continue;
    add("total", { type: "total", label: "전체" }, r);
    add(`p:${r.platform}`, { type: "platform", label: platformLabel(r.platform), platform: r.platform }, r);
    if (r.campaign) {
      add(
        `c:${campaignKeyOf(r)}`,
        {
          type: "campaign",
          label: `${platformLabel(r.platform)} ${r.campaign} (${r.brand})`,
          platform: r.platform,
          brand: r.brand,
          campaign: r.campaign,
        },
        r,
      );
    }
  }
  return [...scopes.values()];
}

function buildWindows(s: ScopeSeries, input: DetectAnomaliesInput): Window[] {
  const { range, comparisonRange, thresholds } = input;
  const bases = thresholds.bases;
  const len = rangeLength(range);
  const out: Window[] = [];
  const day = (d: string) => calculateMetrics(s.byDate.get(d) ?? emptyAccumulator());
  const win = (r: DateRange) => calculateMetrics(sumWindow(s.byDate, r));

  if (bases.previousPeriod) {
    out.push({
      basis: "previousPeriod",
      current: win(range),
      baseline: win(comparisonRange),
      currentLabel: formatRange(range.start, range.end),
      baselineLabel: formatRange(comparisonRange.start, comparisonRange.end),
      days: len,
    });
  }
  const end = range.end;
  if (bases.prevDay) {
    const prev = addDays(end, -1);
    out.push({ basis: "prevDay", current: day(end), baseline: day(prev), currentLabel: formatRange(end, end), baselineLabel: formatRange(prev, prev), days: 1 });
  }
  if (bases.avg7d) {
    const r7 = { start: addDays(end, -7), end: addDays(end, -1) };
    out.push({
      basis: "avg7d",
      current: day(end),
      baseline: averageMetrics(sumWindow(s.byDate, r7), 7),
      currentLabel: formatRange(end, end),
      baselineLabel: `${formatRange(r7.start, r7.end)} 일평균`,
      days: 1,
    });
  }
  if (bases.prevWeek && len <= 7) {
    const pw = shiftRange(range, -7);
    const sameAsPrev = bases.previousPeriod && pw.start === comparisonRange.start && pw.end === comparisonRange.end;
    if (!sameAsPrev) {
      out.push({ basis: "prevWeek", current: win(range), baseline: win(pw), currentLabel: formatRange(range.start, range.end), baselineLabel: formatRange(pw.start, pw.end), days: len });
    }
  }
  if (bases.prevMonth && len <= 31) {
    const pm = shiftRangeMonths(range, -1);
    out.push({ basis: "prevMonth", current: win(range), baseline: win(pm), currentLabel: formatRange(range.start, range.end), baselineLabel: formatRange(pm.start, pm.end), days: len });
  }
  return out;
}

/** 지표별 비교 가능 여부 — 표본이 너무 작으면 평가하지 않는다 */
function isEvaluable(metric: MetricKey, w: Window, t: AlertThresholds): boolean {
  const minSpend = t.minDailySpendForEvaluation * w.days;
  const c = w.current;
  const b = w.baseline;
  if (b.spend < minSpend * 0.5) return false;
  if (metric !== "spend" && c.spend < minSpend * 0.5) return false;
  switch (metric) {
    case "ctr":
      return c.impressions >= 1000 && b.impressions >= 1000;
    case "cpc":
      return c.clicks >= t.minClicksForRatio / 2 && b.clicks >= t.minClicksForRatio / 2;
    case "cvr":
      return c.clicks >= t.minClicksForRatio && b.clicks >= t.minClicksForRatio && b.conversions >= 3;
    case "roas":
    case "revenue":
    case "conversions":
      return b.conversions >= 3;
    case "cpa":
      return c.conversions >= 3 && b.conversions >= 3;
    default:
      return true;
  }
}

function verb(metric: MetricKey, up: boolean): string {
  const count = metric === "spend" || metric === "revenue" || metric === "conversions" || metric === "impressions" || metric === "clicks";
  if (count) return up ? "증가" : "감소";
  return up ? "상승" : "하락";
}

function driverDetail(w: Window, exclude: MetricKey): string {
  const keys: MetricKey[] = ["ctr", "cpc", "cvr", "aov"];
  const parts = keys
    .filter((k) => k !== exclude)
    .map((k) => {
      const ch = pctChange(w.current[k], w.baseline[k]);
      return ch == null ? null : `${METRICS[k].label} ${formatChange(ch)}`;
    })
    .filter(Boolean);
  return parts.length ? `연관 지표: ${parts.join(" · ")}` : "";
}

function makeAlert(
  s: ScopeSeries,
  w: Window,
  ruleId: string,
  severity: AlertSeverity,
  metric: MetricKey,
  message: string,
  detail?: string,
): Alert {
  return {
    id: stableHash(`${s.key}|${ruleId}|${w.basis}|${w.currentLabel}`),
    ruleId,
    severity,
    scope: s.scope,
    metric,
    basis: w.basis,
    currentLabel: w.currentLabel,
    baselineLabel: w.baselineLabel,
    current: w.current[metric],
    baseline: w.baseline[metric],
    changePct: pctChange(w.current[metric], w.baseline[metric]),
    title: RULE_TITLES[ruleId] ?? ruleId,
    message,
    detail,
    currentMetrics: w.current,
    baselineMetrics: w.baseline,
  };
}

function evaluateWindow(s: ScopeSeries, w: Window, t: AlertThresholds): Alert[] {
  const alerts: Alert[] = [];
  const basisLabel = BASIS_LABELS[w.basis];

  for (const rule of t.metricRules) {
    if (!rule.enabled || !isEvaluable(rule.metric, w, t)) continue;
    const ch = pctChange(w.current[rule.metric], w.baseline[rule.metric]);
    if (ch == null) continue;
    const magnitude = rule.direction === "increase" ? ch : -ch;
    if (magnitude < rule.warningPct) continue;
    const severity: AlertSeverity = rule.criticalPct != null && magnitude >= rule.criticalPct ? "critical" : "warning";
    const def = METRICS[rule.metric];
    const msg = `${s.scope.label} ${def.subject} ${basisLabel} ${Math.abs(ch).toFixed(0)}% ${verb(rule.metric, ch > 0)}했습니다.`;
    alerts.push(makeAlert(s, w, rule.id, severity, rule.metric, msg, driverDetail(w, rule.metric)));
  }

  for (const rule of t.positiveRules) {
    if (!rule.enabled || !isEvaluable(rule.metric, w, t)) continue;
    const ch = pctChange(w.current[rule.metric], w.baseline[rule.metric]);
    if (ch == null) continue;
    const magnitude = rule.direction === "increase" ? ch : -ch;
    if (magnitude < rule.pct) continue;
    const def = METRICS[rule.metric];
    const msg = `${s.scope.label} ${def.subject} ${basisLabel} ${Math.abs(ch).toFixed(0)}% ${verb(rule.metric, ch > 0)}했습니다.`;
    alerts.push(makeAlert(s, w, rule.id, "positive", rule.metric, msg, driverDetail(w, rule.metric)));
  }

  if (t.spendSurge.enabled && isEvaluable("spend", w, t) && w.baseline.conversions >= 3) {
    const sp = pctChange(w.current.spend, w.baseline.spend);
    const cv = pctChange(w.current.conversions, w.baseline.conversions);
    if (sp != null && cv != null && sp >= t.spendSurge.spendIncreasePct && cv < t.spendSurge.maxConversionGrowthPct) {
      const msg = `${s.scope.label} 광고비가 ${basisLabel} ${sp.toFixed(0)}% 증가했지만 전환수는 ${formatChange(cv)} 변화에 그쳤습니다.`;
      alerts.push(makeAlert(s, w, "spend_surge", "warning", "spend", msg, driverDetail(w, "spend")));
    }
  }

  if (t.cpaSurgeWithConversionGrowth.enabled && isEvaluable("cpa", w, t)) {
    const cv = pctChange(w.current.conversions, w.baseline.conversions);
    const cpa = pctChange(w.current.cpa, w.baseline.cpa);
    if (cv != null && cpa != null && cv > 0 && cpa >= t.cpaSurgeWithConversionGrowth.cpaIncreasePct) {
      const msg = `${s.scope.label} 전환수는 ${basisLabel} ${cv.toFixed(0)}% 증가했지만 CPA가 ${cpa.toFixed(0)}% 상승했습니다.`;
      alerts.push(makeAlert(s, w, "cpa_surge_conv_growth", "warning", "cpa", msg, driverDetail(w, "cpa")));
    }
  }

  return alerts;
}

/** 광고비 발생 + 전환 0 (캠페인/상품/키워드, 선택 기간 기준) */
function zeroConversionAlerts(input: DetectAnomaliesInput): Alert[] {
  const { records, range, comparisonRange, thresholds } = input;
  if (!thresholds.zeroConversion.enabled) return [];
  const inRange = records.filter((r) => r.date >= range.start && r.date <= range.end);
  const minSpend = thresholds.zeroConversion.minSpend;
  const out: Alert[] = [];
  const label = formatRange(range.start, range.end);
  const prevLabel = formatRange(comparisonRange.start, comparisonRange.end);

  const push = (type: "product" | "keyword", row: ReturnType<typeof aggregateByProduct>[number]) => {
    const scope: AlertScope = {
      type,
      label: `${platformLabel(row.platform)} ${type === "product" ? "상품" : "키워드"} '${row.label}' (${row.brand})`,
      platform: row.platform,
      brand: row.brand,
      campaign: row.campaign,
      entity: row.label,
    };
    const msg = `${scope.label}에서 광고비 ${formatWon(row.metrics.spend)}이 발생했지만 전환이 없습니다.`;
    out.push({
      id: stableHash(`${type}|${row.key}|zero|${label}`),
      ruleId: "zero_conversion",
      severity: row.metrics.spend >= minSpend * 5 ? "critical" : "warning",
      scope,
      metric: "conversions",
      basis: "previousPeriod",
      currentLabel: label,
      baselineLabel: prevLabel,
      current: 0,
      baseline: null,
      changePct: null,
      title: RULE_TITLES.zero_conversion,
      message: msg,
      detail: `클릭 ${formatMetric("clicks", row.metrics.clicks)}회 · CPC ${formatMetric("cpc", row.metrics.cpc)} · CTR ${formatMetric("ctr", row.metrics.ctr)}`,
      currentMetrics: row.metrics,
      baselineMetrics: calculateMetrics(emptyAccumulator()),
    });
  };

  for (const row of aggregateByProduct(inRange)) if (row.metrics.spend >= minSpend && row.metrics.conversions === 0) push("product", row);
  for (const row of aggregateByKeyword(inRange)) if (row.metrics.spend >= minSpend && row.metrics.conversions === 0) push("keyword", row);
  return out;
}

const BASIS_PRIORITY: Record<ComparisonBasis, number> = { avg7d: 0, prevDay: 1, previousPeriod: 2, prevWeek: 3, prevMonth: 4 };

/** 메인 엔트리 */
export function detectAnomalies(input: DetectAnomaliesInput): Alert[] {
  const { range, comparisonRange, records, thresholds } = input;
  const lookbackStart = [comparisonRange.start, addDays(range.end, -8), shiftRangeMonths(range, -1).start, addDays(range.start, -7)].sort()[0];
  const scopes = buildScopes(records, lookbackStart, range.end);

  const candidates: Alert[] = [];
  for (const s of scopes) for (const w of buildWindows(s, input)) candidates.push(...evaluateWindow(s, w, thresholds));
  candidates.push(...zeroConversionAlerts(input));

  // 같은 대상·같은 규칙은 가장 심각하고 변화폭이 큰 1건만 남긴다
  const best = new Map<string, Alert>();
  for (const a of candidates) {
    const key = `${a.scope.type}|${a.scope.platform}|${a.scope.brand}|${a.scope.campaign}|${a.scope.entity}|${a.ruleId}`;
    const prev = best.get(key);
    if (!prev || compareAlerts(a, prev) < 0) best.set(key, a);
  }
  return groupRelated([...best.values()]).sort(compareAlerts);
}

/** 대표 Alert 선정 우선순위 (같은 대상·같은 방향의 Alert 는 하나로 묶는다) */
const RULE_PRIORITY = [
  "roas_drop",
  "spend_surge",
  "revenue_drop",
  "cvr_drop",
  "cpc_rise",
  "ctr_drop",
  "cpa_surge_conv_growth",
  "conversions_drop",
  "cpa_rise",
  "spend_rise",
  "roas_up",
  "cvr_up",
  "cpa_down",
];

function rulePriority(id: string): number {
  const i = RULE_PRIORITY.indexOf(id);
  return i < 0 ? RULE_PRIORITY.length : i;
}

function groupRelated(alerts: Alert[]): Alert[] {
  const groups = new Map<string, Alert[]>();
  for (const a of alerts) {
    const dir = a.severity === "positive" ? "pos" : "neg";
    const key = `${a.scope.type}|${a.scope.platform}|${a.scope.brand}|${a.scope.campaign}|${a.scope.entity}|${dir}`;
    const list = groups.get(key);
    if (list) list.push(a);
    else groups.set(key, [a]);
  }
  const out: Alert[] = [];
  for (const list of groups.values()) {
    list.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || rulePriority(a.ruleId) - rulePriority(b.ruleId));
    const [primary, ...rest] = list;
    out.push(
      rest.length
        ? {
            ...primary,
            related: rest.map((r) => ({ ruleId: r.ruleId, title: r.title, metric: r.metric, changePct: r.changePct, severity: r.severity })),
          }
        : primary,
    );
  }
  return out;
}

export function compareAlerts(a: Alert, b: Alert): number {
  return (
    SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
    SCOPE_ORDER[a.scope.type] - SCOPE_ORDER[b.scope.type] ||
    Math.abs(b.changePct ?? 0) - Math.abs(a.changePct ?? 0) ||
    BASIS_PRIORITY[a.basis] - BASIS_PRIORITY[b.basis]
  );
}

export function countBySeverity(alerts: Alert[]): Record<AlertSeverity, number> {
  const out: Record<AlertSeverity, number> = { critical: 0, warning: 0, positive: 0 };
  for (const a of alerts) out[a.severity]++;
  return out;
}
