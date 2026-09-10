import "server-only";

import { cookies, headers } from "next/headers";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n";

// Определение локали: выбор пользователя (cookie) → язык браузера → ru.
// Path-роутинг /[locale]/ — задел на будущее (см. DECISIONS), пока cookie/гео.
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie && isLocale(fromCookie)) return fromCookie;

  const accept = (await headers()).get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isLocale(code)) return code as Locale;
  }
  return DEFAULT_LOCALE;
}
