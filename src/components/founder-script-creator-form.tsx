"use client";

import * as React from "react";
import { Loader2, Wand2 } from "lucide-react";
import { generateScriptFromTopic } from "~/lib/actions/founder";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/input";
import {
  FOUNDER_FORMATS,
  FOUNDER_FORMAT_LABELS,
  type FounderFormat,
} from "~/lib/supabase/types";

const ARCHETYPE_OPTIONS = [
  { value: "", label: "Auto" },
  { value: "security", label: "Seguridad" },
  { value: "fiscal", label: "Fiscal" },
  { value: "inheritance", label: "Herencia" },
  { value: "business", label: "B2B" },
];

export function FounderScriptCreatorForm() {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pending, startTransition] = React.useTransition();
  const [feedback, setFeedback] = React.useState<
    | { tone: "success"; message: string }
    | { tone: "error"; message: string }
    | null
  >(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await generateScriptFromTopic(fd);
      if (!res.ok) {
        setFeedback({ tone: "error", message: res.error });
        return;
      }
      setFeedback({
        tone: "success",
        message: `Guion generado con ${res.modelUsed}. Aparece arriba en estado "Guion".`,
      });
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="card-dark p-5 sm:p-6 flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
        <h2 className="text-base font-semibold text-fg tracking-tight">
          Guion directo desde tema libre
        </h2>
      </div>
      <p className="text-sm text-anthracite-200 -mt-2">
        Si ya tienes un tema en mente y no quieres pasar por el banco de
        ideas, escríbelo y Gemini Pro genera un guion completo (gancho,
        contexto, moraleja, CTA con palabra clave, hashtags y compliance).
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="theme">Tema o gancho central *</Label>
        <Input
          id="theme"
          name="theme"
          required
          placeholder='Ej: "El error de un médico jubilado con 1.4M€ en Bitcoin"'
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="archetype">Arquetipo</Label>
          <select
            id="archetype"
            name="archetype"
            defaultValue=""
            disabled={pending}
            className="h-11 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 text-sm text-fg focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:opacity-60"
          >
            {ARCHETYPE_OPTIONS.map((opt) => (
              <option
                key={opt.value || "auto"}
                value={opt.value}
                className="bg-anthracite-900"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="format">Formato</Label>
          <select
            id="format"
            name="format"
            defaultValue=""
            disabled={pending}
            className="h-11 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 text-sm text-fg focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:opacity-60"
          >
            <option value="" className="bg-anthracite-900">
              Auto (recomienda Gemini)
            </option>
            {FOUNDER_FORMATS.map((f) => (
              <option
                key={f}
                value={f}
                className="bg-anthracite-900"
              >
                {FOUNDER_FORMAT_LABELS[f as FounderFormat]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="extraContext">Contexto extra (opcional)</Label>
        <textarea
          id="extraContext"
          name="extraContext"
          rows={2}
          maxLength={1000}
          placeholder="Notas, datos de un caso real anonimizado, ángulo concreto que quieras subrayar..."
          disabled={pending}
          className="w-full rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 py-2.5 text-sm text-fg placeholder:text-anthracite-400 focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:opacity-60 resize-y"
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-[11px] text-anthracite-400">
          {pending ? "Gemini Pro redactando: 30-60 segundos." : null}
        </span>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Wand2 className="h-4 w-4" strokeWidth={1.5} />
          )}
          {pending ? "Generando…" : "Generar guion"}
        </Button>
      </div>

      {feedback ? (
        <div
          role="status"
          className={`rounded-[10px] border px-3 py-2.5 text-sm ${
            feedback.tone === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-error/10 border-error/30 text-error"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
    </form>
  );
}
