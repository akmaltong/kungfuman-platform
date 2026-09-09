import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Академия Kungfuman",
  description:
    "Платформа школы кунг-фу и цигун: офлайн-занятия, методика и онлайн-курсы.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body>{children}</body>
    </html>
  );
}
