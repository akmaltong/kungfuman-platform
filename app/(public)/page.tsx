import Link from "next/link";

import { t } from "@/lib/i18n";

// Публичный лендинг школы Худжанд.
export default function HomePage() {
  const title = t({ ru: "Академия Kungfuman" });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 text-sm uppercase tracking-[0.3em] text-gold">
        Худжанд
      </span>
      <h1 className="text-4xl font-semibold text-gold sm:text-6xl">{title}</h1>
      <p className="mt-6 max-w-xl text-lg text-neutral-300">
        Кунг-фу и цигун: живые занятия, семиуровневая методика и онлайн-курсы.
        Один прогресс — офлайн и онлайн.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/trial"
          className="rounded-md bg-gold px-5 py-2.5 font-medium text-ink hover:bg-gold-soft"
        >
          Записаться на пробное
        </Link>
        <Link
          href="/program"
          className="rounded-md border border-ink-muted px-5 py-2.5 text-neutral-200 hover:border-gold/50"
        >
          Программа
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-ink-muted px-5 py-2.5 text-neutral-200 hover:border-gold/50"
        >
          Вход
        </Link>
      </div>
    </main>
  );
}
