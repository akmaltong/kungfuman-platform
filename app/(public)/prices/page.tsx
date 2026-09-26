import Link from "next/link";

export const metadata = {
  title: "Форматы и цены · Академия Kungfuman",
  description:
    "Групповые и персональные занятия, мини-группа на природе, семинары, ретрит, восточная терапия. Цены в сомони.",
};

type Row = { label: string; value: string };
function Card({
  title,
  meta,
  desc,
  rows,
  main,
}: {
  title: string;
  meta: string;
  desc?: string;
  rows: Row[];
  main?: boolean;
}) {
  return (
    <div
      className={`relative border px-6 py-6 ${
        main
          ? "border-2 border-gold bg-ink-lacquer"
          : "border-gold-dim bg-ink"
      }`}
    >
      {main && (
        <span className="absolute -top-3 left-5 bg-gold px-2.5 py-1 text-[13px] font-bold text-ink">
          Доступный старт
        </span>
      )}
      <h3 className="font-serif text-[23px] font-bold text-paper">{title}</h3>
      <p className="mt-1 text-[14px] text-paper-muted">{meta}</p>
      {desc && (
        <p className="mt-3 text-[15px] leading-[1.55] text-paper-muted">
          {desc}
        </p>
      )}
      <dl className="mt-4 space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-3 border-t border-ink-muted pt-2"
          >
            <dt className="text-[15px] text-paper-muted">{r.label}</dt>
            <dd className="font-serif text-[19px] font-bold text-gold">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function PricesPage() {
  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20">
      <header className="pt-10">
        <p className="mb-3 text-[15px] text-gold">Академия Kungfuman · Худжанд</p>
        <h1 className="font-serif text-[40px] font-bold leading-[1.05] text-paper sm:text-[48px]">
          Форматы и цены
        </h1>
        <p className="mt-4 max-w-[36em] font-serif text-[19px] leading-[1.55] text-paper-muted">
          От доступной открытой группы до персональных занятий, семинаров и
          выездного ретрита. Живая передача практики от мастера.
        </p>
      </header>

      <div className="mt-10 grid gap-5">
        <Card
          main
          title="Открытая группа"
          meta="60 минут · 2 раза в неделю · 8 занятий в месяц"
          desc="Тайцзицюань, Цигун или Нэйгун в большой группе. Самый доступный способ начать практику с мастером."
          rows={[
            { label: "Абонемент · 8 занятий / мес", value: "500 сом." },
            { label: "За занятие в абонементе", value: "62 сом." },
            { label: "Разовое занятие", value: "150 сом." },
          ]}
        />
        <Card
          title="Мини-группа на природе"
          meta="90 минут · до 4 человек · утро, открытый воздух"
          desc="Тайцзицюань / Цигун / Вин Чун. Личное внимание, малый круг — то, чего нет в обычном зале."
          rows={[
            { label: "Абонемент · 8 занятий / мес", value: "1 200 сом." },
            { label: "За занятие в абонементе", value: "150 сом." },
            { label: "Разовое занятие", value: "200 сом." },
          ]}
        />
        <Card
          title="Персональные занятия"
          meta="90 минут · один на один"
          desc="Индивидуальная программа под вашу цель и состояние. Рекомендации для самостоятельной практики между встречами."
          rows={[
            { label: "В абонементе · от 5 занятий", value: "400 сом." },
            { label: "Разовое занятие", value: "500 сом." },
          ]}
        />
        <Card
          title="Восточная терапия · Чжэнь Цзю"
          meta="60 минут · иглотерапия и акупрессура"
          desc="Работа с общим самочувствием, напряжением и восстановлением. Начинаем с диагностики состояния. Это оздоровительные практики, они не заменяют врача."
          rows={[
            { label: "Курс · диагностика + 3 сеанса", value: "900 сом." },
            { label: "Разовый сеанс", value: "400 сом." },
            { label: "Диагностика", value: "300 сом." },
          ]}
        />
        <Card
          title="Мастер-классы и семинары"
          meta="с участника"
          desc="Погружение в одно направление — от первого знакомства до системного дня практики."
          rows={[
            { label: "Мастер-класс · 90 минут", value: "150 сом." },
            { label: "Семинар · 6 часов", value: "1 000 сом." },
          ]}
        />
        <Card
          title="Выездной ретрит"
          meta="3 дня · на природе · всё включено"
          desc="Интенсивное погружение: 6 часов практики в день, 18 часов итого. Тайцзи, Цигун, Нэйгун. Питание и проживание включены."
          rows={[
            { label: "Полный ретрит · 18 ч", value: "4 000 сом." },
            { label: "За час практики", value: "350 сом./ч" },
          ]}
        />
      </div>

      <div className="mt-10 border-t border-ink-muted pt-9">
        <Link
          href="/trial"
          className="inline-block rounded-sm bg-gold px-6 py-4 font-bold text-ink hover:bg-gold-soft"
        >
          Записаться на пробное
        </Link>
        <p className="mt-4 text-[14px] text-paper-muted">
          Цены указаны в сомони (TJS) и могут уточняться. Первое знакомство —
          по записи.
        </p>
      </div>
    </main>
  );
}
