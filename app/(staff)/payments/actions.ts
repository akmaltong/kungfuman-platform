"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/context";

const PATH = "/payments";

function addDays(days: number | null): string | null {
  if (!days) return null;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Оформить абонемент ученику: создаёт subscription(pending) + payment(pending).
// Активируется после подтверждения платежа.
export async function issueSubscription(formData: FormData) {
  const { supabase, schoolId } = await requireUser();
  const profileId = String(formData.get("profile_id"));
  const productId = String(formData.get("product_id"));
  const provider = String(formData.get("provider") ?? "alif");
  if (!profileId || !productId) return;

  const { data: school } = await supabase
    .from("schools")
    .select("currency, country_code")
    .eq("id", schoolId)
    .single();
  const currency = (school as { currency?: string } | null)?.currency ?? "TJS";
  const country = (school as { country_code?: string } | null)?.country_code;

  const { data: product } = await supabase
    .from("products")
    .select("sessions_included")
    .eq("id", productId)
    .single();
  const sessionsTotal =
    (product as { sessions_included?: number | null } | null)
      ?.sessions_included ?? null;

  // Цена в валюте школы: приоритет региону страны, затем без региона.
  const { data: pricesData } = await supabase
    .from("product_prices")
    .select("amount_minor, region")
    .eq("product_id", productId)
    .eq("currency", currency)
    .eq("is_active", true);
  const prices = (pricesData ?? []) as { amount_minor: number; region: string | null }[];
  const price =
    prices.find((p) => p.region === country) ??
    prices.find((p) => p.region === null) ??
    prices[0];
  if (!price) return; // нет цены — нельзя оформить

  const { data: sub } = await supabase
    .from("subscriptions")
    .insert({
      profile_id: profileId,
      product_id: productId,
      status: "pending",
      sessions_total: sessionsTotal,
    })
    .select("id")
    .single();
  const subscriptionId = (sub as { id?: string } | null)?.id ?? null;

  await supabase.from("payments").insert({
    school_id: schoolId,
    profile_id: profileId,
    subscription_id: subscriptionId,
    provider,
    amount_minor: price.amount_minor,
    currency,
    status: "pending",
  });
  revalidatePath(PATH);
}

// Ручное подтверждение платежа → активация абонемента.
export async function confirmPayment(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const paymentId = String(formData.get("id"));

  const { data: payment } = await supabase
    .from("payments")
    .select("id, subscription_id, status")
    .eq("id", paymentId)
    .single();
  const p = payment as { subscription_id: string | null; status: string } | null;
  if (!p || p.status === "succeeded") return;

  await supabase
    .from("payments")
    .update({
      status: "succeeded",
      paid_at: new Date().toISOString(),
      confirmed_by: userId,
    })
    .eq("id", paymentId);

  if (p.subscription_id) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("product_id")
      .eq("id", p.subscription_id)
      .single();
    const productId = (sub as { product_id?: string } | null)?.product_id;

    let durationDays: number | null = null;
    let sessionsTotal: number | null = null;
    if (productId) {
      const { data: product } = await supabase
        .from("products")
        .select("duration_days, sessions_included")
        .eq("id", productId)
        .single();
      durationDays =
        (product as { duration_days?: number | null } | null)?.duration_days ??
        null;
      sessionsTotal =
        (product as { sessions_included?: number | null } | null)
          ?.sessions_included ?? null;
    }

    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        starts_at: new Date().toISOString().slice(0, 10),
        ends_at: addDays(durationDays),
        sessions_total: sessionsTotal,
        sessions_used: 0,
      })
      .eq("id", p.subscription_id);
  }
  revalidatePath(PATH);
}

export async function rejectPayment(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase
    .from("payments")
    .update({ status: "failed" })
    .eq("id", String(formData.get("id")));
  revalidatePath(PATH);
}
