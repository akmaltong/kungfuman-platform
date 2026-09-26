import type { Metadata, Viewport } from "next";
import { PT_Sans, PT_Serif } from "next/font/google";
import "./globals.css";

import { PwaRegister } from "@/components/pwa-register";

const ptSans = PT_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-sans",
  display: "swap",
});

const ptSerif = PT_Serif({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Академия Kungfuman",
  description:
    "Платформа школы кунг-фу и цигун: офлайн-занятия, методика и онлайн-курсы.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kungfuman", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`dark ${ptSans.variable} ${ptSerif.variable}`}
    >
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
