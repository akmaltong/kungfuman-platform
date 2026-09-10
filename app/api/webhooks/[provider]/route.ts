import { type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PROVIDERS = ["yookassa", "paddle", "alif"];

function addDays(days: number | null): string | null {
  if (!days) return null;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Приём вебхуков платёжных провайдеров (ЮKassa для РФ, Paddle/MoR для мира).
// Ожидаемое тело (упрощённо): { external_id, status: "succeeded" }.
//
// ВНИМАНИЕ: здесь ОБЯЗАТЕЛЬНА проверка подписи запроса секретом провайдера
// перед доверием телу. Пока — опциональный общий секрет в заголовке
// x-webhook-secret (WEBHOOK_SECRET). Реальную верификацию добавить при
// подключении провайдера — см. DECISIONS.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!PROVIDERS.includes(provider)) {
    return Response.json({ error: "unknown provider" }, { status: 404 });
  }

  const secret = process.env.WEBHOOK_SECRET;
  if (secret && request.headers.get("x-webhook-secret") !== secret) {
    return Response.json({ error: "bad signature" }, { status: 401 });
  }

  let body: { external_id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  if (!body.external_id || body.status !== "succeeded") {
    return Response.json({ ok: true, ignored: true });
  }

  let admin: SupabaseClient;
  try {
    admin = createAdminClient() as unknown as SupabaseClient;
  } catch {
    return Response.json({ error: "not configured" }, { status: 500 });
  }

  const { data: payment } = await admin
    .from("payments")
    .select("id, subscription_id, status")
    .eq("provider", provider)
    .eq("external_id", body.external_id)
    .maybeSingle();
  const p = payment as
    | { id: string; subscription_id: string | null; status: string }
    | null;
  if (!p || p.status === "succeeded") {
    return Response.json({ ok: true, alreadyProcessed: !!p });
  }

  await admin
    .from("payments")
    .update({ status: "succeeded", paid_at: new Date().toISOString() })
    .eq("id", p.id);

  if (p.subscription_id) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("product_id")
      .eq("id", p.subscription_id)
      .single();
    const productId = (sub as { product_id?: string } | null)?.product_id;
    let durationDays: number | null = null;
    let sessionsTotal: number | null = null;
    if (productId) {
      const { data: product } = await admin
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
    await admin
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

  return Response.json({ ok: true });
}
