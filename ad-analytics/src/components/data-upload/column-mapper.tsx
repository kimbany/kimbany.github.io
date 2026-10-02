"use client";

import { ArrowRight, CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import type { CanonicalField } from "@/types/ad-data";
import type { ColumnMapping, RawTable } from "@/types/upload";
import type { PlatformParser } from "@/lib/parsers/types";
import { FIELD_LABELS } from "@/lib/parsers/common-fields";
import { cellToString } from "@/lib/parsers/values";
import { mappedFields } from "@/lib/parsers/mapping";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface Props {
  table: RawTable;
  parser: PlatformParser;
  mapping: ColumnMapping;
  onChange: (m: ColumnMapping) => void;
}

/** 원본 컬럼 → 공통 필드 Mapping 확인 / 수정 */
export function ColumnMapper({ table, parser, mapping, onChange }: Props) {
  const mapped = mappedFields(mapping);
  const required = new Set(parser.requiredFields);
  const recommended = new Set(parser.recommendedFields);

  const set = (header: string, field: CanonicalField | null) => {
    const next: ColumnMapping = { ...mapping };
    // 하나의 공통 필드는 하나의 원본 컬럼에만 연결
    if (field) for (const h of Object.keys(next)) if (next[h] === field) next[h] = null;
    next[header] = field;
    onChange(next);
  };

  const sample = (i: number) => {
    for (const r of table.rows.slice(0, 20)) {
      const v = cellToString(r[i]);
      if (v) return v;
    }
    return "";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {parser.fields
          .filter((f) => required.has(f.field) || recommended.has(f.field))
          .map((f) => {
            const ok = mapped.has(f.field);
            const req = required.has(f.field);
            return (
              <Badge key={f.field} variant={ok ? "positive" : req ? "negative" : "warning"}>
                {ok ? <CheckCircle2 /> : req ? <CircleAlert /> : <CircleDashed />}
                {f.label}
                {req ? " (필수)" : ""}
              </Badge>
            );
          })}
      </div>
      <div className="divide-y rounded-lg border">
        {table.headers.map((h, i) => {
          const field = mapping[h];
          return (
            <div key={h} className="grid grid-cols-[1fr_auto_200px] items-center gap-3 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">&quot;{h}&quot;</div>
                <div className="truncate text-[11px] text-muted-foreground">예: {sample(i) || "-"}</div>
              </div>
              <ArrowRight className={cn("size-4", field ? "text-primary" : "text-gray-300")} />
              <NativeSelect value={field ?? ""} onChange={(e) => set(h, (e.target.value || null) as CanonicalField | null)}>
                <option value="">— 사용 안 함 —</option>
                {parser.fields.map((f) => (
                  <option key={f.field} value={f.field}>
                    {FIELD_LABELS[f.field]} ({f.field})
                    {required.has(f.field) ? " *" : ""}
                  </option>
                ))}
              </NativeSelect>
            </div>
          );
        })}
      </div>
    </div>
  );
}
