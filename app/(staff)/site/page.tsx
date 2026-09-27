import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAGES, defaultsFor, type Field } from "@/lib/content/schema";
import { ImageField } from "@/components/staff/image-field";
import { saveContent } from "./actions";

export const dynamic = "force-dynamic";

export default async function SitePage() {
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase.from("schools").select("settings").maybeSingle();
  const settings =
    ((data as { settings?: Record<string, unknown> } | null)?.settings ??
      {}) as Record<string, unknown>;
  const content = (
    settings.content && typeof settings.content === "object"
      ? settings.content
      : {}
  ) as Record<string, Record<string, string>>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-gold">Сайт — тексты страниц</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Правки сохраняются сразу и появляются на сайте. Списки — по одному пункту
        на строку; пары — «левое | правое» (разделитель — вертикальная черта).
      </p>

      <div className="mt-8 space-y-4">
        {PAGES.map((page) => {
          const saved = content[page.key] ?? {};
          const values = { ...defaultsFor(page.key), ...saved };
          return (
            <details
              key={page.key}
              className="rounded-lg border border-ink-muted bg-ink-soft p-5"
            >
              <summary className="cursor-pointer text-lg font-semibold text-neutral-100">
                {page.title}{" "}
                <span className="text-sm font-normal text-neutral-500">
                  · {page.path}
                </span>
              </summary>
              <form action={saveContent} className="mt-4 space-y-4">
                <input type="hidden" name="__page" value={page.key} />
                {page.fields.map((f) => (
                  <FieldInput key={f.key} field={f} value={values[f.key] ?? ""} />
                ))}
                <Button type="submit">Сохранить «{page.title}»</Button>
              </form>
            </details>
          );
        })}
      </div>
    </main>
  );
}

function FieldInput({ field, value }: { field: Field; value: string }) {
  if (field.type === "image") {
    return <ImageField name={field.key} label={field.label} value={value} />;
  }
  const rows =
    field.type === "text" ? 1 : field.type === "multiline" ? 4 : 6;
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-neutral-300">{field.label}</span>
      {field.type === "text" ? (
        <Input name={field.key} defaultValue={value} className="w-full" />
      ) : (
        <textarea
          name={field.key}
          defaultValue={value}
          rows={rows}
          className="w-full rounded-md border border-ink-muted bg-ink px-3 py-2 text-sm text-neutral-100"
        />
      )}
      {field.hint && (
        <span className="mt-1 block text-xs text-neutral-500">{field.hint}</span>
      )}
    </label>
  );
}
