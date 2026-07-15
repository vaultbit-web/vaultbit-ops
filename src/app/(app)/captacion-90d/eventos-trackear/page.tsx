import { EventosTrackearList } from "~/components/captacion-90d/eventos-trackear-list";
import { getEvents, getPartners } from "~/lib/queries/captacion";

export const dynamic = "force-dynamic";

export default async function EventosTrackearPage() {
  const [events, partners] = await Promise.all([getEvents(), getPartners()]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-light text-fg tracking-tight">
          Eventos <span className="font-bold">a trackear</span>
        </h1>
        <p className="text-sm text-anthracite-200 mt-1">
          {events.length} eventos en monitor / asistir / ponente / patrocinador. Botón «Convertir a tarea» crea una tarea P1 en el backlog vinculada al evento.
        </p>
      </header>

      <EventosTrackearList events={events} partners={partners} />
    </div>
  );
}
