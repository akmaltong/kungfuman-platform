import { parseImage } from "@/lib/content/schema";

// Изображение из редактируемого контента: применяет точку фокуса
// (кадрирование) через object-position. Пустой url → ничего не рендерит.
export function ContentImage({
  value,
  alt,
  className,
}: {
  value: string;
  alt: string;
  className?: string;
}) {
  const img = parseImage(value);
  if (!img.url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={img.url}
      alt={alt}
      className={`object-cover ${className ?? ""}`}
      style={{ objectPosition: `${img.x}% ${img.y}%` }}
    />
  );
}
