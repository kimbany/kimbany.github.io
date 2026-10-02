import type { ColumnMapping, RawTable } from "@/types/upload";
import { FIELD_LABELS } from "@/lib/parsers/common-fields";
import { cellToString } from "@/lib/parsers/values";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** 원본 파일 첫 N행 미리보기 (인식된 공통 필드를 헤더 아래 표시) */
export function FilePreview({ table, mapping, rows = 15 }: { table: RawTable; mapping: ColumnMapping; rows?: number }) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-lg border">
      <Table className="text-xs">
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow>
            <TableHead className="w-10 text-right">#</TableHead>
            {table.headers.map((h) => (
              <TableHead key={h}>
                <div className="font-medium text-foreground">{h}</div>
                <div className={mapping[h] ? "text-primary" : "text-gray-400"}>{mapping[h] ? `→ ${FIELD_LABELS[mapping[h]!]}` : "무시"}</div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.slice(0, rows).map((r, i) => (
            <TableRow key={i}>
              <TableCell className="text-right text-muted-foreground">{i + table.headerRowIndex + 2}</TableCell>
              {table.headers.map((h, j) => (
                <TableCell key={h} className={mapping[h] ? "" : "text-gray-400"}>
                  {cellToString(r[j]) || <span className="text-gray-300">—</span>}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
