"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calculator, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { createQuote, type CreateQuoteItemInput } from "~/lib/actions/quotes";
import { computeQuoteAmounts } from "~/lib/quotes/calc";
import {
  computeServicePrice,
  tiersFor,
  serviceHasRules,
  numericDriverKey,
  type PricingRules,
  type ServicePriceResult,
} from "~/lib/quotes/pricing-engine";
import { SERVICE_INPUTS, defaultInputs, type ServiceInputDef } from "~/lib/quotes/service-inputs";
import {
  SERVICE_LABELS,
  type ServiceSlug,
  TIER_LABELS,
  type Tier,
  MODALITY_LABELS,
  type Modality,
  type ServicePricing,
  type EntityType,
} from "~/lib/supabase/types";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/input";
import { ClientPicker } from "./client-picker";
import type { CrmSearchHit } from "~/lib/actions/search";
import { formatEuro } from "~/lib/utils";

interface QuoteFormProps {
  pricing: ServicePricing[];
  rules: PricingRules;
  initialCrmClient?: {
    entity_type: EntityType;
    entity_id: string;
    name: string;
    email?: string | null;
    organization?: string | null;
  } | null;
}

const SERVICES = Object.entries(SERVICE_LABELS) as [ServiceSlug, string][];

const selectClass =
  "h-11 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 text-sm text-fg focus-visible:border-brand-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40";

interface Line {
  key: string;
  serviceSlug: ServiceSlug;
  modality: Modality;
  tierKey: string;
  caseInputs: Record<string, number | boolean | string>;
  overridePrice: boolean;
  manualBase: number;
}

interface LineResult {
  useEngine: boolean;
  engineResult: ServicePriceResult | null;
  computedBase: number;
  effectiveBase: number;
  tierOptions: { value: string; label: string }[];
  modalities: Modality[];
  inputDefs: ServiceInputDef[];
  showTierDropdown: boolean;
}

let lineKeySeq = 0;
const nextKey = () => `line-${++lineKeySeq}`;

function buildPricingMap(list: ServicePricing[]): Map<string, ServicePricing> {
  const m = new Map<string, ServicePricing>();
  list.forEach((p) => m.set(`${p.service_slug}:${p.tier}:${p.modality}`, p));
  return m;
}

function modalitiesFor(service: string, rules: PricingRules, pricing: ServicePricing[]): Modality[] {
  const out = serviceHasRules(rules, service)
    ? rules.tiers.filter((t) => t.service_slug === service && t.active).map((t) => t.modality)
    : pricing.filter((p) => p.service_slug === service).map((p) => p.modality);
  const uniq = Array.from(new Set(out)) as Modality[];
  return uniq.length ? uniq : (["one_shot"] as Modality[]);
}

function tierOptionsFor(
  service: string,
  modality: string,
  rules: PricingRules,
  pricing: ServicePricing[],
): { value: string; label: string }[] {
  if (serviceHasRules(rules, service)) {
    return tiersFor(rules, service, modality).map((t) => ({ value: t.tier_key, label: t.tier_label }));
  }
  const legacy = pricing.filter((p) => p.service_slug === service && p.modality === modality);
  return Array.from(new Set(legacy.map((p) => p.tier))).map((t) => ({
    value: t,
    label: TIER_LABELS[t as Tier] ?? t,
  }));
}

function makeLine(service: ServiceSlug, rules: PricingRules, pricing: ServicePricing[]): Line {
  const modality = modalitiesFor(service, rules, pricing)[0] ?? ("one_shot" as Modality);
  const tos = tierOptionsFor(service, modality, rules, pricing);
  return {
    key: nextKey(),
    serviceSlug: service,
    modality,
    tierKey: tos[0]?.value ?? "",
    caseInputs: defaultInputs(service),
    overridePrice: false,
    manualBase: 0,
  };
}

function computeLineResult(
  line: Line,
  rules: PricingRules,
  pricing: ServicePricing[],
  pricingMap: Map<string, ServicePricing>,
): LineResult {
  const useEngine = serviceHasRules(rules, line.serviceSlug);
  const engineTiers = useEngine ? tiersFor(rules, line.serviceSlug, line.modality) : [];
  const driverKey = numericDriverKey(engineTiers);
  const engineResult = useEngine
    ? computeServicePrice(line.serviceSlug, line.caseInputs, rules, {
        tierKey: driverKey ? undefined : line.tierKey,
        modality: line.modality,
      })
    : null;
  const matchedPrice = pricingMap.get(`${line.serviceSlug}:${line.tierKey}:${line.modality}`);
  const computedBase = useEngine ? engineResult?.closedPrice ?? 0 : matchedPrice?.price_eur ?? 0;
  const effectiveBase = line.overridePrice ? line.manualBase : computedBase;
  return {
    useEngine,
    engineResult,
    computedBase,
    effectiveBase,
    tierOptions: tierOptionsFor(line.serviceSlug, line.modality, rules, pricing),
    modalities: modalitiesFor(line.serviceSlug, rules, pricing),
    inputDefs: SERVICE_INPUTS[line.serviceSlug] ?? [],
    showTierDropdown: !useEngine || !driverKey,
  };
}

export function QuoteForm({ pricing, rules, initialCrmClient }: QuoteFormProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const pricingMap = React.useMemo(() => buildPricingMap(pricing), [pricing]);

  const availableServices = React.useMemo(() => {
    const legacy = new Set(pricing.map((p) => p.service_slug));
    const motor = new Set(rules.tiers.filter((t) => t.active).map((t) => t.service_slug));
    return SERVICES.filter(([s]) => legacy.has(s) || motor.has(s));
  }, [pricing, rules]);

  const firstService = (availableServices[0]?.[0] as ServiceSlug) ?? "heritage-protocol";

  // Vinculación CRM
  const [crmLink, setCrmLink] = React.useState<{
    entity_type: EntityType;
    entity_id: string;
    name: string;
  } | null>(
    initialCrmClient
      ? {
          entity_type: initialCrmClient.entity_type,
          entity_id: initialCrmClient.entity_id,
          name: initialCrmClient.name,
        }
      : null,
  );

  // Líneas de servicio (multi-servicio)
  const [lines, setLines] = React.useState<Line[]>(() => [makeLine(firstService, rules, pricing)]);

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function changeService(key: string, service: ServiceSlug) {
    const modality = modalitiesFor(service, rules, pricing)[0] ?? ("one_shot" as Modality);
    const tos = tierOptionsFor(service, modality, rules, pricing);
    updateLine(key, {
      serviceSlug: service,
      modality,
      tierKey: tos[0]?.value ?? "",
      caseInputs: defaultInputs(service),
      overridePrice: false,
      manualBase: 0,
    });
  }
  function changeModality(key: string, modality: Modality, service: ServiceSlug) {
    const tos = tierOptionsFor(service, modality, rules, pricing);
    updateLine(key, { modality, tierKey: tos[0]?.value ?? "" });
  }
  function addLine() {
    setLines((prev) => [...prev, makeLine(firstService, rules, pricing)]);
  }
  function removeLine(key: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  // Datos cliente
  const [clientName, setClientName] = React.useState(initialCrmClient?.name ?? "");
  const [clientNif, setClientNif] = React.useState("");
  const [clientEmail, setClientEmail] = React.useState(initialCrmClient?.email ?? "");
  const [clientCompany, setClientCompany] = React.useState(initialCrmClient?.organization ?? "");
  const [clientSector, setClientSector] = React.useState("");
  const [clientAddress, setClientAddress] = React.useState("");

  function applyCrmHit(hit: CrmSearchHit) {
    setCrmLink({ entity_type: hit.entity_type, entity_id: hit.entity_id, name: hit.name });
    setClientName(hit.name);
    if (hit.email) setClientEmail(hit.email);
    if (hit.organization) setClientCompany(hit.organization);
  }

  // Económico (global)
  const [discountPct, setDiscountPct] = React.useState<number>(0);
  const [vatPct, setVatPct] = React.useState<number>(21);
  const [validityDays, setValidityDays] = React.useState<number>(30);
  const [notes, setNotes] = React.useState("");
  const [internalNotes, setInternalNotes] = React.useState("");

  // Resultados por línea + total combinado
  const results = lines.map((l) => computeLineResult(l, rules, pricing, pricingMap));
  const combinedBase =
    Math.round(results.reduce((acc, r) => acc + r.effectiveBase, 0) * 100) / 100;
  const amounts = computeQuoteAmounts({
    base_price_eur: combinedBase,
    discount_percent: discountPct,
    vat_percent: vatPct,
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) {
      setError("El nombre del cliente es obligatorio");
      return;
    }
    setError(null);
    const items: CreateQuoteItemInput[] = lines.map((line, i) => {
      const r = results[i];
      return {
        service_slug: line.serviceSlug,
        tier: r.useEngine ? r.engineResult?.selectedTierKey ?? line.tierKey : line.tierKey,
        modality: line.modality,
        pricing_inputs: r.useEngine ? line.caseInputs : null,
        base_price_eur: r.effectiveBase,
        override_price: line.overridePrice,
      };
    });
    startTransition(async () => {
      const res = await createQuote({
        client_name: clientName,
        client_nif: clientNif,
        client_email: clientEmail,
        client_company: clientCompany,
        client_sector: clientSector,
        client_address: clientAddress,
        items,
        discount_percent: discountPct,
        vat_percent: vatPct,
        validity_days: validityDays,
        notes,
        internal_notes: internalNotes,
        crm_entity_type: crmLink?.entity_type ?? null,
        crm_entity_id: crmLink?.entity_id ?? null,
      });
      if (!res.ok) setError(res.error);
      else if (res.id) router.push(`/comercial/calculadora/${res.id}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      {/* Columna izquierda: cliente + servicios + notas */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="card-dark p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h3 className="text-base font-semibold text-fg">Datos del cliente</h3>
            <ClientPicker
              selected={crmLink}
              onSelect={applyCrmHit}
              onClear={() => setCrmLink(null)}
              triggerLabel="Buscar en CRM"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="client_name">Nombre · razón social *</Label>
              <Input id="client_name" value={clientName} onChange={(e) => setClientName(e.target.value)} required disabled={pending} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="client_nif">NIF / CIF</Label>
              <Input id="client_nif" value={clientNif} onChange={(e) => setClientNif(e.target.value)} disabled={pending} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="client_email">Email</Label>
              <Input id="client_email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} disabled={pending} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="client_company">Empresa</Label>
              <Input id="client_company" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} disabled={pending} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="client_sector">Sector</Label>
              <Input id="client_sector" value={clientSector} onChange={(e) => setClientSector(e.target.value)} disabled={pending} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="client_address">Domicilio</Label>
              <Input id="client_address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} disabled={pending} />
            </div>
          </div>
        </div>

        {/* Servicios (multi-línea) */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-fg">
            Servicios {lines.length > 1 ? `(${lines.length})` : ""}
          </h3>
          <Button type="button" variant="secondary" onClick={addLine} disabled={pending} className="h-9 px-3 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span className="ml-1">Añadir servicio</span>
          </Button>
        </div>

        {lines.map((line, i) => (
          <LineCard
            key={line.key}
            index={i}
            line={line}
            result={results[i]}
            availableServices={availableServices}
            canRemove={lines.length > 1}
            pending={pending}
            onChangeService={(s) => changeService(line.key, s)}
            onChangeModality={(m) => changeModality(line.key, m, line.serviceSlug)}
            onChangeTier={(t) => updateLine(line.key, { tierKey: t })}
            onChangeInput={(k, v) =>
              updateLine(line.key, { caseInputs: { ...line.caseInputs, [k]: v } })
            }
            onToggleOverride={() =>
              updateLine(line.key, {
                overridePrice: !line.overridePrice,
                manualBase: !line.overridePrice ? results[i].computedBase : line.manualBase,
              })
            }
            onChangeManualBase={(v) => updateLine(line.key, { manualBase: v })}
            onRemove={() => removeLine(line.key)}
          />
        ))}

        <div className="card-dark p-5">
          <h3 className="text-base font-semibold text-fg mb-4">Notas</h3>
          <div className="grid gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Alcance / observaciones (visible en PDF)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={2000}
                disabled={pending}
                className="rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 py-2.5 text-sm text-fg resize-y"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="internal_notes">Notas internas (no aparecen en el PDF)</Label>
              <textarea
                id="internal_notes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
                maxLength={2000}
                disabled={pending}
                className="rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-3 py-2.5 text-sm text-fg resize-y"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha: cálculo combinado */}
      <div className="lg:col-span-1">
        <div className="card-dark p-5 sticky top-20 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-fg flex items-center gap-2">
            <Calculator className="h-4 w-4 text-brand-400" strokeWidth={1.5} />
            Cálculo
          </h3>

          {/* Resumen por servicio */}
          <div className="flex flex-col gap-1.5 text-sm">
            {lines.map((line, i) => (
              <div key={line.key} className="flex justify-between gap-2 text-anthracite-200">
                <span className="truncate">{SERVICE_LABELS[line.serviceSlug]}</span>
                <span className="shrink-0 tabular-nums text-fg">{formatEuro(results[i].effectiveBase)}</span>
              </div>
            ))}
            {lines.length > 1 ? (
              <div className="flex justify-between pt-2 mt-1 border-t border-anthracite-600/30 text-anthracite-100">
                <span className="font-medium">Base combinada</span>
                <span className="font-medium tabular-nums">{formatEuro(combinedBase)}</span>
              </div>
            ) : null}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <Label>Descuento (%)</Label>
              <Input type="number" min={0} max={100} step={1} value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} disabled={pending} />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <Label>IVA (%)</Label>
              <Input type="number" min={0} max={100} step={1} value={vatPct} onChange={(e) => setVatPct(Number(e.target.value))} disabled={pending} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Validez (días)</Label>
            <Input type="number" min={1} max={365} value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} disabled={pending} />
          </div>

          <div className="border-t border-anthracite-600/30 pt-4 mt-2 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-anthracite-200">
              <span>Subtotal</span>
              <span className="font-medium text-fg">{formatEuro(amounts.subtotal)}</span>
            </div>
            <div className="flex justify-between text-anthracite-200">
              <span>IVA</span>
              <span className="font-medium text-fg">{formatEuro(amounts.vatAmount)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-anthracite-600/30 mt-2">
              <span className="text-anthracite-100 font-medium">Total</span>
              <span className="text-2xl font-semibold text-brand-400 tracking-tight">{formatEuro(amounts.total)}</span>
            </div>
          </div>

          {error ? <p className="text-xs text-error">{error}</p> : null}

          <Button type="submit" loading={pending} className="mt-2">
            Crear presupuesto
          </Button>
          <p className="text-[10px] text-anthracite-400 text-center">
            Se guardará como borrador. El PDF se genera con un click.
          </p>
        </div>
      </div>
    </form>
  );
}

function LineCard({
  index,
  line,
  result,
  availableServices,
  canRemove,
  pending,
  onChangeService,
  onChangeModality,
  onChangeTier,
  onChangeInput,
  onToggleOverride,
  onChangeManualBase,
  onRemove,
}: {
  index: number;
  line: Line;
  result: LineResult;
  availableServices: [ServiceSlug, string][];
  canRemove: boolean;
  pending: boolean;
  onChangeService: (s: ServiceSlug) => void;
  onChangeModality: (m: Modality) => void;
  onChangeTier: (t: string) => void;
  onChangeInput: (k: string, v: number | boolean | string) => void;
  onToggleOverride: () => void;
  onChangeManualBase: (v: number) => void;
  onRemove: () => void;
}) {
  const { useEngine, engineResult, effectiveBase, tierOptions, modalities, inputDefs, showTierDropdown } = result;

  return (
    <div className="card-dark p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-anthracite-100">Servicio {index + 1}</h4>
        {canRemove ? (
          <button type="button" onClick={onRemove} disabled={pending} className="text-anthracite-400 hover:text-error" aria-label="Quitar servicio">
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-3">
          <Label>Servicio</Label>
          <select value={line.serviceSlug} onChange={(e) => onChangeService(e.target.value as ServiceSlug)} disabled={pending} className={selectClass}>
            {availableServices.map(([slug, label]) => (
              <option key={slug} value={slug}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tier</Label>
          {showTierDropdown ? (
            <select value={line.tierKey} onChange={(e) => onChangeTier(e.target.value)} disabled={pending || tierOptions.length === 0} className={selectClass}>
              {tierOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <div className="h-11 flex items-center rounded-[10px] border border-anthracite-600/40 bg-anthracite-900/60 px-3 text-sm text-anthracite-200">
              {engineResult?.selectedTierLabel ?? "—"}
              <span className="ml-1.5 text-[10px] text-anthracite-500">(automático)</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Modalidad</Label>
          <select value={line.modality} onChange={(e) => onChangeModality(e.target.value as Modality)} disabled={pending} className={selectClass}>
            {modalities.map((m) => (
              <option key={m} value={m}>{MODALITY_LABELS[m]}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <p className="text-[11px] text-anthracite-400">
            {SERVICE_LABELS[line.serviceSlug]}
          </p>
        </div>
      </div>

      {useEngine && inputDefs.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 border-t border-anthracite-600/20 pt-3">
          {inputDefs.map((def) => (
            <div key={def.key} className="flex flex-col gap-1.5">
              <Label>{def.label}</Label>
              {def.type === "number" ? (
                <Input type="number" min={def.min ?? 0} step={def.step ?? 1} value={String(line.caseInputs[def.key] ?? "")} onChange={(e) => onChangeInput(def.key, Number(e.target.value))} disabled={pending} />
              ) : def.type === "boolean" ? (
                <label className="flex items-center gap-2 text-sm text-anthracite-100 h-11">
                  <input type="checkbox" checked={Boolean(line.caseInputs[def.key])} onChange={(e) => onChangeInput(def.key, e.target.checked)} disabled={pending} className="h-4 w-4 accent-brand-500" />
                  Sí
                </label>
              ) : (
                <select value={String(line.caseInputs[def.key] ?? "")} onChange={(e) => onChangeInput(def.key, e.target.value)} disabled={pending} className={selectClass}>
                  {(def.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
              {def.help ? <p className="text-[10px] text-anthracite-400">{def.help}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* Precio de la línea */}
      <div className="border-t border-anthracite-600/20 pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>{useEngine ? "Precio cerrado (€)" : "Precio base (€)"}</Label>
          <button type="button" onClick={onToggleOverride} className="text-[10px] text-anthracite-400 hover:text-brand-400">
            {line.overridePrice ? "Usar cálculo" : "Editar manual"}
          </button>
        </div>
        <Input type="number" min={0} step={50} value={effectiveBase} onChange={(e) => onChangeManualBase(Number(e.target.value))} disabled={pending || !line.overridePrice} />
        {useEngine && engineResult?.isCustom ? (
          <p className="text-[10px] text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" strokeWidth={1.5} />
            Tarifa a medida — confirma el precio manualmente.
          </p>
        ) : null}
        {!line.overridePrice && useEngine && engineResult && engineResult.breakdown.length > 1 ? (
          <div className="flex flex-col gap-1 text-xs text-anthracite-300">
            {engineResult.breakdown.map((l, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="truncate">{l.label}</span>
                <span className="shrink-0 tabular-nums">{formatEuro(l.amount)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
