import type { ComparisonMode, DatePreset, DateRange } from "@/types/analytics";
import {
  addDays,
  addMonths,
  diffDays,
  endOfMonth,
  formatRange,
  startOfMonth,
} from "@/lib/utils/date";

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "오늘" },
  { id: "yesterday", label: "어제" },
  { id: "last7", label: "최근 7일" },
  { id: "last30", label: "최근 30일" },
  { id: "thisMonth", label: "이번 달" },
  { id: "lastMonth", label: "지난달" },
  { id: "custom", label: "사용자 지정" },
];

export function resolveDateRange(preset: DatePreset, today: string, custom?: DateRange | null): DateRange {
  switch (preset) {
    case "today":
      return { start: today, end: today };
    case "yesterday": {
      const y = addDays(today, -1);
      return { start: y, end: y };
    }
    case "last7":
      return { start: addDays(today, -6), end: today };
    case "last30":
      return { start: addDays(today, -29), end: today };
    case "thisMonth":
      return { start: startOfMonth(today), end: today };
    case "lastMonth": {
      const prev = addMonths(startOfMonth(today), -1);
      return { start: prev, end: endOfMonth(prev) };
    }
    case "custom":
      if (custom && custom.start <= custom.end) return custom;
      return { start: addDays(today, -6), end: today };
  }
}

export function rangeLength(range: DateRange): number {
  return diffDays(range.start, range.end) + 1;
}

export function shiftRange(range: DateRange, days: number): DateRange {
  return { start: addDays(range.start, days), end: addDays(range.end, days) };
}

export function shiftRangeMonths(range: DateRange, months: number): DateRange {
  return { start: addMonths(range.start, months), end: addMonths(range.end, months) };
}

/**
 * 비교 기간 계산.
 * - previous: 바로 이전 동일 길이 (최근 7일 → 그 직전 7일)
 * - previousMonthSameDays: 전월 동일 날짜 구간 (10/1~10/15 → 9/1~9/15)
 * - previousMonthFull: 지난달 전체
 */
export function getComparisonRange(range: DateRange, mode: ComparisonMode = "previous"): DateRange {
  switch (mode) {
    case "previousMonthSameDays":
      return shiftRangeMonths(range, -1);
    case "previousMonthFull": {
      const prevStart = addMonths(startOfMonth(range.start), -1);
      return { start: prevStart, end: endOfMonth(prevStart) };
    }
    case "previous":
    default: {
      const len = rangeLength(range);
      return { start: addDays(range.start, -len), end: addDays(range.start, -1) };
    }
  }
}

export function inRange(date: string, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

export function describeRange(range: DateRange): string {
  return formatRange(range.start, range.end);
}

export const COMPARISON_MODE_LABELS: Record<ComparisonMode, string> = {
  previous: "직전 동일 기간",
  previousMonthSameDays: "전월 동일 날짜",
  previousMonthFull: "지난달 전체",
};
