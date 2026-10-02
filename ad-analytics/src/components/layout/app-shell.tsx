"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useDataStore } from "@/store/data-store";
import { useSettingsStore } from "@/store/settings-store";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

/** 공통 Layout: 좌측 Sidebar + 상단 Header(공통 필터) + 본문. 저장소 초기 로딩도 담당 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const loadData = useDataStore((s) => s.load);
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    void loadSettings();
    void loadData();
  }, [loadData, loadSettings]);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="min-h-screen">
      <aside data-print-hide className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r bg-card lg:block">
        <Sidebar />
      </aside>
      {menuOpen && (
        <div data-print-hide className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r bg-card shadow-xl">
            <button className="absolute right-3 top-4 text-muted-foreground" onClick={() => setMenuOpen(false)} aria-label="메뉴 닫기">
              <X className="size-4" />
            </button>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}
      <div className="lg:pl-60" data-print-full>
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-[1440px] px-4 py-5 lg:px-6 lg:py-6" data-print-full>
          <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
