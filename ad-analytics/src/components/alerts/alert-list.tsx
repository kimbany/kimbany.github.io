"use client";

import { useState } from "react";
import type { Alert, AlertSeverity } from "@/types/alerts";
import { countBySeverity } from "@/lib/analytics/anomalies";
import { cn } from "@/lib/utils/cn";
import { AlertCard } from "./alert-card";
import { SEVERITY_META } from "./severity";
import { EmptyState } from "@/components/common/empty-state";
import { CheckCircle2 } from "lucide-react";

export function AlertList({ alerts, compact, limit, filterable }: { alerts: Alert[]; compact?: boolean; limit?: number; filterable?: boolean }) {
  const [sev, setSev] = useState<AlertSeverity | "all">("all");
  const counts = countBySeverity(alerts);
  const list = (sev === "all" ? alerts : alerts.filter((a) => a.severity === sev)).slice(0, limit);
  return (
    <div>
      {filterable && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(["all", "critical", "warning", "positive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSev(s)}
              className={cn("rounded-full border px-3 py-1 text-xs", sev === s ? "border-foreground bg-foreground text-white" : "bg-card hover:bg-muted")}
            >
              {s === "all" ? `전체 ${alerts.length}` : `${SEVERITY_META[s].label} ${counts[s]}`}
            </button>
          ))}
        </div>
      )}
      {list.length ? (
        <div className="space-y-2.5">
          {list.map((a) => (
            <AlertCard key={a.id} alert={a} compact={compact} />
          ))}
        </div>
      ) : (
        <EmptyState compact icon={CheckCircle2} title="임계값을 넘는 이상징후가 없습니다." description="Settings 에서 Alert 기준을 조정할 수 있습니다." showUpload={false} />
      )}
    </div>
  );
}
