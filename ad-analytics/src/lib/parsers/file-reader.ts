/**
 * CSV / XLS / XLSX 파일을 브라우저에서 직접 읽는다 (파일은 외부로 전송되지 않음).
 * - CSV 는 UTF-8 → 실패 시 EUC-KR(CP949) 로 디코딩 (네이버 리포트 대응)
 * - 보고서 상단의 제목/기간 행을 건너뛰고 실제 헤더 행을 자동 탐지
 */
import * as XLSX from "xlsx";
import type { CellValue, RawTable } from "@/types/upload";
import { ParseError, type PlatformParser } from "./types";
import { normalizeHeader } from "./mapping";

export const SUPPORTED_EXTENSIONS = ["csv", "xls", "xlsx"] as const;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

export function fileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function decodeText(buf: ArrayBuffer): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    text = new TextDecoder("euc-kr").decode(buf);
  }
  return text.replace(/^﻿/, "");
}

function headerScore(row: CellValue[], aliases: Set<string>): number {
  let score = 0;
  for (const c of row) {
    if (typeof c === "string" && c.trim() && aliases.has(normalizeHeader(c))) score++;
  }
  return score;
}

function uniqueHeaders(row: CellValue[]): string[] {
  const seen = new Map<string, number>();
  return row.map((c, i) => {
    const base = c == null || String(c).trim() === "" ? `컬럼${i + 1}` : String(c).trim();
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base} (${n + 1})` : base;
  });
}

export async function readSpreadsheet(file: File, parser: PlatformParser): Promise<RawTable> {
  const ext = fileExtension(file.name);
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ParseError("UNSUPPORTED_FILE", `지원하지 않는 파일 형식입니다. (.${ext || "?"}) CSV, XLS, XLSX 파일만 업로드할 수 있습니다.`);
  }
  if (file.size === 0) throw new ParseError("EMPTY_FILE", "빈 파일입니다.");
  if (file.size > MAX_FILE_SIZE) throw new ParseError("FILE_TOO_LARGE", "파일이 너무 큽니다. 20MB 이하 파일만 업로드할 수 있습니다.");

  let wb: XLSX.WorkBook;
  try {
    const buf = await file.arrayBuffer();
    wb = ext === "csv" ? XLSX.read(decodeText(buf), { type: "string", raw: true }) : XLSX.read(buf, { type: "array", cellDates: false });
  } catch {
    throw new ParseError("READ_FAILED", "파일을 읽을 수 없습니다. 파일이 손상되었거나 암호가 걸려 있는지 확인해주세요.");
  }

  const aliases = new Set(parser.fields.flatMap((f) => f.aliases.map(normalizeHeader)));
  let best: { sheet: string; rows: CellValue[][]; headerIdx: number; score: number } | null = null;
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<CellValue[]>(wb.Sheets[name], { header: 1, raw: true, defval: null, blankrows: false });
    if (!rows.length) continue;
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const score = headerScore(rows[i] ?? [], aliases);
      if (!best || score > best.score) best = { sheet: name, rows, headerIdx: i, score };
    }
  }
  if (!best || best.rows.length === 0) throw new ParseError("EMPTY_FILE", "파일에 데이터가 없습니다.");
  if (best.score === 0) {
    // 헤더를 찾지 못하면 첫 번째 비어있지 않은 행을 헤더로 사용하고 수동 Mapping 에 맡긴다
    best.headerIdx = best.rows.findIndex((r) => r.some((c) => c != null && String(c).trim() !== ""));
  }
  const headerRow = best.rows[best.headerIdx] ?? [];
  const headers = uniqueHeaders(headerRow);
  const rows = best.rows
    .slice(best.headerIdx + 1)
    .filter((r) => r.some((c) => c != null && String(c).trim() !== ""))
    .map((r) => headers.map((_, i) => (r[i] === undefined ? null : r[i])));
  if (!rows.length) throw new ParseError("EMPTY_FILE", "헤더 아래에 데이터 행이 없습니다.");

  return { fileName: file.name, sheetName: best.sheet, headerRowIndex: best.headerIdx, headers, rows };
}
