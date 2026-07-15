"use client";

import * as React from "react";
import {
  ExternalLink,
  Sparkles,
  Trash2,
  Loader2,
  MessageCircle,
  Send,
  Archive,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  deleteLinkedInContact,
  generateContactLinkedInMessage,
  updateLinkedInNotes,
  updateLinkedInOutreachStatus,
  updateLinkedInRelevance,
} from "~/lib/actions/linkedin";
import { LinkedInMessageModal } from "./linkedin-message-modal";
import { Badge } from "./ui/badge";
import { cn, relativeTime } from "~/lib/utils";
import type { Database } from "~/lib/supabase/database.types";

type Contact = Database["public"]["Tables"]["linkedin_contacts"]["Row"];

interface Props {
  contact: Contact;
}

const SECTOR_LABELS: Record<string, string> = {
  crypto: "Cripto / Web3",
  wealth_mgmt: "Wealth / banca privada",
  legal_succession: "Legal / sucesorio",
  entrepreneur_unverified: "Empresario sin verificar",
  entrepreneur_crypto_signal: "Empresario cripto",
};

const OUTREACH_LABELS: Record<string, string> = {
  new: "Nuevo",
  message_drafted: "Borrador",
  sent: "Enviado",
  replied: "Respondió",
  archived: "Archivado",
};

const OUTREACH_TONE: Record<string, "neutral" | "brand" | "success" | "warning"> = {
  new: "neutral",
  message_drafted: "warning",
  sent: "brand",
  replied: "success",
  archived: "neutral",
};

export function LinkedInContactCard({ contact }: Props) {
  const [pending, startTransition] = React.useTransition();
  const [generating, setGenerating] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [currentMessage, setCurrentMessage] = React.useState(
    contact.generated_message,
  );
  const [notesValue, setNotesValue] = React.useState(contact.notes ?? "");
  const [notesDirty, setNotesDirty] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fullName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim() ||
    "(sin nombre)";

  const sectorTags = Array.isArray(contact.sector_tags)
    ? contact.sector_tags.filter((t): t is string => typeof t === "string")
    : [];

  async function onGenerateMessage() {
    setError(null);
    setGenerating(true);
    try {
      const res = await generateContactLinkedInMessage(contact.id);
      if (!res.ok) {
        setError(res.error);
      } else {
        setCurrentMessage(res.message);
        setModalOpen(true);
      }
    } finally {
      setGenerating(false);
    }
  }

  function onUpdateOutreach(status: "sent" | "replied" | "archived" | "new") {
    setError(null);
    startTransition(async () => {
      const res = await updateLinkedInOutreachStatus(contact.id, status);
      if (!res.ok) setError(res.error);
    });
  }

  function onMarkRelevant() {
    setError(null);
    startTransition(async () => {
      const res = await updateLinkedInRelevance(contact.id, "relevant");
      if (!res.ok) setError(res.error);
    });
  }

  function onMarkIrrelevant() {
    setError(null);
    startTransition(async () => {
      const res = await updateLinkedInRelevance(contact.id, "irrelevant");
      if (!res.ok) setError(res.error);
    });
  }

  function onSaveNotes() {
    setError(null);
    startTransition(async () => {
      const res = await updateLinkedInNotes(contact.id, notesValue);
      if (!res.ok) setError(res.error);
      else setNotesDirty(false);
    });
  }

  function onDelete() {
    if (!confirm(`¿Eliminar el contacto "${fullName}"? No se puede deshacer.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteLinkedInContact(contact.id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="card-dark p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-fg truncate">
              {fullName}
            </h3>
            <Badge tone={OUTREACH_TONE[contact.outreach_status] ?? "neutral"}>
              {OUTREACH_LABELS[contact.outreach_status] ?? contact.outreach_status}
            </Badge>
            {contact.has_message_history && (
              <Badge tone="info">
                <MessageCircle className="h-3 w-3" strokeWidth={1.5} />
                {contact.last_message_at
                  ? `hace ${relativeTime(contact.last_message_at)}`
                  : "con historial"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-anthracite-200 mt-1 truncate">
            {[contact.position, contact.company].filter(Boolean).join(" · ") ||
              "(sin cargo / empresa)"}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          title="Eliminar"
          className="text-anthracite-400 hover:text-error transition-colors p-1"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Tags + LinkedIn + email */}
      <div className="flex items-center flex-wrap gap-2 text-[11px]">
        {sectorTags.map((tag) => (
          <span
            key={tag}
            className={cn(
              "rounded-full px-2 py-0.5 border",
              tag === "crypto" || tag === "entrepreneur_crypto_signal"
                ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
                : "bg-anthracite-800 text-anthracite-200 border-anthracite-600/40",
            )}
          >
            {SECTOR_LABELS[tag] ?? tag}
          </span>
        ))}
        {contact.crypto_signal && (
          <Badge tone="brand">señal cripto ✓</Badge>
        )}
        <a
          href={contact.linkedin_url}
          target="_blank"
          rel="noreferrer noopener"
          className="ml-auto inline-flex items-center gap-1 text-anthracite-300 hover:text-brand-400 transition-colors"
        >
          <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
          LinkedIn
        </a>
        {contact.email_address && (
          <span className="text-anthracite-400 truncate max-w-[140px]">
            {contact.email_address}
          </span>
        )}
      </div>

      {/* Relevance reason */}
      {contact.relevance_reason && (
        <p className="text-[11px] text-anthracite-300 leading-relaxed border-l-2 border-anthracite-700 pl-2.5">
          {contact.relevance_reason}
        </p>
      )}

      {/* Acciones según relevance */}
      {contact.relevance_status === "review" && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkRelevant}
            disabled={pending}
            className="text-[11px] rounded-full px-2.5 py-1 border border-success/30 bg-success/10 text-success hover:bg-success/20 transition-colors"
          >
            Marcar relevante
          </button>
          <button
            type="button"
            onClick={onMarkIrrelevant}
            disabled={pending}
            className="text-[11px] rounded-full px-2.5 py-1 border border-anthracite-600/40 bg-anthracite-900 text-anthracite-200 hover:border-error/30 hover:text-error transition-colors"
          >
            Descartar
          </button>
        </div>
      )}

      {contact.relevance_status === "irrelevant" && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkRelevant}
            disabled={pending}
            className="text-[11px] rounded-full px-2.5 py-1 border border-anthracite-600/40 bg-anthracite-900 text-anthracite-200 hover:border-success/30 hover:text-success transition-colors"
          >
            Recuperar como relevante
          </button>
        </div>
      )}

      {/* Acciones outreach (solo si relevante) */}
      {contact.relevance_status === "relevant" && (
        <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-anthracite-800/60">
          <button
            type="button"
            onClick={onGenerateMessage}
            disabled={generating || pending}
            className="text-[11px] rounded-full px-2.5 py-1 border border-brand-500/30 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors inline-flex items-center gap-1.5"
          >
            {generating ? (
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
            ) : (
              <Sparkles className="h-3 w-3" strokeWidth={1.5} />
            )}
            {contact.generated_message ? "Regenerar mensaje" : "Generar mensaje"}
          </button>

          {contact.generated_message && (
            <button
              type="button"
              onClick={() => {
                setCurrentMessage(contact.generated_message);
                setModalOpen(true);
              }}
              disabled={pending}
              className="text-[11px] rounded-full px-2.5 py-1 border border-anthracite-600/40 bg-anthracite-900 text-anthracite-200 hover:text-fg transition-colors"
            >
              Ver / editar borrador
            </button>
          )}

          {contact.outreach_status !== "sent" && (
            <button
              type="button"
              onClick={() => onUpdateOutreach("sent")}
              disabled={pending}
              className="text-[11px] rounded-full px-2.5 py-1 border border-anthracite-600/40 bg-anthracite-900 text-anthracite-200 hover:border-brand-500/30 hover:text-brand-400 transition-colors inline-flex items-center gap-1"
            >
              <Send className="h-3 w-3" strokeWidth={1.5} />
              Marcar enviado
            </button>
          )}

          {contact.outreach_status === "sent" && (
            <button
              type="button"
              onClick={() => onUpdateOutreach("replied")}
              disabled={pending}
              className="text-[11px] rounded-full px-2.5 py-1 border border-success/30 bg-success/10 text-success hover:bg-success/20 transition-colors inline-flex items-center gap-1"
            >
              <Check className="h-3 w-3" strokeWidth={1.5} />
              Respondió
            </button>
          )}

          {contact.outreach_status !== "archived" && (
            <button
              type="button"
              onClick={() => onUpdateOutreach("archived")}
              disabled={pending}
              className="text-[11px] rounded-full px-2.5 py-1 border border-anthracite-600/40 bg-anthracite-900 text-anthracite-300 hover:text-fg transition-colors inline-flex items-center gap-1"
            >
              <Archive className="h-3 w-3" strokeWidth={1.5} />
              Archivar
            </button>
          )}

          {(contact.outreach_status === "archived" ||
            contact.outreach_status === "sent" ||
            contact.outreach_status === "replied") && (
            <button
              type="button"
              onClick={() => onUpdateOutreach("new")}
              disabled={pending}
              className="text-[11px] rounded-full px-2.5 py-1 border border-anthracite-600/40 bg-anthracite-900 text-anthracite-300 hover:text-fg transition-colors inline-flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
              Resetear
            </button>
          )}
        </div>
      )}

      {/* Notas */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`notes-${contact.id}`} className="text-[11px] uppercase tracking-wider text-anthracite-400">
          Notas
        </label>
        <textarea
          id={`notes-${contact.id}`}
          value={notesValue}
          onChange={(e) => {
            setNotesValue(e.target.value);
            setNotesDirty(true);
          }}
          rows={2}
          maxLength={5000}
          disabled={pending}
          placeholder="Notas internas sobre este contacto…"
          className="w-full rounded-[8px] border border-anthracite-700/60 bg-anthracite-900 px-2.5 py-1.5 text-xs text-fg placeholder:text-anthracite-500 focus-visible:border-brand-500/60 focus-visible:outline-none transition-colors disabled:opacity-60"
        />
        {notesDirty && (
          <button
            type="button"
            onClick={onSaveNotes}
            disabled={pending}
            className="self-end text-[11px] text-brand-400 hover:underline"
          >
            {pending ? "Guardando…" : "Guardar nota"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-error border-l-2 border-error/40 pl-2">
          {error}
        </p>
      )}

      <LinkedInMessageModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contactId={contact.id}
        contactName={fullName}
        initialMessage={currentMessage}
        onMessageUpdated={setCurrentMessage}
        onSent={() => onUpdateOutreach("sent")}
      />
    </div>
  );
}
