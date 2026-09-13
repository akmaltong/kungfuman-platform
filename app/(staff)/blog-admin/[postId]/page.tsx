import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { PostForm } from "./post-form";

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
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-neutral-100">
          {t(post.title) || "Статья"}
        </h1>
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

      <PostForm
        id={post.id}
        title={post.title ?? {}}
        excerpt={post.excerpt ?? {}}
        body={post.body ?? {}}
        coverUrl={post.cover_url ?? ""}
      />
    </main>
  );
}
