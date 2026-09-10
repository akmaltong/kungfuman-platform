"use client";

import { useRouter } from "next/navigation";

import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

const LABELS: Record<Locale, string> = { ru: "RU", tg: "TJ", en: "EN" };
const LOCALES: Locale[] = ["ru", "tg", "en"];

// Переключатель языка: пишет cookie и перезагружает страницу (серверные
// компоненты перечитают локаль).
export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter();

  function set(locale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            current === l
              ? "bg-gold text-ink"
              : "border border-ink-muted text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
