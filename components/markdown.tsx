import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Рендер Markdown для статей блога и т.п.
// Поддерживает: заголовки, списки, жирный/курсив, цитаты, код, кликабельные
// ссылки, картинки (![](url)) и авто-встраивание видео (ссылка на YouTube/VK/
// Kinescope превращается в плеер). Сырой HTML НЕ рендерится (безопасно).

// Ссылка на известный видеохостинг → embed-URL, иначе null.
function videoEmbed(href: string): string | null {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = u.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "vk.com" || host === "vkvideo.ru") {
    const m = u.pathname.match(/video(-?\d+)_(\d+)/);
    return m ? `https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}` : null;
  }
  if (host === "kinescope.io") {
    const id = u.pathname.replace(/^\/(embed\/)?/, "").split("/")[0];
    return id ? `https://kinescope.io/embed/${id}` : null;
  }
  return null;
}

// span+block, чтобы валидно вкладываться внутрь <p> (iframe как inline-элемент).
function VideoFrame({ src }: { src: string }) {
  return (
    <span className="my-4 block aspect-video w-full overflow-hidden rounded-lg border border-ink-muted">
      <iframe
        src={src}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
      />
    </span>
  );
}

const components: Components = {
  h1: ({ children }) => (
    <h2 className="mt-8 font-serif text-[26px] font-bold text-gold">{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 font-serif text-[26px] font-bold text-gold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 font-serif text-[21px] font-bold text-paper">{children}</h3>
  ),
  p: ({ children }) => <p className="text-[17px] leading-[1.7]">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc space-y-1 pl-6">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-1 pl-6">{children}</ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-gold/50 pl-4 font-serif italic text-paper-muted">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-ink-muted px-1.5 py-0.5 font-mono text-sm text-gold">
      {children}
    </code>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-paper">{children}</strong>
  ),
  hr: () => <hr className="border-ink-muted" />,
  img: ({ src, alt }) =>
    typeof src === "string" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ""}
        loading="lazy"
        className="my-4 w-full rounded-lg border border-ink-muted"
      />
    ) : null,
  a: ({ href, children }) => {
    const embed = href ? videoEmbed(href) : null;
    if (embed) return <VideoFrame src={embed} />;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold underline decoration-gold/40 underline-offset-2 hover:decoration-gold"
      >
        {children}
      </a>
    );
  },
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-4 text-paper">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
