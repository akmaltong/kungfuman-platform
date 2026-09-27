"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { parseImage, encodeImage } from "@/lib/content/schema";

// Загрузка в публичный бакет media → публичный URL.
async function uploadImage(file: File): Promise<string> {
  const supabase = createClient();
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `site/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

// Поле изображения: загрузка нового файла + кадрирование (точка фокуса).
// Пишет строку «url|posX|posY» в скрытый input с именем поля — форма
// раздела «Сайт» отправляет её как обычное значение.
export function ImageField({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: string;
}) {
  const init = parseImage(value);
  const [url, setUrl] = useState(init.url);
  const [x, setX] = useState(init.x);
  const [y, setY] = useState(init.y);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(file?: File) {
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      setUrl(await uploadImage(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-ink-muted bg-ink p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-neutral-300">{label}</span>
        <label className="cursor-pointer text-sm text-gold hover:underline">
          {busy ? "Загрузка…" : "Загрузить фото"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
      </div>

      {/* Превью с текущим кадрированием */}
      <div className="aspect-[16/9] w-full overflow-hidden border border-gold-dim bg-ink-lacquer">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: `${x}% ${y}%` }}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-neutral-500">
            нет фото
          </div>
        )}
      </div>

      {/* Кадрирование — точка фокуса */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-xs text-neutral-400">
          По горизонтали: {x}%
          <input
            type="range"
            min={0}
            max={100}
            value={x}
            onChange={(e) => setX(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </label>
        <label className="text-xs text-neutral-400">
          По вертикали: {y}%
          <input
            type="range"
            min={0}
            max={100}
            value={y}
            onChange={(e) => setY(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </label>
      </div>

      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}

      <input type="hidden" name={name} value={encodeImage({ url, x, y })} />
    </div>
  );
}
