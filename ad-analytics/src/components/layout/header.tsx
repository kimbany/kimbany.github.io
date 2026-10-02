"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { findNavItem } from "@/lib/config/navigation";
import { useDataStore } from "@/store/data-store";
import { useSettingsStore } from "@/store/settings-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/filters/filter-bar";

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const nav = findNavItem(pathname);
  const useSample = useSettingsStore((s) => s.settings.useSampleData);
  const uploadedRows = useDataStore((s) => s.records.length);

  return (
    <header data-print-hide className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
      <div className="flex min-h-14 items-center gap-3 px-4 lg:px-6">
        <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onOpenMenu} aria-label="메뉴 열기">
          <Menu />
        </Button>
        <div className="min-w-0 flex-1 py-2">
          <h1 className="truncate text-base font-semibold tracking-tight">{nav?.label ?? "Ad Insight"}</h1>
          {nav && <p className="hidden truncate text-xs text-muted-foreground sm:block">{nav.description}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {useSample && <Badge variant="warning">샘플 데이터 포함</Badge>}
          <Badge variant="outline" className="hidden sm:inline-flex">
            업로드 {uploadedRows.toLocaleString("ko-KR")}행
          </Badge>
        </div>
      </div>
      {nav && nav.filters !== "none" && (
        <div className="border-t px-4 py-2.5 lg:px-6">
          <FilterBar showDateRange={nav.filters === "all"} />
        </div>
      )}
    </header>
  );
}
