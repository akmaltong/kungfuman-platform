"use client";

import { useEffect, useState } from "react";

// Лёгкий плеер для превью-уроков на публичной странице: только загружает адрес
// с /api/media/sign и показывает embed. Без сохранения прогресса (для анонимов).
export function PreviewPlayer({ lessonId }: { lessonId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/media/sign?lesson=${lessonId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => alive && setUrl(d.url))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [lessonId]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-ink-muted bg-black">
      {url ? (
        <iframe
          src={url}
          className="h-full w-full"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          title="Превью"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-neutral-500">
          {error ? "Превью недоступно" : "Загрузка…"}
        </div>
      )}
    </div>
  );
}
