import * as React from "react";

// Минимальная кнопка в айдентике Kungfuman (без shadcn CLI).
type Variant = "primary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-gold text-ink hover:bg-gold-soft",
  ghost: "border border-ink-muted text-neutral-200 hover:border-gold/50",
  danger: "border border-red-500/40 text-red-300 hover:bg-red-500/10",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ className = "", variant = "primary", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
});
