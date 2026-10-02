/**
 * 원본 테이블 + 컬럼 Mapping → 공통 AdRecord 변환.
 * 플랫폼과 무관한 공통 로직이며, 플랫폼별 차이는 PlatformParser(fields/postProcess)로 처리한다.
 */
import type { AdRecord, CanonicalField } from "@/types/ad-data";
import type { ColumnMapping, ParseIssue, ParseResult, RawTable } from "@/types/upload";
import { dedupeKeyOf } from "@/lib/db/repository";
import { FIELD_LABELS } from "./common-fields";
import { missingFields } from "./mapping";
import { ParseError, type PlatformParser } from "./types";
import { cellToString, isSummaryRow, parseDate, parseNumber } from "./values";

const NUMBER_FIELDS = new Set<CanonicalField>([
  "spend", "impressions", "clicks", "conversions", "revenue",
  "reach", "frequency", "videoViews", "addToCart", "landingPageViews", "orders",
]);
const ADDITIVE: (keyof AdRecord)[] = ["spend", "impressions", "clicks", "conversions", "revenue", "reach", "videoViews", "addToCart", "landingPageViews", "orders"];
const MAX_ISSUES = 50;

export interface NormalizeOptions {
  brand: string;
  sourceFileId: string;
}

export function validateMapping(mapping: ColumnMapping, parser: PlatformParser): { missingRequired: CanonicalField[]; missingRecommended: CanonicalField[] } {
  return {
    missingRequired: missingFields(mapping, parser.requiredFields),
    missingRecommended: missingFields(mapping, parser.recommendedFields),
  };
}

export function normalizeRows(table: RawTable, mapping: ColumnMapping, parser: PlatformParser, opt: NormalizeOptions): ParseResult {
  const { missingRequired, missingRecommended } = validateMapping(mapping, parser);
  if (missingRequired.length) {
    throw new ParseError(
      "MISSING_REQUIRED",
      `필수 컬럼을 찾을 수 없습니다: ${missingRequired.map((f) => FIELD_LABELS[f]).join(", ")}. 컬럼 Mapping 에서 직접 지정해주세요.`,
    );
  }

  const errors: ParseIssue[] = [];
  const warnings: ParseIssue[] = missingRecommended.map((f) => ({ message: `'${FIELD_LABELS[f]}' 컬럼이 없어 0 또는 빈 값으로 처리됩니다.` }));
  const colIndex = table.headers
    .map((h, i) => ({ field: mapping[h], i, h }))
    .filter((x): x is { field: CanonicalField; i: number; h: string } => !!x.field);

  const merged = new Map<string, AdRecord>();
  let skipped = 0;
  let dateFailures = 0;
  let numberFailures = 0;
  let mergedCount = 0;
  let seq = 0;
  const rowOffset = table.headerRowIndex + 2; // 1-based + 헤더

  table.rows.forEach((row, idx) => {
    const rowNo = idx + rowOffset;
    const rec: Record<string, unknown> = {
      platform: parser.platform,
      brand: opt.brand,
      sourceFileId: opt.sourceFileId,
      campaign: "", adGroup: "", ad: "", product: "", keyword: "",
      spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0,
    };
    let invalidRow = false;
    for (const { field, i, h } of colIndex) {
      const cell = row[i];
      if (field === "date") {
        const d = parseDate(cell);
        if (!d) {
          invalidRow = true;
          if (!isSummaryRow(row)) {
            dateFailures++;
            if (errors.length < MAX_ISSUES) errors.push({ row: rowNo, column: h, message: `날짜 형식을 인식할 수 없습니다: "${cellToString(cell)}"` });
          }
        }
        rec.date = d;
      } else if (NUMBER_FIELDS.has(field)) {
        const n = parseNumber(cell);
        if (n == null) {
          numberFailures++;
          if (errors.length < MAX_ISSUES) errors.push({ row: rowNo, column: h, message: `숫자 데이터 형식이 올바르지 않습니다: "${cellToString(cell)}"` });
          rec[field] = 0;
        } else rec[field] = n;
      } else {
        rec[field] = cellToString(cell);
      }
    }
    if (invalidRow) {
      skipped++;
      return;
    }
    let record = { ...(rec as unknown as AdRecord), id: `${opt.sourceFileId}_${seq++}` };
    if (parser.postProcess) record = parser.postProcess(record);
    for (const k of Object.keys(record) as (keyof AdRecord)[]) if (record[k] === undefined) delete record[k];

    // 같은 파일 안의 동일 키 행은 합산 (예: 노출 위치 breakdown 을 매핑하지 않은 경우)
    const key = dedupeKeyOf(record);
    const prev = merged.get(key);
    if (prev) {
      mergedCount++;
      const target = prev as unknown as Record<string, number | undefined>;
      for (const f of ADDITIVE) {
        const v = record[f] as number | undefined;
        if (v != null) target[f] = (target[f] ?? 0) + v;
      }
    } else merged.set(key, record);
  });

  const records = [...merged.values()];
  const total = table.rows.length;
  if (!records.length && dateFailures > 0) {
    throw new ParseError("INVALID_DATE", "날짜 형식을 인식할 수 없습니다. 날짜 컬럼 Mapping 과 형식(예: 2026-09-01)을 확인해주세요.");
  }
  if (total > 0 && numberFailures / Math.max(1, total * colIndex.filter((c) => NUMBER_FIELDS.has(c.field)).length) > 0.2) {
    throw new ParseError("INVALID_NUMBER", "숫자 데이터 형식이 올바르지 않습니다. 금액·노출·클릭 컬럼 Mapping 을 확인해주세요.");
  }
  if (mergedCount) warnings.push({ message: `동일한 날짜·캠페인·광고그룹·광고·상품·키워드 조합 ${mergedCount}개 행을 합산했습니다.` });
  if (skipped - dateFailures > 0) warnings.push({ message: `합계/요약 행 ${skipped - dateFailures}개를 제외했습니다.` });

  let start: string | null = null;
  let end: string | null = null;
  for (const r of records) {
    if (!start || r.date < start) start = r.date;
    if (!end || r.date > end) end = r.date;
  }
  return {
    records,
    errors,
    warnings,
    totalRows: total,
    skippedRows: skipped,
    dateRange: start && end ? { start, end } : null,
  };
}
