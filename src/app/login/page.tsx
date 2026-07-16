import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { Isotype } from "~/components/brand/isotype";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Acceso · Centro de Operaciones",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && isEmailAllowed(user.email)) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-dvh grid place-items-center px-4 py-12 grid-bg">
      <div className="w-full max-w-md">
        <div className="card-dark glow-orange p-8 sm:p-10">
          <div className="flex flex-col items-center gap-4 mb-8">
            <Isotype size={52} animated />
            <div className="text-center space-y-1">
              <h1
                className="text-2xl text-fg tracking-tight"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                Daniel Brosed
              </h1>
              <p className="db-kicker text-[11px] text-anthracite-400">
                Centro de Operaciones
              </p>
            </div>
          </div>

          <LoginForm initialError={params.error} />
        </div>

        <p className="text-center text-[11px] text-anthracite-400 mt-6">
          © {new Date().getFullYear()} Daniel Brosed
        </p>
      </div>
    </main>
  );
}
