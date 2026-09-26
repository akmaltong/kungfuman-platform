import Link from "next/link";

// Минимальная шапка публичной части в стиле сайта: бренд ведёт на главную,
// компактная навигация. Узкая колонка, тёплое золото на чёрном.
const NAV = [
  { href: "/master", label: "Мастер" },
  { href: "/directions", label: "Направления" },
  { href: "/prices", label: "Форматы" },
  { href: "/courses", label: "Курсы" },
  { href: "/blog", label: "Блог" },
  { href: "/association", label: "Ассоциация" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-ink-muted">
        <div className="mx-auto flex max-w-[640px] flex-wrap items-center gap-x-5 gap-y-2 px-6 py-4">
          <Link
            href="/"
            className="font-serif text-lg font-bold text-gold"
          >
            Академия Kungfuman
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-paper-muted hover:text-gold"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/login"
            className="ml-auto text-sm text-paper-muted hover:text-gold"
          >
            Вход
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
