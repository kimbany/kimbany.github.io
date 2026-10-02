import type { AdRecord, CanonicalField, PlatformId } from "./ad-data";

export type UploadStatus = "success" | "partial" | "failed";
export type DuplicateMode = "skip" | "overwrite";

export interface UploadRecord {
  id: string;
  uploadedAt: string;
  fileName: string;
  platform: PlatformId;
  brand: string;
  dataStartDate: string | null;
  dataEndDate: string | null;
  rowCount: number;
  skippedRows: number;
  status: UploadStatus;
  duplicateMode?: DuplicateMode;
  duplicateCount?: number;
}

export type CellValue = string | number | boolean | Date | null;

/** 파일에서 읽은 원본 테이블 */
export interface RawTable {
  fileName: string;
  sheetName: string;
  headerRowIndex: number;
  headers: string[];
  rows: CellValue[][];
}

/** 원본 컬럼명 → 공통 필드 (null 이면 무시) */
export type ColumnMapping = Record<string, CanonicalField | null>;

export interface ParseIssue {
  /** 원본 파일 기준 행 번호 (1-based, 헤더 포함) */
  row?: number;
  column?: string;
  message: string;
}

export interface ParseResult {
  records: AdRecord[];
  errors: ParseIssue[];
  warnings: ParseIssue[];
  totalRows: number;
  skippedRows: number;
  dateRange: { start: string; end: string } | null;
}
