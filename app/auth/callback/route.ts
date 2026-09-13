import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Обмен кода из письма (magic-link) на сессию и переход в кабинет.
// На бесплатном плане Supabase шлёт письмо со ссылкой (не код), поэтому
// email-вход завершается здесь, а не вводом кода на /login.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  // Разрешаем только относительные пути — защита от open redirect.
  const next = nextParam.startsWith("/") ? nextParam : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
