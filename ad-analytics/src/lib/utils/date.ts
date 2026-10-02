/**
 * 날짜는 내부적으로 항상 "YYYY-MM-DD" 문자열로 다룬다.
 * 계산은 UTC 기준으로 수행해 타임존/서머타임 영향을 받지 않게 한다.
 */

const DAY_MS = 86_400_000;

export function toUtcDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function fromUtcDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatYmd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** 사용자 로컬 기준 오늘 */
export function todayLocal(): string {
  const now = new Date();
  return formatYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addDays(date: string, days: number): string {
  return fromUtcDate(new Date(toUtcDate(date).getTime() + days * DAY_MS));
}

/** 월 이동. 말일 보정 (3/31 - 1개월 = 2/28) */
export function addMonths(date: string, months: number): string {
  const d = toUtcDate(date);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const target = new Date(Date.UTC(y, m, 1));
  const last = daysInMonth(target.getUTCFullYear(), target.getUTCMonth() + 1);
  return formatYmd(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(d.getUTCDate(), last));
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function diffDays(a: string, b: string): number {
  return Math.round((toUtcDate(b).getTime() - toUtcDate(a).getTime()) / DAY_MS);
}

export function startOfMonth(date: string): string {
  return date.slice(0, 8) + "01";
}

export function endOfMonth(date: string): string {
  const d = toUtcDate(date);
  return formatYmd(d.getUTCFullYear(), d.getUTCMonth() + 1, daysInMonth(d.getUTCFullYear(), d.getUTCMonth() + 1));
}

/** 월요일 시작 주 */
export function startOfWeek(date: string): string {
  const dow = (toUtcDate(date).getUTCDay() + 6) % 7;
  return addDays(date, -dow);
}

export function listDates(start: string, end: string): string[] {
  const out: string[] = [];
  if (start > end) return out;
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function isValidYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = toUtcDate(s);
  return !Number.isNaN(d.getTime()) && fromUtcDate(d) === s;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function weekdayKo(date: string): string {
  return WEEKDAYS[toUtcDate(date).getUTCDay()];
}

/** 10/01 (수) */
export function formatShortDate(date: string, withWeekday = false): string {
  const s = `${date.slice(5, 7)}/${date.slice(8, 10)}`;
  return withWeekday ? `${s} (${weekdayKo(date)})` : s;
}

/** 2026.10.01 */
export function formatDotDate(date: string): string {
  return date.replace(/-/g, ".");
}

export function formatRange(start: string, end: string): string {
  if (start === end) return `${formatDotDate(start)} (${weekdayKo(start)})`;
  return `${formatDotDate(start)} ~ ${formatDotDate(end)}`;
}
