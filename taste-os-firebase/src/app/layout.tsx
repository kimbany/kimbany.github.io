import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { AmbientField } from "@/components/ambient/AmbientField";
import { AtmosphereProvider } from "@/components/providers/AtmosphereProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { FrictionProbe } from "@/components/testing/FrictionProbe";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const serifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-serif-kr",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Taste OS — 마음이 머무는 공기",
  description: "사람은 자신이 사랑하는 공기의 결을 닮아갑니다.",
  openGraph: {
    title: "Taste OS — 마음이 머무는 공기",
    description: "조용히 들어와, 당신만의 분위기를 만나는 곳.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Taste OS",
    description: "조용한 감정의 대기. 천천히 빠져드는 곳.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E0C0B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${display.variable} ${serifKr.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <AtmosphereProvider>
            <AmbientField />
            <div className="relative z-[5]">{children}</div>
            <FrictionProbe />
          </AtmosphereProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
