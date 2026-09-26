import type { ReactNode } from "react";

// Единая шапка публичных страниц в дизайн-языке школы:
// золотой надзаголовок, крупный serif-заголовок, serif-подзаголовок.
// `aside` — правый слот (например, переключатель языка).
export function PageHeader({
  eyebrow = "Академия Kungfuman",
  title,
  subtitle,
  aside,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="pt-10">
      {aside && <div className="mb-5 flex justify-end">{aside}</div>}
      <p className="mb-3 text-[15px] text-gold">{eyebrow}</p>
      <h1 className="font-serif text-[40px] font-bold leading-[1.05] text-paper sm:text-[48px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 max-w-[36em] font-serif text-[19px] leading-[1.55] text-paper-muted">
          {subtitle}
        </p>
      )}
    </header>
  );
}
