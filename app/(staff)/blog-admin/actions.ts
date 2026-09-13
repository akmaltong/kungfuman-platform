"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/context";

const LIST = "/blog-admin";
function editor(id: string) {
  return `/blog-admin/${id}`;
}

// Собирает JSONB {ru,tg,en} из полей formData вида `<prefix>_ru` и т.д.
// Пустые локали НЕ включаются — иначе t() покажет пусто вместо фолбэка на ru.
function localized(formData: FormData, prefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of ["ru", "tg", "en"] as const) {
    const v = String(formData.get(`${prefix}_${l}`) ?? "").trim();
    if (v) out[l] = v;
  }
  return out;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-я\s-]/gi, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function createPost(formData: FormData) {
  const { supabase, schoolId, userId } = await requireUser();
  const titleRu = String(formData.get("title_ru") ?? "").trim();
  if (!titleRu) return;
  const slug =
    String(formData.get("slug") ?? "").trim() || slugify(titleRu) || "post";

  await supabase.from("posts").insert({
    school_id: schoolId,
    author_id: userId,
    slug,
    title: { ru: titleRu },
  });
  revalidatePath(LIST);
}

export type SaveState = { ok: boolean; error?: string } | null;

export async function updatePost(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const title = localized(formData, "title");
  if (!id || !title.ru) return { ok: false, error: "Нужен заголовок (RU)." };

  const { error } = await supabase
    .from("posts")
    .update({
      title,
      excerpt: localized(formData, "excerpt"),
      body: localized(formData, "body"),
      cover_url: String(formData.get("cover_url") ?? "").trim() || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(LIST);
  revalidatePath(editor(id));
  return { ok: true };
}

export async function setPostStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const publish = String(formData.get("publish")) === "true";
  await supabase
    .from("posts")
    .update({
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq("id", id);
  revalidatePath(LIST);
  revalidatePath(editor(id));
}

export async function deletePost(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("posts").delete().eq("id", String(formData.get("id")));
  revalidatePath(LIST);
}
