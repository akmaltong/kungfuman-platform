/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export const metadata = {
  title: "Направления · Академия Kungfuman",
  description:
    "Внутренние искусства (Тайцзицюань, Нэйгун, Цигун), традиционные системы (Вин Чун, Джиткундо) и восточная терапия Чжэнь Цзю.",
};

type Item = { name: string; desc: string };

function List({ items }: { items: Item[] }) {
  return (
    <ul className="mt-5 space-y-0">
      {items.map((it) => (
        <li key={it.name} className="border-b border-ink-muted py-4">
          <b className="font-serif text-[20px] text-gold">{it.name}</b>
          <p className="mt-1 text-[16px] leading-[1.55] text-paper-muted">
            {it.desc}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function DirectionsPage() {
  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20">
      <header className="pt-10">
        <p className="mb-3 text-[15px] text-gold">Академия Kungfuman</p>
        <h1 className="font-serif text-[40px] font-bold leading-[1.05] text-paper sm:text-[48px]">
          Направления
        </h1>
        <p className="mt-4 max-w-[36em] font-serif text-[19px] leading-[1.55] text-paper-muted">
          Внутренние искусства, традиционные системы движения и восточная
          терапия. Язык практики — структура тела, дыхание, движение и
          внимание.
        </p>
      </header>

      <section className="border-t border-ink-muted py-9">
        <img
          src="/site/sila-1.jpg"
          alt="Внутренние искусства"
          className="mb-6 aspect-[16/9] w-full border border-gold-dim object-cover"
        />
        <h2 className="font-serif text-[26px] font-bold text-gold">
          Внутренние искусства
        </h2>
        <p className="mt-3 text-[16px] leading-[1.6] text-paper">
          Работа со структурой тела, дыханием и расслаблением. Сила без
          лишнего напряжения, устойчивость и внимание к себе.
        </p>
        <List
          items={[
            {
              name: "Тайцзицюань",
              desc: "Гармония тела и разума: медленное точное движение, центр тяжести, координация и спокойная сила.",
            },
            {
              name: "Нэйгун",
              desc: "Древняя даосская внутренняя практика: структура, дыхание, управление напряжением и вниманием.",
            },
            {
              name: "Цигун",
              desc: "Дыхательно-двигательная работа: мягкие формы, дыхание и ощущение тела; в том числе оздоровительный цигун.",
            },
          ]}
        />
      </section>

      <section className="border-t border-ink-muted py-9">
        <img
          src="/site/edinoborstva-1.jpg"
          alt="Традиционные системы"
          className="mb-6 aspect-[16/9] w-full border border-gold-dim object-cover"
        />
        <h2 className="font-serif text-[26px] font-bold text-gold">
          Традиционные системы движения
        </h2>
        <p className="mt-3 text-[16px] leading-[1.6] text-paper">
          Традиционные школы как культурное наследие — методология, техника и
          дисциплина. Без спортивных соревнований и разрядов.
        </p>
        <List
          items={[
            {
              name: "Вин Чун",
              desc: "Ближний бой и концентрация: чувствительность рук, линия, экономичное движение (традиция линии Ип Мана).",
            },
            {
              name: "Джиткундо",
              desc: "Система Брюса Ли: прямота, адаптивность, работа без лишних форм.",
            },
          ]}
        />
      </section>

      <section className="border-t border-ink-muted py-9">
        <img
          src="/site/terapiya-1.jpg"
          alt="Восточная терапия"
          className="mb-6 aspect-[16/9] w-full border border-gold-dim object-cover"
        />
        <h2 className="font-serif text-[26px] font-bold text-gold">
          Восточная терапия · Чжэнь Цзю
        </h2>
        <p className="mt-3 text-[16px] leading-[1.6] text-paper">
          Традиционная китайская иглотерапия и акупрессура. Работа с общим
          самочувствием, напряжением и восстановлением после нагрузок. Начинаем
          с диагностики и разговора о состоянии.
        </p>
        <p className="mt-4 rounded-sm border-l-[3px] border-gold-dim bg-ink-lacquer px-4 py-3 text-[14px] leading-[1.5] text-paper-muted">
          Это оздоровительные практики и не заменяют медицинскую помощь. Мы не
          ставим диагнозов в медицинском смысле и не обещаем лечения — при
          заболеваниях обращайтесь к врачу.
        </p>
      </section>

      <div className="border-t border-ink-muted pt-10">
        <Link
          href="/trial"
          className="inline-block rounded-sm bg-gold px-6 py-4 font-bold text-ink hover:bg-gold-soft"
        >
          Записаться на пробное
        </Link>
        <p className="mt-4 text-[15px] text-paper-muted">
          Форматы и цены —{" "}
          <Link href="/prices" className="text-gold hover:underline">
            на странице «Форматы»
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
