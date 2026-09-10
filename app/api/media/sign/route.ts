import { type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface MediaAsset {
  provider: string;
  external_id: string;
}

// Возвращает адрес для воспроизведения видео урока. Доступ проверяет RLS: если
// урок не читается текущим пользователем (не превью и курс не куплен), выборка
// пуста → 403. Прямой URL исходника клиенту не отдаётся.
//
// ВНИМАНИЕ: для Kinescope здесь должна стоять генерация подписанного токена
// через их API (KINESCOPE_API_TOKEN). Пока возвращается embed-адрес —
// см. DECISIONS. Заменить на реальную подпись при подключении аккаунта.
function playbackUrl(asset: MediaAsset): string | null {
  switch (asset.provider) {
    case "kinescope":
      return `https://kinescope.io/embed/${asset.external_id}`;
    case "youtube":
      return `https://www.youtube.com/embed/${asset.external_id}`;
    case "vk_video":
      return `https://vk.com/video_ext.php?oid=${asset.external_id}`;
    default:
      return null;
  }
}

export async function GET(request: NextRequest) {
  const lessonId = request.nextUrl.searchParams.get("lesson");
  if (!lessonId) {
    return Response.json({ error: "no lesson" }, { status: 400 });
  }

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data: lesson } = await supabase
    .from("lessons")
    .select("media_asset_id")
    .eq("id", lessonId)
    .maybeSingle();

  const mediaId = (lesson as { media_asset_id?: string | null } | null)
    ?.media_asset_id;
  if (!mediaId) {
    // Урок недоступен (RLS) или без видео.
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: asset } = await supabase
    .from("media_assets")
    .select("provider, external_id")
    .eq("id", mediaId)
    .maybeSingle();
  if (!asset) {
    return Response.json({ error: "no media" }, { status: 404 });
  }

  const url = playbackUrl(asset as MediaAsset);
  if (!url) return Response.json({ error: "unsupported" }, { status: 415 });

  return Response.json(
    { url },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
