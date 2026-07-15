import { Dashboard90d } from "~/components/captacion-90d/dashboard-90d";
import {
  getDashboardKpis,
  getNextPartnerActions,
  getTasksForCurrentWeek,
  getUpcomingEvents,
} from "~/lib/queries/captacion";

export const dynamic = "force-dynamic";

export default async function CaptacionDashboardPage() {
  const [kpis, weekTasks, nextActions, upcomingEvents] = await Promise.all([
    getDashboardKpis(),
    getTasksForCurrentWeek(),
    getNextPartnerActions(5),
    getUpcomingEvents(3),
  ]);

  return (
    <Dashboard90d
      kpis={kpis}
      weekTasks={weekTasks}
      nextActions={nextActions}
      upcomingEvents={upcomingEvents}
    />
  );
}
