"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_ICON, APP_NAME, NAV_ITEMS } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const AppIcon = APP_ICON;
  const groups = [NAV_ITEMS.slice(0, 1), NAV_ITEMS.slice(1, 6), NAV_ITEMS.slice(6, 8), NAV_ITEMS.slice(8)];
  const groupLabels = ["", "분석", "인사이트 · 보고", "관리"];

  return (
    <nav className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 px-5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-white">
          <AppIcon className="size-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">{APP_NAME}</div>
          <div className="text-[11px] text-muted-foreground">광고 운영 의사결정</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((items, gi) => (
          <div key={gi} className="mt-3">
            {groupLabels[gi] && <div className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">{groupLabels[gi]}</div>}
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    active ? "bg-accent font-medium text-accent-foreground" : "text-gray-600 hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-4", active ? "text-primary" : "text-gray-400")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
        업로드 파일은 브라우저에만 저장되며
        <br />
        외부로 전송되지 않습니다.
      </div>
    </nav>
  );
}
