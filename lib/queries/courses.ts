import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { bySortOrder } from "@/lib/domain/curriculum";
import type { Localized } from "@/lib/i18n";

export interface PublicLesson {
  id: string;
  title: Localized;
  is_preview: boolean;
  duration_min: number | null;
}
export interface PublicModule {
  id: string;
  title: Localized;
  lessons: PublicLesson[];
}
export interface PublicCourse {
  id: string;
  slug: string;
  title: Localized;
  description: Localized;
  modules: PublicModule[];
  price: { amount_minor: number; currency: string } | null;
}

export interface FreeLesson {
  lessonId: string;
  title: Localized;
  duration_min: number | null;
  courseSlug: string;
  courseTitle: Localized;
}

// Все превью-уроки опубликованных курсов — витрина «Бесплатные уроки».
// Читается server-side admin-клиентом; воспроизведение превью открыто анонимам
// (RLS + /api/media/sign).
export async function getFreeLessons(): Promise<FreeLesson[]> {
  let admin: SupabaseClient;
  try {
    admin = createAdminClient() as unknown as SupabaseClient;
  } catch {
    return [];
  }

  const { data: courses } = await admin
    .from("courses")
    .select("id, slug, title")
    .eq("status", "published");
  const courseList = (courses ?? []) as {
    id: string;
    slug: string;
    title: Localized;
  }[];
  if (courseList.length === 0) return [];

  const { data: modules } = await admin
    .from("course_modules")
    .select("id, course_id")
    .in(
      "course_id",
      courseList.map((c) => c.id),
    );
  const moduleList = (modules ?? []) as { id: string; course_id: string }[];
  if (moduleList.length === 0) return [];
  const courseByModule = new Map(moduleList.map((m) => [m.id, m.course_id]));

  const { data: lessons } = await admin
    .from("lessons")
    .select("id, module_id, title, duration_min, sort_order, is_preview")
    .eq("is_preview", true)
    .in(
      "module_id",
      moduleList.map((m) => m.id),
    );

  const courseById = new Map(courseList.map((c) => [c.id, c]));
  return ((lessons ?? []) as {
    id: string;
    module_id: string;
    title: Localized;
    duration_min: number | null;
  }[]).flatMap((l) => {
    const courseId = courseByModule.get(l.module_id);
    const course = courseId ? courseById.get(courseId) : undefined;
    if (!course) return [];
    return [
      {
        lessonId: l.id,
        title: l.title,
        duration_min: l.duration_min,
        courseSlug: course.slug,
        courseTitle: course.title,
      },
    ];
  });
}

// Полная витрина опубликованного курса (включая «закрытые» уроки — только
// заголовки и флаг превью). Читается server-side admin-клиентом, чтобы показать
// программу целиком; воспроизведение по-прежнему только для превью или после
// покупки (RLS + /api/media/sign). См. DECISIONS.
export async function getPublicCourse(
  slug: string,
): Promise<PublicCourse | null> {
  let admin: SupabaseClient;
  try {
    admin = createAdminClient() as unknown as SupabaseClient;
  } catch {
    return null;
  }

  const { data: course } = await admin
    .from("courses")
    .select("id, slug, title, description, school_id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!course) return null;
  const c = course as {
    id: string;
    slug: string;
    title: Localized;
    description: Localized;
    school_id: string;
  };

  const { data: modulesData } = await admin
    .from("course_modules")
    .select("id, title, sort_order")
    .eq("course_id", c.id);
  const modules = ((modulesData ?? []) as {
    id: string;
    title: Localized;
    sort_order: number;
  }[]);
  const moduleIds = modules.map((m) => m.id);

  const { data: lessonsData } = moduleIds.length
    ? await admin
        .from("lessons")
        .select("id, module_id, title, is_preview, duration_min, sort_order")
        .in("module_id", moduleIds)
    : { data: [] };
  const lessons = (lessonsData ?? []) as {
    id: string;
    module_id: string;
    title: Localized;
    is_preview: boolean;
    duration_min: number | null;
    sort_order: number;
  }[];

  // Цена: продукт, привязанный к курсу, в валюте школы.
  const { data: school } = await admin
    .from("schools")
    .select("currency")
    .eq("id", c.school_id)
    .maybeSingle();
  const currency = (school as { currency?: string } | null)?.currency ?? "TJS";

  const { data: products } = await admin
    .from("products")
    .select("id")
    .eq("course_id", c.id)
    .eq("is_active", true);
  const productIds = ((products ?? []) as { id: string }[]).map((p) => p.id);
  let price: { amount_minor: number; currency: string } | null = null;
  if (productIds.length) {
    const { data: prices } = await admin
      .from("product_prices")
      .select("amount_minor, currency")
      .in("product_id", productIds)
      .eq("currency", currency)
      .eq("is_active", true)
      .limit(1);
    const pr = (prices ?? [])[0] as { amount_minor: number; currency: string } | undefined;
    if (pr) price = pr;
  }

  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    price,
    modules: bySortOrder(modules).map((m) => ({
      id: m.id,
      title: m.title,
      lessons: bySortOrder(lessons.filter((l) => l.module_id === m.id)).map(
        (l) => ({
          id: l.id,
          title: l.title,
          is_preview: l.is_preview,
          duration_min: l.duration_min,
        }),
      ),
    })),
  };
}
