import { AlertOctagon, AlertTriangle, TrendingUp } from "lucide-react";
import type { AlertSeverity } from "@/types/alerts";
import { Badge } from "@/components/ui/badge";

export const SEVERITY_META: Record<AlertSeverity, { label: string; icon: typeof AlertOctagon; badge: "negative" | "warning" | "positive"; bar: string; text: string; soft: string }> = {
  critical: { label: "Critical", icon: AlertOctagon, badge: "negative", bar: "bg-negative", text: "text-negative", soft: "bg-negative-soft" },
  warning: { label: "Warning", icon: AlertTriangle, badge: "warning", bar: "bg-warning", text: "text-warning", soft: "bg-warning-soft" },
  positive: { label: "Positive", icon: TrendingUp, badge: "positive", bar: "bg-positive", text: "text-positive", soft: "bg-positive-soft" },
};

/** 상태는 색 + 아이콘 + 라벨로 함께 표시 (색만으로 구분하지 않음) */
export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const m = SEVERITY_META[severity];
  const Icon = m.icon;
  return (
    <Badge variant={m.badge}>
      <Icon /> {m.label}
    </Badge>
  );
}
