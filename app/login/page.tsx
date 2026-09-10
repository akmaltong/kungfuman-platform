"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Method = "phone" | "email";
type Step = "request" | "verify";

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
        : await supabase.auth.signInWithOtp({ email: contact });
    setBusy(false);
    if (error) setError(error.message);
    else setStep("verify");
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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="text-center">
        <div className="text-sm uppercase tracking-[0.3em] text-gold">
          Академия Kungfuman
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-100">Вход</h1>
      </div>

      <div className="mt-8 rounded-lg border border-ink-muted bg-ink-soft p-6">
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
                  : "border-ink-muted text-neutral-300"
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
              {busy ? "Отправляем…" : "Получить код"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-3">
            <p className="text-sm text-neutral-400">
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
              className="w-full text-center text-sm text-neutral-500 hover:text-neutral-300"
            >
              Изменить {method === "phone" ? "номер" : "email"}
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Впервые у нас?{" "}
        <a href="/trial" className="text-gold hover:underline">
          Записаться на пробное
        </a>
      </p>
    </main>
  );
}
