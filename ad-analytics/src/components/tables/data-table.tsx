"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  align?: "left" | "right" | "center";
  /** 정렬 기준 값. 없으면 정렬 불가 */
  sortValue?: (row: T) => number | string | null;
  render: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  defaultSort?: { key: string; dir: "asc" | "desc" };
  onRowClick?: (row: T) => void;
  footer?: React.ReactNode;
  emptyText?: string;
  maxRows?: number;
  dense?: boolean;
  rowClassName?: (row: T) => string | undefined;
}

/** 모든 컬럼 정렬 가능한 범용 테이블 (null 값은 항상 마지막) */
export function DataTable<T>({ columns, rows, rowKey, defaultSort, onRowClick, footer, emptyText = "데이터가 없습니다.", maxRows, dense, rowClassName }: DataTableProps<T>) {
  const [sort, setSort] = useState(defaultSort ?? null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "string" || typeof vb === "string") return String(va).localeCompare(String(vb), "ko") * dir;
      return (va - vb) * dir;
    });
  }, [rows, sort, columns]);
  const visible = maxRows ? sorted.slice(0, maxRows) : sorted;

  const onSort = (c: Column<T>) => {
    if (!c.sortValue) return;
    setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === "desc" ? "asc" : "desc" } : { key: c.key, dir: "desc" }));
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((c) => {
            const active = sort?.key === c.key;
            const Icon = active ? (sort!.dir === "desc" ? ArrowDown : ArrowUp) : ChevronsUpDown;
            return (
              <TableHead key={c.key} className={cn(c.align === "right" && "text-right", c.align === "center" && "text-center", c.headerClassName)}>
                {c.sortValue ? (
                  <button
                    onClick={() => onSort(c)}
                    className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground", c.align === "right" && "flex-row-reverse")}
                  >
                    {c.header}
                    <Icon className={cn("size-3", !active && "opacity-40")} />
                  </button>
                ) : (
                  c.header
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {visible.map((row) => (
          <TableRow
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(onRowClick && "cursor-pointer", rowClassName?.(row))}
          >
            {columns.map((c) => (
              <TableCell key={c.key} className={cn(dense && "py-2", c.align === "right" && "text-right", c.align === "center" && "text-center", c.className)}>
                {c.render(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
        {!visible.length && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
              {emptyText}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      {footer}
    </Table>
  );
}
