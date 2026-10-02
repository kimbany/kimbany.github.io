import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { MetricDelta } from "@/types/analytics";
import { formatChange } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const tone = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-muted-foreground",
};

/** ▲ 12.4% / ▼ 3.1% — 방향은 화살표, 좋고 나쁨은 색으로 구분 (광고비는 중립) */
export function ChangeIndicator({ delta, className, size = "sm" }: { delta: MetricDelta; className?: string; size?: "xs" | "sm" }) {
  const textSize = size === "xs" ? "text-[11px]" : "text-xs";
  if (delta.changePct == null) {
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-muted-foreground", textSize, className)}>
        {delta.isNew ? "신규" : "-"}
      </span>
    );
  }
  const up = delta.changePct > 0;
  const flat = Math.abs(delta.changePct) < 0.5;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium tabular", tone[delta.sentiment], textSize, className)}>
      <Icon className={size === "xs" ? "size-3" : "size-3.5"} />
      {formatChange(delta.changePct)}
    </span>
  );
}
