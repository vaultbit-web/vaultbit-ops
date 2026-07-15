import { createClient } from "~/lib/supabase/server";

export interface CalBookingRow {
  id: string;
  cal_booking_id: string;
  title: string;
  event_type_slug: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  start_time: string;
  end_time: string;
  status: string;
  meeting_url: string | null;
  cancellation_reason: string | null;
}

export interface CalDashboardData {
  upcoming: CalBookingRow[];
  todayCount: number;
  thisWeekCount: number;
  total: number;
  lastReceivedAt: string | null;
}

export async function getCalDashboardData(): Promise<CalDashboardData> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [upcomingRes, totalRes, lastRes] = await Promise.all([
      supabase
        .from("cal_bookings")
        .select(
          "id, cal_booking_id, title, event_type_slug, attendee_name, attendee_email, start_time, end_time, status, meeting_url, cancellation_reason",
        )
        .gte("start_time", now.toISOString())
        .lte("start_time", in7Days.toISOString())
        .neq("status", "cancelled")
        .order("start_time", { ascending: true })
        .limit(15),
      supabase
        .from("cal_bookings")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("cal_bookings")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const upcoming = (upcomingRes.data ?? []) as CalBookingRow[];
    const todayCount = upcoming.filter(
      (b) => new Date(b.start_time) <= todayEnd,
    ).length;

    return {
      upcoming,
      todayCount,
      thisWeekCount: upcoming.length,
      total: totalRes.count ?? 0,
      lastReceivedAt: (lastRes.data as { created_at: string } | null)?.created_at ?? null,
    };
  } catch {
    return { upcoming: [], todayCount: 0, thisWeekCount: 0, total: 0, lastReceivedAt: null };
  }
}

/**
 * Bookings históricos para un email concreto (mostrar en lead detail).
 */
export async function getBookingsForEmail(email: string, limit = 5): Promise<CalBookingRow[]> {
  if (!email) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cal_bookings")
      .select(
        "id, cal_booking_id, title, event_type_slug, attendee_name, attendee_email, start_time, end_time, status, meeting_url, cancellation_reason",
      )
      .ilike("attendee_email", email)
      .order("start_time", { ascending: false })
      .limit(limit);
    return (data ?? []) as CalBookingRow[];
  } catch {
    return [];
  }
}
