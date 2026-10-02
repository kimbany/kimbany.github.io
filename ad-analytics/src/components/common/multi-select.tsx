"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils/cn";

export interface MultiSelectOption {
  value: string;
  label: string;
  hint?: string;
  prefix?: React.ReactNode;
}

interface MultiSelectProps {
  label: string;
  allLabel: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (v: string[]) => void;
  searchable?: boolean;
  className?: string;
}

/** 공통 필터용 다중 선택. 빈 배열 = 전체 */
export function MultiSelect({ label, allLabel, options, value, onChange, searchable, className }: MultiSelectProps) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => (q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options), [q, options]);
  const selected = new Set(value);
  const summary =
    value.length === 0 ? allLabel : value.length === 1 ? (options.find((o) => o.value === value[0])?.label ?? value[0]) : `${value.length}개 선택`;

  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange([...next]);
  };

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex h-8 max-w-56 items-center gap-1.5 rounded-md border bg-card px-2.5 text-xs hover:bg-muted",
          value.length > 0 && "border-primary/40 bg-accent/60",
          className,
        )}
      >
        <span className="text-muted-foreground">{label}</span>
        <span className="truncate font-medium">{summary}</span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1.5">
        {searchable && (
          <div className="mb-1 flex items-center gap-1.5 rounded-md border px-2">
            <Search className="size-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className="h-7 flex-1 bg-transparent text-xs outline-none" />
          </div>
        )}
        <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted" onClick={() => onChange([])}>
          <Checkbox checked={value.length === 0} tabIndex={-1} className="pointer-events-none" />
          {allLabel}
        </button>
        <div className="max-h-64 overflow-y-auto">
          {filtered.map((o) => (
            <button key={o.value} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted" onClick={() => toggle(o.value)}>
              <Checkbox checked={selected.has(o.value)} tabIndex={-1} className="pointer-events-none" />
              {o.prefix}
              <span className="flex-1 truncate">{o.label}</span>
              {o.hint && <span className="text-[10px] text-muted-foreground">{o.hint}</span>}
            </button>
          ))}
          {!filtered.length && <div className="px-2 py-3 text-center text-xs text-muted-foreground">항목이 없습니다</div>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
