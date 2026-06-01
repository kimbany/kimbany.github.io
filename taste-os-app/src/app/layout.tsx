import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { AmbientField } from "@/components/ambient/AmbientField";
import { AtmosphereProvider } from "@/components/providers/AtmosphereProvider";

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
  title: "Taste OS — 마음이 머무는 공기",
  description: "사람은 자신이 사랑하는 공기의 결을 닮아갑니다.",
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
        <AtmosphereProvider>
          <AmbientField />
          <div className="relative z-[5]">{children}</div>
        </AtmosphereProvider>
      </body>
    </html>
  );
}
