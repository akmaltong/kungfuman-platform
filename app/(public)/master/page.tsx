/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { getContent } from "@/lib/queries/site-content";
import { toLines, toPairs } from "@/lib/content/schema";

// «О мастере» — тексты редактируются в кабинете (раздел «Сайт»), хранятся в
// schools.settings.content.master. Дефолты — в lib/content/schema.ts.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "О мастере · Академия Kungfuman",
  description:
    "Акмал Тонг — мастер Тайцзицюань, Вин Чун, Цигун, Нэйгун. 28 лет практики, призёр Чемпионата Европы, 4 дуань.",
};

// Сертификаты, грамоты и медали (фото из архива).
const CERTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => `/site/master-${n}.jpg`);

export default async function MasterPage() {
  const c = await getContent("khujand", "master");
  const about = c.about.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const facts = toLines(c.facts);
  const directions = toPairs(c.directions);
  const seminars = toPairs(c.seminars);
  const media = toPairs(c.media);
  const tg = c.telegram.replace(/^@/, "").trim();

  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20">
      {/* Hero */}
      <header className="pt-10">
        <p className="mb-4 text-[15px] text-gold">{c.eyebrow}</p>
        <img
          src="/site/master-1.jpg"
          alt={c.name}
          className="mb-7 w-full border border-gold-dim object-cover"
        />
        <h1 className="font-serif text-[40px] font-bold leading-[1.05] text-paper sm:text-[52px]">
          {c.name}
        </h1>
        <p className="mt-4 font-serif text-[19px] leading-[1.5] text-paper-muted">
          {c.tagline}
        </p>
        <p className="mt-3 text-[15px] text-gold-dim">{c.credits}</p>
      </header>

      {/* Quote */}
      {c.quote && (
        <blockquote className="my-9 border-l-[3px] border-seal bg-ink-lacquer px-6 py-6 font-serif text-[20px] italic leading-[1.6] text-paper">
          {c.quote}
        </blockquote>
      )}

      <Section title="О мастере">
        {about.map((p, i) => (
          <p key={i} className={i > 0 ? "mt-4" : undefined}>
            {p}
          </p>
        ))}
        {facts.length > 0 && (
          <ul className="mt-6 space-y-0">
            {facts.map((f) => (
              <li key={f} className="border-b border-ink-muted py-2.5 text-paper">
                {f}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {directions.length > 0 && (
        <Section title="Направления">
          <ul className="space-y-0">
            {directions.map(([name, desc]) => (
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
      )}

      {seminars.length > 0 && (
        <Section title="Семинары и мастер-классы">
          <ul className="space-y-0">
            {seminars.map(([title, place]) => (
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
      )}

      {media.length > 0 && (
        <Section title="В медиа и кино">
          <ul className="space-y-0">
            {media.map(([title, desc]) => (
              <li key={title} className="border-b border-ink-muted py-3">
                <b className="font-serif text-[17px] text-paper">{title}</b>
                <span className="mt-0.5 block text-[14px] text-paper-muted">
                  {desc}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

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
        {c.certsNote && (
          <p className="mt-4 text-[14px] text-paper-muted">{c.certsNote}</p>
        )}
      </Section>

      {/* CTA */}
      <div className="mt-12 border-t border-ink-muted pt-10">
        <Link
          href="/trial"
          className="inline-block rounded-sm bg-gold px-6 py-4 font-bold text-ink hover:bg-gold-soft"
        >
          Записаться на пробное
        </Link>
        {tg && (
          <p className="mt-5 text-[14px] text-paper-muted">
            Telegram-канал:{" "}
            <a
              href={`https://t.me/${tg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              @{tg}
            </a>
          </p>
        )}
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
