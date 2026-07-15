"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  PROFESSIONAL_TYPES,
  PROFESSIONAL_TYPE_LABELS,
} from "~/lib/captacion/types";
import { createProspectPartner } from "~/lib/actions/captacion";

export function PosiblePartnerForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setOkMsg(null);
    const fullName = String(formData.get("full_name") ?? "").trim();
    startTransition(async () => {
      const res = await createProspectPartner({
        full_name: fullName,
        company: String(formData.get("company") ?? "").trim() || null,
        professional_type:
          String(formData.get("professional_type") ?? "").trim() || null,
        city: String(formData.get("city") ?? "").trim() || null,
        email: String(formData.get("email") ?? "").trim() || null,
        phone: String(formData.get("phone") ?? "").trim() || null,
        company_website:
          String(formData.get("company_website") ?? "").trim() || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
      });
      if (res.ok) {
        setOkMsg(`Añadido: ${fullName}`);
        formRef.current?.reset();
      } else {
        setError(res.error);
      }
    });
  }

  const inputClass =
    "w-full rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900 px-3 py-1.5 text-xs text-fg focus:border-brand-500/50 focus:outline-none";

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Añadir posible partner
        </Button>
        {okMsg ? <p className="text-xs text-success">{okMsg}</p> : null}
      </div>
    );
  }

  return (
    <div className="card-dark p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-400">
          Añadir posible partner
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-anthracite-400 hover:text-fg"
          aria-label="Cerrar formulario"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <form ref={formRef} action={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            name="full_name"
            type="text"
            required
            placeholder="Nombre de la persona o de la notaría/despacho *"
            className={inputClass}
          />
          <input
            name="company"
            type="text"
            placeholder="Organización (notaría, despacho, gestoría…)"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select
            name="professional_type"
            defaultValue=""
            className={inputClass}
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
            placeholder="Ciudad (p. ej. Barcelona)"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            name="email"
            type="email"
            placeholder="Email público"
            className={inputClass}
          />
          <input
            name="phone"
            type="text"
            placeholder="Teléfono"
            className={inputClass}
          />
        </div>
        <input
          name="company_website"
          type="text"
          placeholder="Web (https://…)"
          className={inputClass}
        />
        <textarea
          name="notes"
          rows={2}
          placeholder="Notas (por qué encaja, quién es el contacto…)"
          className={inputClass}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" variant="primary" loading={pending}>
            Guardar
          </Button>
          {okMsg ? <p className="text-xs text-success">{okMsg}</p> : null}
          {error ? <p className="text-xs text-error">{error}</p> : null}
        </div>
      </form>
    </div>
  );
}
