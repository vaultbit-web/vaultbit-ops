"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, Check, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";

type Step = "email" | "code" | "success";

/**
 * Flujo de login en dos pasos:
 *
 *  1. Email → pide a Supabase un OTP (mismo email lleva código + magic link).
 *  2. Code  → el usuario escribe el código de 6 dígitos directamente en la app.
 *
 * Por qué OTP en vez de sólo magic link: en iOS una PWA instalada y Safari
 * son cookie-jars distintos. Si el usuario pulsa el magic link en Gmail,
 * Safari completa el callback pero la sesión queda fuera de la PWA. Con
 * OTP la sesión se establece en el mismo WebView de la PWA y entra directo.
 *
 * El magic link clicable sigue funcionando (vía /auth/callback) — útil en
 * desktop, donde no hay este problema.
 */
export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    initialError === "not_allowed"
      ? "Este email no tiene acceso al Centro de Operaciones."
      : null,
  );

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        // Mantenemos el magic link funcional para escritorio.
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        // NO provisionar identidades nuevas desde el login: el operador ya existe.
        // Con true, cualquiera podía crearse un usuario 'authenticated' y (mientras la
        // RLS autorice solo por rol) leer/escribir el CRM vía PostgREST saltándose la
        // allowlist. Complementa a: desactivar signups en Supabase Auth + RLS por identidad.
        shouldCreateUser: false,
      },
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanCode = code.replace(/\s+/g, "");
    if (cleanCode.length < 6) {
      setError("Introduce el código completo del email");
      return;
    }
    setPending(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: cleanCode,
      type: "email",
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("success");
    // Refresh para que el middleware vea la nueva sesión y el server-side
    // re-evalúe la página /dashboard.
    router.refresh();
    setTimeout(() => router.push("/dashboard"), 200);
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-6">
        <div className="rounded-full bg-success/15 p-3 border border-success/30">
          <Check className="h-6 w-6 text-success" strokeWidth={2} />
        </div>
        <p className="text-sm text-anthracite-100">Entrando…</p>
      </div>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setError(null);
          }}
          className="self-start inline-flex items-center gap-1 text-xs text-anthracite-400 hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
          Cambiar email
        </button>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="otp">Código del email</Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
            disabled={pending}
            autoFocus
            className="text-center text-lg tracking-[0.4em] font-mono"
          />
          <p className="text-[11px] text-anthracite-400">
            Te lo enviamos a <strong className="text-fg">{email}</strong>. Pega los dígitos que aparecen en el email.
          </p>
        </div>

        {error ? (
          <p className="text-xs text-error" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={pending} disabled={code.length < 6}>
          <KeyRound className="h-4 w-4" strokeWidth={1.5} />
          Entrar
        </Button>

        <button
          type="button"
          onClick={requestCode}
          disabled={pending}
          className="text-[11px] text-anthracite-400 hover:text-brand-400 transition-colors text-center disabled:opacity-50"
        >
          ¿No te ha llegado? Reenviar código
        </button>

        <p className="text-[10px] text-anthracite-400 text-center pt-2">
          También funciona el enlace clicable del email (sólo desktop).
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email autorizado</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@vaultbit.es"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
        />
      </div>

      {error ? (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" loading={pending} className="mt-2">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Mail className="h-4 w-4" strokeWidth={1.5} />}
        Enviarme código
      </Button>

      <p className="text-[11px] text-anthracite-400 text-center pt-2">
        Solo emails de la allowlist pueden entrar. Sin contraseñas.
      </p>
    </form>
  );
}
