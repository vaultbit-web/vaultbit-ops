"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Briefcase,
  Building2,
  ExternalLink,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Tag,
  Users,
} from "lucide-react";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { formatDateShort } from "~/lib/utils";
import {
  COMPETITION_RISK_LABELS,
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
  PROFESSIONAL_TYPES,
  PROFESSIONAL_TYPE_LABELS,
  VERIFICATION_LEVEL_LABELS,
  type Partner,
  type PartnerSource,
  type PipelineStage,
  type ProfessionalType,
} from "~/lib/captacion/types";
import {
  addPartnerSource,
  promotePartnerStage,
  updatePartnerCallScript,
  updatePartnerContactInfo,
  updatePartnerNotes,
  updatePartnerOutreach,
} from "~/lib/actions/captacion";
import { CopyButton } from "./copy-button";

interface PartnerDrawerProps {
  partner: Partner | null;
  sources: PartnerSource[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerDrawer({
  partner,
  sources,
  open,
  onOpenChange,
}: PartnerDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="responsive">
        {partner ? (
          <PartnerDrawerInner partner={partner} sources={sources} />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function PartnerDrawerInner({
  partner,
  sources,
}: {
  partner: Partner;
  sources: PartnerSource[];
}) {
  const [stage, setStage] = useState<PipelineStage>(partner.pipeline_stage);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [localSources, setLocalSources] = useState<PartnerSource[]>(sources);

  // Notas operativas · edición con autoguardado
  const [notes, setNotes] = useState(partner.notes ?? "");
  const [notesStatus, setNotesStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedNotes = useRef(partner.notes ?? "");

  // Correo de captación · asunto + cuerpo, con autoguardado
  const [outreachSubject, setOutreachSubject] = useState(partner.outreach_subject ?? "");
  const [outreachEmail, setOutreachEmail] = useState(partner.outreach_email ?? "");
  const [outreachStatus, setOutreachStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const outreachTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedOutreach = useRef({
    subject: partner.outreach_subject ?? "",
    email: partner.outreach_email ?? "",
  });

  // Guion de llamada en frío · método Cooling, con autoguardado
  const [callScript, setCallScript] = useState(partner.call_script ?? "");
  const [callScriptStatus, setCallScriptStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const callScriptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedCallScript = useRef(partner.call_script ?? "");

  useEffect(() => {
    setStage(partner.pipeline_stage);
    setLocalSources(sources);
    setNotes(partner.notes ?? "");
    lastSavedNotes.current = partner.notes ?? "";
    setNotesStatus("idle");
    if (notesTimer.current) clearTimeout(notesTimer.current);
    setOutreachSubject(partner.outreach_subject ?? "");
    setOutreachEmail(partner.outreach_email ?? "");
    lastSavedOutreach.current = {
      subject: partner.outreach_subject ?? "",
      email: partner.outreach_email ?? "",
    };
    setOutreachStatus("idle");
    if (outreachTimer.current) clearTimeout(outreachTimer.current);
    setCallScript(partner.call_script ?? "");
    lastSavedCallScript.current = partner.call_script ?? "";
    setCallScriptStatus("idle");
    if (callScriptTimer.current) clearTimeout(callScriptTimer.current);
  }, [
    partner.id,
    partner.pipeline_stage,
    partner.notes,
    partner.outreach_subject,
    partner.outreach_email,
    partner.call_script,
    sources,
  ]);

  // Limpia los temporizadores de debounce al desmontar
  useEffect(() => {
    return () => {
      if (notesTimer.current) clearTimeout(notesTimer.current);
      if (outreachTimer.current) clearTimeout(outreachTimer.current);
      if (callScriptTimer.current) clearTimeout(callScriptTimer.current);
    };
  }, []);

  function saveOutreach(subject: string, email: string) {
    if (
      subject.trim() === lastSavedOutreach.current.subject.trim() &&
      email.trim() === lastSavedOutreach.current.email.trim()
    ) {
      setOutreachStatus("idle");
      return;
    }
    setOutreachStatus("saving");
    updatePartnerOutreach(partner.id, subject, email).then((res) => {
      if (res.ok) {
        lastSavedOutreach.current = { subject, email };
        setOutreachStatus("saved");
      } else {
        setOutreachStatus("error");
        setError(res.error);
      }
    });
  }

  function handleOutreachChange(subject: string, email: string) {
    setOutreachSubject(subject);
    setOutreachEmail(email);
    setOutreachStatus("idle");
    if (outreachTimer.current) clearTimeout(outreachTimer.current);
    outreachTimer.current = setTimeout(() => saveOutreach(subject, email), 800);
  }

  function handleOutreachBlur() {
    if (outreachTimer.current) clearTimeout(outreachTimer.current);
    saveOutreach(outreachSubject, outreachEmail);
  }

  function saveCallScript(value: string) {
    if (value.trim() === lastSavedCallScript.current.trim()) {
      setCallScriptStatus("idle");
      return;
    }
    setCallScriptStatus("saving");
    updatePartnerCallScript(partner.id, value).then((res) => {
      if (res.ok) {
        lastSavedCallScript.current = value;
        setCallScriptStatus("saved");
      } else {
        setCallScriptStatus("error");
        setError(res.error);
      }
    });
  }

  function handleCallScriptChange(value: string) {
    setCallScript(value);
    setCallScriptStatus("idle");
    if (callScriptTimer.current) clearTimeout(callScriptTimer.current);
    callScriptTimer.current = setTimeout(() => saveCallScript(value), 800);
  }

  function handleCallScriptBlur() {
    if (callScriptTimer.current) clearTimeout(callScriptTimer.current);
    saveCallScript(callScript);
  }

  function saveNotes(value: string) {
    if (value.trim() === lastSavedNotes.current.trim()) {
      setNotesStatus("idle");
      return;
    }
    setNotesStatus("saving");
    updatePartnerNotes(partner.id, value).then((res) => {
      if (res.ok) {
        lastSavedNotes.current = value;
        setNotesStatus("saved");
      } else {
        setNotesStatus("error");
        setError(res.error);
      }
    });
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    setNotesStatus("idle");
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => saveNotes(value), 800);
  }

  function handleNotesBlur() {
    if (notesTimer.current) clearTimeout(notesTimer.current);
    saveNotes(notes);
  }

  function handlePromote() {
    setError(null);
    if (stage === partner.pipeline_stage) return;
    startTransition(async () => {
      const res = await promotePartnerStage(partner.id, stage);
      if (!res.ok) {
        setError(res.error);
        setStage(partner.pipeline_stage);
      }
    });
  }

  function handleSaveContact(formData: FormData) {
    setError(null);
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const professionalType = String(
      formData.get("professional_type") ?? "",
    ).trim();
    const city = String(formData.get("city") ?? "").trim();
    const website = String(formData.get("company_website") ?? "").trim();
    startTransition(async () => {
      const res = await updatePartnerContactInfo(partner.id, {
        email: email || null,
        phone: phone || null,
        professional_type: (professionalType || null) as ProfessionalType | null,
        city: city || null,
        company_website: website || null,
      });
      if (!res.ok) setError(res.error);
    });
  }

  function handleAddSource(formData: FormData) {
    setError(null);
    const url = String(formData.get("url") ?? "");
    const type = String(formData.get("type") ?? "web");
    const title = String(formData.get("title") ?? "");
    startTransition(async () => {
      const res = await addPartnerSource(partner.id, url, type, title);
      if (res.ok) {
        // optimista — añadimos un placeholder hasta el next refresh server-side
        setLocalSources((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            partner_id: partner.id,
            source_url: url,
            source_type: type as PartnerSource["source_type"],
            source_title: title || null,
            created_at: new Date().toISOString(),
            created_by: null,
            notes: null,
          },
        ]);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{partner.full_name}</DrawerTitle>
        <DrawerDescription>
          {[partner.role, partner.company].filter(Boolean).join(" · ")}
        </DrawerDescription>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={verifTone(partner.verification_level)}>
            {partner.verification_level === "high" ? (
              <ShieldCheck className="h-3 w-3" strokeWidth={1.5} />
            ) : (
              <ShieldAlert className="h-3 w-3" strokeWidth={1.5} />
            )}
            {VERIFICATION_LEVEL_LABELS[partner.verification_level]}
          </Badge>
          <Badge tone={riskTone(partner.competition_risk)}>
            {COMPETITION_RISK_LABELS[partner.competition_risk]}
          </Badge>
          <Badge tone="brand">
            {PIPELINE_STAGE_LABELS[partner.pipeline_stage]}
          </Badge>
        </div>
      </DrawerHeader>

      <DrawerBody>
        <div className="space-y-6">
          {/* Identidad */}
          <Section title="Identidad y datos verificados">
            <DataRow label="Empresa" value={partner.company} icon={Building2} />
            <DataRow label="Rol" value={partner.role} />
            <DataRow
              label="Tipo"
              value={
                partner.professional_type
                  ? PROFESSIONAL_TYPE_LABELS[partner.professional_type]
                  : null
              }
              icon={Briefcase}
            />
            <DataRow
              label="Ubicación"
              value={[partner.city, partner.country].filter(Boolean).join(", ") || null}
              icon={MapPin}
            />
            <DataRow
              label="Email"
              value={partner.email ?? null}
              icon={Mail}
              link={partner.email ? `mailto:${partner.email}` : null}
            />
            <DataRow
              label="Teléfono"
              value={partner.phone ?? null}
              icon={Phone}
              link={partner.phone ? `tel:${partner.phone.replace(/\s+/g, "")}` : null}
            />
            <DataRow
              label="LinkedIn"
              value={partner.linkedin_url}
              icon={Linkedin}
              link={partner.linkedin_url}
            />
            <DataRow
              label="Web empresa"
              value={partner.company_website}
              icon={Globe}
              link={partner.company_website}
            />
            <DataRow
              label="Comunidad"
              value={partner.community_website}
              icon={Users}
              link={partner.community_website}
            />
            <DataRow
              label="CIF"
              value={partner.company_cif}
            />
            <DataRow
              label="Origen"
              value={partner.origin}
              icon={Tag}
            />
          </Section>

          {/* Contacto · edición rápida */}
          <Section
            title="Editar contacto"
            description="Email, teléfono, tipo y ciudad. Se guarda en la ficha del partner."
          >
            <form
              key={partner.id}
              action={handleSaveContact}
              className="space-y-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  name="email"
                  type="email"
                  defaultValue={partner.email ?? ""}
                  placeholder="Email"
                  className="w-full rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg"
                />
                <input
                  name="phone"
                  type="text"
                  defaultValue={partner.phone ?? ""}
                  placeholder="Teléfono"
                  className="w-full rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  name="professional_type"
                  defaultValue={partner.professional_type ?? ""}
                  className="w-full rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg"
                >
                  <option value="">Tipo de profesional…</option>
                  {PROFESSIONAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {PROFESSIONAL_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <input
                  name="city"
                  type="text"
                  defaultValue={partner.city ?? ""}
                  placeholder="Ciudad"
                  className="w-full rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg"
                />
              </div>
              <input
                name="company_website"
                type="text"
                defaultValue={partner.company_website ?? ""}
                placeholder="Web (https://…)"
                className="w-full rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg"
              />
              <Button type="submit" size="sm" variant="secondary" loading={pending}>
                Guardar contacto
              </Button>
            </form>
          </Section>

          {/* Correo de captación · asunto + cuerpo, casillas dedicadas */}
          <Section
            title="Correo de captación"
            description="Asunto y correo completo para enviar a este partner. Se guardan solos al dejar de escribir."
            action={<NotesStatus status={outreachStatus} />}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={outreachSubject}
                  onChange={(e) => handleOutreachChange(e.target.value, outreachEmail)}
                  onBlur={handleOutreachBlur}
                  placeholder="Asunto del correo…"
                  className="flex-1 rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg focus:border-brand-500/50 focus:outline-none"
                />
                <CopyButton text={outreachSubject} label="Copiar" />
              </div>
              <textarea
                value={outreachEmail}
                onChange={(e) => handleOutreachChange(outreachSubject, e.target.value)}
                onBlur={handleOutreachBlur}
                placeholder="Correo completo (cuerpo del email)…"
                rows={12}
                className="w-full min-h-[220px] resize-y rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 text-sm text-fg leading-relaxed whitespace-pre-wrap focus:border-brand-500/50 focus:outline-none"
              />
              <div className="flex justify-end">
                <CopyButton text={outreachEmail} label="Copiar correo" />
              </div>
            </div>
          </Section>

          {/* Guion de llamada en frío · método Cooling */}
          <Section
            title="Guion de llamada"
            description="Guion de primera llamada: pasar centralita, pedir por quien decide, pitch de 30s y cerrar reunión. Se guarda solo al dejar de escribir."
            action={<NotesStatus status={callScriptStatus} />}
          >
            <textarea
              value={callScript}
              onChange={(e) => handleCallScriptChange(e.target.value)}
              onBlur={handleCallScriptBlur}
              placeholder="Opener para pasar centralita · pedir por [quien decide] · pitch 30s · cierre 30 min sin compromiso · respuestas a objeciones…"
              rows={12}
              className="w-full min-h-[220px] resize-y rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 text-sm text-fg leading-relaxed whitespace-pre-wrap focus:border-brand-500/50 focus:outline-none"
            />
            <div className="flex justify-end">
              <CopyButton text={callScript} label="Copiar guion" />
            </div>
          </Section>

          {/* Próxima acción */}
          {partner.next_action ? (
            <Section title="Próxima acción">
              <div className="card-dark-sub p-4">
                <p className="text-[10px] uppercase tracking-wider text-brand-400 font-semibold mb-1.5">
                  {partner.next_action_date
                    ? formatDateShort(partner.next_action_date)
                    : "Sin fecha"}
                </p>
                <p className="text-sm text-fg leading-relaxed">
                  {partner.next_action}
                </p>
              </div>
            </Section>
          ) : null}

          {/* Borrador LinkedIn */}
          {partner.linkedin_draft ? (
            <Section
              title="Borrador LinkedIn"
              action={<CopyButton text={partner.linkedin_draft} label="Copiar mensaje" />}
            >
              <div className="rounded-(--radius-md) border border-brand-500/20 bg-anthracite-900 p-4">
                <p className="whitespace-pre-wrap text-sm text-anthracite-100 leading-relaxed">
                  {partner.linkedin_draft}
                </p>
              </div>
            </Section>
          ) : null}

          {/* Notas operativas · editable con autoguardado */}
          <Section
            title="Notas operativas"
            description="Se guardan solas al dejar de escribir. Ideal para preparar la llamada y anotar el resultado."
            action={<NotesStatus status={notesStatus} />}
          >
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Qué hace el despacho, equipo y socios, ángulo de llamada, resultado del contacto…"
              rows={8}
              className="w-full min-h-[160px] resize-y rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 text-sm text-fg leading-relaxed whitespace-pre-wrap focus:border-brand-500/50 focus:outline-none"
            />
          </Section>

          {/* Tags */}
          {partner.tags.length > 0 ? (
            <Section title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {partner.tags.map((t) => (
                  <Badge key={t} tone="info" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
            </Section>
          ) : null}

          {/* Fuentes de verificación */}
          <Section
            title={`Fuentes de verificación (${localSources.length})`}
            description="Mínimo 2 fuentes independientes para promover el partner de 'identificado' a 'investigado'."
          >
            {localSources.length === 0 ? (
              <p className="text-xs text-anthracite-400 italic mb-3">
                Sin fuentes registradas.
              </p>
            ) : (
              <ul className="space-y-1.5 mb-4">
                {localSources.map((s) => (
                  <li
                    key={s.id}
                    className="card-dark-sub px-3 py-2 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-fg truncate">
                        {s.source_title ?? s.source_url}
                      </p>
                      <p className="text-[10px] text-anthracite-400 uppercase tracking-wider">
                        {s.source_type}
                      </p>
                    </div>
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-anthracite-400 hover:text-brand-400 shrink-0"
                      aria-label="Abrir fuente"
                    >
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <form action={handleAddSource} className="space-y-2">
              <input
                name="url"
                type="url"
                required
                placeholder="https://… (fuente pública)"
                className="w-full rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg"
              />
              <div className="flex gap-2">
                <select
                  name="type"
                  defaultValue="web"
                  className="flex-1 rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg"
                >
                  <option value="web">web</option>
                  <option value="linkedin">linkedin</option>
                  <option value="prensa">prensa</option>
                  <option value="registro_mercantil">registro_mercantil</option>
                  <option value="github">github</option>
                  <option value="podcast">podcast</option>
                  <option value="evento">evento</option>
                  <option value="otro">otro</option>
                </select>
                <input
                  name="title"
                  type="text"
                  placeholder="Título (opcional)"
                  className="flex-1 rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2 sm:py-1.5 text-base sm:text-xs text-fg"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" loading={pending}>
                Añadir fuente
              </Button>
            </form>
          </Section>

        </div>
      </DrawerBody>

      {/* Pipeline: acción principal siempre visible al pie del drawer */}
      <DrawerFooter className="flex-wrap justify-stretch sm:justify-end">
        {error ? <p className="w-full text-xs text-error">{error}</p> : null}
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as PipelineStage)}
          aria-label="Etapa del pipeline"
          className="min-w-0 flex-1 sm:flex-none rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-2.5 sm:py-1.5 text-base sm:text-xs text-fg focus:border-brand-500/50 focus:outline-none"
        >
          {PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>
              {PIPELINE_STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="primary"
          onClick={handlePromote}
          disabled={stage === partner.pipeline_stage}
          loading={pending}
          className="h-11 shrink-0 sm:h-8"
        >
          Mover a {PIPELINE_STAGE_LABELS[stage]}
        </Button>
      </DrawerFooter>
    </>
  );
}

function NotesStatus({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error";
}) {
  if (status === "saving")
    return <span className="text-[10px] text-anthracite-400">Guardando…</span>;
  if (status === "saved")
    return <span className="text-[10px] text-success">Guardado ✓</span>;
  if (status === "error")
    return <span className="text-[10px] text-error">Error al guardar</span>;
  return null;
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-400">
          {title}
        </p>
        {action}
      </div>
      {description ? (
        <p className="text-[11px] text-anthracite-400 mb-2">{description}</p>
      ) : null}
      {children}
    </section>
  );
}

function DataRow({
  label,
  value,
  icon: Icon,
  link,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  link?: string | null;
}) {
  if (!value) return null;
  const content = link ? (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-400 hover:text-brand-500 break-all"
    >
      {value}
    </a>
  ) : (
    <span className="text-anthracite-100 break-words">{value}</span>
  );
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-anthracite-600/20 last:border-b-0">
      <div className="flex items-center gap-1.5 min-w-[120px] text-[11px] uppercase tracking-wider text-anthracite-400">
        {Icon ? <Icon className="h-3 w-3" strokeWidth={1.5} /> : null}
        {label}
      </div>
      <div className="flex-1 text-xs">{content}</div>
    </div>
  );
}

function verifTone(
  level: Partner["verification_level"],
): "success" | "warning" | "error" | "neutral" {
  switch (level) {
    case "high":
      return "success";
    case "medium":
      return "warning";
    case "low":
      return "error";
    default:
      return "neutral";
  }
}

function riskTone(
  risk: Partner["competition_risk"],
): "success" | "info" | "warning" | "error" | "neutral" {
  switch (risk) {
    case "none":
    case "low":
      return "success";
    case "medium":
      return "info";
    case "high":
      return "warning";
    case "very_high":
      return "error";
    default:
      return "neutral";
  }
}

export type { PartnerDrawerProps };
