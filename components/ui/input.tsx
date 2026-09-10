import * as React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`rounded-md border border-ink-muted bg-ink px-3 py-1.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-gold/60 ${className}`}
      {...props}
    />
  );
});
