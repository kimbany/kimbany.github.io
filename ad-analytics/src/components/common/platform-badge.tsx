import { PLATFORMS } from "@/lib/config/platforms";
import type { PlatformId } from "@/types/ad-data";
import { cn } from "@/lib/utils/cn";

export function PlatformDot({ platform, className }: { platform: PlatformId; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ background: PLATFORMS[platform]?.color ?? "#9ca3af" }} />;
}

export function PlatformBadge({ platform, short, className }: { platform: PlatformId; short?: boolean; className?: string }) {
  const def = PLATFORMS[platform];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-foreground", className)}>
      <PlatformDot platform={platform} />
      {short ? def?.shortLabel : def?.label ?? platform}
    </span>
  );
}
