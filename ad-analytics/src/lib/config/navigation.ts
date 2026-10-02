import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  Database,
  FileText,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  Sparkles,
  Split,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** 상단 공통 필터 표시 범위 */
  filters: "all" | "dimensions" | "none";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "광고비 · 매출 · ROAS 와 오늘 확인해야 할 핵심 이슈", icon: LayoutDashboard, filters: "all" },
  { href: "/daily", label: "Daily Analysis", description: "특정 날짜 성과를 전일 · 최근 7일 평균과 비교", icon: CalendarDays, filters: "dimensions" },
  { href: "/channels", label: "Channel Analysis", description: "Meta · Naver Shopping · Naver Powerlink 채널 비교", icon: Split, filters: "all" },
  { href: "/campaigns", label: "Campaign Analysis", description: "캠페인별 성과와 상세 추이", icon: Megaphone, filters: "all" },
  { href: "/products", label: "Product Analysis", description: "쇼핑검색광고 상품별 효율 분석", icon: Package, filters: "all" },
  { href: "/keywords", label: "Keyword Analysis", description: "파워링크 키워드 효율 · 낭비 키워드 탐지", icon: KeyRound, filters: "all" },
  { href: "/insights", label: "AI Insights", description: "문제 → 가능한 원인 → 확인사항 → 권장 액션", icon: Sparkles, filters: "all" },
  { href: "/reports", label: "Reports", description: "일간 · 주간 · 월간 보고서", icon: FileText, filters: "dimensions" },
  { href: "/data", label: "Data Management", description: "광고 보고서 업로드 · 업로드 이력 관리", icon: Database, filters: "none" },
  { href: "/settings", label: "Settings", description: "브랜드 · Alert 기준 · 비교 방식 설정", icon: Settings, filters: "none" },
];

export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
}

export const APP_NAME = "Ad Insight";
export const APP_ICON = BarChart3;
