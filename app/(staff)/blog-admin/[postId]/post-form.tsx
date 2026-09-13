"use client";

import { useActionState, useState } from "react";

import { Markdown } from "@/components/markdown";
import { createClient } from "@/lib/supabase/client";
import type { Localized, Locale } from "@/lib/i18n";
import { updatePost } from "../actions";

// Загрузка картинки в публичный бакет `media` (Supabase Storage) → публичный URL.
async function uploadImage(file: File): Promise<string> {
  const supabase = createClient();
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `blog/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

const LANGS: { code: Locale; label: string }[] = [
  { code: "ru", label: "RU" },
  { code: "tg", label: "TG" },
  { code: "en", label: "EN" },
];

type Trio = Record<Locale, string>;
const trio = (v: Localized): Trio => ({
  ru: v.ru ?? "",
  tg: v.tg ?? "",
  en: v.en ?? "",
});

const inputCls =
  "w-full rounded-md border border-ink-muted bg-ink px-3 py-2 text-sm text-neutral-100";

export function PostForm({
  id,
  title,
  excerpt,
  body,
  coverUrl,
}: {
  id: string;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  coverUrl: string;
}) {
  const [lang, setLang] = useState<Locale>("ru");
  const [titleV, setTitleV] = useState<Trio>(trio(title));
  const [excerptV, setExcerptV] = useState<Trio>(trio(excerpt));
  const [bodyV, setBodyV] = useState<Trio>(trio(body));
  const [cover, setCover] = useState(coverUrl);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saveState, formAction, saving] = useActionState(updatePost, null);

  async function handleUpload(
    file: File | undefined,
    target: "cover" | "body",
  ) {
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const url = await uploadImage(file);
      if (target === "cover") setCover(url);
      else
        setBodyV((b) => ({
          ...b,
          [lang]: `${b[lang]}${b[lang] ? "\n\n" : ""}![](${url})\n`,
        }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="cover_url" value={cover} />
      {LANGS.map((l) => (
        <span key={l.code}>
          <input type="hidden" name={`title_${l.code}`} value={titleV[l.code]} />
          <input type="hidden" name={`excerpt_${l.code}`} value={excerptV[l.code]} />
          <input type="hidden" name={`body_${l.code}`} value={bodyV[l.code]} />
        </span>
      ))}

      {/* Переключатель языка */}
      <div className="flex flex-wrap items-center gap-2">
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            className={`rounded-md border px-3 py-1 text-sm ${
              lang === l.code
                ? "border-gold bg-gold text-ink"
                : "border-ink-muted text-neutral-300"
            }`}
          >
            {l.label}
          </button>
        ))}
        <span className="text-xs text-neutral-500">
          {lang === "ru"
            ? "основной язык"
            : "необязательно · пусто → покажется русский"}
        </span>
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-400">
          Заголовок ({lang})
        </label>
        <input
          value={titleV[lang]}
          onChange={(e) => setTitleV({ ...titleV, [lang]: e.target.value })}
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-400">
          Обложка (URL)
        </label>
        <input
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          placeholder="https://…"
          className={inputCls}
        />
        <div className="mt-2">
          <label className="cursor-pointer rounded-md border border-ink-muted px-3 py-1.5 text-sm text-neutral-300 hover:border-gold/50">
            {busy ? "Загрузка…" : "⬆ Загрузить файл"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => handleUpload(e.target.files?.[0], "cover")}
            />
          </label>
        </div>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="mt-2 max-h-40 rounded-md border border-ink-muted"
          />
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-400">
          Анонс ({lang})
        </label>
        <textarea
          value={excerptV[lang]}
          onChange={(e) => setExcerptV({ ...excerptV, [lang]: e.target.value })}
          rows={2}
          className={inputCls}
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm text-neutral-400">
            Текст статьи — Markdown ({lang})
          </label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer text-sm text-gold hover:underline">
              {busy ? "Загрузка…" : "+ картинка"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => handleUpload(e.target.files?.[0], "body")}
              />
            </label>
            <button
              type="button"
              onClick={() => setPreview((p) => !p)}
              className="text-sm text-gold hover:underline"
            >
              {preview ? "← Редактировать" : "Предпросмотр →"}
            </button>
          </div>
        </div>
        {preview ? (
          <div className="min-h-[16rem] rounded-md border border-ink-muted bg-ink p-4">
            {bodyV[lang] ? (
              <Markdown>{bodyV[lang]}</Markdown>
            ) : (
              <p className="text-neutral-500">Пусто.</p>
            )}
          </div>
        ) : (
          <textarea
            value={bodyV[lang]}
            onChange={(e) => setBodyV({ ...bodyV, [lang]: e.target.value })}
            rows={18}
            className={`${inputCls} font-mono`}
          />
        )}
        <MarkdownHint />
      </div>

      {err && <p className="text-sm text-red-400">Загрузка: {err}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold px-5 py-2.5 font-medium text-ink hover:bg-gold-soft disabled:opacity-60"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
        {!saving && saveState?.ok && (
          <span className="text-sm text-green-400">Сохранено ✓</span>
        )}
        {!saving && saveState && !saveState.ok && (
          <span className="text-sm text-red-400">{saveState.error}</span>
        )}
      </div>
    </form>
  );
}

function MarkdownHint() {
  return (
    <details className="mt-2 text-xs text-neutral-500">
      <summary className="cursor-pointer hover:text-neutral-300">
        Подсказка по Markdown
      </summary>
      <ul className="mt-2 space-y-1 pl-4">
        <li>
          <code># Заголовок</code>, <code>## Подзаголовок</code>
        </li>
        <li>
          <code>**жирный**</code>, <code>*курсив*</code>
        </li>
        <li>
          Список: строки, начинающиеся с <code>- </code> или <code>1. </code>
        </li>
        <li>
          Ссылка: <code>[текст](https://…)</code>
        </li>
        <li>
          Картинка: <code>![подпись](https://…jpg)</code>
        </li>
        <li>
          Видео: вставь ссылку на YouTube / VK / Kinescope отдельной строкой —
          встроится плеер.
        </li>
        <li>Абзац — пустая строка между блоками.</li>
      </ul>
    </details>
  );
}
