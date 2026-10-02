import type { CanonicalField } from "@/types/ad-data";
import type { ColumnMapping } from "@/types/upload";
import type { PlatformParser } from "./types";

/** 비교용 헤더 정규화: 소문자, 공백/구분자 제거 */
export function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/[\s_\-·:]/g, "")
    .replace(/\(\)/g, "");
}

function stripParens(h: string): string {
  return h.replace(/\([^)]*\)/g, "");
}

/**
 * alias 기반 자동 Mapping.
 * 필드별로 alias 우선순위대로 헤더를 찾고, 하나의 헤더는 하나의 필드에만 연결한다.
 * 1순위: 정규화 문자열 완전 일치 / 2순위: 괄호(단위) 제거 후 일치
 */
export function autoMapColumns(headers: string[], parser: PlatformParser): ColumnMapping {
  const mapping: ColumnMapping = Object.fromEntries(headers.map((h) => [h, null]));
  const used = new Set<string>();
  const norm = headers.map((h) => ({ h, n: normalizeHeader(h), np: normalizeHeader(stripParens(h)) }));

  for (const pass of ["exact", "loose"] as const) {
    for (const f of parser.fields) {
      if (Object.values(mapping).includes(f.field)) continue;
      for (const alias of f.aliases) {
        const a = normalizeHeader(alias);
        const ap = normalizeHeader(stripParens(alias));
        const hit = norm.find((x) => !used.has(x.h) && (pass === "exact" ? x.n === a : x.np === ap));
        if (hit) {
          mapping[hit.h] = f.field;
          used.add(hit.h);
          break;
        }
      }
    }
  }
  return mapping;
}

export function mappedFields(mapping: ColumnMapping): Set<CanonicalField> {
  return new Set(Object.values(mapping).filter((v): v is CanonicalField => !!v));
}

export function missingFields(mapping: ColumnMapping, fields: CanonicalField[]): CanonicalField[] {
  const m = mappedFields(mapping);
  return fields.filter((f) => !m.has(f));
}
