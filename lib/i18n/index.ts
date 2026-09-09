// Слой мультиязычности. Все пользовательские тексты хранятся в БД как JSONB
// {"ru":..,"tg":..,"en":..}. Здесь — хелпер для выбора строки по локали.

export type Locale = "ru" | "tg" | "en";

export const DEFAULT_LOCALE: Locale = "ru";
export const SUPPORTED_LOCALES: readonly Locale[] = ["ru", "tg", "en"] as const;

/** Локализованное значение из JSONB-колонки. */
export type Localized = Partial<Record<Locale, string>>;

/**
 * Возвращает строку на нужной локали с фолбэком на ru, затем на любую
 * непустую. Никогда не бросает и не возвращает undefined.
 */
export function t(
  value: Localized | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!value) return "";
  return (
    value[locale] ??
    value[DEFAULT_LOCALE] ??
    Object.values(value).find((v): v is string => Boolean(v)) ??
    ""
  );
}

/** Тип-гард поддерживаемой локали. */
export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
