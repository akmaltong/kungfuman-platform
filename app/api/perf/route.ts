import { NextResponse } from "next/server";
import dns from "node:dns";
import { createClient } from "@supabase/supabase-js";

// ВРЕМЕННЫЙ диагностический эндпоинт латентности Supabase. Удалить после.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function timeSupa(url: string, key: string) {
  const t = Date.now();
  const supa = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supa
    .from("disciplines")
    .select("id")
    .limit(1);
  return { ms: Date.now() - t, err: error?.message ?? null, rows: data?.length ?? null };
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const result: Record<string, unknown> = { region: process.env.VERCEL_REGION };

  // 1) supabase-js с DNS по умолчанию
  result.default = await timeSupa(url, key);

  // 2) supabase-js после переключения DNS на ipv4first
  try {
    dns.setDefaultResultOrder("ipv4first");
    result.dns_order = "ipv4first";
  } catch (e) {
    result.dns_order_err = String(e);
  }
  result.ipv4first = await timeSupa(url, key);

  // 3) ещё раз (тёплый)
  result.ipv4first_2 = await timeSupa(url, key);

  return NextResponse.json(result);
}
