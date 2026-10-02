import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function LoadingState({ label = "데이터를 불러오는 중입니다…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted-foreground", className)}>
      <Loader2 className="size-6 animate-spin text-primary" />
      {label}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
