"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/context";

const PATH = "/venues";

export async function createVenue(formData: FormData) {
  const { supabase, schoolId } = await requireUser();
  const nameRu = String(formData.get("name_ru") ?? "").trim();
  if (!nameRu) return;

  await supabase.from("venues").insert({
    school_id: schoolId,
    name: { ru: nameRu },
    address: String(formData.get("address") ?? "").trim() || null,
    is_outdoor: formData.get("is_outdoor") === "on",
  });
  revalidatePath(PATH);
}

export async function deleteVenue(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("venues").delete().eq("id", String(formData.get("id")));
  revalidatePath(PATH);
}
