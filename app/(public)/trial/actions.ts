"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// Публичная запись на пробное занятие → создаёт lead. Аноним не проходит RLS на
// leads, поэтому вставка идёт server-side админ-клиентом строго для нужной школы.
// Простейшая защита от спама — honeypot-поле.
export async function createLead(formData: FormData) {
  const honeypot = String(formData.get("company") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (honeypot || !phone) {
    redirect("/trial?ok=1"); // молча, чтобы не подсказывать ботам
  }

  try {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const { data: school } = await admin
      .from("schools")
      .select("id")
      .eq("slug", "khujand")
      .maybeSingle();
    const schoolId = (school as { id?: string } | null)?.id;
    if (schoolId) {
      await admin.from("leads").insert({
        school_id: schoolId,
        full_name: fullName || null,
        phone,
        source: "website",
        status: "new",
      });
    }
  } catch {
    // Нет ключей/сети — не роняем публичную страницу.
  }

  redirect("/trial?ok=1");
}
