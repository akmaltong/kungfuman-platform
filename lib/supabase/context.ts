import "server-only";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// Контекст текущего пользователя для серверного кода: клиент, его id, школа и
// роль. Все записи всё равно проходят через RLS — это удобный доступ к school_id.
// Каст к дефолтной схеме: типы БД пока плейсхолдер (см. DECISIONS).
export interface UserContext {
  supabase: SupabaseClient;
  userId: string;
  schoolId: string;
  role: string;
}

export async function requireUser(): Promise<UserContext> {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single();

  const row = profile as { school_id?: string; role?: string } | null;
  if (!row?.school_id) redirect("/login");

  return {
    supabase,
    userId: user.id,
    schoolId: row.school_id,
    role: row.role ?? "student",
  };
}
