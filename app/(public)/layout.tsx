import Link from "next/link";

// Общая шапка публичных страниц: бренд ведёт на главную + навигация,
// чтобы с любой страницы (программа, курсы, блог…) можно было вернуться.
const NAV = [
  { href: "/program", label: "Программа" },
  { href: "/courses", label: "Онлайн-курсы" },
  { href: "/free", label: "Бесплатные уроки" },
  { href: "/blog", label: "Блог" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-ink-muted bg-ink-soft">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <Link href="/" className="font-semibold text-gold">
            Kungfuman
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
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
          <Link
            href="/login"
            className="ml-auto text-sm text-neutral-400 hover:text-gold"
          >
            Вход
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
