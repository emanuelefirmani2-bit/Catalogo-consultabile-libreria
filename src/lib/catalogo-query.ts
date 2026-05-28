import "server-only";
import { creaClientPubblico } from "@/lib/supabase/server";
import type {
  Volume,
  ColonnaOrdinabile,
  DirezioneOrdine,
} from "@/types/catalogo";

/** Parametri di ricerca/filtro applicati alla lista catalogo. */
export interface ParametriRicerca {
  q?: string; // ricerca libera su autore/titolo/casa_editrice/collocazione
  annoMin?: number;
  annoMax?: number;
  casaEditrice?: string; // esatto (case-insensitive)
  specifica?: string; // strumento/organico, match parziale
  collocazione?: string; // prefisso (es. "A I")
  ordina?: ColonnaOrdinabile;
  direzione?: DirezioneOrdine;
  pagina?: number; // 1-based
  perPagina?: number;
}

export const PER_PAGINA_DEFAULT = 25;
export const PER_PAGINA_MAX = 100;

/**
 * Sanitizza una stringa per uso in pattern PostgREST `ilike`.
 * - Rimuove virgole e parentesi (caratteri speciali del DSL .or()).
 * - Rimuove % e _ (wildcard SQL: li gestiamo noi).
 * - Limita lunghezza a 80.
 */
function pulisciPerPattern(s: string): string {
  return s
    .replace(/[,()%_*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Esegue la query del catalogo. Ritorna i volumi della pagina + conteggio totale.
 */
export async function cercaCatalogo(p: ParametriRicerca): Promise<{
  volumi: Volume[];
  totale: number;
  pagina: number;
  perPagina: number;
  totalePagine: number;
}> {
  const supa = creaClientPubblico();

  const perPagina = Math.min(
    Math.max(1, p.perPagina ?? PER_PAGINA_DEFAULT),
    PER_PAGINA_MAX,
  );
  const pagina = Math.max(1, p.pagina ?? 1);
  const from = (pagina - 1) * perPagina;
  const to = from + perPagina - 1;

  let query = supa
    .from("catalogo")
    .select("*", { count: "exact" });

  // Ricerca libera (fuzzy via ILIKE su 5 colonne in OR)
  // Include `ingresso`: indice GIN trigram lo rende veloce anche su pattern parziale.
  // Per numeri d'ingresso interamente numerici cerchiamo prefix-match (più mirato),
  // per testo usiamo contains-match.
  if (p.q && p.q.trim()) {
    const term = pulisciPerPattern(p.q);
    if (term.length > 0) {
      const pat = `*${term}*`;
      const eNumerico = /^[0-9]+(\.[0-9]+)?$/.test(term);
      const patIngresso = eNumerico ? `${term}*` : pat;
      query = query.or(
        [
          `ingresso.ilike.${patIngresso}`,
          `autore.ilike.${pat}`,
          `titolo.ilike.${pat}`,
          `casa_editrice.ilike.${pat}`,
          `antica_collocazione.ilike.${pat}`,
        ].join(","),
      );
    }
  }

  // Filtro anno range
  if (typeof p.annoMin === "number") query = query.gte("anno_num", p.annoMin);
  if (typeof p.annoMax === "number") query = query.lte("anno_num", p.annoMax);

  // Filtro casa editrice (case-insensitive esatto)
  if (p.casaEditrice && p.casaEditrice.trim()) {
    query = query.ilike("casa_editrice", p.casaEditrice.trim());
  }

  // Filtro specifica (strumento/organico) — match parziale
  if (p.specifica && p.specifica.trim()) {
    const term = pulisciPerPattern(p.specifica);
    if (term.length > 0) query = query.ilike("specifica", `%${term}%`);
  }

  // Filtro collocazione — prefisso (es. "A I")
  if (p.collocazione && p.collocazione.trim()) {
    const term = pulisciPerPattern(p.collocazione);
    if (term.length > 0) query = query.ilike("antica_collocazione", `${term}%`);
  }

  // Ordinamento
  const colonnaOrdine = p.ordina ?? "ingresso_num";
  const ascendente = (p.direzione ?? "asc") === "asc";
  // NULLS LAST è il default di Supabase per ordine ascendente solo se nullsFirst:false
  query = query.order(colonnaOrdine, {
    ascending: ascendente,
    nullsFirst: false,
  });
  // Tie-break sempre su ingresso_num per stabilità
  if (colonnaOrdine !== "ingresso_num") {
    query = query.order("ingresso_num", { ascending: true, nullsFirst: false });
  }

  // Paginazione
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) {
    throw new Error(`Errore query catalogo: ${error.message}`);
  }

  const totale = count ?? 0;
  return {
    volumi: (data ?? []) as Volume[],
    totale,
    pagina,
    perPagina,
    totalePagine: Math.max(1, Math.ceil(totale / perPagina)),
  };
}

/** Recupera il volume per id (chiave primaria). */
export async function trovaVolumePerId(id: number): Promise<Volume | null> {
  const supa = creaClientPubblico();
  const { data, error } = await supa
    .from("catalogo")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Errore lettura volume ${id}: ${error.message}`);
  return (data as Volume | null) ?? null;
}

/**
 * Restituisce la top N delle case editrici per popolare il dropdown filtro.
 * Aggrega case-insensitive via lower() lato app (le aggregazioni cross-case
 * pure verranno fatte nella futura dashboard via funzione SQL dedicata).
 */
export async function caseEditriciTop(n = 30): Promise<
  Array<{ valore: string; conteggio: number }>
> {
  const supa = creaClientPubblico();
  // PostgREST non supporta GROUP BY: prendiamo le prime ~5000 case editrici
  // dal DB e aggreghiamo lato app. Il dataset è piccolo, è accettabile.
  const { data, error } = await supa
    .from("catalogo")
    .select("casa_editrice")
    .not("casa_editrice", "is", null)
    .limit(6000);
  if (error) throw new Error(`Errore case editrici: ${error.message}`);

  const conteggi = new Map<string, { label: string; n: number }>();
  for (const r of data ?? []) {
    const raw = (r as { casa_editrice: string | null }).casa_editrice;
    if (!raw) continue;
    const key = raw.trim().toLowerCase();
    const existing = conteggi.get(key);
    if (existing) existing.n++;
    else conteggi.set(key, { label: capitalizza(raw.trim()), n: 1 });
  }
  return [...conteggi.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, n)
    .map((x) => ({ valore: x.label, conteggio: x.n }));
}

function capitalizza(s: string): string {
  // Restituisce la stringa con prima lettera maiuscola per ogni parola,
  // ma preserva acronimi tutti maiuscoli (es. "N. N.") e rimuove varianti
  // sole upper-case (es. "ZANIBON" → "Zanibon").
  if (s.length <= 2) return s;
  return s
    .split(/(\s+)/)
    .map((tok) => {
      if (/^\s+$/.test(tok)) return tok;
      if (tok.length <= 2) return tok.toUpperCase();
      return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
    })
    .join("");
}
