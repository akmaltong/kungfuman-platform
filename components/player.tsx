"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { completeLesson, saveLessonProgress } from "@/lib/actions/lessons";
import { Button } from "@/components/ui/button";

// Плеер урока: тянет адрес воспроизведения с /api/media/sign (прямой URL
// исходника клиенту не отдаётся), шлёт хартбит прогресса раз в 15 секунд.
export function Player({
  lessonId,
  durationSec,
}: {
  lessonId: string;
  durationSec: number | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/media/sign?lesson=${lessonId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => alive && setUrl(d.url))
      .catch(() => alive && setError("Видео недоступно"));
    return () => {
      alive = false;
    };
  }, [lessonId]);

  // Хартбит прогресса, пока урок открыт.
  useEffect(() => {
    if (!url) return;
    const id = setInterval(() => {
      void saveLessonProgress(lessonId, 15, durationSec);
    }, 15_000);
    return () => clearInterval(id);
  }, [url, lessonId, durationSec]);

  return (
    <div>
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-ink-muted bg-black">
        {url ? (
          <iframe
            src={url}
            className="h-full w-full"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            title="Урок"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-500">
            {error ?? "Загрузка видео…"}
          </div>
        )}
      </div>
      <div className="mt-3">
        <Button
          type="button"
          onClick={async () => {
            await completeLesson(lessonId);
            router.refresh();
          }}
        >
          Отметить пройденным
        </Button>
      </div>
    </div>
  );
}
