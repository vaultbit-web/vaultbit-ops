import Link from "next/link";
import { Calculator, ScrollText, FileSignature } from "lucide-react";
import type { EntityType } from "~/lib/supabase/types";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";

interface Props {
  entityType: EntityType;
  entityId: string;
}

/**
 * Bloque de acciones rápidas que se muestra en cada página detalle CRM.
 * Lleva al usuario al editor de presupuesto / plantilla legal con el cliente
 * pre-vinculado y los campos relevantes autocompletados.
 *
 * Las plantillas concretas dependen del tipo de entidad:
 *   - funnel_lead / lead_magnet → presupuesto + precontrato + aceptación
 *   - investor                 → NDA mutuo + precontrato
 *   - partner                  → acuerdo de partner + NDA
 */
export function CrmDocActions({ entityType, entityId }: Props) {
  const baseQs = `entity_type=${entityType}&entity_id=${entityId}`;

  const actions: { href: string; label: string; sub: string; icon: React.ElementType }[] = [];

  // Presupuesto: para todos
  actions.push({
    href: `/comercial/calculadora/nueva?${baseQs}`,
    label: "Nuevo presupuesto",
    sub: "Calcular y generar PDF",
    icon: Calculator,
  });

  // Precontrato: para clientes potenciales
  if (entityType === "funnel_lead" || entityType === "lead_magnet") {
    actions.push({
      href: `/comercial/legal/precontrato-servicios?${baseQs}`,
      label: "Precontrato de servicios",
      sub: "Documento previo a la firma",
      icon: ScrollText,
    });
  }

  // NDA: investors y partners
  if (entityType === "investor" || entityType === "partner") {
    actions.push({
      href: `/comercial/legal/nda-mutuo?${baseQs}`,
      label: "NDA mutuo bilateral",
      sub: "Acuerdo de confidencialidad",
      icon: ScrollText,
    });
  }

  // Acuerdo partner: sólo partners
  if (entityType === "partner") {
    actions.push({
      href: `/comercial/legal/acuerdo-partner?${baseQs}`,
      label: "Acuerdo de partner",
      sub: "Marco de colaboración profesional",
      icon: FileSignature,
    });
  }

  // Aceptación de presupuesto: clientes potenciales
  if (entityType === "funnel_lead" || entityType === "lead_magnet") {
    actions.push({
      href: `/comercial/legal/aceptacion-presupuesto?${baseQs}`,
      label: "Aceptación de presupuesto",
      sub: "Versión corta para servicios pequeños",
      icon: FileSignature,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos comerciales</CardTitle>
        <CardDescription>
          Genera presupuestos y plantillas legales con los datos de este cliente pre-rellenados.
        </CardDescription>
      </CardHeader>

      <ul className="grid gap-2 sm:grid-cols-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <li key={a.href}>
              <Link
                href={a.href}
                className="flex items-center gap-3 rounded-[10px] border border-anthracite-600/40 bg-anthracite-900 px-3.5 py-3 text-sm hover:border-brand-500/40 hover:bg-anthracite-800 transition-colors group"
              >
                <span className="rounded-[8px] bg-brand-500/10 p-2 text-brand-400 shrink-0 group-hover:bg-brand-500/15">
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-fg font-medium truncate">{a.label}</p>
                  <p className="text-[11px] text-anthracite-400 truncate">{a.sub}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
