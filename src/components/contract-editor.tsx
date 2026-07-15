"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileSignature, Loader2 } from "lucide-react";
import { createContract } from "~/lib/actions/contracts";
import type { EntityType, PlaceholderDef } from "~/lib/supabase/types";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/input";
import { ClientPicker } from "./client-picker";
import type { CrmSearchHit } from "~/lib/actions/search";

interface Props {
  templateSlug: string;
  templateName: string;
  bodyMd: string;
  placeholders: PlaceholderDef[];
  /** Valores pre-rellenados desde URL params (cuando vienes de un presupuesto) */
  initialValues?: Record<string, string>;
  /** ID del presupuesto si vienes desde uno */
  quoteId?: string | null;
  /** Pre-vinculación CRM cuando vienes desde la página detalle de un lead */
  initialCrmLink?: { entity_type: EntityType; entity_id: string; name: string } | null;
  /** Email del cliente (de URL, CRM o presupuesto) para autorrellenar el campo */
  initialClientEmail?: string | null;
  /** NIF del cliente (de URL o CRM) para autorrellenar el campo */
  initialClientNif?: string | null;
}

function todayStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/**
 * Mapping de campos cliente → claves típicas en plantillas legales.
 * Cuando se selecciona un cliente del CRM, autorrellenamos cualquier
 * placeholder cuya key coincida con uno de estos.
 */
const CLIENT_NAME_KEYS = ["cliente_nombre", "contraparte_nombre", "partner_nombre"];
const CLIENT_NIF_KEYS = ["cliente_nif", "contraparte_nif", "partner_nif"];
const CLIENT_EMAIL_KEYS = ["cliente_email", "contraparte_email", "partner_email"];
const CLIENT_ORG_KEYS = ["cliente_empresa", "contraparte_organizacion", "partner_organizacion"];
const CLIENT_ADDRESS_KEYS = ["cliente_direccion", "contraparte_direccion"];

export function ContractEditor({
  templateSlug,
  templateName,
  bodyMd,
  placeholders,
  initialValues = {},
  quoteId,
  initialCrmLink,
  initialClientEmail,
  initialClientNif,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // Vinculación CRM
  const [crmLink, setCrmLink] = React.useState<{
    entity_type: EntityType;
    entity_id: string;
    name: string;
  } | null>(initialCrmLink ?? null);

  // Estado de valores
  const [values, setValues] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    placeholders.forEach((ph) => {
      const fromUrl = initialValues[ph.key];
      if (fromUrl !== undefined) {
        initial[ph.key] = fromUrl;
      } else if (ph.default !== undefined) {
        initial[ph.key] = ph.default;
      } else if (ph.type === "date") {
        initial[ph.key] = todayStr();
      } else {
        initial[ph.key] = "";
      }
    });
    return initial;
  });

  // Datos del cliente para guardar en la fila
  const [clientName, setClientName] = React.useState(
    initialValues.cliente_nombre ??
      initialValues.contraparte_nombre ??
      initialValues.partner_nombre ??
      initialCrmLink?.name ??
      "",
  );
  const [clientNif, setClientNif] = React.useState(
    initialClientNif ??
      initialValues.cliente_nif ??
      initialValues.contraparte_nif ??
      initialValues.partner_nif ??
      "",
  );
  const [clientEmail, setClientEmail] = React.useState(
    initialClientEmail ??
      initialValues.cliente_email ??
      initialValues.contraparte_email ??
      initialValues.partner_email ??
      "",
  );

  function update(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  /**
   * Al seleccionar un cliente CRM, autorrellena los placeholders y campos
   * de cliente cuya key (o concepto) coincida.
   */
  function applyCrmHit(hit: CrmSearchHit) {
    setCrmLink({ entity_type: hit.entity_type, entity_id: hit.entity_id, name: hit.name });
    setClientName(hit.name);
    if (hit.email) setClientEmail(hit.email);

    setValues((v) => {
      const next = { ...v };
      for (const ph of placeholders) {
        if (CLIENT_NAME_KEYS.includes(ph.key)) next[ph.key] = hit.name;
        else if (CLIENT_EMAIL_KEYS.includes(ph.key) && hit.email) next[ph.key] = hit.email;
        else if (CLIENT_ORG_KEYS.includes(ph.key) && hit.organization) next[ph.key] = hit.organization;
      }
      return next;
    });
  }

  /** Marker tipo no usado para evitar warnings con el array de keys */
  void CLIENT_NIF_KEYS;
  void CLIENT_ADDRESS_KEYS;

  // Preview con sustitución básica de placeholders
  const preview = React.useMemo(() => {
    let body = bodyMd;
    placeholders.forEach((ph) => {
      const v = values[ph.key];
      const display = v && v.trim().length > 0 ? v.trim() : `[${ph.label} no informado]`;
      body = body.replaceAll(`{{${ph.key}}}`, display);
    });
    return body;
  }, [bodyMd, placeholders, values]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Si no hay clientName explícito, usar el que aparezca en values
    const finalClientName =
      clientName || values.cliente_nombre || values.contraparte_nombre || values.partner_nombre || "";
    if (!finalClientName.trim()) {
      setError("Debes indicar el nombre del cliente / contraparte");
      return;
    }

    startTransition(async () => {
      const res = await createContract({
        template_slug: templateSlug,
        quote_id: quoteId ?? null,
        client_name: finalClientName,
        client_nif: clientNif || null,
        client_email: clientEmail || null,
        values,
        crm_entity_type: crmLink?.entity_type ?? null,
        crm_entity_id: crmLink?.entity_id ?? null,
      });
      if (!res.ok) {
        setError(res.error);
      } else if (res.id) {
        router.push(`/comercial/legal/contratos/${res.id}`);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
      {/* Columna izquierda: campos */}
      <div className="card-dark p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-base font-semibold text-fg">{templateName}</h3>
          <ClientPicker
            selected={crmLink}
            onSelect={applyCrmHit}
            onClear={() => setCrmLink(null)}
            triggerLabel="Buscar en CRM"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="client_name">Cliente / contraparte (referencia interna) *</Label>
            <Input
              id="client_name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client_nif">NIF/CIF</Label>
            <Input
              id="client_nif"
              value={clientNif}
              onChange={(e) => setClientNif(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client_email">Email</Label>
            <Input
              id="client_email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              disabled={pending}
            />
          </div>
        </div>

        <div className="border-t border-anthracite-600/30 pt-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-anthracite-400">
            Campos de la plantilla
          </p>
          {placeholders.map((ph) => (
            <div key={ph.key} className="flex flex-col gap-1.5">
              <Label htmlFor={`ph-${ph.key}`}>
                {ph.label}
                {ph.required ? <span className="text-error"> *</span> : null}
              </Label>
              {ph.type === "textarea" ? (
                <textarea
                  id={`ph-${ph.key}`}
                  value={values[ph.key] ?? ""}
                  onChange={(e) => update(ph.key, e.target.value)}
                  required={ph.required}
                  disabled={pending}
                  rows={3}
                  className="rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 py-2.5 text-sm text-fg resize-y"
                />
              ) : (
                <Input
                  id={`ph-${ph.key}`}
                  type={ph.type === "date" ? "date" : ph.type === "number" ? "number" : "text"}
                  value={values[ph.key] ?? ""}
                  onChange={(e) => update(ph.key, e.target.value)}
                  required={ph.required}
                  disabled={pending}
                />
              )}
            </div>
          ))}
        </div>

        {error ? <p className="text-xs text-error">{error}</p> : null}

        <Button type="submit" loading={pending} className="mt-2">
          <FileSignature className="h-4 w-4" strokeWidth={1.5} />
          Generar contrato
        </Button>
        <p className="text-[10px] text-anthracite-400 text-center">
          Se guarda en histórico. El PDF se descarga desde el detalle.
        </p>
      </div>

      {/* Columna derecha: preview */}
      <div className="card-dark p-5 lg:max-h-[80vh] lg:overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-fg">Vista previa</h3>
          <span className="text-[10px] text-anthracite-400">El PDF respetará formato y branding</span>
        </div>
        <article className="prose-vb text-sm text-anthracite-100 whitespace-pre-wrap leading-relaxed">
          {preview}
        </article>
      </div>
    </form>
  );
}
