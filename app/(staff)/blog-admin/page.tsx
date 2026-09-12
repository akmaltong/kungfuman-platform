import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPost, deletePost, setPostStatus } from "./actions";

export const dynamic = "force-dynamic";

interface PostRow {
  id: string;
  slug: string;
  title: Localized;
  status: string;
  published_at: string | null;
  updated_at: string;
}

export default async function BlogAdminPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase
    .from("posts")
    .select("id, slug, title, status, published_at, updated_at")
    .order("updated_at", { ascending: false });
  const posts = (data ?? []) as PostRow[];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Блог</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Статьи школы. Публикуются на публичном блоге.
      </p>

      <form
        action={createPost}
        className="mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-ink-muted bg-ink-soft p-4"
      >
        <Input name="title_ru" placeholder="Заголовок статьи" className="flex-1" required />
        <Input name="slug" placeholder="slug (необязательно)" className="w-48" />
        <Button type="submit">+ Статья</Button>
      </form>

      <ul className="mt-6 space-y-2">
        {posts.length === 0 && <li className="text-neutral-500">Пока нет статей.</li>}
        {posts.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-muted bg-ink-soft p-4"
          >
            <div>
              <Link href={`/blog-admin/${p.id}`} className="text-neutral-100 hover:text-gold">
                {t(p.title)}
              </Link>
              <div className="text-xs text-neutral-600">
                {p.status === "published"
                  ? `опубликовано ${p.published_at ? formatDateTime(p.published_at) : ""}`
                  : "черновик"}{" "}
                · /{p.slug}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <form action={setPostStatus}>
                <input type="hidden" name="id" value={p.id} />
                <input
                  type="hidden"
                  name="publish"
                  value={(p.status !== "published").toString()}
                />
                <Button type="submit" variant="ghost">
                  {p.status === "published" ? "В черновик" : "Опубликовать"}
                </Button>
              </form>
              <form action={deletePost}>
                <input type="hidden" name="id" value={p.id} />
                <Button type="submit" variant="danger">
                  Удалить
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
