"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Method = "phone" | "email";
type Step = "request" | "verify" | "sent";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

// Вход по телефону + OTP (основной сценарий для Худжанда), email — запасной.
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [method, setMethod] = useState<Method>("phone");
  const [step, setStep] = useState<Step>("request");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const supabase = createClient();

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } =
      method === "phone"
        ? await supabase.auth.signInWithOtp({ phone: contact })
        : await supabase.auth.signInWithOtp({
            email: contact,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            },
          });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Телефон — ввод кода из SMS; email — переход по ссылке из письма.
    setStep(method === "phone" ? "verify" : "sent");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp(
      method === "phone"
        ? { phone: contact, token: code, type: "sms" }
        : { email: contact, token: code, type: "email" },
    );
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[400px] flex-col justify-center px-6">
      <div className="text-center">
        <Link
          href="/"
          className="text-[15px] text-gold hover:text-gold-soft"
        >
          Академия Kungfuman
        </Link>
        <h1 className="mt-2 font-serif text-[30px] font-bold text-paper">Вход</h1>
      </div>

      <div className="mt-8 border border-gold-dim bg-ink p-6">
        {/* Переключатель способа */}
        <div className="mb-4 flex gap-2">
          {(["phone", "email"] as Method[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMethod(m);
                setStep("request");
                setError(null);
              }}
              className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${
                method === m
                  ? "border-gold bg-gold text-ink"
                  : "border-gold-dim text-paper-muted"
              }`}
            >
              {m === "phone" ? "Телефон" : "Email"}
            </button>
          ))}
        </div>

        {step === "request" ? (
          <form onSubmit={requestCode} className="space-y-3">
            <Input
              id="contact"
              type={method === "phone" ? "tel" : "email"}
              inputMode={method === "phone" ? "tel" : "email"}
              placeholder={method === "phone" ? "+992 XX XXX XX XX" : "you@example.com"}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full"
              required
            />
            <Button type="submit" className="w-full py-2.5" disabled={busy}>
              {busy
                ? "Отправляем…"
                : method === "phone"
                  ? "Получить код"
                  : "Получить ссылку"}
            </Button>
          </form>
        ) : step === "verify" ? (
          <form onSubmit={verifyCode} className="space-y-3">
            <p className="text-sm text-paper-muted">
              Код отправлен на {contact}
            </p>
            <Input
              id="code"
              inputMode="numeric"
              placeholder="Код из сообщения"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full"
              required
            />
            <Button type="submit" className="w-full py-2.5" disabled={busy}>
              {busy ? "Проверяем…" : "Войти"}
            </Button>
            <button
              type="button"
              onClick={() => setStep("request")}
              className="w-full text-center text-sm text-paper-muted hover:text-gold"
            >
              Изменить {method === "phone" ? "номер" : "email"}
            </button>
          </form>
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-sm text-paper">
              Ссылка для входа отправлена на{" "}
              <span className="text-paper">{contact}</span>.
            </p>
            <p className="text-sm text-paper-muted">
              Откройте письмо и нажмите «Sign in» — вход произойдёт
              автоматически. Если письма нет, проверьте «Спам».
            </p>
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setError(null);
              }}
              className="w-full text-center text-sm text-paper-muted hover:text-gold"
            >
              Изменить email
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      <p className="mt-6 text-center text-sm text-paper-muted">
        Впервые у нас?{" "}
        <Link href="/trial" className="text-gold hover:underline">
          Записаться на пробное
        </Link>
      </p>
      <p className="mt-3 text-center text-sm">
        <Link href="/" className="text-paper-muted hover:text-gold">
          ← На главную
        </Link>
      </p>
    </main>
  );
}
