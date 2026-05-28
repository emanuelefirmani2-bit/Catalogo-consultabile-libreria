import "server-only";
import { creaClientPubblico } from "@/lib/supabase/server";

export interface StatisticheCatalogo {
  totale: number;
  da_verificare: number;
  con_note: number;
  completezza: Record<string, number>;
  per_secolo: Record<string, number>;
  per_decennio: Array<{ decennio: number; n: number }>;
  case_editrici_top: Array<{ valore: string; conteggio: number }>;
  strumenti_top: Array<{ valore: string; conteggio: number }>;
}

/** Chiama la funzione SQL `statistiche_catalogo()` via RPC. */
export async function leggiStatistiche(): Promise<StatisticheCatalogo> {
  const supa = creaClientPubblico();
  const { data, error } = await supa.rpc("statistiche_catalogo");
  if (error) {
    throw new Error(`Errore lettura statistiche: ${error.message}`);
  }
  return data as StatisticheCatalogo;
}
