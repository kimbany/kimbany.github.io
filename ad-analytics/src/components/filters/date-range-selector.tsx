"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { DATE_PRESETS, describeRange } from "@/lib/analytics/period";
import { useDateRange, useToday } from "@/hooks/use-analytics";
import { useFilterStore } from "@/store/filter-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export function DateRangeSelector() {
  const today = useToday();
  const preset = useFilterStore((s) => s.preset);
  const setPreset = useFilterStore((s) => s.setPreset);
  const setCustomRange = useFilterStore((s) => s.setCustomRange);
  const { range } = useDateRange();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(range.start);
  const [end, setEnd] = useState(range.end);
  const presetLabel = DATE_PRESETS.find((p) => p.id === preset)?.label;
  const invalid = !start || !end || start > end;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setStart(range.start);
          setEnd(range.end);
        }
      }}
    >
      <PopoverTrigger className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 text-xs hover:bg-muted">
        <CalendarDays className="size-3.5 text-muted-foreground" />
        <span className="font-medium">{presetLabel}</span>
        <span className="hidden text-muted-foreground sm:inline">{describeRange(range)}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2">
        <div className="grid grid-cols-3 gap-1">
          {DATE_PRESETS.filter((p) => p.id !== "custom").map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPreset(p.id);
                setOpen(false);
              }}
              className={cn("rounded-md px-2 py-1.5 text-xs hover:bg-muted", preset === p.id && "bg-accent font-medium text-accent-foreground")}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-2 border-t pt-2">
          <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">사용자 지정 기간</div>
          <div className="flex items-center gap-1.5">
            <Input type="date" value={start} max={today} onChange={(e) => setStart(e.target.value)} className="h-8 px-2 text-xs" />
            <span className="text-xs text-muted-foreground">~</span>
            <Input type="date" value={end} max={today} onChange={(e) => setEnd(e.target.value)} className="h-8 px-2 text-xs" />
          </div>
          {invalid && <p className="mt-1 text-[11px] text-negative">시작일이 종료일보다 늦을 수 없습니다.</p>}
          <Button
            size="sm"
            className="mt-2 w-full"
            disabled={invalid}
            onClick={() => {
              setCustomRange({ start, end });
              setOpen(false);
            }}
          >
            적용
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
