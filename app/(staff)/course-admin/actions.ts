"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/context";

const LIST = "/course-admin";
function editor(courseId: string) {
  return `/course-admin/${courseId}`;
}

// --- Медиа-ассеты (видео у провайдера) ---------------------------------------

const PROVIDERS = ["kinescope", "vk_video", "bunny", "youtube", "supabase"];

export async function createMediaAsset(formData: FormData) {
  const { supabase, schoolId } = await requireUser();
  const provider = String(formData.get("provider") ?? "");
  const externalId = String(formData.get("external_id") ?? "").trim();
  if (!PROVIDERS.includes(provider) || !externalId) return;

  const duration = Number(formData.get("duration_sec"));
  await supabase.from("media_assets").insert({
    school_id: schoolId,
    provider,
    external_id: externalId,
    title: String(formData.get("title") ?? "").trim() || null,
    duration_sec: Number.isFinite(duration) && duration > 0 ? duration : null,
    is_public: formData.get("is_public") === "on",
  });
  revalidatePath(LIST);
}

export async function deleteMediaAsset(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase
    .from("media_assets")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidatePath(LIST);
}

// --- Курсы -------------------------------------------------------------------

export async function createCourse(formData: FormData) {
  const { supabase, schoolId } = await requireUser();
  const slug = String(formData.get("slug") ?? "").trim();
  const titleRu = String(formData.get("title_ru") ?? "").trim();
  if (!slug || !titleRu) return;

  await supabase.from("courses").insert({
    school_id: schoolId,
    slug,
    title: { ru: titleRu },
    discipline_id: String(formData.get("discipline_id") ?? "") || null,
    level_id: String(formData.get("level_id") ?? "") || null,
  });
  revalidatePath(LIST);
}

export async function deleteCourse(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("courses").delete().eq("id", String(formData.get("id")));
  revalidatePath(LIST);
}

export async function setCourseStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["draft", "review", "published", "archived"].includes(status)) return;
  await supabase.from("courses").update({ status }).eq("id", id);
  revalidatePath(LIST);
  revalidatePath(editor(id));
}

// --- Модули ------------------------------------------------------------------

export async function createModule(formData: FormData) {
  const { supabase } = await requireUser();
  const courseId = String(formData.get("course_id"));
  const titleRu = String(formData.get("title_ru") ?? "").trim();
  if (!courseId || !titleRu) return;

  const { data: siblings } = await supabase
    .from("course_modules")
    .select("sort_order")
    .eq("course_id", courseId);
  const nextOrder = maxOrder(siblings) + 1;

  await supabase
    .from("course_modules")
    .insert({ course_id: courseId, title: { ru: titleRu }, sort_order: nextOrder });
  revalidatePath(editor(courseId));
}

export async function deleteModule(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase
    .from("course_modules")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidatePath(editor(String(formData.get("course_id"))));
}

// --- Уроки -------------------------------------------------------------------

export async function createLesson(formData: FormData) {
  const { supabase } = await requireUser();
  const courseId = String(formData.get("course_id"));
  const moduleId = String(formData.get("module_id"));
  const titleRu = String(formData.get("title_ru") ?? "").trim();
  if (!moduleId || !titleRu) return;

  const { data: siblings } = await supabase
    .from("lessons")
    .select("sort_order")
    .eq("module_id", moduleId);
  const nextOrder = maxOrder(siblings) + 1;
  const duration = Number(formData.get("duration_min"));

  await supabase.from("lessons").insert({
    module_id: moduleId,
    title: { ru: titleRu },
    media_asset_id: String(formData.get("media_asset_id") ?? "") || null,
    practice_id: String(formData.get("practice_id") ?? "") || null,
    is_preview: formData.get("is_preview") === "on",
    duration_min: Number.isFinite(duration) && duration > 0 ? duration : null,
    sort_order: nextOrder,
  });
  revalidatePath(editor(courseId));
}

export async function deleteLesson(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("lessons").delete().eq("id", String(formData.get("id")));
  revalidatePath(editor(String(formData.get("course_id"))));
}

export async function toggleLessonPreview(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const next = formData.get("is_preview") === "true";
  await supabase.from("lessons").update({ is_preview: next }).eq("id", id);
  revalidatePath(editor(String(formData.get("course_id"))));
}

function maxOrder(rows: { sort_order: number }[] | null): number {
  if (!rows || rows.length === 0) return -1;
  return Math.max(...rows.map((r) => r.sort_order));
}
