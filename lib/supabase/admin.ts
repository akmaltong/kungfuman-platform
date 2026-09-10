import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

// СЕРВЕРНЫЙ клиент с service-role ключом. ОБХОДИТ RLS — использовать только в
// серверном коде и только для явно безопасных, отфильтрованных выборок
// (например, публичный каталог программы с status='published').
// НИКОГДА не импортировать в клиентские ('use client') компоненты.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_URL не заданы",
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
