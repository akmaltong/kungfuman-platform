import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { defaultsFor } from "@/lib/content/schema";

// Контент витринной страницы: дефолты из схемы, перекрытые сохранёнными в
// schools.settings.content[pageKey]. Читается service-role клиентом, поэтому
// доступен анонимам (RLS на schools закрыт для анонимов). Никогда не падает —
// при любой ошибке отдаёт дефолты.

export type Content = Record<string, string>;

export async function getContent(
  schoolSlug: string,
  pageKey: string,
): Promise<Content> {
  const defaults = defaultsFor(pageKey);
  let admin;
  try {
    admin = createAdminClient() as unknown as SupabaseClient;
  } catch {
    return defaults;
  }

  const { data } = await admin
    .from("schools")
    .select("settings")
    .eq("slug", schoolSlug)
    .maybeSingle();

  const settings = (data as { settings?: unknown } | null)?.settings;
  const saved =
    settings &&
    typeof settings === "object" &&
    "content" in settings &&
    (settings as { content?: Record<string, unknown> }).content
      ? (settings as { content: Record<string, unknown> }).content[pageKey]
      : undefined;

  if (saved && typeof saved === "object") {
    const clean: Content = {};
    for (const [k, v] of Object.entries(saved as Record<string, unknown>)) {
      if (typeof v === "string") clean[k] = v;
    }
    return { ...defaults, ...clean };
  }
  return defaults;
}
