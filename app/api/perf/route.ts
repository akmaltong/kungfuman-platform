import { NextResponse } from "next/server";
import dns from "node:dns/promises";

// ВРЕМЕННЫЙ диагностический эндпоинт для замера латентности к Supabase.
// Удалить после диагностики производительности.
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const host = new URL(url).hostname;
  const result: Record<string, unknown> = { region: process.env.VERCEL_REGION };

  // 1) DNS
  let t = Date.now();
  try {
    const addrs = await dns.lookup(host, { all: true });
    result.dns_ms = Date.now() - t;
    result.dns = addrs;
  } catch (e) {
    result.dns_ms = Date.now() - t;
    result.dns_err = String(e);
  }

  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const rest = `${url}/rest/v1/disciplines?select=id&limit=1`;

  // 2) первый REST-запрос (включает TLS/коннект)
  t = Date.now();
  try {
    const res = await fetch(rest, { headers, cache: "no-store" });
    await res.text();
    result.rest1_ms = Date.now() - t;
    result.rest1_status = res.status;
  } catch (e) {
    result.rest1_ms = Date.now() - t;
    result.rest1_err = String(e);
  }

  // 3) второй REST-запрос (переиспользование соединения)
  t = Date.now();
  try {
    const res = await fetch(rest, { headers, cache: "no-store" });
    await res.text();
    result.rest2_ms = Date.now() - t;
    result.rest2_status = res.status;
  } catch (e) {
    result.rest2_ms = Date.now() - t;
    result.rest2_err = String(e);
  }

  // 4) auth health (GoTrue)
  t = Date.now();
  try {
    const res = await fetch(`${url}/auth/v1/health`, { headers, cache: "no-store" });
    await res.text();
    result.auth_ms = Date.now() - t;
    result.auth_status = res.status;
  } catch (e) {
    result.auth_ms = Date.now() - t;
    result.auth_err = String(e);
  }

  return NextResponse.json(result);
}
