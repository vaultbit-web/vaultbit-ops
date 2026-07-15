"use client";

import * as React from "react";
import { Mail, Check, Loader2, Pencil, X, AlertCircle } from "lucide-react";
import { updateQuoteClientEmail } from "~/lib/actions/quotes";
import { updateContractClientEmail } from "~/lib/actions/contracts";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface Props {
  channel: "quote" | "contract";
  id: string;
  currentEmail: string | null;
}

/**
 * Editor inline del email del cliente. Muestra:
 *   - Si hay email: el email + botón discreto "Editar"
 *   - Si NO hay email: aviso amarillo + form para añadirlo de un click
 *
 * Pensado para no obligar a borrar y rehacer un documento sólo porque
 * faltaba el email cuando se creó.
 */
export function ClientEmailEditor({ channel, id, currentEmail }: Props) {
  const [editing, setEditing] = React.useState(!currentEmail);
  const [value, setValue] = React.useState(currentEmail ?? "");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Indica un email");
      return;
    }
    startTransition(async () => {
      const action =
        channel === "quote" ? updateQuoteClientEmail : updateContractClientEmail;
      const res = await action(id, trimmed);
      if (!res.ok) {
        setError(res.error);
      } else {
        setSavedAt(Date.now());
        setEditing(false);
      }
    });
  }

  // Mensaje destacado cuando falta el email
  if (!currentEmail && editing) {
    return (
      <div className="card-dark border-l-2 border-warning p-4 flex flex-col gap-3 mb-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-fg">Falta el email del cliente</p>
            <p className="text-xs text-anthracite-300">
              Añádelo aquí para poder enviar el documento por correo. Si tienes el cliente en
              el CRM, edítalo allí también para que la próxima vez se autorrellene.
            </p>
          </div>
        </div>
        <form onSubmit={onSave} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="cliente@ejemplo.com"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={pending}
            required
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="md" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <Check className="h-4 w-4" strokeWidth={1.5} />
            )}
            Guardar
          </Button>
        </form>
        {error ? <p className="text-xs text-error">{error}</p> : null}
      </div>
    );
  }

  // Modo edición cuando ya había email
  if (editing) {
    return (
      <form onSubmit={onSave} className="flex items-center gap-2 mb-4">
        <Mail className="h-4 w-4 text-anthracite-400 shrink-0" strokeWidth={1.5} />
        <Input
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
          autoFocus
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <Check className="h-3.5 w-3.5" strokeWidth={1.5} />}
          Guardar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setValue(currentEmail ?? "");
            setEditing(false);
            setError(null);
          }}
          disabled={pending}
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Button>
        {error ? <span className="text-xs text-error">{error}</span> : null}
      </form>
    );
  }

  // Modo lectura — email actual + botón pequeño de editar
  return (
    <div className="flex items-center gap-2 mb-4 group">
      <Mail className="h-4 w-4 text-anthracite-400 shrink-0" strokeWidth={1.5} />
      <a
        href={`mailto:${currentEmail}`}
        className="text-sm text-anthracite-100 hover:text-brand-400 truncate"
      >
        {currentEmail}
      </a>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-anthracite-400 hover:text-brand-400 inline-flex items-center gap-1 text-[11px]"
      >
        <Pencil className="h-3 w-3" strokeWidth={1.5} />
        editar
      </button>
      {savedAt && Date.now() - savedAt < 2000 ? (
        <span className="text-[11px] text-success inline-flex items-center gap-1">
          <Check className="h-3 w-3" strokeWidth={2} /> guardado
        </span>
      ) : null}
    </div>
  );
}
