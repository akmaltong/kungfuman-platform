import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLead } from "./actions";

export const dynamic = "force-dynamic";

export default async function TrialPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="text-center">
        <div className="text-sm uppercase tracking-[0.3em] text-gold">
          Худжанд
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-neutral-100">
          Пробное занятие
        </h1>
        <p className="mt-3 text-neutral-400">
          Оставь номер — мы напишем в WhatsApp и подберём удобное время.
        </p>
      </div>

      {ok ? (
        <div className="mt-8 rounded-lg border border-gold/40 bg-ink-soft p-6 text-center">
          <p className="text-neutral-100">Спасибо! Мы свяжемся с тобой.</p>
          <Link
            href="/program"
            className="mt-3 inline-block text-sm text-gold hover:underline"
          >
            Пока посмотри программу →
          </Link>
        </div>
      ) : (
        <form
          action={createLead}
          className="mt-8 space-y-3 rounded-lg border border-ink-muted bg-ink-soft p-6"
        >
          <Input id="full_name" name="full_name" placeholder="Как тебя зовут" className="w-full" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="+992 XX XXX XX XX"
            className="w-full"
            required
          />
          {/* honeypot — скрыто от людей, ловит ботов */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          <Button type="submit" className="w-full py-2.5">
            Записаться
          </Button>
          <p className="text-center text-xs text-neutral-500">
            Или напиши напрямую в{" "}
            <a
              href="https://wa.me/992000000000"
              className="text-gold hover:underline"
            >
              WhatsApp
            </a>
          </p>
        </form>
      )}
    </main>
  );
}
