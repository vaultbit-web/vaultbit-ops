import { encrypt, decrypt } from "./crypto";
import { createClient } from "~/lib/supabase/server";

/**
 * Cliente OAuth Google Calendar.
 *
 * Flujo:
 *   1. /api/auth/google/start  → redirige a Google con scopes solicitados
 *   2. Google → /api/auth/google/callback con `code`
 *   3. Intercambiamos code por { access_token, refresh_token } y guardamos cifrado
 *   4. Cuando hace falta llamar la API, getValidAccessToken() refresca si expiró
 */

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export function getRedirectUri(): string {
  // En producción usamos NEXT_PUBLIC_APP_URL si está, sino caemos al host actual.
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
}

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET deben estar configurados.",
    );
  }
  return { clientId, clientSecret };
}

/**
 * URL a la que enviar al usuario para iniciar el flujo OAuth.
 * `state` es un valor aleatorio que validamos en el callback (anti-CSRF).
 */
export function buildAuthUrl(state: string): string {
  const { clientId } = getCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline", // necesario para recibir refresh_token
    prompt: "consent", // fuerza pantalla de consentimiento → garantiza refresh_token
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

/**
 * Intercambia el `code` recibido en el callback por tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getCredentials();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error intercambiando code: ${res.status} ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

/**
 * Refresca el access_token usando el refresh_token guardado.
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = getCredentials();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error refrescando token: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return data;
}

/**
 * Lee el email del usuario Google asociado al access_token (para mostrarlo en UI).
 */
export async function getGoogleUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Guarda los tokens (cifrados) tras un intercambio inicial. Si ya existe
 * un row para este user_id, lo sobrescribe (reconexión).
 */
export async function saveTokens(
  userId: string,
  tokens: TokenResponse,
  email: string | null,
) {
  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Si Google no devuelve refresh_token, mantenemos el anterior si existe.
  let refreshTokenEnc: string | null = null;
  if (tokens.refresh_token) {
    refreshTokenEnc = encrypt(tokens.refresh_token);
  } else {
    const { data: existing } = await supabase
      .from("google_oauth_tokens")
      .select("refresh_token_enc")
      .eq("user_id", userId)
      .maybeSingle();
    refreshTokenEnc = existing?.refresh_token_enc ?? null;
  }
  if (!refreshTokenEnc) {
    throw new Error(
      "Google no envió refresh_token y no había uno previo. Revoca el acceso desde tu cuenta Google y vuelve a conectar.",
    );
  }

  const accessTokenEnc = encrypt(tokens.access_token);

  const { error } = await supabase.from("google_oauth_tokens").upsert(
    {
      user_id: userId,
      email,
      access_token_enc: accessTokenEnc,
      refresh_token_enc: refreshTokenEnc,
      expires_at: expiresAt,
      scope: tokens.scope,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`No se pudo guardar el token: ${error.message}`);
}

/**
 * Devuelve un access_token válido para llamar la Calendar API.
 * Si está cerca de expirar, lo refresca y persiste el nuevo.
 * Devuelve null si el usuario no ha conectado aún.
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("google_oauth_tokens")
    .select("access_token_enc, refresh_token_enc, expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;

  const expiresAt = new Date(data.expires_at).getTime();
  const now = Date.now();
  const REFRESH_MARGIN_MS = 60 * 1000; // refresca si quedan <60s

  if (expiresAt - now > REFRESH_MARGIN_MS) {
    return decrypt(data.access_token_enc);
  }

  // Refrescar
  const refreshToken = decrypt(data.refresh_token_enc);
  try {
    const fresh = await refreshAccessToken(refreshToken);
    const newExpiresAt = new Date(now + fresh.expires_in * 1000).toISOString();
    const newEnc = encrypt(fresh.access_token);
    await supabase
      .from("google_oauth_tokens")
      .update({ access_token_enc: newEnc, expires_at: newExpiresAt })
      .eq("user_id", userId);
    return fresh.access_token;
  } catch (err) {
    console.error("[getValidAccessToken] refresh failed:", err);
    return null;
  }
}

export interface ConnectionStatus {
  connected: boolean;
  email: string | null;
  scope: string | null;
}

export async function getConnectionStatus(userId: string): Promise<ConnectionStatus> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("google_oauth_tokens")
    .select("email, scope")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { connected: false, email: null, scope: null };
  return { connected: true, email: data.email, scope: data.scope };
}

export async function deleteTokens(userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("google_oauth_tokens").delete().eq("user_id", userId);
}
