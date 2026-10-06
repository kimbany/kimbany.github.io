/** 카페24 응답 값 정리 — 숫자 · 날짜(KST) */

export const num = (v) => {
  const n = Number(String(v ?? 0).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** 채널이 KST 로컬 문자열('2026-08-24 09:00:00')을 주는 경우가 많아 KST 로 해석한다. */
export function toIso(v) {
  if (!v) return new Date().toISOString();
  if (v instanceof Date) return v.toISOString();
  const s = String(v).trim();
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(s)) return new Date(s).toISOString();
  const d = s.replace(' ', 'T');
  const withSec = /T\d{2}:\d{2}$/.test(d) ? `${d}:00` : d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(withSec)) return new Date(`${withSec}T00:00:00+09:00`).toISOString();
  if (/^\d{14}$/.test(s)) {
    const p = [s.slice(0, 4), s.slice(4, 6), s.slice(6, 8), s.slice(8, 10), s.slice(10, 12), s.slice(12, 14)];
    return new Date(`${p[0]}-${p[1]}-${p[2]}T${p[3]}:${p[4]}:${p[5]}+09:00`).toISOString();
  }
  const parsed = new Date(`${withSec}+09:00`);
  return Number.isNaN(parsed.getTime()) ? new Date(s).toISOString() : parsed.toISOString();
}

/** 오늘(KST) 기준 YYYY-MM-DD */
export function kstToday(offsetDays = 0) {
  const now = new Date(Date.now() + 9 * 3600_000 + offsetDays * 86400_000);
  return now.toISOString().slice(0, 10);
}
