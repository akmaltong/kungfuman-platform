import Link from "next/link";

import { signOut } from "@/lib/actions/auth";

const NAV = [
  { href: "/dashboard", label: "Кабинет" },
  { href: "/schedule", label: "Расписание" },
  { href: "/progress", label: "Прогресс" },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <header className="border-b border-ink-muted bg-ink-soft">
        <div className="mx-auto flex max-w-3xl items-center gap-x-5 px-6 py-3">
          <Link href="/dashboard" className="font-semibold text-gold">
            Kungfuman
          </Link>
          <nav className="flex gap-x-5 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-neutral-400 hover:text-gold"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <form action={signOut} className="ml-auto">
            <button
              type="submit"
              className="text-sm text-neutral-500 hover:text-neutral-300"
            >
              Выйти
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
