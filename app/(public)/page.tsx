import Link from "next/link";

// Публичный лендинг школы. Дизайн-язык перенесён с сайта мастера:
// узкая колонка, красная печать, serif-заголовки, тёплое золото на чёрном.
export default function HomePage() {
  return (
    <main className="mx-auto max-w-[640px] px-6">
      <header className="relative pb-10 pt-11">
        <div
          aria-hidden
          style={{ transform: "rotate(-4deg)" }}
          className="mb-7 grid h-[84px] w-[84px] place-items-center rounded-md bg-seal font-serif text-[46px] leading-none text-[#f6e9dc] shadow-[inset_0_0_0_5px_rgba(246,233,220,0.33)]"
        >
          功
        </div>
        <p className="mb-2.5 text-[15px] text-gold">
          Академия Kungfuman · Худжанд
        </p>
        <h1 className="mb-4 font-serif text-[40px] font-bold leading-[1.08] text-paper sm:text-[52px]">
          Акмал Тонг
        </h1>
        <p className="max-w-[34em] font-serif text-[19px] leading-[1.6] text-paper-muted">
          Боевые искусства, внутренние практики и восточная терапия. 28 лет
          практики, 20 лет преподавания.
        </p>
      </header>

      <section className="border-t border-ink-muted py-9">
        <Link
          href="/trial"
          className="inline-block rounded-sm bg-gold px-6 py-4 font-bold text-ink hover:bg-gold-soft"
        >
          Записаться на пробное
        </Link>
      </section>

      <nav className="grid gap-3.5 border-t border-ink-muted py-9 pb-14">
        <NavCard
          href="/master"
          title="О мастере"
          desc="Акмал Тонг · 28 лет практики, призёр Чемпионата Европы"
        />
        <NavCard
          href="/program"
          title="Программа"
          desc="Семиуровневая методика: дисциплина → уровень → практика"
        />
        <NavCard
          href="/free"
          title="Бесплатные уроки"
          desc="Открытые превью-уроки из курсов академии"
        />
        <NavCard
          href="/courses"
          title="Онлайн-курсы"
          desc="Видеокурсы: смотри и отслеживай прогресс"
        />
        <NavCard
          href="/blog"
          title="Блог"
          desc="Статьи и заметки школы"
        />
        <NavCard
          href="/login"
          title="Вход"
          desc="Личный кабинет ученика и персонала"
        />
      </nav>
    </main>
  );
}

function NavCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block border border-gold-dim bg-ink px-5 py-[18px] transition-colors hover:border-gold hover:bg-ink-lacquer"
    >
      <b className="mb-1 block font-serif text-[21px] text-gold">{title}</b>
      <span className="block text-[15px] text-paper-muted">{desc}</span>
    </Link>
  );
}
