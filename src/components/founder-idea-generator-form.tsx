"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { generateFounderIdeasBatch } from "~/lib/actions/founder";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/input";

const ARCHETYPE_OPTIONS = [
  { value: "", label: "Cualquiera (mezcla)" },
  { value: "security", label: "Seguridad / custodia" },
  { value: "fiscal", label: "Fiscalidad cripto" },
  { value: "inheritance", label: "Herencia digital" },
  { value: "business", label: "Web3 B2B" },
];

const COUNT_OPTIONS = [10, 20, 30, 50];

export function FounderIdeaGeneratorForm() {
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
      const res = await generateFounderIdeasBatch(fd);
      if (!res.ok) {
        setFeedback({ tone: "error", message: res.error });
        return;
      }
      setFeedback({
        tone: "success",
        message: `Generadas ${res.inserted} ideas con ${res.modelUsed}. Las verás abajo en estado "Sin filtrar". Marca las que pasen el filtro 5/8 como ganadoras.`,
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
        <Sparkles className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
        <h2 className="text-base font-semibold text-fg tracking-tight">
          Generar lote de ideas
        </h2>
      </div>
      <p className="text-sm text-anthracite-200 -mt-2">
        Gemini Pro genera ideas brutas siguiendo la metodología Víctor Eras
        (filtro 5/50, paradigma contracorriente, polémica controlada). Cada
        idea viene con score 0-8 y check de compliance VaultBit.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="count">Cantidad</Label>
          <select
            id="count"
            name="count"
            defaultValue={20}
            disabled={pending}
            className="h-11 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 text-sm text-fg focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40 disabled:opacity-60"
          >
            {COUNT_OPTIONS.map((n) => (
              <option key={n} value={n} className="bg-anthracite-900">
                {n} ideas
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
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
                key={opt.value || "any"}
                value={opt.value}
                className="bg-anthracite-900"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="extraContext">Contexto extra (opcional)</Label>
        <Input
          id="extraContext"
          name="extraContext"
          placeholder='Ej: "esta semana toca herencia", "tras un caso real de cliente que perdió la frase semilla"'
          disabled={pending}
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-[11px] text-anthracite-400">
          {pending
            ? "Gemini Pro está pensando: 30-60 segundos."
            : "Modelo: Gemini 2.5 Pro · tier gratis: 5 RPM, 100 RPD"}
        </span>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
          )}
          {pending ? "Generando…" : "Generar ideas"}
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
