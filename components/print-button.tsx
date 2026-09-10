"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Печать / Сохранить PDF" }: { label?: string }) {
  return (
    <Button type="button" onClick={() => window.print()} className="print:hidden">
      {label}
    </Button>
  );
}
