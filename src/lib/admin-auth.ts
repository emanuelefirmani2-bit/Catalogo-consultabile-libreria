import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-cookie";

const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 ore

/**
 * Auth admin semplice basata su password singola.
 * - L'unica "password" valida è in env `ADMIN_PASSWORD`.
 * - Al login generiamo un token = sha256(password + segreto interno).
 * - Il token va in un cookie httpOnly, sameSite=lax.
 * - Verifica con `timingSafeEqual` per evitare timing attack.
 *
 * NOTA: appropriato per un'app interna a un singolo bibliotecario.
 * Per multi-utente o ruoli, sostituire con Supabase Auth + RLS dedicate.
 */

function passwordAttesa(): string | null {
  return process.env.ADMIN_PASSWORD ?? null;
}

function tokenAtteso(): string | null {
  const pw = passwordAttesa();
  if (!pw) return null;
  // Hash della password con un sale fisso interno → token cookie
  return createHash("sha256").update(`braga:${pw}`).digest("hex");
}

/** Verifica se il cookie corrente contiene un token valido. */
export async function isAdminLoggato(): Promise<boolean> {
  const atteso = tokenAtteso();
  if (!atteso) return false;
  const store = await cookies();
  const c = store.get(ADMIN_COOKIE_NAME);
  if (!c) return false;
  try {
    const a = Buffer.from(c.value, "hex");
    const b = Buffer.from(atteso, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Tenta il login. Ritorna true se la password è corretta, e setta il cookie. */
export async function tentaLogin(passwordInserita: string): Promise<boolean> {
  const pw = passwordAttesa();
  if (!pw) return false;
  if (passwordInserita.length !== pw.length) {
    // Confronto timing-safe richiede stessa lunghezza
    return false;
  }
  const ok = timingSafeEqual(
    Buffer.from(passwordInserita, "utf8"),
    Buffer.from(pw, "utf8"),
  );
  if (!ok) return false;

  const token = tokenAtteso();
  if (!token) return false;
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return true;
}

/** Logout: elimina il cookie. */
export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}

