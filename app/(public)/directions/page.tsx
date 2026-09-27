/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { getContent } from "@/lib/queries/site-content";
import { toPairs } from "@/lib/content/schema";

// Тексты редактируются в кабинете (раздел «Сайт» → «Направления»).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Направления · Академия Kungfuman",
  description:
    "Внутренние искусства (Тайцзицюань, Нэйгун, Цигун), традиционные системы (Вин Чун, Джиткундо) и восточная терапия Чжэнь Цзю.",
};

function List({ items }: { items: [string, string][] }) {
  return (
    <ul className="mt-5 space-y-0">
      {items.map(([name, desc]) => (
        <li key={name} className="border-b border-ink-muted py-4">
          <b className="font-serif text-[20px] text-gold">{name}</b>
          <p className="mt-1 text-[16px] leading-[1.55] text-paper-muted">
            {desc}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default async function DirectionsPage() {
  const c = await getContent("khujand", "directions");

  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20">
      <header className="pt-10">
        <p className="mb-3 text-[15px] text-gold">{c.eyebrow}</p>
        <h1 className="font-serif text-[40px] font-bold leading-[1.05] text-paper sm:text-[48px]">
          {c.title}
        </h1>
        <p className="mt-4 max-w-[36em] font-serif text-[19px] leading-[1.55] text-paper-muted">
          {c.subtitle}
        </p>
      </header>

      <section className="border-t border-ink-muted py-9">
        <img
          src="/site/sila-1.jpg"
          alt={c.internalTitle}
          className="mb-6 aspect-[16/9] w-full border border-gold-dim object-cover"
        />
        <h2 className="font-serif text-[26px] font-bold text-gold">
          {c.internalTitle}
        </h2>
        <p className="mt-3 text-[16px] leading-[1.6] text-paper">
          {c.internalIntro}
        </p>
        <List items={toPairs(c.internalItems)} />
      </section>

      <section className="border-t border-ink-muted py-9">
        <img
          src="/site/edinoborstva-1.jpg"
          alt={c.traditionalTitle}
          className="mb-6 aspect-[16/9] w-full border border-gold-dim object-cover"
        />
        <h2 className="font-serif text-[26px] font-bold text-gold">
          {c.traditionalTitle}
        </h2>
        <p className="mt-3 text-[16px] leading-[1.6] text-paper">
          {c.traditionalIntro}
        </p>
        <List items={toPairs(c.traditionalItems)} />
      </section>

      <section className="border-t border-ink-muted py-9">
        <img
          src="/site/terapiya-1.jpg"
          alt={c.therapyTitle}
          className="mb-6 aspect-[16/9] w-full border border-gold-dim object-cover"
        />
        <h2 className="font-serif text-[26px] font-bold text-gold">
          {c.therapyTitle}
        </h2>
        <p className="mt-3 text-[16px] leading-[1.6] text-paper">
          {c.therapyIntro}
        </p>
        {c.therapyDisclaimer && (
          <p className="mt-4 rounded-sm border-l-[3px] border-gold-dim bg-ink-lacquer px-4 py-3 text-[14px] leading-[1.5] text-paper-muted">
            {c.therapyDisclaimer}
          </p>
        )}
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
