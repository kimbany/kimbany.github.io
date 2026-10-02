import { Badge } from "@/components/ui/badge";

const NEGATIVE = new Set(["no_conversion", "high_spend_low_revenue", "high_cpc", "low_ctr", "low_roas"]);
const POSITIVE = new Set(["high_roas", "high_cvr", "high_revenue"]);

export function FlagBadges({ flags, labels }: { flags: string[]; labels: Record<string, string> }) {
  if (!flags.length) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((f) => (
        <Badge key={f} variant={f === "no_conversion" ? "negative" : NEGATIVE.has(f) ? "warning" : POSITIVE.has(f) ? "positive" : "outline"}>
          {labels[f] ?? f}
        </Badge>
      ))}
    </div>
  );
}
