import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Acceso · VaultBit Ops",
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
          <div className="flex flex-col items-center gap-5 mb-8">
            <div className="rounded-[14px] border border-brand-500/40 bg-brand-500/10 p-2.5">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-brand-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-light text-fg tracking-tight">
                VaultBit <span className="font-bold">Ops</span>
              </h1>
              <p className="text-xs text-anthracite-200">
                Centro de operaciones interno
              </p>
            </div>
          </div>

          <LoginForm initialError={params.error} />
        </div>

        <p className="text-center text-[11px] text-anthracite-400 mt-6">
          © {new Date().getFullYear()} VaultBit Advisory S.L.
        </p>
      </div>
    </main>
  );
}
