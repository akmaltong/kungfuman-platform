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
    <main className="mx-auto flex min-h-[80vh] max-w-[440px] flex-col justify-center px-6">
      <div className="text-center">
        <p className="text-[15px] text-gold">Академия Kungfuman · Худжанд</p>
        <h1 className="mt-2 font-serif text-[34px] font-bold leading-[1.1] text-paper">
          Пробное занятие
        </h1>
        <p className="mt-3 text-[16px] leading-[1.55] text-paper-muted">
          Оставьте номер — мы напишем в WhatsApp и подберём удобное время.
        </p>
      </div>

      {ok ? (
        <div className="mt-8 border border-gold bg-ink-lacquer p-6 text-center">
          <p className="text-[17px] text-paper">Спасибо! Мы свяжемся с вами.</p>
          <Link
            href="/program"
            className="mt-3 inline-block text-[15px] text-gold hover:underline"
          >
            Пока посмотрите программу →
          </Link>
        </div>
      ) : (
        <form
          action={createLead}
          className="mt-8 space-y-3 border border-gold-dim bg-ink p-6"
        >
          <Input
            id="full_name"
            name="full_name"
            placeholder="Как вас зовут"
            className="w-full"
          />
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
          <p className="text-center text-[13px] text-paper-muted">
            Или напишите напрямую в{" "}
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
