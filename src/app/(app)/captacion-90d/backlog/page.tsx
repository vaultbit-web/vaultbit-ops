import { BacklogKanban } from "~/components/captacion-90d/backlog-kanban";
import {
  getEvents,
  getPartners,
  getTasks,
} from "~/lib/queries/captacion";

export const dynamic = "force-dynamic";

export default async function BacklogPage() {
  const [tasks, partners, events] = await Promise.all([
    getTasks(),
    getPartners(),
    getEvents(),
  ]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-light text-fg tracking-tight">
          Backlog <span className="font-bold">90 días</span>
        </h1>
        <p className="text-sm text-anthracite-200 mt-1">
          Kanban con drag&drop. {tasks.length} tareas totales · arrastra entre columnas para cambiar de estado.
        </p>
      </header>
      <BacklogKanban
        initialTasks={tasks}
        partners={partners}
        events={events}
      />
    </div>
  );
}
