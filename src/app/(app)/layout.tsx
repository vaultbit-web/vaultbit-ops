import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { Sidebar } from "~/components/sidebar";
import { Header } from "~/components/header";
import { BottomNav } from "~/components/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defensa en profundidad: el middleware ya redirige, pero aquí también.
  if (!user || !isEmailAllowed(user.email)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar desktop */}
      <div className="hidden lg:block w-[260px] shrink-0 sticky top-0 h-dvh">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header userEmail={user.email ?? null} />
        <main className="flex-1 px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-10">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
