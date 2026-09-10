"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  await supabase.auth.signOut();
  redirect("/login");
}
