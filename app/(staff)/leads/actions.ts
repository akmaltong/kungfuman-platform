"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/context";

const PATH = "/leads";
const STATUSES = [
  "new",
  "contacted",
  "trial_booked",
  "trial_attended",
  "converted",
  "lost",
];

export async function setLeadStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!STATUSES.includes(status)) return;
  await supabase.from("leads").update({ status }).eq("id", id);
  revalidatePath(PATH);
}
