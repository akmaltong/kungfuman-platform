import Link from "next/link";

import { signOut } from "@/lib/actions/auth";

const NAV = [
  { href: "/overview", label: "Дашборд" },
  { href: "/students", label: "Ученики" },
  { href: "/groups", label: "Группы" },
  { href: "/sessions", label: "Занятия" },
  { href: "/curriculum", label: "Методика" },
  { href: "/venues", label: "Площадки" },
  { href: "/products", label: "Продукты" },
  { href: "/payments", label: "Платежи" },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <header className="border-b border-ink-muted bg-ink-soft">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
          <Link href="/overview" className="font-semibold text-gold">
            Kungfuman
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
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
