import { Search, SlidersHorizontal } from "lucide-react";
import type { ColonnaOrdinabile, DirezioneOrdine } from "@/types/catalogo";

/**
 * Form di ricerca + filtri. Server Component: form HTML standard con
 * method="GET" e action="/", il submit ricarica la pagina con nuovi
 * searchParams.
 *
 * Mobile-first (pattern UX 2026 - "clarity is more"):
 *   - ricerca SEMPRE visibile (sticky-friendly)
 *   - filtri collassabili via checkbox-hack pure CSS (zero JS):
 *     - su mobile chiusi di default, badge col conteggio attivi
 *     - su sm+ forzati aperti (ignora lo stato del checkbox)
 *   - ordinamento integrato come select (su mobile non c'e' la
 *     intestazione tabella cliccabile)
 */

const OPZIONI_ORDINE: Array<{ valore: string; etichetta: string }> = [
  { valore: "ingresso_num:asc", etichetta: "Numero d'ingresso (crescente)" },
  { valore: "ingresso_num:desc", etichetta: "Numero d'ingresso (decrescente)" },
  { valore: "autore:asc", etichetta: "Autore (A→Z)" },
  { valore: "autore:desc", etichetta: "Autore (Z→A)" },
  { valore: "titolo:asc", etichetta: "Titolo (A→Z)" },
  { valore: "anno_num:asc", etichetta: "Anno (più antichi)" },
  { valore: "anno_num:desc", etichetta: "Anno (più recenti)" },
  { valore: "casa_editrice:asc", etichetta: "Casa editrice (A→Z)" },
  { valore: "antica_collocazione:asc", etichetta: "Collocazione (A→Z)" },
];

export function Cerca({
  q,
  annoMin,
  annoMax,
  casaEditrice,
  specifica,
  collocazione,
  ordina,
  direzione,
  caseEditrici,
}: {
  q?: string;
  annoMin?: number;
  annoMax?: number;
  casaEditrice?: string;
  specifica?: string;
  collocazione?: string;
  ordina?: ColonnaOrdinabile;
  direzione?: DirezioneOrdine;
  caseEditrici: Array<{ valore: string; conteggio: number }>;
}) {
  // Conta filtri attivi per il badge mobile
  const filtriAttivi = [annoMin, annoMax, casaEditrice, specifica, collocazione]
    .filter((x) => x !== undefined && x !== "" && x !== null).length;

  const ordineCorrente =
    ordina && direzione ? `${ordina}:${direzione}` : "ingresso_num:asc";

  return (
    <form
      action="/"
      method="GET"
      className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 shadow-sm"
    >
      {/* Ricerca principale */}
      <label htmlFor="q" className="block text-sm font-medium mb-1.5">
        Ricerca per ingresso, autore, titolo, casa editrice o collocazione
      </label>
      <div className="relative">
        <Search
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-muted)]"
        />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="es. 4763, Verdi, Boito, Ricordi, A VI…"
          className="w-full rounded border border-[var(--color-border-hard)] bg-white py-2.5 pl-9 pr-3 text-base sm:text-sm placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        />
      </div>

      {/* Checkbox-hack per filtri collassabili su mobile */}
      <input
        id="apri-filtri"
        type="checkbox"
        className="peer/filtri sr-only"
      />

      {/* Label toggle: visibile solo su mobile */}
      <label
        htmlFor="apri-filtri"
        className="mt-3 sm:hidden flex items-center justify-between cursor-pointer rounded border border-[var(--color-border-hard)] bg-white px-3 py-2 text-sm select-none"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal aria-hidden className="size-4" />
          Filtri & ordinamento
          {filtriAttivi > 0 ? (
            <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-medium text-white">
              {filtriAttivi}
            </span>
          ) : null}
        </span>
        <span className="text-xs text-[var(--color-muted)] peer-checked/filtri:hidden">
          Apri ▾
        </span>
      </label>

      {/*
        Contenitore filtri:
        - mobile: hidden di default, mostrato quando checkbox checked
        - sm+: SEMPRE visibile (override)
      */}
      <div className="hidden peer-checked/filtri:block sm:!block mt-4 sm:mt-5 space-y-4 sm:space-y-0">
        <fieldset>
          <legend className="hidden sm:block text-sm font-medium mb-2">
            Filtri
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Anno range */}
            <div className="flex items-center gap-2">
              <label htmlFor="annoMin" className="text-xs text-[var(--color-muted)] shrink-0">
                Anno dal
              </label>
              <input
                id="annoMin"
                name="annoMin"
                type="number"
                inputMode="numeric"
                defaultValue={annoMin ?? ""}
                min={1500}
                max={2100}
                placeholder="1850"
                className="w-full rounded border border-[var(--color-border-hard)] bg-white px-2 py-2 sm:py-1.5 text-base sm:text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="annoMax" className="text-xs text-[var(--color-muted)] shrink-0">
                al
              </label>
              <input
                id="annoMax"
                name="annoMax"
                type="number"
                inputMode="numeric"
                defaultValue={annoMax ?? ""}
                min={1500}
                max={2100}
                placeholder="1950"
                className="w-full rounded border border-[var(--color-border-hard)] bg-white px-2 py-2 sm:py-1.5 text-base sm:text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            {/* Casa editrice */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label htmlFor="casaEditrice" className="block text-xs text-[var(--color-muted)] mb-1">
                Casa editrice
              </label>
              <input
                id="casaEditrice"
                name="casaEditrice"
                list="ce-list"
                defaultValue={casaEditrice ?? ""}
                placeholder="Ricordi, Zanibon…"
                className="w-full rounded border border-[var(--color-border-hard)] bg-white px-2 py-2 sm:py-1.5 text-base sm:text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
              <datalist id="ce-list">
                {caseEditrici.map((c) => (
                  <option key={c.valore} value={c.valore}>{`${c.conteggio}`}</option>
                ))}
              </datalist>
            </div>

            {/* Strumento / organico */}
            <div className="sm:col-span-2">
              <label htmlFor="specifica" className="block text-xs text-[var(--color-muted)] mb-1">
                Strumento / organico
              </label>
              <input
                id="specifica"
                name="specifica"
                type="text"
                defaultValue={specifica ?? ""}
                placeholder="pianoforte, violino, canto…"
                className="w-full rounded border border-[var(--color-border-hard)] bg-white px-2 py-2 sm:py-1.5 text-base sm:text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            {/* Collocazione (prefisso) */}
            <div className="sm:col-span-2">
              <label htmlFor="collocazione" className="block text-xs text-[var(--color-muted)] mb-1">
                Antica collocazione (prefisso)
              </label>
              <input
                id="collocazione"
                name="collocazione"
                type="text"
                defaultValue={collocazione ?? ""}
                placeholder="A VI, B III, C II…"
                className="w-full rounded border border-[var(--color-border-hard)] bg-white px-2 py-2 sm:py-1.5 text-base sm:text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
          </div>
        </fieldset>

        {/* Ordinamento: usato anche per cambiare ordine via select su mobile;
            su desktop e' un overlay ma utile per device misti. */}
        <div className="mt-4 sm:mt-3">
          <label htmlFor="ordineMobile" className="block text-xs text-[var(--color-muted)] mb-1">
            Ordinamento
          </label>
          <select
            id="ordineMobile"
            name="ordineMobile"
            defaultValue={ordineCorrente}
            className="w-full sm:w-72 rounded border border-[var(--color-border-hard)] bg-white px-2 py-2 sm:py-1.5 text-base sm:text-sm focus:border-[var(--color-accent)] focus:outline-none"
          >
            {OPZIONI_ORDINE.map((o) => (
              <option key={o.valore} value={o.valore}>
                {o.etichetta}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 sm:mt-5 flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          className="rounded bg-[var(--color-accent)] px-5 py-2.5 sm:px-4 sm:py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-soft)]"
        >
          Cerca
        </button>
        <a href="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]">
          Azzera filtri
        </a>
      </div>
    </form>
  );
}
