import Link from "next/link";
import { ChevronRight, ClipboardCheck, Lightbulb, ListChecks, Target } from "lucide-react";
import type { InsightItem } from "@/types/ai";
import { cn } from "@/lib/utils/cn";
import { SEVERITY_META, SeverityBadge } from "@/components/alerts/severity";

/** 문제 → 가능한 원인 → 확인해야 할 사항 → 권장 액션 */
export function InsightCard({ item, className }: { item: InsightItem; className?: string }) {
  return (
    <div id={item.id} className={cn("scroll-mt-40 rounded-xl border bg-card print-avoid-break", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b px-5 py-3">
        <SeverityBadge severity={item.severity} />
        <h3 className="text-sm font-semibold">{item.title}</h3>
      </div>
      <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
        <Block icon={Target} title="문제">
          <p className="text-sm leading-relaxed">{item.problem}</p>
        </Block>
        <Block icon={Lightbulb} title="가능한 원인">
          <ul className="space-y-1.5 text-sm leading-relaxed">
            {item.possibleCauses.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-gray-400" />
                {c}
              </li>
            ))}
          </ul>
        </Block>
        <Block icon={ListChecks} title="확인해야 할 사항">
          <div className="flex flex-wrap gap-1.5">
            {item.checks.map((c) => (
              <span key={c} className="rounded-md border bg-muted/50 px-2 py-1 text-xs">
                {c}
              </span>
            ))}
          </div>
        </Block>
        <Block icon={ClipboardCheck} title="권장 액션">
          <ol className="space-y-1.5 text-sm">
            {item.recommendedActions.map((a) => (
              <li key={a.priority} className="flex items-start gap-2">
                <span className={cn("mt-0.5 inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[11px] font-semibold", a.priority === 1 ? "bg-foreground text-white" : "bg-muted text-foreground")}>
                  {a.priority}순위
                </span>
                {a.action}
              </li>
            ))}
          </ol>
        </Block>
      </div>
    </div>
  );
}

function Block({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" /> {title}
      </div>
      {children}
    </div>
  );
}

/** Dashboard 용 한 줄 요약 (클릭 시 AI Insights 상세로 이동) */
export function InsightSummaryItem({ item }: { item: InsightItem }) {
  const m = SEVERITY_META[item.severity];
  const Icon = m.icon;
  return (
    <Link href={`/insights#${item.id}`} className="group flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/70">
      <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md", m.soft, m.text)}>
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium" title={item.title}>{item.title}</div>
        <div className="line-clamp-1 text-xs text-muted-foreground">{item.recommendedActions[0] ? `→ ${item.recommendedActions[0].action}` : item.problem}</div>
      </div>
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
}
