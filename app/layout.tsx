import type { Metadata, Viewport } from "next";
import "./globals.css";

import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "Академия Kungfuman",
  description:
    "Платформа школы кунг-фу и цигун: офлайн-занятия, методика и онлайн-курсы.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kungfuman", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
