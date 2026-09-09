import { t } from "@/lib/i18n";

// Временный публичный лендинг. Наполнение — этап 2 (публичная страница программы).
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
      <p className="mt-10 text-sm text-neutral-500">
        Платформа в разработке. Этап 1 — ядро.
      </p>
    </main>
  );
}
