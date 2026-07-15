"use client";

import * as React from "react";
import { Send, Loader2, X, Check, AlertCircle, FileText, ExternalLink } from "lucide-react";
import {
  getDiagnosisDefaults,
  sendDiagnosisEmail,
} from "~/lib/actions/diagnosis-email";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/input";

interface Props {
  leadId: string;
  /** Email del lead. Si está vacío deshabilitamos el botón. */
  defaultTo: string | null;
}

interface ModalState {
  loading: boolean;
  loadError: string | null;
  to: string;
  subject: string;
  body: string;
  hasDrafts: boolean;
  alreadySentAt: string | null;
  forceResend: boolean;
}

const initialModal: ModalState = {
  loading: true,
  loadError: null,
  to: "",
  subject: "",
  body: "",
  hasDrafts: false,
  alreadySentAt: null,
  forceResend: false,
};

/**
 * Botón "Enviar diagnóstico" + modal con preview editable.
 *
 * Carga defaults desde server action `getDiagnosisDefaults` al abrir.
 * El subject y el body se generan desde el composer y se pueden editar
 * antes de enviar. Incluye link a la vista previa del PDF.
 */
export function DiagnosisSendButton({ leadId, defaultTo }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [state, setState] = React.useState<ModalState>(initialModal);
  const [result, setResult] = React.useState<
    { ok: true } | { ok: false; error: string } | null
  >(null);

  React.useEffect(() => {
    if (!open) {
      setState(initialModal);
      setResult(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await getDiagnosisDefaults(leadId);
      if (cancelled) return;
      if (!res.ok) {
        setState({ ...initialModal, loading: false, loadError: res.error });
        return;
      }
      setState({
        loading: false,
        loadError: null,
        to: res.to,
        subject: res.subject,
        body: res.body,
        hasDrafts: res.hasDrafts,
        alreadySentAt: res.alreadySentAt,
        forceResend: false,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [open, leadId]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.to.trim()) {
      setResult({ ok: false, error: "Falta el email del destinatario" });
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await sendDiagnosisEmail(
        leadId,
        state.subject,
        state.body,
        { force: state.forceResend },
      );
      setResult(res);
      if (res.ok) {
        setTimeout(() => setOpen(false), 1500);
      }
    });
  }

  const noEmail = !defaultTo;
  const blockedByDrafts = state.hasDrafts;
  const blockedByPriorSend = !!state.alreadySentAt && !state.forceResend;
  const submitDisabled =
    pending || state.loading || blockedByDrafts || blockedByPriorSend;

  return (
    <>
      <Button
        type="button"
        size="md"
        variant="primary"
        onClick={() => setOpen(true)}
        disabled={noEmail}
        title={
          noEmail
            ? "Añade el email del lead arriba para activar el envío"
            : undefined
        }
      >
        <Send className="h-4 w-4" strokeWidth={1.5} />
        {noEmail ? "Enviar diagnóstico · falta email" : "Enviar diagnóstico"}
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
            className="relative w-full max-w-2xl card-dark p-0 max-h-[85dvh] flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 border-b border-anthracite-600/30 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-fg">
                  Enviar diagnóstico personalizado
                </h3>
                <p className="text-[11px] text-anthracite-400 mt-0.5">
                  PDF + email compuestos según las respuestas Q1-Q5 del lead
                </p>
              </div>
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
              {state.loading ? (
                <div className="flex items-center gap-2 text-sm text-anthracite-300 py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Componiendo subject y cuerpo según las respuestas del lead…
                </div>
              ) : state.loadError ? (
                <div className="flex items-start gap-2 rounded-[10px] border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
                  <span>{state.loadError}</span>
                </div>
              ) : (
                <>
                  {/* Avisos */}
                  {blockedByDrafts ? (
                    <div className="flex items-start gap-2 rounded-[10px] border border-error/40 bg-error/10 px-3 py-2.5 text-sm text-error">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
                      <div>
                        <p className="font-semibold">
                          Hay fragmentos sin redactar para esta combinación.
                        </p>
                        <p className="text-[12px] mt-1 text-error/90">
                          El PDF se generaría con marca de agua &quot;BORRADOR&quot; y texto
                          placeholder. El envío está bloqueado hasta que termines
                          los fragmentos en{" "}
                          <code className="text-[11px]">src/lib/diagnosis/fragments/</code>{" "}
                          y marques <code className="text-[11px]">draft: false</code>.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {state.alreadySentAt && !state.forceResend ? (
                    <div className="flex items-start gap-2 rounded-[10px] border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-warning">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
                      <div className="flex-1">
                        <p className="font-semibold">
                          Este diagnóstico ya se envió el{" "}
                          {new Date(state.alreadySentAt).toLocaleString("es-ES")}.
                        </p>
                        <label className="inline-flex items-center gap-2 mt-2 text-[12px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={state.forceResend}
                            onChange={(e) =>
                              setState((s) => ({
                                ...s,
                                forceResend: e.target.checked,
                              }))
                            }
                            className="h-3.5 w-3.5"
                          />
                          Reenviar igualmente
                        </label>
                      </div>
                    </div>
                  ) : null}

                  {/* Vista previa del PDF */}
                  <div className="flex items-center justify-between rounded-[10px] border border-anthracite-600/40 bg-anthracite-900 px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-[6px] bg-brand-500/10 p-1.5 text-brand-400">
                        <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </span>
                      <div>
                        <p className="text-[12px] text-fg font-medium">
                          PDF adjunto · 4 páginas
                        </p>
                        <p className="text-[11px] text-anthracite-400">
                          Generado a partir de las respuestas Q1-Q5 del lead
                        </p>
                      </div>
                    </div>
                    <a
                      href={`/api/diagnosis/${leadId}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] text-brand-400 hover:text-brand-300"
                    >
                      Vista previa
                      <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                    </a>
                  </div>

                  {/* Campos editables */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="diag-to">Destinatario</Label>
                    <Input
                      id="diag-to"
                      type="email"
                      value={state.to}
                      onChange={(e) =>
                        setState((s) => ({ ...s, to: e.target.value }))
                      }
                      required
                      disabled={pending}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="diag-subject">Asunto</Label>
                    <Input
                      id="diag-subject"
                      value={state.subject}
                      onChange={(e) =>
                        setState((s) => ({ ...s, subject: e.target.value }))
                      }
                      required
                      disabled={pending}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="diag-body">Cuerpo del email</Label>
                    <textarea
                      id="diag-body"
                      value={state.body}
                      onChange={(e) =>
                        setState((s) => ({ ...s, body: e.target.value }))
                      }
                      rows={14}
                      disabled={pending}
                      className="rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 py-2.5 text-sm text-fg resize-y leading-relaxed font-mono"
                    />
                  </div>

                  <p className="text-[11px] text-anthracite-400">
                    Remitente: <strong>danielbrosed@vaultbit.es</strong> · El PDF se
                    adjunta automáticamente. Envío vía webhook n8n.
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
                </>
              )}
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
              <Button type="submit" size="md" loading={pending} disabled={submitDisabled}>
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
