"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/context";

const LIST = "/blog-admin";
function editor(id: string) {
  return `/blog-admin/${id}`;
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

export async function updatePost(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const titleRu = String(formData.get("title_ru") ?? "").trim();
  if (!id || !titleRu) return;

  await supabase
    .from("posts")
    .update({
      title: { ru: titleRu },
      excerpt: { ru: String(formData.get("excerpt_ru") ?? "").trim() },
      body: { ru: String(formData.get("body_ru") ?? "") },
      cover_url: String(formData.get("cover_url") ?? "").trim() || null,
    })
    .eq("id", id);
  revalidatePath(LIST);
  revalidatePath(editor(id));
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
