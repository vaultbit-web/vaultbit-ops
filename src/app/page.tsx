import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && isEmailAllowed(user.email)) {
    redirect("/dashboard");
  }
  redirect("/login");
}
