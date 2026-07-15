import Link from "next/link";
import { CalendarRange, Plug } from "lucide-react";
import { getCalConnectionStatus, listEventTypes } from "~/lib/cal/client";
import { CalLinkButton } from "~/components/cal-link-button";

interface CalLinkSectionProps {
  /** Email del lead — pre-rellenado en el form de booking. */
  attendeeEmail?: string | null;
  /** Nombre del lead — pre-rellenado en el form de booking. */
  attendeeName?: string | null;
  /** Path a revalidar tras crear booking (página detalle). */
  revalidatePath?: string;
}

/**
 * Sección server-rendered que decide si mostrar el botón "Enviar link Cal.com"
 * o un CTA hacia /ajustes para conectar.
 *
 * Aparece en las páginas detalle del CRM junto a CrmDocActions y al botón
 * de Google Calendar.
 */
export async function CalLinkSection({
  attendeeEmail,
  attendeeName,
  revalidatePath,
}: CalLinkSectionProps) {
  const status = await getCalConnectionStatus();

  if (!status.configured) {
    // No mostramos nada si la API key no está siquiera puesta — el usuario lo
    // verá en /ajustes. Evitamos saturar la UI con avisos en cada lead.
    return null;
  }

  if (!status.connected) {
    return (
      <div className="flex items-center gap-2 rounded-(--radius-md) border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
        <CalendarRange className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        Cal.com no conectado.
        <Link href="/ajustes" className="underline ml-auto">
          Revisar
        </Link>
      </div>
    );
  }

  const eventTypes = await listEventTypes();
  if (eventTypes.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-(--radius-md) border border-anthracite-600/40 bg-anthracite-900/40 px-3 py-2 text-xs text-anthracite-300">
        <CalendarRange className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        Cal.com conectado pero sin event types.
        <a
          href="https://cal.com/event-types"
          target="_blank"
          rel="noopener noreferrer"
          className="underline ml-auto inline-flex items-center gap-1"
        >
          <Plug className="h-3 w-3" strokeWidth={1.5} />
          Crear uno
        </a>
      </div>
    );
  }

  return (
    <CalLinkButton
      eventTypes={eventTypes}
      attendeeEmail={attendeeEmail ?? null}
      attendeeName={attendeeName ?? null}
      revalidatePath={revalidatePath}
    />
  );
}
