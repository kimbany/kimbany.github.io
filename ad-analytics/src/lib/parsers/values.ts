/** 원본 셀 값 → 숫자 / 날짜 변환 유틸 */
import type { CellValue } from "@/types/upload";
import { formatYmd, isValidYmd } from "@/lib/utils/date";

/**
 * 숫자 파싱. "1,234원", "₩1,234", "12.3%", "-", "" 등을 처리한다.
 * 빈 값 → 0, 해석 불가 → null
 */
export function parseNumber(v: CellValue): number | null {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean" || v instanceof Date) return null;
  let s = v.trim();
  if (s === "" || s === "-" || s === "--" || s === "N/A" || s.toLowerCase() === "nan") return 0;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[,\s₩원%]|KRW/gi, "");
  if (!/^-?\d*\.?\d+(e[+-]?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Excel 날짜 serial → YYYY-MM-DD (1900 date system) */
function fromExcelSerial(serial: number): string | null {
  if (serial < 20000 || serial > 80000) return null;
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(ms);
  return formatYmd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * 날짜 파싱. 지원 형식:
 * 2026-09-01, 2026.09.01., 2026/9/1, 2026년 9월 1일, 20260901, 2026.09.01.(화), 09/01/2026, Excel serial, Date 객체
 * 기간 형식("2026-09-01 - 2026-09-07")은 시작일을 사용한다.
 */
export function parseDate(v: CellValue): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return formatYmd(v.getFullYear(), v.getMonth() + 1, v.getDate());
  }
  if (typeof v === "number") {
    if (v >= 19000101 && v <= 21001231) return checked(String(v).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3"));
    return fromExcelSerial(v);
  }
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  let m = s.match(/(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})/);
  if (m) return checked(formatYmd(+m[1], +m[2], +m[3]));
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return checked(formatYmd(+m[1], +m[2], +m[3]));
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return checked(formatYmd(+m[3], +m[1], +m[2]));
  if (/^\d+(\.\d+)?$/.test(s)) return fromExcelSerial(Number(s));
  return null;
}

function checked(ymd: string): string | null {
  return isValidYmd(ymd) ? ymd : null;
}

export function cellToString(v: CellValue): string {
  if (v == null) return "";
  if (v instanceof Date) return parseDate(v) ?? "";
  return String(v).trim();
}

/** 합계 / 총계 행 판별 */
export function isSummaryRow(row: CellValue[]): boolean {
  return row.some((c) => typeof c === "string" && /^(합계|총계|전체|total|summary)$/i.test(c.trim()));
}
