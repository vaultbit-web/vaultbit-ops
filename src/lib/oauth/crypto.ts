import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

/**
 * Cifrado AES-256-GCM para tokens OAuth almacenados en BD.
 *
 * Formato del string almacenado: `iv.authTag.ciphertext` (todos en hex).
 * - iv: 12 bytes (96 bits) — recomendado para GCM.
 * - authTag: 16 bytes — verifica integridad y autenticidad.
 * - ciphertext: longitud variable.
 *
 * Clave: `OAUTH_ENCRYPTION_KEY` env var, hex de 64 chars (= 32 bytes / 256 bits).
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const hex = process.env.OAUTH_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "OAUTH_ENCRYPTION_KEY no configurada. Genera 32 bytes en hex y añádela a las env vars.",
    );
  }
  if (hex.length !== 64) {
    throw new Error(
      `OAUTH_ENCRYPTION_KEY debe tener 64 caracteres hex (32 bytes). Recibido: ${hex.length}.`,
    );
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${enc.toString("hex")}`;
}

export function decrypt(payload: string): string {
  const key = getKey();
  const parts = payload.split(".");
  if (parts.length !== 3) {
    throw new Error("Payload cifrado con formato inválido");
  }
  const [ivHex, tagHex, encHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}
