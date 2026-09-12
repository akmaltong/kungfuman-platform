import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePost } from "../actions";

export const dynamic = "force-dynamic";

interface Post {
  id: string;
  slug: string;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  cover_url: string | null;
  status: string;
}

export default async function PostEditor({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase
    .from("posts")
    .select("id, slug, title, excerpt, body, cover_url, status")
    .eq("id", postId)
    .maybeSingle();

  if (!data) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-neutral-400">Статья не найдена.</p>
      </main>
    );
  }
  const post = data as Post;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/blog-admin" className="text-sm text-gold hover:underline">
        ← Блог
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-neutral-100">Статья</h1>
        <span className="text-xs text-neutral-500">
          {post.status} · /{post.slug}
        </span>
        {post.status === "published" && (
          <Link
            href={`/blog/${post.slug}`}
            className="text-sm text-gold hover:underline"
          >
            открыть публично →
          </Link>
        )}
      </div>

      <form action={updatePost} className="mt-6 space-y-3">
        <input type="hidden" name="id" value={post.id} />
        <label className="block text-sm text-neutral-400">Заголовок</label>
        <Input name="title_ru" defaultValue={t(post.title)} className="w-full" required />

        <label className="block text-sm text-neutral-400">Обложка (URL)</label>
        <Input name="cover_url" defaultValue={post.cover_url ?? ""} className="w-full" />

        <label className="block text-sm text-neutral-400">Анонс</label>
        <textarea
          name="excerpt_ru"
          defaultValue={t(post.excerpt)}
          rows={2}
          className="w-full rounded-md border border-ink-muted bg-ink px-3 py-2 text-sm text-neutral-100"
        />

        <label className="block text-sm text-neutral-400">
          Текст статьи (обычный текст, абзацы пустой строкой)
        </label>
        <textarea
          name="body_ru"
          defaultValue={t(post.body)}
          rows={16}
          className="w-full rounded-md border border-ink-muted bg-ink px-3 py-2 font-mono text-sm text-neutral-100"
        />

        <Button type="submit">Сохранить</Button>
      </form>
    </main>
  );
}
