/**
 * Helper per costruire URL preservando i searchParams correnti.
 * Utile per i link di ordinamento e paginazione: cambia solo i parametri
 * indicati in `override`, mantiene gli altri.
 */
export function costruisciHref(
  base: string,
  attuali: Record<string, string | string[] | undefined>,
  override: Record<string, string | number | null | undefined>,
): string {
  const sp = new URLSearchParams();
  // Prima copia gli attuali (valori stringa, escludi gli array)
  for (const [k, v] of Object.entries(attuali)) {
    if (typeof v === "string" && v !== "") sp.set(k, v);
  }
  // Poi applica gli override (null/undefined → rimuovi)
  for (const [k, v] of Object.entries(override)) {
    if (v === null || v === undefined || v === "") sp.delete(k);
    else sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Estrae un valore stringa singolo da searchParams. */
export function primaStringa(
  v: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

/** Estrae un intero positivo da searchParams (1-based pagina, range anno…). */
export function primoIntero(
  v: string | string[] | undefined,
): number | undefined {
  const s = primaStringa(v);
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
}
