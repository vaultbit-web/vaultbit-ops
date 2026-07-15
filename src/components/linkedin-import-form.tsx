"use client";

import * as React from "react";
import { Loader2, Upload, FileArchive } from "lucide-react";
import { importLinkedInZip } from "~/lib/actions/linkedin";
import { Button } from "./ui/button";

export function LinkedInImportForm() {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pending, startTransition] = React.useTransition();
  const [filename, setFilename] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<
    | { tone: "success"; message: string }
    | { tone: "error"; message: string }
    | null
  >(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!file || !(file instanceof File) || file.size === 0) {
      setFeedback({ tone: "error", message: "Selecciona un archivo (.zip o .csv)" });
      return;
    }
    startTransition(async () => {
      const res = await importLinkedInZip(fd);
      if (!res.ok) {
        setFeedback({ tone: "error", message: res.error });
        return;
      }
      setFeedback({
        tone: "success",
        message: `Importados ${res.total} contactos · ${res.relevant} relevantes · ${res.review} pendiente review · ${res.irrelevant} descartados · ${res.with_history} con historial de mensajes.`,
      });
      setFilename(null);
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
        <FileArchive className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
        <h2 className="text-base font-semibold text-fg tracking-tight">
          Importar export de LinkedIn
        </h2>
      </div>
      <p className="text-sm text-anthracite-200 -mt-2">
        Sube el ZIP completo de tu export (recomendado, contiene
        Connections.csv y messages.csv) o solo Connections.csv suelto.
        Máximo 50MB. Solo procesamos esos dos archivos del ZIP — el resto
        (Profile, Education, etc.) se ignora.
      </p>

      <label
        htmlFor="linkedin-file"
        className="flex flex-col gap-2 rounded-[10px] border-2 border-dashed border-anthracite-600/60 px-4 py-6 cursor-pointer hover:border-brand-500/50 transition-colors"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-anthracite-200">
          <Upload className="h-4 w-4" strokeWidth={1.5} />
          <span>
            {filename
              ? `Archivo seleccionado: ${filename}`
              : "Arrastra el archivo aquí o haz clic para seleccionar"}
          </span>
        </div>
        <input
          id="linkedin-file"
          name="file"
          type="file"
          accept=".zip,.csv"
          disabled={pending}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFilename(f?.name ?? null);
            setFeedback(null);
          }}
        />
      </label>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-[11px] text-anthracite-400">
          {pending
            ? "Parseando ZIP, cruzando con historial de mensajes y clasificando con heurística…"
            : "Heurística gratis primero. Para refinar los marcados como 'review' usa el botón de Gemini abajo."}
        </span>
        <Button type="submit" disabled={pending || !filename}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Upload className="h-4 w-4" strokeWidth={1.5} />
          )}
          {pending ? "Importando…" : "Importar contactos"}
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
