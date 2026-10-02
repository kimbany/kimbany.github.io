"use client";

import { cn } from "@/lib/utils/cn";

export function SegmentChips<T extends string>({ options, value, onChange }: { options: { id: T; label: string; count: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn("rounded-full border px-3 py-1 text-xs transition-colors", value === o.id ? "border-foreground bg-foreground text-white" : "bg-card hover:bg-muted")}
        >
          {o.label} <span className={cn("ml-0.5 tabular", value === o.id ? "text-white/70" : "text-muted-foreground")}>{o.count}</span>
        </button>
      ))}
    </div>
  );
}
