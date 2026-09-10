"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/context";

const PATH = "/products";

const KINDS = ["subscription", "single_visit", "course", "workshop", "retreat"];

export async function createProduct(formData: FormData) {
  const { supabase, schoolId } = await requireUser();
  const kind = String(formData.get("kind") ?? "");
  const slug = String(formData.get("slug") ?? "").trim();
  const titleRu = String(formData.get("title_ru") ?? "").trim();
  if (!KINDS.includes(kind) || !slug || !titleRu) return;

  const sessions = Number(formData.get("sessions_included"));
  const duration = Number(formData.get("duration_days"));

  await supabase.from("products").insert({
    school_id: schoolId,
    kind,
    slug,
    title: { ru: titleRu },
    sessions_included:
      Number.isFinite(sessions) && sessions > 0 ? sessions : null,
    duration_days: Number.isFinite(duration) && duration > 0 ? duration : null,
  });
  revalidatePath(PATH);
}

export async function deleteProduct(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("products").delete().eq("id", String(formData.get("id")));
  revalidatePath(PATH);
}

export async function addPrice(formData: FormData) {
  const { supabase } = await requireUser();
  const productId = String(formData.get("product_id"));
  const currency = String(formData.get("currency") ?? "").trim().toUpperCase();
  const major = Number(formData.get("amount"));
  const region = String(formData.get("region") ?? "").trim() || null;
  if (!productId || currency.length !== 3 || !Number.isFinite(major) || major < 0)
    return;

  await supabase.from("product_prices").upsert(
    {
      product_id: productId,
      currency,
      amount_minor: Math.round(major * 100),
      region,
    },
    { onConflict: "product_id,currency,region" },
  );
  revalidatePath(PATH);
}

export async function deletePrice(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase
    .from("product_prices")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidatePath(PATH);
}
