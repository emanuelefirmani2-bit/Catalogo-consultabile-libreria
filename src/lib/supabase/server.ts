import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase lato server per query pubbliche (SELECT).
 * Usa la chiave publishable (anon) e rispetta le RLS policy della tabella.
 */
export function creaClientPubblico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Variabili NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY mancanti in .env.local",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Client Supabase lato server con privilegi elevati (service_role).
 * Bypassa RLS. Usare SOLO in route handler protetti (admin re-import, edit record).
 * Non esporre MAI ai client.
 */
export function creaClientAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    throw new Error(
      "Variabili NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY mancanti in .env.local",
    );
  }
  return createClient(url, service, {
    auth: { persistSession: false },
  });
}
