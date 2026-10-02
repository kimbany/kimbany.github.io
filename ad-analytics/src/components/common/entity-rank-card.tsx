import type { AggregatedRow } from "@/types/analytics";
import { formatRoas, formatWon } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/** Top / Underperforming 목록 카드 */
export function EntityRankCard({
  title,
  description,
  rows,
  tone,
  icon,
  extra,
}: {
  title: string;
  description?: string;
  rows: AggregatedRow[];
  tone: "positive" | "negative";
  icon: React.ReactNode;
  extra?: (r: AggregatedRow) => React.ReactNode;
}) {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      {description && <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>}
      <ol className="mt-2 divide-y">
        {rows.map((r, i) => (
          <li key={r.key} className="flex items-center gap-2 py-2 text-sm">
            <span className="w-4 text-xs text-muted-foreground tabular">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{r.label}</div>
              <div className="text-[11px] text-muted-foreground">
                {r.brand}
                {extra && <> · {extra(r)}</>}
              </div>
            </div>
            <div className="text-right tabular">
              <div className={cn("text-sm font-semibold", tone === "positive" ? "text-positive" : "text-negative")}>ROAS {formatRoas(r.metrics.roas)}</div>
              <div className="text-[11px] text-muted-foreground">
                광고비 {formatWon(r.metrics.spend)} · 매출 {formatWon(r.metrics.revenue)}
              </div>
            </div>
          </li>
        ))}
        {!rows.length && <li className="py-4 text-center text-xs text-muted-foreground">해당 항목이 없습니다.</li>}
      </ol>
    </Card>
  );
}
