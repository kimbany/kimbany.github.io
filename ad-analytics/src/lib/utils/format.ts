/**
 * 한국 사용자 기준 숫자 표시.
 * null / NaN / Infinity 는 모두 "-" 로 표시해 화면이 깨지지 않게 한다.
 */
import type { MetricKey } from "@/types/analytics";

export const EMPTY = "-";

function isNum(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function formatNumber(v: number | null | undefined, digits = 0): string {
  if (!isNum(v)) return EMPTY;
  return v.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

/** 1,230,000원 */
export function formatWon(v: number | null | undefined): string {
  if (!isNum(v)) return EMPTY;
  return `${Math.round(v).toLocaleString("ko-KR")}원`;
}

/** 큰 금액 보조 표기: 1.23백만원 / 1.2억원 / 3.4만원 */
export function formatWonCompact(v: number | null | undefined): string {
  if (!isNum(v)) return EMPTY;
  const abs = Math.abs(v);
  if (abs >= 100_000_000) return `${trim(v / 100_000_000, 2)}억원`;
  if (abs >= 1_000_000) return `${trim(v / 1_000_000, 2)}백만원`;
  if (abs >= 10_000) return `${trim(v / 10_000, 1)}만원`;
  return formatWon(v);
}

/** 차트 축용 짧은 표기 */
export function formatAxisWon(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 100_000_000) return `${trim(v / 100_000_000, 1)}억`;
  if (abs >= 10_000) return `${trim(v / 10_000, 0)}만`;
  return `${v}`;
}

function trim(v: number, digits: number): string {
  return Number(v.toFixed(digits)).toLocaleString("ko-KR", { maximumFractionDigits: digits });
}

/** 2.82% */
export function formatPercent(v: number | null | undefined, digits = 2): string {
  if (!isNum(v)) return EMPTY;
  return `${v.toFixed(digits)}%`;
}

/** ROAS 712% */
export function formatRoas(v: number | null | undefined): string {
  if (!isNum(v)) return EMPTY;
  return `${Math.round(v).toLocaleString("ko-KR")}%`;
}

/** 변화율: +12.4% / -3.1% */
export function formatChange(v: number | null | undefined): string {
  if (!isNum(v)) return EMPTY;
  const sign = v > 0 ? "+" : "";
  const digits = Math.abs(v) >= 100 ? 0 : 1;
  return `${sign}${v.toFixed(digits)}%`;
}

export function formatMetric(metric: MetricKey, v: number | null | undefined): string {
  switch (metric) {
    case "spend":
    case "revenue":
    case "cpc":
    case "cpa":
    case "cpm":
    case "aov":
      return formatWon(v);
    case "roas":
      return formatRoas(v);
    case "ctr":
    case "cvr":
      return formatPercent(v);
    case "impressions":
    case "clicks":
      return formatNumber(v);
    case "conversions":
      return formatNumber(v, 1);
  }
}
