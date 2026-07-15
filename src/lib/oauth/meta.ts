import { encrypt, decrypt } from "./crypto";
import { createClient } from "~/lib/supabase/server";

/**
 * Cliente OAuth Meta (Facebook Login para Business). Usado para acceder a
 * la Graph API de Instagram con permisos `instagram_basic` +
 * `instagram_manage_insights` + `pages_show_list` + `pages_read_engagement`,
 * que son los necesarios para leer métricas de los Reels publicados desde
 * `@danielbrosedemprendedor`.
 *
 * Flujo:
 *   1. /api/auth/meta/start    → redirige a Facebook login con scopes.
 *   2. Facebook → /api/auth/meta/callback con `code`.
 *   3. Intercambiamos `code` por short-lived token, luego short → long
 *      (60 días). Resolvemos la Página y la cuenta IG vinculada y guardamos
 *      todo cifrado.
 *   4. `getValidAccessToken()` refresca el long-lived si quedan <7 días.
 *
 * Notas:
 *   - Meta NO devuelve `refresh_token` separado: el long-lived token se
 *     puede refrescar llamando otra vez al endpoint de "long-lived" antes
 *     de que expire.
 *   - Para que esto funcione la cuenta `@danielbrosedemprendedor` debe
 *     estar marcada como Business o Creator y vinculada a una página
 *     de Facebook (requisito de Meta para acceder a Insights de IG).
 */

export const META_SCOPES = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
] as const;

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const AUTH_URL = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

export function getRedirectUri(): string {
  const explicit = process.env.META_REDIRECT_URI;
  if (explicit) return explicit;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  return `${base.replace(/\/$/, "")}/api/auth/meta/callback`;
}

function getCredentials(): { appId: string; appSecret: string } {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error(
      "META_APP_ID y META_APP_SECRET deben estar configurados en Dokploy.",
    );
  }
  return { appId, appSecret };
}

export function buildAuthUrl(state: string): string {
  const { appId } = getCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: META_SCOPES.join(","),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

interface ShortLivedToken {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

interface LongLivedToken {
  access_token: string;
  token_type?: string;
  expires_in: number;
}

/**
 * Intercambia el `code` recibido en el callback por un short-lived token.
 */
export async function exchangeCodeForShortLived(
  code: string,
): Promise<ShortLivedToken> {
  const { appId, appSecret } = getCredentials();
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", getRedirectUri());
  url.searchParams.set("code", code);

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta exchange code falló: ${res.status} ${text}`);
  }
  return (await res.json()) as ShortLivedToken;
}

/**
 * Cambia un short-lived (1h) por un long-lived (60d). Es el mismo endpoint
 * que se llama para "refrescar" un long-lived antes de que expire.
 */
export async function exchangeForLongLived(
  shortLivedAccessToken: string,
): Promise<LongLivedToken> {
  const { appId, appSecret } = getCredentials();
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortLivedAccessToken);

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta long-lived exchange falló: ${res.status} ${text}`);
  }
  const data = (await res.json()) as Partial<LongLivedToken>;
  if (!data.access_token || typeof data.expires_in !== "number") {
    throw new Error("Meta no devolvió access_token o expires_in válidos");
  }
  return {
    access_token: data.access_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
  };
}

/**
 * Devuelve la primera página de Facebook a la que el usuario tiene acceso
 * y que tenga un Instagram Business Account vinculado. Si no hay ninguna,
 * lanza un error con un mensaje útil para que Daniel sepa qué hacer.
 */
export async function resolveInstagramAccount(
  accessToken: string,
): Promise<{
  instagram_user_id: string;
  instagram_username: string | null;
  facebook_page_id: string;
  facebook_page_name: string | null;
}> {
  // 1. Listar páginas con Instagram vinculado
  const pagesUrl = new URL(`${GRAPH_BASE}/me/accounts`);
  pagesUrl.searchParams.set(
    "fields",
    "id,name,instagram_business_account{id,username}",
  );
  pagesUrl.searchParams.set("access_token", accessToken);

  const res = await fetch(pagesUrl, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Meta /me/accounts falló: ${res.status} ${text.slice(0, 200)}`,
    );
  }
  const data = (await res.json()) as {
    data?: Array<{
      id: string;
      name?: string;
      instagram_business_account?: { id: string; username?: string };
    }>;
  };
  const pages = data.data ?? [];
  const withIg = pages.find((p) => p.instagram_business_account?.id);
  if (!withIg || !withIg.instagram_business_account) {
    throw new Error(
      "No se encontró ninguna página de Facebook con cuenta de Instagram Business vinculada. " +
        "Asegúrate de que @danielbrosedemprendedor está como Business/Creator y vinculada a una FB Page.",
    );
  }
  return {
    instagram_user_id: withIg.instagram_business_account.id,
    instagram_username: withIg.instagram_business_account.username ?? null,
    facebook_page_id: withIg.id,
    facebook_page_name: withIg.name ?? null,
  };
}

interface SaveTokensInput {
  userId: string;
  longLived: LongLivedToken;
  account: {
    instagram_user_id: string;
    instagram_username: string | null;
    facebook_page_id: string;
    facebook_page_name: string | null;
  };
}

export async function saveTokens(input: SaveTokensInput): Promise<void> {
  const supabase = await createClient();
  const expiresAt = new Date(
    Date.now() + input.longLived.expires_in * 1000,
  ).toISOString();
  const accessTokenEnc = encrypt(input.longLived.access_token);

  const { error } = await supabase.from("meta_oauth_tokens").upsert(
    {
      user_id: input.userId,
      access_token_enc: accessTokenEnc,
      expires_at: expiresAt,
      instagram_user_id: input.account.instagram_user_id,
      instagram_username: input.account.instagram_username,
      facebook_page_id: input.account.facebook_page_id,
      facebook_page_name: input.account.facebook_page_name,
      scope: META_SCOPES.join(","),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`No se pudo guardar el token Meta: ${error.message}`);
}

/**
 * Devuelve un access_token Meta válido. Si quedan <7 días para expirar,
 * intenta refrescarlo (el endpoint long-lived sirve también de refresh).
 * Devuelve null si el usuario no ha conectado o si el refresh falla.
 */
export async function getValidAccessToken(
  userId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meta_oauth_tokens")
    .select("access_token_enc, expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;

  const expiresAt = new Date(data.expires_at).getTime();
  const now = Date.now();
  const REFRESH_MARGIN_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

  const current = decrypt(data.access_token_enc);
  if (expiresAt - now > REFRESH_MARGIN_MS) return current;

  // Refrescar usando el mismo current token como fb_exchange_token.
  try {
    const fresh = await exchangeForLongLived(current);
    const newExpiresAt = new Date(now + fresh.expires_in * 1000).toISOString();
    const { error: updateErr } = await supabase
      .from("meta_oauth_tokens")
      .update({
        access_token_enc: encrypt(fresh.access_token),
        expires_at: newExpiresAt,
      })
      .eq("user_id", userId);
    if (updateErr) {
      console.error("[meta getValidAccessToken] update", updateErr.message);
    }
    return fresh.access_token;
  } catch (err) {
    console.error("[meta getValidAccessToken] refresh failed:", err);
    // Si el refresh falla pero el token actual aún no ha expirado del todo,
    // lo devolvemos para no romper la app inmediatamente.
    if (expiresAt > now) return current;
    return null;
  }
}

export interface MetaConnectionStatus {
  connected: boolean;
  instagram_username: string | null;
  facebook_page_name: string | null;
  expires_at: string | null;
}

export async function getConnectionStatus(
  userId: string,
): Promise<MetaConnectionStatus> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meta_oauth_tokens")
    .select("instagram_username, facebook_page_name, expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) {
    return {
      connected: false,
      instagram_username: null,
      facebook_page_name: null,
      expires_at: null,
    };
  }
  return {
    connected: true,
    instagram_username: data.instagram_username,
    facebook_page_name: data.facebook_page_name,
    expires_at: data.expires_at,
  };
}

export async function deleteTokens(userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("meta_oauth_tokens").delete().eq("user_id", userId);
}

/**
 * Útil para los helpers Graph: lee la fila completa con instagram_user_id.
 * No descifra el token aquí — usa getValidAccessToken para eso.
 */
export async function getUserMetaContext(userId: string): Promise<{
  instagram_user_id: string;
  facebook_page_id: string;
} | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meta_oauth_tokens")
    .select("instagram_user_id, facebook_page_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data || !data.instagram_user_id || !data.facebook_page_id) return null;
  return {
    instagram_user_id: data.instagram_user_id,
    facebook_page_id: data.facebook_page_id,
  };
}
