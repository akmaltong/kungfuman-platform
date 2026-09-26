import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Keep-alive: лёгкий запрос к базе, чтобы бесплатный Supabase не уходил в
// паузу после 7 дней простоя. Дёргается Vercel Cron (см. vercel.json).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // Необязательная защита: если задан CRON_SECRET — пускаем только Vercel Cron.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase.from("schools").select("id").limit(1);
    return NextResponse.json({
      ok: !error,
      at: new Date().toISOString(),
      error: error?.message ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
