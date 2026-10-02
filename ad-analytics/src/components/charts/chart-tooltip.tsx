import { formatShortDate } from "@/lib/utils/date";

export function TooltipShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-44 rounded-lg border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="mb-1.5 font-medium">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function TooltipRow({ color, label, value }: { color?: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {color && <span className="inline-block size-2 rounded-full" style={{ background: color }} />}
        {label}
      </span>
      <span className="font-medium tabular text-foreground">{value}</span>
    </div>
  );
}

export const dateTick = (d: string) => formatShortDate(d);
