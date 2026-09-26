/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

// «О мастере» — перенос страницы master из сайта в дизайн-систему школы.
export const metadata = {
  title: "О мастере · Академия Kungfuman",
  description:
    "Акмал Тонг — мастер Тайцзицюань, Вин Чун, Цигун, Нэйгун. 28 лет практики, призёр Чемпионата Европы, 4 дуань.",
};

const FACTS = [
  "Чёрный пояс · 4 дуань по традиционному ушу (кунг-фу чуантун)",
  "Призёр Чемпионата Европы по тайцзицюань, цигун и внутренним искусствам · 2019",
  "28 лет практики · 20 лет преподавания",
  "Работа с детьми, подростками и детьми с РАС",
];

const DIRECTIONS = [
  ["Тайцзицюань", "гармония тела и разума"],
  ["Вин Чун", "ближний бой и концентрация"],
  ["Цигун", "мастерство владения энергией"],
  ["Нэйгун", "древняя даосская внутренняя практика"],
  ["Джиткундо", "система Брюса Ли"],
  ["Чжэнь Цзю", "акупунктурная диагностика и терапия"],
];

const SEMINARS = [
  ["Силы Тайцзи в практике телесных терапевтов", "Москва · 2025"],
  ["Основы структуры тела", "Москва · 2023"],
  ["Уроки Нэйгун на фестивале", "2023"],
  ["Цигун для перцептологов", "Валдай · 2022"],
  ["Нэйгун в Ярославле", ""],
  ["Мастер-класс по Нэйгун", "Москва · 2018"],
  ["Нэйгун в Colgate — корпоративный выезд", "Москва · 2017"],
];

const MEDIA = [
  ["Журнал «Серебряный Город»", "статья и интервью о цигун и мастерстве"],
  ["РенТВ · «Невероятно интересные истории»", "интервью"],
  ["Элджей & Don Diablo — «UFO»", "постановка боевых сцен"],
  ["Pixonic — «Продолжай мечтать»", "постановка боевых сцен"],
  ["L'One — «Сон»", "хореография боевых сцен"],
];

// Сертификаты, грамоты и медали (фото из архива).
const CERTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => `/site/master-${n}.jpg`);

export default function MasterPage() {
  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20">
      {/* Hero */}
      <header className="pt-10">
        <p className="mb-4 text-[15px] text-gold">Академия Kungfuman · Худжанд</p>
        <img
          src="/site/master-1.jpg"
          alt="Акмал Тонг"
          className="mb-7 w-full border border-gold-dim object-cover"
        />
        <h1 className="font-serif text-[40px] font-bold leading-[1.05] text-paper sm:text-[52px]">
          Акмал Тонг
        </h1>
        <p className="mt-4 font-serif text-[19px] leading-[1.5] text-paper-muted">
          Мастер Тайцзицюань, Вин Чун, Цигун, Нэйгун. Специалист по
          акупунктурной терапии Чжэнь Цзю.
        </p>
        <p className="mt-3 text-[15px] text-gold-dim">
          Призёр Чемпионата Европы · 4 дуань · 28 лет практики · Москва → Худжанд
        </p>
      </header>

      {/* Quote */}
      <blockquote className="my-9 border-l-[3px] border-seal bg-ink-lacquer px-6 py-6 font-serif text-[20px] italic leading-[1.6] text-paper">
        «Тело не лжёт. Оно говорит правду — надо только уметь слушать.»
      </blockquote>

      <Section title="О мастере">
        <p>
          Практикую и преподаю восточные боевые и оздоровительные искусства 28
          лет. Работал в Москве — персональные занятия, семинары для телесных
          терапевтов и специалистов, сеансы акупунктурной диагностики.
        </p>
        <p className="mt-4">
          Теперь вернулся в Худжанд — и привёз всё то, что передавал ученикам в
          Москве. Тот же подход, та же глубина, те же методы.
        </p>
        <ul className="mt-6 space-y-0">
          {FACTS.map((f) => (
            <li
              key={f}
              className="border-b border-ink-muted py-2.5 text-paper"
            >
              {f}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Направления">
        <ul className="space-y-0">
          {DIRECTIONS.map(([name, desc]) => (
            <li
              key={name}
              className="flex flex-wrap items-baseline gap-x-3 border-b border-ink-muted py-3"
            >
              <b className="font-serif text-[19px] text-gold">{name}</b>
              <span className="text-[15px] text-paper-muted">{desc}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Семинары и мастер-классы">
        <ul className="space-y-0">
          {SEMINARS.map(([title, place]) => (
            <li
              key={title}
              className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-ink-muted py-3"
            >
              <span className="text-paper">{title}</span>
              {place && (
                <span className="text-[14px] text-paper-muted">{place}</span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="В медиа и кино">
        <ul className="space-y-0">
          {MEDIA.map(([title, desc]) => (
            <li key={title} className="border-b border-ink-muted py-3">
              <b className="font-serif text-[17px] text-paper">{title}</b>
              <span className="mt-0.5 block text-[14px] text-paper-muted">
                {desc}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Сертификаты, грамоты и медали">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CERTS.map((src) => (
            <img
              key={src}
              src={src}
              alt="Сертификат / грамота"
              loading="lazy"
              className="aspect-[3/4] w-full border border-gold-dim bg-ink-lacquer object-cover"
            />
          ))}
        </div>
        <p className="mt-4 text-[14px] text-paper-muted">
          Федерация УШУ РТ · TCFE Chinese Internal Martial Arts Championship
          (Санкт-Петербург, 2016) · международные семинары.
        </p>
      </Section>

      {/* CTA */}
      <div className="mt-12 border-t border-ink-muted pt-10">
        <Link
          href="/trial"
          className="inline-block rounded-sm bg-gold px-6 py-4 font-bold text-ink hover:bg-gold-soft"
        >
          Записаться на пробное
        </Link>
        <p className="mt-5 text-[14px] text-paper-muted">
          Telegram-канал:{" "}
          <a
            href="https://t.me/Kungfu_man"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            @Kungfu_man
          </a>
        </p>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink-muted py-9">
      <h2 className="mb-5 font-serif text-[26px] font-bold text-gold">
        {title}
      </h2>
      <div className="text-[17px] leading-[1.6] text-paper">{children}</div>
    </section>
  );
}
