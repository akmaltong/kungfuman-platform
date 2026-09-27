import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Localized } from "@/lib/i18n";

// Публичный прайс школы: активные продукты + их цена в валюте региона.
// Читается service-role клиентом (как каталог программы), отдаёт только
// безопасные витринные поля. Пусто при отсутствии ключей/данных.

export interface PricedProduct {
  id: string;
  kind: string;
  slug: string;
  title: Localized;
  description: Localized;
  sessionsIncluded: number | null;
  priceMinor: number | null;
  perSessionMinor: number | null; // для абонементов с несколькими занятиями
  currency: string;
}

export async function getPublicPricing(
  schoolSlug: string,
  region = "TJ",
): Promise<PricedProduct[]> {
  let admin;
  try {
    admin = createAdminClient() as unknown as SupabaseClient;
  } catch {
    return [];
  }

  const { data: school } = await admin
    .from("schools")
    .select("id, currency")
    .eq("slug", schoolSlug)
    .maybeSingle();
  const schoolRow = school as { id?: string; currency?: string } | null;
  if (!schoolRow?.id) return [];
  const currency = schoolRow.currency ?? "TJS";

  const { data: products } = await admin
    .from("products")
    .select("id, kind, slug, title, description, sessions_included, is_active")
    .eq("school_id", schoolRow.id)
    .eq("is_active", true);

  const rows = (products ?? []) as {
    id: string;
    kind: string;
    slug: string;
    title: Localized;
    description: Localized;
    sessions_included: number | null;
  }[];
  if (rows.length === 0) return [];

  const { data: prices } = await admin
    .from("product_prices")
    .select("product_id, currency, amount_minor, region, is_active")
    .eq("currency", currency)
    .in(
      "product_id",
      rows.map((r) => r.id),
    );

  // Индекс: сначала цена нужного региона, иначе любая активная в валюте.
  const byProduct = new Map<string, number>();
  for (const p of (prices ?? []) as {
    product_id: string;
    amount_minor: number;
    region: string | null;
    is_active: boolean;
  }[]) {
    if (p.is_active === false) continue;
    const exact = p.region === region;
    if (exact || !byProduct.has(p.product_id)) {
      byProduct.set(p.product_id, p.amount_minor);
    }
  }

  const result: PricedProduct[] = rows.map((r) => {
    const priceMinor = byProduct.get(r.id) ?? null;
    const perSessionMinor =
      priceMinor != null && r.sessions_included && r.sessions_included > 1
        ? Math.round(priceMinor / r.sessions_included)
        : null;
    return {
      id: r.id,
      kind: r.kind,
      slug: r.slug,
      title: r.title,
      description: r.description ?? {},
      sessionsIncluded: r.sessions_included,
      priceMinor,
      perSessionMinor,
      currency,
    };
  });

  // Сортировка по цене (дешёвые сначала); без цены — в конец.
  return result.sort(
    (a, b) => (a.priceMinor ?? Infinity) - (b.priceMinor ?? Infinity),
  );
}
