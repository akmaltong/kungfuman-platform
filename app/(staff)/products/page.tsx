import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { formatMoney } from "@/lib/domain/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addPrice,
  createProduct,
  deletePrice,
  deleteProduct,
} from "./actions";

export const dynamic = "force-dynamic";

interface ProductRow {
  id: string;
  kind: string;
  slug: string;
  title: Localized;
  sessions_included: number | null;
  duration_days: number | null;
  is_active: boolean;
}
interface PriceRow {
  id: string;
  product_id: string;
  currency: string;
  amount_minor: number;
  region: string | null;
}

const KIND_LABEL: Record<string, string> = {
  subscription: "абонемент",
  single_visit: "разовое",
  course: "курс",
  workshop: "воркшоп",
  retreat: "ретрит",
};

export default async function ProductsPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const [{ data: products }, { data: prices }] = await Promise.all([
    supabase
      .from("products")
      .select("id, kind, slug, title, sessions_included, duration_days, is_active"),
    supabase
      .from("product_prices")
      .select("id, product_id, currency, amount_minor, region"),
  ]);

  const priceList = (prices ?? []) as PriceRow[];
  const pricesByProduct = new Map<string, PriceRow[]>();
  for (const p of priceList) {
    const arr = pricesByProduct.get(p.product_id);
    if (arr) arr.push(p);
    else pricesByProduct.set(p.product_id, [p]);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Продукты и цены</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Разовое посещение, абонемент (8/12 занятий), безлимит. Цена — отдельно по
        валюте и региону.
      </p>

      {/* Создать продукт */}
      <form
        action={createProduct}
        className="mt-6 grid gap-2 rounded-lg border border-ink-muted bg-ink-soft p-4 sm:grid-cols-2"
      >
        <select
          name="kind"
          className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
        >
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <Input name="slug" placeholder="slug (abonement-8)" required />
        <Input name="title_ru" placeholder="Название (Абонемент 8 занятий)" required />
        <div className="flex items-center gap-2">
          <Input
            name="sessions_included"
            type="number"
            min={1}
            placeholder="занятий (пусто = безлимит)"
            className="flex-1"
          />
          <Input
            name="duration_days"
            type="number"
            min={1}
            placeholder="дней"
            className="w-24"
          />
        </div>
        <Button type="submit">+ Продукт</Button>
      </form>

      <div className="mt-8 space-y-4">
        {((products ?? []) as ProductRow[]).length === 0 && (
          <p className="text-neutral-500">Пока нет продуктов.</p>
        )}
        {((products ?? []) as ProductRow[]).map((product) => (
          <section
            key={product.id}
            className="rounded-lg border border-ink-muted bg-ink-soft p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg text-neutral-100">{t(product.title)}</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {KIND_LABEL[product.kind] ?? product.kind}
                  {product.sessions_included
                    ? ` · ${product.sessions_included} занятий`
                    : " · безлимит"}
                  {product.duration_days && ` · ${product.duration_days} дней`}
                  {` · ${product.slug}`}
                </p>
              </div>
              <form action={deleteProduct}>
                <input type="hidden" name="id" value={product.id} />
                <Button type="submit" variant="danger">
                  Удалить
                </Button>
              </form>
            </div>

            {/* Цены */}
            <ul className="mt-3 flex flex-wrap gap-2">
              {(pricesByProduct.get(product.id) ?? []).map((price) => (
                <li
                  key={price.id}
                  className="flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-sm text-neutral-300"
                >
                  {formatMoney(price.amount_minor, price.currency)}
                  {price.region && (
                    <span className="text-neutral-500">· {price.region}</span>
                  )}
                  <form action={deletePrice}>
                    <input type="hidden" name="id" value={price.id} />
                    <button
                      type="submit"
                      className="text-red-400/70 hover:text-red-300"
                      aria-label="Удалить цену"
                    >
                      ✕
                    </button>
                  </form>
                </li>
              ))}
            </ul>

            <form
              action={addPrice}
              className="mt-3 flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="product_id" value={product.id} />
              <Input name="amount" type="number" min={0} step="0.01" placeholder="сумма" className="w-28" required />
              <Input name="currency" placeholder="TJS" maxLength={3} className="w-20" defaultValue="TJS" />
              <Input name="region" placeholder="регион (TJ)" className="w-28" />
              <Button type="submit" variant="ghost">
                + Цена
              </Button>
            </form>
          </section>
        ))}
      </div>
    </main>
  );
}
