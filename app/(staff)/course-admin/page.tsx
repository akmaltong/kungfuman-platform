import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { t, type Localized } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCourse,
  createMediaAsset,
  deleteCourse,
  deleteMediaAsset,
  setCourseStatus,
} from "./actions";

export const dynamic = "force-dynamic";

interface CourseRow {
  id: string;
  slug: string;
  title: Localized;
  status: string;
}
interface MediaRow {
  id: string;
  provider: string;
  external_id: string;
  title: string | null;
  is_public: boolean;
}
interface Discipline {
  id: string;
  title: Localized;
}

export default async function CourseAdminPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const [{ data: courses }, { data: media }, { data: disciplines }] =
    await Promise.all([
      supabase.from("courses").select("id, slug, title, status"),
      supabase
        .from("media_assets")
        .select("id, provider, external_id, title, is_public"),
      supabase.from("disciplines").select("id, title"),
    ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Курсы</h1>

      {/* Создать курс */}
      <form
        action={createCourse}
        className="mt-6 grid gap-2 rounded-lg border border-ink-muted bg-ink-soft p-4 sm:grid-cols-2"
      >
        <Input name="title_ru" placeholder="Название курса" required />
        <Input name="slug" placeholder="slug (qigong-1)" required />
        <select
          name="discipline_id"
          className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
        >
          <option value="">— дисциплина (необязательно) —</option>
          {((disciplines ?? []) as Discipline[]).map((d) => (
            <option key={d.id} value={d.id}>
              {t(d.title)}
            </option>
          ))}
        </select>
        <Button type="submit">+ Курс</Button>
      </form>

      <ul className="mt-6 space-y-2">
        {((courses ?? []) as CourseRow[]).length === 0 && (
          <li className="text-neutral-500">Пока нет курсов.</li>
        )}
        {((courses ?? []) as CourseRow[]).map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-ink-muted bg-ink-soft p-4"
          >
            <div>
              <Link
                href={`/course-admin/${c.id}`}
                className="text-neutral-100 hover:text-gold"
              >
                {t(c.title)}
              </Link>
              <span className="ml-2 text-xs text-neutral-500">{c.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <form action={setCourseStatus}>
                <input type="hidden" name="id" value={c.id} />
                <input
                  type="hidden"
                  name="status"
                  value={c.status === "published" ? "draft" : "published"}
                />
                <Button type="submit" variant="ghost">
                  {c.status === "published" ? "В черновик" : "Опубликовать"}
                </Button>
              </form>
              <form action={deleteCourse}>
                <input type="hidden" name="id" value={c.id} />
                <Button type="submit" variant="danger">
                  Удалить
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      {/* Медиа-ассеты */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-gold">Видео</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Регистрируй видео у провайдера (Kinescope и т.п.). Прямой URL клиенту
          никогда не отдаётся — только подписанный.
        </p>
        <form
          action={createMediaAsset}
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <select
            name="provider"
            className="rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100"
          >
            <option value="kinescope">Kinescope</option>
            <option value="bunny">Bunny</option>
            <option value="vk_video">VK Video</option>
            <option value="youtube">YouTube</option>
          </select>
          <Input name="external_id" placeholder="ID видео у провайдера" required />
          <Input name="title" placeholder="Название" className="w-40" />
          <Input name="duration_sec" type="number" min={1} placeholder="сек" className="w-24" />
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name="is_public" className="accent-gold" /> публичное
          </label>
          <Button type="submit" variant="ghost">
            + Видео
          </Button>
        </form>
        <ul className="mt-3 space-y-1">
          {((media ?? []) as MediaRow[]).map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded border border-ink-muted p-2 text-sm"
            >
              <span className="text-neutral-300">
                {m.title || m.external_id}{" "}
                <span className="text-neutral-600">({m.provider})</span>
                {m.is_public && <span className="ml-2 text-gold">публичное</span>}
              </span>
              <form action={deleteMediaAsset}>
                <input type="hidden" name="id" value={m.id} />
                <button
                  type="submit"
                  className="text-red-400/70 hover:text-red-300"
                >
                  удалить
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
