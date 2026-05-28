/**
 * Tipo TypeScript del record `public.catalogo`.
 * Riflette lo schema Postgres creato via migration MCP.
 */
export interface Volume {
  id: number;

  // Dal registro originale
  ingresso: string;
  ingresso_num: string | number | null; // numeric → string da PostgREST
  autore: string | null;
  titolo: string | null;
  specifica: string | null;
  partitura_parti_formato: string | null;
  antica_collocazione: string | null;
  casa_editrice: string | null;
  anno: string | null;
  anno_num: number | null;
  pagine: string | null;

  // Campi futuri
  data_ingresso: string | null;
  revisore: string | null;
  provenienza: string | null;

  // Tecnico — TODO ESP32 pick-to-light
  posizione_led: string | null;

  // Qualità dati
  note: string | null;
  da_verificare: boolean;

  created_at: string;
  updated_at: string;
}

/** Colonne ordinabili dalla UI tabella */
export type ColonnaOrdinabile =
  | "ingresso_num"
  | "autore"
  | "titolo"
  | "casa_editrice"
  | "anno_num"
  | "antica_collocazione";

export type DirezioneOrdine = "asc" | "desc";
