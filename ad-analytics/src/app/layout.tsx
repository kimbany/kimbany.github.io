import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ad Insight — 광고 통합 분석",
  description: "Meta · 네이버 쇼핑검색 · 파워링크 광고 데이터를 통합 분석하는 내부용 광고 운영 의사결정 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
