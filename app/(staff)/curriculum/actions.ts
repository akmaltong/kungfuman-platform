"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { moveItem, changedSortOrders } from "@/lib/domain/curriculum";

const PATH = "/curriculum";

// Контекст текущего пользователя: клиент, его id и школа. Все записи всё равно
// проходят через RLS (is_admin + school_id), это лишь удобный доступ к school_id.
async function ctx(): Promise<{
  supabase: SupabaseClient;
  userId: string;
  schoolId: string;
}> {
  // Каст к дефолтной схеме: типы БД пока плейсхолдер (см. DECISIONS).
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();

  const schoolId = (profile as { school_id?: string } | null)?.school_id;
  if (!schoolId) redirect("/login");

  return { supabase, userId: user.id, schoolId };
}

function ru(value: FormDataEntryValue | null): { ru: string } {
  return { ru: String(value ?? "").trim() };
}

// --- Дисциплины ---------------------------------------------------------------

export async function createDiscipline(formData: FormData) {
  const { supabase, schoolId } = await ctx();
  const code = String(formData.get("code") ?? "").trim();
  const title = ru(formData.get("title_ru"));
  if (!code || !title.ru) return;

  const { data: siblings } = await supabase
    .from("disciplines")
    .select("sort_order")
    .eq("school_id", schoolId);
  const nextOrder = maxOrder(siblings) + 1;

  await supabase
    .from("disciplines")
    .insert({ school_id: schoolId, code, title, sort_order: nextOrder });
  revalidatePath(PATH);
}

export async function deleteDiscipline(formData: FormData) {
  const { supabase } = await ctx();
  await supabase
    .from("disciplines")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidatePath(PATH);
}

// --- Уровни -------------------------------------------------------------------

export async function createLevel(formData: FormData) {
  const { supabase } = await ctx();
  const disciplineId = String(formData.get("discipline_id"));
  const number = Number(formData.get("number"));
  const title = ru(formData.get("title_ru"));
  if (!disciplineId || !Number.isInteger(number) || number < 1 || number > 7)
    return;

  await supabase
    .from("levels")
    .insert({ discipline_id: disciplineId, number, title });
  revalidatePath(PATH);
}

export async function deleteLevel(formData: FormData) {
  const { supabase } = await ctx();
  await supabase.from("levels").delete().eq("id", String(formData.get("id")));
  revalidatePath(PATH);
}

// --- Практики -----------------------------------------------------------------

export async function createPractice(formData: FormData) {
  const { supabase } = await ctx();
  const levelId = String(formData.get("level_id"));
  const code = String(formData.get("code") ?? "").trim();
  const title = ru(formData.get("title_ru"));
  if (!levelId || !code || !title.ru) return;

  const { data: siblings } = await supabase
    .from("practices")
    .select("sort_order")
    .eq("level_id", levelId);
  const nextOrder = maxOrder(siblings) + 1;

  await supabase
    .from("practices")
    .insert({ level_id: levelId, code, title, sort_order: nextOrder });
  revalidatePath(PATH);
}

export async function deletePractice(formData: FormData) {
  const { supabase } = await ctx();
  await supabase
    .from("practices")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidatePath(PATH);
}

export async function setPracticeStatus(formData: FormData) {
  const { supabase } = await ctx();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["draft", "review", "published", "archived"].includes(status)) return;
  await supabase.from("practices").update({ status }).eq("id", id);
  revalidatePath(PATH);
}

// Переупорядочивание практик внутри уровня (кнопки вверх/вниз).
export async function movePractice(formData: FormData) {
  const { supabase } = await ctx();
  const levelId = String(formData.get("level_id"));
  const id = String(formData.get("id"));
  const direction = String(formData.get("direction")) === "up" ? "up" : "down";

  const { data } = await supabase
    .from("practices")
    .select("id, sort_order")
    .eq("level_id", levelId);
  const before = (data ?? []) as { id: string; sort_order: number }[];

  const after = moveItem(before, id, direction);
  const changed = changedSortOrders(before, after);

  for (const c of changed) {
    await supabase
      .from("practices")
      .update({ sort_order: c.sort_order })
      .eq("id", c.id);
  }
  revalidatePath(PATH);
}

// --- Критерии аттестации ------------------------------------------------------

export async function createCriterion(formData: FormData) {
  const { supabase } = await ctx();
  const practiceId = String(formData.get("practice_id"));
  const title = ru(formData.get("title_ru"));
  const weight = Number(formData.get("weight") ?? 1) || 1;
  if (!practiceId || !title.ru) return;

  const { data: siblings } = await supabase
    .from("practice_criteria")
    .select("sort_order")
    .eq("practice_id", practiceId);
  const nextOrder = maxOrder(siblings) + 1;

  await supabase.from("practice_criteria").insert({
    practice_id: practiceId,
    title,
    weight,
    sort_order: nextOrder,
  });
  revalidatePath(PATH);
}

export async function deleteCriterion(formData: FormData) {
  const { supabase } = await ctx();
  await supabase
    .from("practice_criteria")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidatePath(PATH);
}

function maxOrder(rows: { sort_order: number }[] | null): number {
  if (!rows || rows.length === 0) return -1;
  return Math.max(...rows.map((r) => r.sort_order));
}
