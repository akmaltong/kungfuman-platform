import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUser } from "@/lib/supabase/context";
import { t, type Localized } from "@/lib/i18n";
import { isCourseComplete } from "@/lib/domain/courses";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { supabase, userId } = await requireUser();
  const client = supabase as unknown as SupabaseClient;

  const [{ data: course }, { data: profile }] = await Promise.all([
    client.from("courses").select("id, title").eq("id", courseId).maybeSingle(),
    client.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
  ]);
  if (!course) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center text-neutral-400">
        Курс не найден.
      </main>
    );
  }

  // Все уроки курса и прогресс ученика.
  const { data: modules } = await client
    .from("course_modules")
    .select("id")
    .eq("course_id", courseId);
  const moduleIds = ((modules ?? []) as { id: string }[]).map((m) => m.id);
  const { data: lessons } = moduleIds.length
    ? await client.from("lessons").select("id, is_preview").in("module_id", moduleIds)
    : { data: [] };
  const lessonList = (lessons ?? []) as { id: string; is_preview: boolean }[];
  const { data: progress } = await client
    .from("lesson_progress")
    .select("lesson_id, status")
    .eq("profile_id", userId);
  const progressList = (progress ?? []) as {
    lesson_id: string;
    status: "not_started" | "in_progress" | "completed";
  }[];

  const complete = isCourseComplete(lessonList, progressList);
  const fullName =
    (profile as { full_name?: string | null } | null)?.full_name ?? "Ученик";
  const courseTitle = t((course as { title: Localized }).title);

  if (!complete) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-neutral-300">
          Сертификат станет доступен после прохождения всех уроков курса.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-gold hover:underline">
          ← В кабинет
        </Link>
      </main>
    );
  }

  const today = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* Сам сертификат — печатается на белом фоне */}
      <div className="mx-auto max-w-2xl border-4 border-gold-deep bg-white p-12 text-center text-neutral-900 print:border-2">
        <div className="text-sm uppercase tracking-[0.3em] text-gold-deep">
          Академия Kungfuman · Худжанд
        </div>
        <h1 className="mt-6 text-3xl font-semibold">Сертификат</h1>
        <p className="mt-6 text-neutral-600">настоящим подтверждается, что</p>
        <p className="mt-2 text-2xl font-semibold">{fullName}</p>
        <p className="mt-4 text-neutral-600">прошёл(-ла) курс</p>
        <p className="mt-2 text-xl font-medium text-gold-deep">«{courseTitle}»</p>
        <p className="mt-8 text-sm text-neutral-500">{today}</p>
      </div>

      <div className="mt-6 text-center">
        <PrintButton />
      </div>
    </main>
  );
}
