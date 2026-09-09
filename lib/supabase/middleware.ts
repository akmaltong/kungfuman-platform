import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";

// Обновляет сессию Supabase и разводит пользователей по ролям.
//
// Правила маршрутизации:
//   - неавторизованный на защищённом маршруте → /login
//   - student → пространство (student)
//   - instructor/admin/owner → пространство (staff)
//
// Пути route-групп (student)/(staff) не видны в URL, поэтому логические
// префиксы фиксируем здесь явными путями.
const STAFF_PREFIXES = [
  "/students",
  "/groups",
  "/sessions",
  "/attendance",
  "/payments",
  "/curriculum",
  "/leads",
];
const STUDENT_PREFIXES = ["/dashboard", "/schedule", "/progress", "/learn"];
const PUBLIC_PREFIXES = ["/login", "/courses", "/school"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/" || PUBLIC_PREFIXES.some((p) => path.startsWith(p));
  const isStaffArea = STAFF_PREFIXES.some((p) => path.startsWith(p));
  const isStudentArea = STUDENT_PREFIXES.some((p) => path.startsWith(p));

  // Неавторизованный на защищённом маршруте → на вход.
  if (!user && (isStaffArea || isStudentArea)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Разведение по ролям.
  if (user && (isStaffArea || isStudentArea)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (profile as { role?: string } | null)?.role ?? "student";
    const isStaff =
      role === "instructor" || role === "admin" || role === "owner";

    if (isStaffArea && !isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    if (isStudentArea && isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/students";
      return NextResponse.redirect(url);
    }
  }

  void isPublic;
  return response;
}
