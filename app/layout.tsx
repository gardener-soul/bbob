import type { Metadata, Viewport } from "next";
import { Black_Han_Sans, Gothic_A1 } from "next/font/google";
import "./globals.css";

// 한글 폰트는 unicode-range 조각으로 받으므로 preload 하지 않는다
const display = Black_Han_Sans({
  weight: "400",
  preload: false,
  display: "swap",
  variable: "--font-black-han-sans",
});

const body = Gothic_A1({
  weight: ["400", "600", "800"],
  preload: false,
  display: "swap",
  variable: "--font-gothic-a1",
});

export const metadata: Metadata = {
  title: "새벽이슬 말씀 캡슐",
  description: "수원제일교회 새벽이슬청년부 말씀 캡슐 뽑기",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#e9f2ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
