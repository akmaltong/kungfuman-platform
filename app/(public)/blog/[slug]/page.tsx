import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/format";
import { Markdown } from "@/components/markdown";

export const dynamic = "force-dynamic";

interface Post {
  slug: string;
  title: Localized;
  body: Localized;
  cover_url: string | null;
  published_at: string | null;
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Slug может быть кириллическим и прийти из URL percent-кодированным —
  // декодируем, чтобы совпало со значением в БД.
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    // оставляем как есть, если строка не является валидным %-кодом
  }
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const [{ data }, locale] = await Promise.all([
    supabase
      .from("posts")
      .select("slug, title, body, cover_url, published_at")
      .eq("slug", decodedSlug)
      .eq("status", "published")
      .maybeSingle(),
    getLocale(),
  ]);

  if (!data) {
    return (
      <main className="mx-auto max-w-[680px] px-6 py-16 text-center">
        <p className="text-paper-muted">Статья не найдена.</p>
        <Link href="/blog" className="mt-4 inline-block text-gold hover:underline">
          ← Блог
        </Link>
      </main>
    );
  }
  const post = data as Post;
  const body = t(post.body, locale).trim();

  return (
    <article className="mx-auto max-w-[680px] px-6 pb-20 pt-10">
      <Link href="/blog" className="text-sm text-gold hover:underline">
        ← Блог
      </Link>
      {post.published_at && (
        <div className="mt-6 text-[13px] text-paper-muted">
          {formatDateTime(post.published_at)}
        </div>
      )}
      <h1 className="mt-1 font-serif text-[36px] font-bold leading-[1.1] text-paper sm:text-[42px]">
        {t(post.title, locale)}
      </h1>
      {post.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_url}
          alt=""
          className="mt-6 w-full border border-gold-dim object-cover"
        />
      )}
      <div className="mt-8">
        {body ? (
          <Markdown>{body}</Markdown>
        ) : (
          <p className="text-paper-muted">Текст статьи пока пуст.</p>
        )}
      </div>
    </article>
  );
}
