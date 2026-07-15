"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";
import { isEmailAllowed } from "~/lib/auth/allowlist";
import {
  JOB_OFFER_STATUSES,
  type JobOfferStatus,
} from "~/lib/empleo/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function assertAuthorized() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    throw new Error("No autorizado");
  }
  return { user, supabase };
}

/** Triaje manual de una oferta. Único campo que Ops escribe en job_offers. */
export async function updateJobOfferStatus(
  offerId: string,
  status: JobOfferStatus,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAuthorized();
    if (!JOB_OFFER_STATUSES.includes(status)) {
      return { ok: false, error: "Estado inválido" };
    }
    if (!offerId) return { ok: false, error: "ID inválido" };

    const { error } = await supabase
      .from("job_offers")
      .update({ status })
      .eq("id", offerId);
    if (error) {
      // No filtrar el detalle interno de Postgres/PostgREST al cliente.
      console.error("[updateJobOfferStatus]", error.message);
      return { ok: false, error: "No se pudo actualizar el estado" };
    }

    revalidatePath("/empleo");
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "No autorizado") {
      return { ok: false, error: "No autorizado" };
    }
    console.error("[updateJobOfferStatus]", err);
    return { ok: false, error: "No se pudo actualizar el estado" };
  }
}
