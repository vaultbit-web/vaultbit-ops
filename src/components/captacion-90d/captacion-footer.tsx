import { CAPTACION_DISCLAIMERS } from "~/lib/captacion/types";

/**
 * Footer obligatorio en todas las vistas de /captacion-90d.
 *
 * Disclaimers literales de la Sección 10 del Manual Operativo.
 */
export function CaptacionFooter() {
  return (
    <footer className="mt-12 border-t border-anthracite-600/30 pt-6">
      <div className="card-dark-sub p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-400 mb-3">
          Disclaimers obligatorios · Vaultbit Advisory
        </p>
        <ul className="space-y-1.5 text-xs text-anthracite-200 leading-relaxed">
          {CAPTACION_DISCLAIMERS.map((d) => (
            <li key={d} className="flex gap-2">
              <span aria-hidden className="text-brand-500">·</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 text-center text-[11px] text-anthracite-400">
        Fuente única de verdad: <span className="font-mono">Vaultbit_Manual_Operativo_y_CRM_Partners.html</span> · v1.1 · 25 may 2026
      </p>
    </footer>
  );
}
