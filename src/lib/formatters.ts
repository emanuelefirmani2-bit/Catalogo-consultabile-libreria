/**
 * Helper di visualizzazione per i campi del catalogo.
 * Tutti i campi (tranne id e ingresso) possono essere NULL: rendiamo l'assenza
 * in modo elegante con "—" o "non disponibile" a seconda del contesto.
 */

/** Per uso compatto in tabella: "—" se vuoto. */
export function comeTesto(v: string | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  return s === "" ? "—" : s;
}

/** Per scheda dettaglio: "non disponibile" in italico se vuoto. */
export function comeCampoDettaglio(v: string | null | undefined): {
  testo: string;
  vuoto: boolean;
} {
  if (v === null || v === undefined || String(v).trim() === "") {
    return { testo: "non disponibile", vuoto: true };
  }
  return { testo: String(v).trim(), vuoto: false };
}

/** Tronca un testo lungo al numero di caratteri indicato, con ellipsis. */
export function tronca(s: string | null | undefined, max = 80): string {
  if (!s) return "—";
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}
