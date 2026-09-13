"use client";

import { useState } from "react";

import { t, type Localized, type Locale } from "@/lib/i18n";

const LANGS: { code: Locale; label: string }[] = [
  { code: "ru", label: "RU" },
  { code: "tg", label: "TG" },
  { code: "en", label: "EN" },
];

// Инлайновое переименование локализованного заголовка (ru/tg/en).
// action — серверный экшен, принимает FormData с id и title_ru/title_tg/title_en.
export function EditableTitle({
  id,
  value,
  action,
  extra,
  className = "",
}: {
  id: string;
  value: Localized;
  action: (formData: FormData) => void | Promise<void>;
  extra?: Record<string, string>;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span>{t(value) || "—"}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Переименовать"
          className="text-xs text-neutral-500 hover:text-gold"
        >
          ✎
        </button>
      </span>
    );
  }

  return (
    <form
      action={action}
      onSubmit={() => setEditing(false)}
      className="flex flex-wrap items-center gap-1"
    >
      <input type="hidden" name="id" value={id} />
      {extra &&
        Object.entries(extra).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      {LANGS.map((l) => (
        <input
          key={l.code}
          name={`title_${l.code}`}
          defaultValue={value[l.code] ?? ""}
          placeholder={l.label}
          className="w-28 rounded border border-ink-muted bg-ink px-2 py-1 text-sm text-neutral-100"
        />
      ))}
      <button
        type="submit"
        className="rounded bg-gold px-2 py-1 text-xs font-medium text-ink hover:bg-gold-soft"
      >
        Сохранить
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="px-1 text-xs text-neutral-500 hover:text-neutral-300"
      >
        Отмена
      </button>
    </form>
  );
}
