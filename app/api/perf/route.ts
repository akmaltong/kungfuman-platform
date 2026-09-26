import { NextResponse } from "next/server";
import dnsp from "node:dns/promises";

// ВРЕМЕННЫЙ диагностический эндпоинт связности Vercel → Supabase. Удалить после.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function timedFetch(u: string, headers?: Record<string, string>) {
  const t = Date.now();
  try {
    const res = await fetch(u, { cache: "no-store", headers });
    const body = (await res.text()).slice(0, 60);
    return { ms: Date.now() - t, status: res.status, body };
  } catch (e) {
    const err = e as { message?: string; cause?: { code?: string; errno?: number; message?: string } };
    return {
      ms: Date.now() - t,
      err: err?.message ?? String(e),
      cause_code: err?.cause?.code,
      cause_errno: err?.cause?.errno,
      cause_msg: err?.cause?.message,
    };
  }
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    host = "BAD_URL";
  }
  const out: Record<string, unknown> = {
    region: process.env.VERCEL_REGION,
    host,
    url_len: url.length,
    key_len: key.length,
  };

  // DNS-записи хоста Supabase
  try {
    out.A = await dnsp.resolve4(host);
  } catch (e) {
    out.A_err = String(e);
  }
  try {
    out.AAAA = await dnsp.resolve6(host);
  } catch (e) {
    out.AAAA_err = String(e);
  }
  try {
    out.lookup = await dnsp.lookup(host, { all: true });
  } catch (e) {
    out.lookup_err = String(e);
  }

  // Контроль: исходящий интернет вообще работает?
  out.example = await timedFetch("https://example.com");
  // Supabase health (без авторизации)
  out.supabase_health = await timedFetch(`${url}/auth/v1/health`, {
    apikey: key,
  });

  return NextResponse.json(out);
}
