import Link from "next/link";
import { Inbox, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  showUpload?: boolean;
  compact?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  title = "선택한 기간에 광고 데이터가 없습니다.",
  description = "Data Management 에서 광고 보고서를 업로드해주세요.",
  icon: Icon = Inbox,
  showUpload = true,
  compact,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center", compact ? "px-4 py-8" : "px-6 py-16", className)}>
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      {showUpload && (
        <Button asChild className="mt-4" size="sm">
          <Link href="/data">
            <Upload /> Upload Data
          </Link>
        </Button>
      )}
      {children}
    </div>
  );
}
