"use client";

import * as React from "react";
import { Plus, Trash2, Save, Check } from "lucide-react";
import {
  upsertPricingTier,
  deletePricingTier,
  upsertPricingModifier,
  deletePricingModifier,
  type PricingTierInput,
  type PricingModifierInput,
} from "~/lib/actions/pricing";
import {
  SERVICE_LABELS,
  MODIFIER_KINDS,
  MODIFIER_KIND_LABELS,
  MODALITY_LABELS,
  MODALITIES,
  type ServiceSlug,
  type PricingTier,
  type PricingModifier,
} from "~/lib/supabase/types";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/input";

const selectClass =
  "h-10 rounded-[10px] border border-anthracite-600/60 bg-anthracite-900 px-2.5 text-sm text-fg";

interface PricingAdminProps {
  tiers: PricingTier[];
  modifiers: PricingModifier[];
}

type TierDraft = Partial<PricingTier> & { service_slug: string };
type ModifierDraft = Partial<PricingModifier> & { service_slug: string };

export function PricingAdmin({ tiers, modifiers }: PricingAdminProps) {
  const services = Object.entries(SERVICE_LABELS) as [ServiceSlug, string][];
  const [tierDrafts, setTierDrafts] = React.useState<Record<string, TierDraft[]>>({});
  const [modDrafts, setModDrafts] = React.useState<Record<string, ModifierDraft[]>>({});

  function addTierDraft(slug: ServiceSlug) {
    setTierDrafts((p) => ({
      ...p,
      [slug]: [
        ...(p[slug] ?? []),
        { service_slug: slug, modality: "one_shot", base_price_eur: 0, is_custom: false, active: true },
      ],
    }));
  }
  function addModDraft(slug: ServiceSlug) {
    setModDrafts((p) => ({
      ...p,
      [slug]: [
        ...(p[slug] ?? []),
        { service_slug: slug, kind: "per_unit", unit_amount: 0, free_quantity: 0, default_enabled: true, active: true },
      ],
    }));
  }
  function dropTierDraft(slug: string, idx: number) {
    setTierDrafts((p) => ({ ...p, [slug]: (p[slug] ?? []).filter((_, i) => i !== idx) }));
  }
  function dropModDraft(slug: string, idx: number) {
    setModDrafts((p) => ({ ...p, [slug]: (p[slug] ?? []).filter((_, i) => i !== idx) }));
  }

  return (
    <div className="flex flex-col gap-6">
      {services.map(([slug, label]) => {
        const serviceTiers = tiers.filter((t) => t.service_slug === slug);
        const serviceMods = modifiers.filter((m) => m.service_slug === slug);
        const drafts = tierDrafts[slug] ?? [];
        const mDrafts = modDrafts[slug] ?? [];
        return (
          <div key={slug} className="card-dark p-5">
            <h3 className="text-base font-semibold text-fg mb-4">{label}</h3>

            {/* Tiers */}
            <div className="mb-2 flex items-center justify-between">
              <Label>Tiers (escalones base)</Label>
              <button
                type="button"
                onClick={() => addTierDraft(slug)}
                className="text-[11px] text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
              >
                <Plus className="h-3 w-3" strokeWidth={2} /> Nuevo tier
              </button>
            </div>
            <div className="flex flex-col gap-2 mb-5">
              {serviceTiers.length === 0 && drafts.length === 0 ? (
                <p className="text-xs text-anthracite-400 italic">Sin tiers. Añade uno.</p>
              ) : null}
              {serviceTiers.map((t) => (
                <TierEditor key={t.id} initial={t} />
              ))}
              {drafts.map((d, i) => (
                <TierEditor key={`draft-${i}`} initial={d} onSaved={() => dropTierDraft(slug, i)} />
              ))}
            </div>

            {/* Modifiers */}
            <div className="mb-2 flex items-center justify-between">
              <Label>Recargos / add-ons</Label>
              <button
                type="button"
                onClick={() => addModDraft(slug)}
                className="text-[11px] text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
              >
                <Plus className="h-3 w-3" strokeWidth={2} /> Nuevo recargo
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {serviceMods.length === 0 && mDrafts.length === 0 ? (
                <p className="text-xs text-anthracite-400 italic">Sin recargos.</p>
              ) : null}
              {serviceMods.map((m) => (
                <ModifierEditor key={m.id} initial={m} />
              ))}
              {mDrafts.map((d, i) => (
                <ModifierEditor key={`mdraft-${i}`} initial={d} onSaved={() => dropModDraft(slug, i)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function TierEditor({ initial, onSaved }: { initial: TierDraft; onSaved?: () => void }) {
  const [f, setF] = React.useState<TierDraft>(initial);
  const [pending, start] = React.useTransition();
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  function set<K extends keyof TierDraft>(k: K, v: TierDraft[K]) {
    setF((p) => ({ ...p, [k]: v }));
    setDone(false);
  }

  function save() {
    setErr(null);
    start(async () => {
      const res = await upsertPricingTier({
        id: f.id ?? null,
        service_slug: f.service_slug,
        tier_key: f.tier_key ?? "",
        tier_label: f.tier_label ?? "",
        modality: f.modality ?? "one_shot",
        base_price_eur: Number(f.base_price_eur ?? 0),
        driver_key: f.driver_key ?? null,
        driver_min: f.driver_min ?? null,
        driver_max: f.driver_max ?? null,
        is_custom: f.is_custom ?? false,
        sort_order: f.sort_order ?? 0,
        active: f.active ?? true,
      } as PricingTierInput);
      if (!res.ok) setErr(res.error);
      else {
        setDone(true);
        onSaved?.();
      }
    });
  }

  function remove() {
    if (!f.id) {
      onSaved?.();
      return;
    }
    start(async () => {
      const res = await deletePricingTier(f.id!);
      if (!res.ok) setErr(res.error);
    });
  }

  return (
    <div className="rounded-[10px] border border-anthracite-600/40 bg-anthracite-900/40 p-3 flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-12 items-end">
        <Field className="sm:col-span-2" label="tier_key">
          <Input value={f.tier_key ?? ""} onChange={(e) => set("tier_key", e.target.value)} disabled={pending} />
        </Field>
        <Field className="sm:col-span-3" label="Etiqueta">
          <Input value={f.tier_label ?? ""} onChange={(e) => set("tier_label", e.target.value)} disabled={pending} />
        </Field>
        <Field className="sm:col-span-2" label="Modalidad">
          <select
            value={f.modality ?? "one_shot"}
            onChange={(e) => set("modality", e.target.value)}
            disabled={pending}
            className={selectClass + " w-full"}
          >
            {MODALITIES.map((m) => (
              <option key={m} value={m}>
                {MODALITY_LABELS[m]}
              </option>
            ))}
          </select>
        </Field>
        <Field className="sm:col-span-2" label="Base €">
          <Input
            type="number"
            min={0}
            step={10}
            value={String(f.base_price_eur ?? 0)}
            onChange={(e) => set("base_price_eur", num(e.target.value))}
            disabled={pending}
          />
        </Field>
        <Field className="sm:col-span-3" label="Driver (min–max)">
          <div className="flex items-center gap-1">
            <Input
              value={f.driver_key ?? ""}
              placeholder="driver"
              onChange={(e) => set("driver_key", e.target.value || null)}
              disabled={pending}
              className="w-20"
            />
            <Input
              type="number"
              value={f.driver_min ?? ""}
              placeholder="min"
              onChange={(e) => set("driver_min", e.target.value === "" ? null : num(e.target.value))}
              disabled={pending}
              className="w-20"
            />
            <Input
              type="number"
              value={f.driver_max ?? ""}
              placeholder="max"
              onChange={(e) => set("driver_max", e.target.value === "" ? null : num(e.target.value))}
              disabled={pending}
              className="w-20"
            />
          </div>
        </Field>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-anthracite-200">
          <input type="checkbox" checked={!!f.is_custom} onChange={(e) => set("is_custom", e.target.checked)} className="accent-brand-500" />
          A medida (desde)
        </label>
        <label className="flex items-center gap-1.5 text-xs text-anthracite-200">
          <input type="checkbox" checked={f.active ?? true} onChange={(e) => set("active", e.target.checked)} className="accent-brand-500" />
          Activo
        </label>
        <label className="flex items-center gap-1.5 text-xs text-anthracite-200">
          Orden
          <Input
            type="number"
            value={String(f.sort_order ?? 0)}
            onChange={(e) => set("sort_order", num(e.target.value))}
            disabled={pending}
            className="w-16 h-9"
          />
        </label>
        <div className="ml-auto flex items-center gap-2">
          {err ? <span className="text-[11px] text-error">{err}</span> : null}
          <Button type="button" variant="secondary" onClick={save} loading={pending} className="h-9 px-3 text-xs">
            {done ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            <span className="ml-1">{done ? "Guardado" : "Guardar"}</span>
          </Button>
          <button type="button" onClick={remove} disabled={pending} className="text-anthracite-400 hover:text-error" aria-label="Eliminar">
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ModifierEditor({ initial, onSaved }: { initial: ModifierDraft; onSaved?: () => void }) {
  const [f, setF] = React.useState<ModifierDraft>(initial);
  const [pending, start] = React.useTransition();
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  function set<K extends keyof ModifierDraft>(k: K, v: ModifierDraft[K]) {
    setF((p) => ({ ...p, [k]: v }));
    setDone(false);
  }

  function save() {
    setErr(null);
    start(async () => {
      const res = await upsertPricingModifier({
        id: f.id ?? null,
        service_slug: f.service_slug,
        tier_key: f.tier_key ?? null,
        modifier_key: f.modifier_key ?? "",
        label: f.label ?? "",
        kind: f.kind ?? "per_unit",
        unit_amount: Number(f.unit_amount ?? 0),
        free_quantity: Number(f.free_quantity ?? 0),
        input_key: f.input_key ?? null,
        default_enabled: f.default_enabled ?? true,
        sort_order: f.sort_order ?? 0,
        active: f.active ?? true,
      } as PricingModifierInput);
      if (!res.ok) setErr(res.error);
      else {
        setDone(true);
        onSaved?.();
      }
    });
  }

  function remove() {
    if (!f.id) {
      onSaved?.();
      return;
    }
    start(async () => {
      const res = await deletePricingModifier(f.id!);
      if (!res.ok) setErr(res.error);
    });
  }

  return (
    <div className="rounded-[10px] border border-anthracite-600/40 bg-anthracite-900/40 p-3 flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-12 items-end">
        <Field className="sm:col-span-2" label="modifier_key">
          <Input value={f.modifier_key ?? ""} onChange={(e) => set("modifier_key", e.target.value)} disabled={pending} />
        </Field>
        <Field className="sm:col-span-3" label="Etiqueta">
          <Input value={f.label ?? ""} onChange={(e) => set("label", e.target.value)} disabled={pending} />
        </Field>
        <Field className="sm:col-span-2" label="Tipo">
          <select
            value={f.kind ?? "per_unit"}
            onChange={(e) => set("kind", e.target.value)}
            disabled={pending}
            className={selectClass + " w-full"}
          >
            {MODIFIER_KINDS.map((k) => (
              <option key={k} value={k}>
                {MODIFIER_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field className="sm:col-span-2" label="Importe">
          <Input
            type="number"
            step={1}
            value={String(f.unit_amount ?? 0)}
            onChange={(e) => set("unit_amount", num(e.target.value))}
            disabled={pending}
          />
        </Field>
        <Field className="sm:col-span-1" label="Incl.">
          <Input
            type="number"
            min={0}
            value={String(f.free_quantity ?? 0)}
            onChange={(e) => set("free_quantity", num(e.target.value))}
            disabled={pending}
          />
        </Field>
        <Field className="sm:col-span-2" label="input_key">
          <Input value={f.input_key ?? ""} onChange={(e) => set("input_key", e.target.value || null)} disabled={pending} />
        </Field>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-anthracite-200">
          <input type="checkbox" checked={f.default_enabled ?? true} onChange={(e) => set("default_enabled", e.target.checked)} className="accent-brand-500" />
          Activo por defecto
        </label>
        <label className="flex items-center gap-1.5 text-xs text-anthracite-200">
          <input type="checkbox" checked={f.active ?? true} onChange={(e) => set("active", e.target.checked)} className="accent-brand-500" />
          Activo
        </label>
        <label className="flex items-center gap-1.5 text-xs text-anthracite-200">
          Orden
          <Input
            type="number"
            value={String(f.sort_order ?? 0)}
            onChange={(e) => set("sort_order", num(e.target.value))}
            disabled={pending}
            className="w-16 h-9"
          />
        </label>
        <div className="ml-auto flex items-center gap-2">
          {err ? <span className="text-[11px] text-error">{err}</span> : null}
          <Button type="button" variant="secondary" onClick={save} loading={pending} className="h-9 px-3 text-xs">
            {done ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            <span className="ml-1">{done ? "Guardado" : "Guardar"}</span>
          </Button>
          <button type="button" onClick={remove} disabled={pending} className="text-anthracite-400 hover:text-error" aria-label="Eliminar">
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={"flex flex-col gap-1 " + (className ?? "")}>
      <span className="text-[10px] uppercase tracking-wider text-anthracite-400">{label}</span>
      {children}
    </div>
  );
}
