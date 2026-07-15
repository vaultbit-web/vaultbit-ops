"use client";

import * as React from "react";
import { Send, Loader2, X, Check, AlertCircle } from "lucide-react";
import { sendQuoteEmail, sendContractEmail } from "~/lib/actions/email";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/input";

interface Props {
  /** Tipo de documento a enviar */
  channel: "quote" | "contract";
  /** ID del quote o contract */
  id: string;
  /** Email del cliente — si está vacío, deshabilitamos el botón con mensaje */
  defaultTo: string | null;
  /** Subject por defecto (se puede editar antes de enviar) */
  defaultSubject?: string;
  /** Cuerpo por defecto */
  defaultBody?: string;
}

/**
 * Botón de envío con dialog de confirmación que permite editar
 * destinatario, asunto y cuerpo antes de disparar la Server Action.
 *
 * El envío real lo hace el server action via webhook n8n + SMTP Hostinger.
 * El PDF se adjunta automáticamente.
 */
export function EmailSendButton({
  channel,
  id,
  defaultTo,
  defaultSubject = "",
  defaultBody = "",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [to, setTo] = React.useState(defaultTo ?? "");
  const [subject, setSubject] = React.useState(defaultSubject);
  const [body, setBody] = React.useState(defaultBody);
  const [result, setResult] = React.useState<
    { ok: true } | { ok: false; error: string } | null
  >(null);

  React.useEffect(() => {
    if (open) {
      setTo(defaultTo ?? "");
      setSubject(defaultSubject);
      setBody(defaultBody);
      setResult(null);
    }
  }, [open, defaultTo, defaultSubject, defaultBody]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim()) {
      setResult({ ok: false, error: "Falta el email del destinatario" });
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res =
        channel === "quote"
          ? await sendQuoteEmail(id, subject, body)
          : await sendContractEmail(id, subject, body);
      setResult(res);
      if (res.ok) {
        setTimeout(() => setOpen(false), 1500);
      }
    });
  }

  const noEmail = !defaultTo;

  return (
    <>
      <Button
        type="button"
        size="md"
        variant="primary"
        onClick={() => setOpen(true)}
        disabled={noEmail}
        title={noEmail ? "Añade el email del cliente arriba para activar el envío" : undefined}
      >
        <Send className="h-4 w-4" strokeWidth={1.5} />
        {noEmail ? "Enviar por email · falta email" : "Enviar por email"}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-8">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => !pending && setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <form
            onSubmit={onSubmit}
            className="relative w-full max-w-xl card-dark p-0 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 border-b border-anthracite-600/30 px-5 py-4">
              <h3 className="text-base font-semibold text-fg">Enviar por email</h3>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="text-anthracite-400 hover:text-fg"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email-to">Destinatario</Label>
                <Input
                  id="email-to"
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                  disabled={pending}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email-subject">Asunto</Label>
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={pending}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email-body">Mensaje</Label>
                <textarea
                  id="email-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={9}
                  disabled={pending}
                  className="rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 py-2.5 text-sm text-fg resize-y leading-relaxed"
                />
              </div>
              <p className="text-[11px] text-anthracite-400">
                El PDF se adjunta automáticamente. Envío vía SMTP info@vaultbit.es a través de n8n.
              </p>

              {result?.ok === true ? (
                <div className="flex items-center gap-2 rounded-[10px] border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  <Check className="h-4 w-4" strokeWidth={2} />
                  Email enviado correctamente.
                </div>
              ) : null}
              {result?.ok === false ? (
                <div className="flex items-start gap-2 rounded-[10px] border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
                  <span>{result.error}</span>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-anthracite-600/30 px-5 py-4">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button type="submit" size="md" loading={pending}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Send className="h-4 w-4" strokeWidth={1.5} />
                )}
                Enviar ahora
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
