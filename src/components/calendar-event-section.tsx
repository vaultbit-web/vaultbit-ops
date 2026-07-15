import Link from "next/link";
import { Calendar, Plug } from "lucide-react";
import { createClient } from "~/lib/supabase/server";
import { getConnectionStatus } from "~/lib/oauth/google";
import { CreateEventButton } from "~/components/create-event-button";

interface CalendarEventSectionProps {
  /** Path a revalidar tras crear el evento (página detalle del lead). */
  revalidatePath: string;
  defaultTitle: string;
  /** Email pre-poblado como invitado del evento (lead/inversor/partner). */
  attendeeEmail?: string | null;
}

/**
 * Sección que aparece en las páginas detalle del CRM. Si Google Calendar está
 * conectado, muestra el botón para crear evento. Si no, ofrece un CTA hacia
 * Ajustes para conectar.
 */
export async function CalendarEventSection({
  revalidatePath,
  defaultTitle,
  attendeeEmail,
}: CalendarEventSectionProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const status = await getConnectionStatus(user.id);

  if (!status.connected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-(--radius-lg) border border-anthracite-600/40 bg-anthracite-900/40 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="h-4 w-4 text-anthracite-400 shrink-0" strokeWidth={1.5} />
          <p className="text-xs text-anthracite-300 truncate">
            Conecta Google Calendar para agendar reuniones desde aquí.
          </p>
        </div>
        <Link
          href="/ajustes"
          className="inline-flex items-center gap-1.5 rounded-(--radius-md) border border-anthracite-600/60 px-2.5 py-1.5 text-[11px] font-semibold text-anthracite-100 hover:border-brand-500/40 hover:text-fg transition-colors shrink-0"
        >
          <Plug className="h-3.5 w-3.5" strokeWidth={1.5} />
          Conectar
        </Link>
      </div>
    );
  }

  return (
    <CreateEventButton
      revalidatePath={revalidatePath}
      defaultTitle={defaultTitle}
      attendeeEmail={attendeeEmail ?? null}
    />
  );
}
