import Link from "next/link";

import { getPublicPricing, type PricedProduct } from "@/lib/queries/pricing";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/public/page-header";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Форматы и цены · Академия Kungfuman",
  description:
    "Групповые и персональные занятия, мини-группа на природе, семинары, ретрит, восточная терапия. Цены в сомони.",
};

const KIND_LABEL: Record<string, string> = {
  subscription: "Абонемент",
  single_visit: "Разовое",
  course: "Курс",
  workshop: "Семинар / курс",
  retreat: "Ретрит",
};

// Цена в минорных единицах → «500 сом.» (для TJS) или «500 TJS».
function money(minor: number, currency: string): string {
  const major = (minor / 100).toLocaleString("ru-RU", {
    maximumFractionDigits: 2,
  });
  return `${major} ${currency === "TJS" ? "сом." : currency}`;
}

// Русское склонение: 1 занятие · 2 занятия · 5 занятий.
function lessons(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word = "занятий";
  if (mod10 === 1 && mod100 !== 11) word = "занятие";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    word = "занятия";
  return `${n} ${word}`;
}

function Card({
  product,
  main,
  locale,
}: {
  product: PricedProduct;
  main?: boolean;
  locale: "ru" | "tg" | "en";
}) {
  const desc = t(product.description, locale);
  return (
    <div
      className={`relative border px-6 py-6 ${
        main ? "border-2 border-gold bg-ink-lacquer" : "border-gold-dim bg-ink"
      }`}
    >
      {main && (
        <span className="absolute -top-3 left-5 bg-gold px-2.5 py-1 text-[13px] font-bold text-ink">
          Доступный старт
        </span>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-[23px] font-bold text-paper">
            {t(product.title, locale)}
          </h3>
          <p className="mt-1 text-[13px] uppercase tracking-[0.14em] text-gold-dim">
            {KIND_LABEL[product.kind] ?? product.kind}
            {product.kind === "subscription" && product.sessionsIncluded
              ? ` · ${lessons(product.sessionsIncluded)}`
              : ""}
          </p>
        </div>
        {product.priceMinor != null && (
          <div className="shrink-0 text-right">
            <div className="font-serif text-[26px] font-bold text-gold">
              {money(product.priceMinor, product.currency)}
            </div>
            {product.kind === "subscription" &&
              product.perSessionMinor != null && (
                <div className="text-[13px] text-paper-muted">
                  ≈ {money(product.perSessionMinor, product.currency)} / занятие
                </div>
              )}
          </div>
        )}
      </div>
      {desc && (
        <p className="mt-3 text-[15px] leading-[1.55] text-paper-muted">{desc}</p>
      )}
    </div>
  );
}

export default async function PricesPage() {
  const [products, locale] = await Promise.all([
    getPublicPricing("khujand"),
    getLocale(),
  ]);

  // «Доступный старт» — самый дешёвый абонемент.
  const featuredId = products
    .filter((p) => p.kind === "subscription" && p.priceMinor != null)
    .sort((a, b) => (a.priceMinor ?? 0) - (b.priceMinor ?? 0))[0]?.id;

  return (
    <main className="mx-auto max-w-[680px] px-6 pb-20">
      <PageHeader
        title="Форматы и цены"
        subtitle="От доступной открытой группы до персональных занятий, семинаров и выездного ретрита. Живая передача практики от мастера."
      />

      {products.length === 0 ? (
        <p className="mt-10 text-[16px] text-paper-muted">
          Цены скоро появятся здесь.
        </p>
      ) : (
        <div className="mt-10 grid gap-5">
          {products.map((p) => (
            <Card
              key={p.id}
              product={p}
              main={p.id === featuredId}
              locale={locale}
            />
          ))}
        </div>
      )}

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
