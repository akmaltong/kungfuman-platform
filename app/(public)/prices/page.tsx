import Link from "next/link";

import { getPublicPricing } from "@/lib/queries/pricing";
import { PageHeader } from "@/components/public/page-header";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Форматы и цены · Академия Kungfuman",
  description:
    "Мини-группа на природе, открытая группа, персональные занятия, акупунктурная терапия Чжэнь Цзю, семинары и выездной ретрит. Цены в сомони.",
};

const money = (v: number) => `${v.toLocaleString("ru-RU")} сомони`;

type Row = { label: string; value: string; hint?: string };

function Card({
  eyebrow,
  title,
  sub,
  desc,
  rows,
  note,
  disclaimer,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  desc: string;
  rows: Row[];
  note?: string;
  disclaimer?: string;
}) {
  return (
    <div className="border border-gold-dim bg-ink px-6 py-6">
      <p className="text-[12px] uppercase tracking-[0.16em] text-gold-dim">
        {eyebrow}
      </p>
      <h3 className="mt-2 font-serif text-[24px] font-bold text-paper">{title}</h3>
      <p className="mt-1 text-[14px] text-gold">{sub}</p>
      <p className="mt-3 text-[15px] leading-[1.55] text-paper-muted">{desc}</p>

      <dl className="mt-5 space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-3 border-t border-ink-muted pt-2"
          >
            <dt className="text-[15px] text-paper-muted">{r.label}</dt>
            <dd className="text-right">
              <span className="font-serif text-[19px] font-bold text-gold">
                {r.value}
              </span>
              {r.hint && (
                <span className="ml-2 text-[13px] text-paper-muted">{r.hint}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {note && (
        <p className="mt-4 border-l-2 border-gold-dim pl-3 text-[13px] leading-[1.55] text-paper-muted">
          {note}
        </p>
      )}
      {disclaimer && (
        <p className="mt-3 text-[12px] leading-[1.5] text-paper-muted">
          {disclaimer}
        </p>
      )}
    </div>
  );
}

export default async function PricesPage() {
  const products = await getPublicPricing("khujand");
  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
  // Цена в сомони из БД (редактируется в кабинете «Продукты»), иначе — запас.
  const som = (slug: string, fallback: number) => {
    const m = bySlug[slug]?.priceMinor;
    return m != null ? Math.round(m / 100) : fallback;
  };
  const perLesson = (slug: string, n: number, fallback: number) => {
    const m = bySlug[slug]?.priceMinor;
    return m != null ? Math.floor(m / n / 100) : fallback;
  };
  const THERAPY_DISCLAIMER =
    "Оздоровительная практика. Не заменяет медицинскую помощь — при заболеваниях обращайтесь к врачу.";

  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20">
      <PageHeader
        title="Форматы и цены"
        subtitle="От доступной открытой группы до персональных занятий, терапии, семинаров и выездного ретрита. Живая передача практики от мастера."
      />

      <div className="mt-10 grid gap-5">
        <Card
          eyebrow="Утренняя практика · мини-группа · 4 человека · на природе"
          title="Мини-группа"
          sub="90 минут · Тайцзицюань / Цигун / Вин Чун"
          desc="Живая передача практики от мастера. Не поток, не секция — 4 человека, личное внимание, открытый воздух. То, чего нет ни в одном зале Худжанда."
          rows={[
            { label: "Разовое занятие", value: money(som("mini-group-single", 200)) },
            { label: "Абонемент · 8 занятий / мес", value: money(som("mini-group-month", 1200)) },
            { label: "За занятие в абонементе", value: money(perLesson("mini-group-month", 8, 150)) },
          ]}
          note="Абонемент в лучший зал Худжанда — 600 сомони за 8 занятий по 60 минут на тренажёрах. Здесь — 1 200 сомони за 8 занятий по 90 минут с мастером на природе, 4 человека. Это не дороже. Это другой продукт."
        />

        <Card
          eyebrow="Открытая группа · 10+ человек"
          title="Групповая практика"
          sub="60 минут · 2 раза в неделю · 8 занятий в месяц"
          desc="Тайцзицюань, Цигун или Нэйгун — в большой группе. Доступный формат для тех, кто хочет начать практику. Регулярное расписание, живая работа с мастером."
          rows={[
            { label: "Разовое занятие", value: money(som("open-group-single", 150)) },
            { label: "Абонемент · 8 занятий / мес", value: money(som("open-group-month", 500)) },
            { label: "За занятие в абонементе", value: money(perLesson("open-group-month", 8, 62)) },
          ]}
          note="Самый доступный способ начать практику с мастером. 500 сомони в месяц — это меньше стоимости одного похода к врачу. 8 занятий, живая передача, проверенные методы."
        />

        <Card
          eyebrow="Персональные занятия · один на один · 90 минут"
          title="Персональный класс"
          sub="Тайцзицюань · Вин Чун · Цигун · Нэйгун"
          desc="Индивидуальная программа под вашу цель и состояние. Рекомендации для самостоятельной практики между встречами. Поддержка в мессенджере."
          rows={[
            { label: "Разовое занятие", value: money(som("personal-single", 500)) },
            { label: "В абонементе · от 5 занятий", value: money(perLesson("personal-5", 5, 400)) },
          ]}
        />

        <Card
          eyebrow="Акупунктурная терапия · Чжэнь Цзю · лучший способ начать"
          title="3 сеанса терапии"
          sub="+ диагностика в подарок · 60 минут каждый"
          desc="Сначала — диагностика: определяем состояние тела и энергетических каналов, составляем протокол. Затем — 3 сеанса иглотерапии точно по результатам диагностики. Диагностика в подарок — вы экономите 300 сомони."
          rows={[
            { label: "Диагностика", value: money(som("therapy-diagnostic", 300)), hint: "в подарок" },
            { label: "3 сеанса", value: money(som("therapy-course", 900)) },
            { label: "Итого вы платите", value: money(som("therapy-course", 900)) },
          ]}
          note="Правильный сеанс иглотерапии начинается с диагностики — иначе это работа вслепую. Поэтому при оплате 3 сеансов диагностика включается бесплатно."
          disclaimer={THERAPY_DISCLAIMER}
        />

        <Card
          eyebrow="Акупунктурная терапия · разовый формат"
          title="Сеанс терапии"
          sub="60 минут · Иглотерапия Чжэнь Цзю"
          desc="Традиционная китайская иглотерапия. Работа с напряжением, качеством сна, восстановлением после нагрузок и общим самочувствием."
          rows={[{ label: "Разовый сеанс", value: money(som("therapy-single", 400)) }]}
          disclaimer={THERAPY_DISCLAIMER}
        />

        <Card
          eyebrow="Мастер-классы · семинары · разовый формат"
          title="Мастер-класс"
          sub="90 минут · с участника"
          desc="Погружение в одно направление: Тайцзицюань, Вин Чун или Нэйгун. Теория и живая практика. Подходит для первого знакомства."
          rows={[{ label: "Стоимость", value: money(som("masterclass", 150)) }]}
        />

        <Card
          eyebrow="Полный день"
          title="Семинар"
          sub="6 часов · с участника"
          desc="Глубокая работа с одной темой. Теория, практика, разбор. Для тех, кто хочет системное понимание. Анонс в Telegram за 2 недели."
          rows={[{ label: "Стоимость", value: money(som("seminar", 1000)) }]}
        />

        <Card
          eyebrow="Выездной ретрит · 3 дня · на природе · всё включено"
          title="Ретрит"
          sub="6 часов практики в день · 18 часов итого"
          desc="Интенсивное погружение вдали от города. Тайцзицюань, Цигун, Нэйгун, акупунктурная терапия. Питание и проживание включены. Полная перезагрузка."
          rows={[
            { label: "За час практики", value: `${money(350)} / ч` },
            { label: "Полный ретрит · 18 ч", value: money(som("retreat", 4000)) },
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
