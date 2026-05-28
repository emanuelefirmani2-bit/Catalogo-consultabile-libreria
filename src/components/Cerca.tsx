import { Search } from "lucide-react";

/**
 * Form di ricerca + filtri. Server Component: usa un form HTML standard
 * con `method="GET"` e `action="/"`, così il submit ricarica la pagina
 * con i nuovi searchParams (e re-fetch lato server).
 *
 * Tutti i campi precompilati riflettono i parametri correnti.
 */
export function Cerca({
  q,
  annoMin,
  annoMax,
  casaEditrice,
  specifica,
  collocazione,
  caseEditrici,
}: {
  q?: string;
  annoMin?: number;
  annoMax?: number;
  casaEditrice?: string;
  specifica?: string;
  collocazione?: string;
  caseEditrici: Array<{ valore: string; conteggio: number }>;
}) {
  return (
    <form
      action="/"
      method="GET"
      className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
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
          className="w-full rounded border border-[var(--color-border-hard)] bg-white py-2 pl-9 pr-3 text-sm placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        />
      </div>

      {/* Filtri */}
      <fieldset className="mt-5">
        <legend className="text-sm font-medium mb-2">Filtri</legend>
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
              defaultValue={annoMin ?? ""}
              min={1500}
              max={2100}
              placeholder="1850"
              className="w-full rounded border border-[var(--color-border-hard)] bg-white px-2 py-1.5 text-sm focus:border-[var(--color-accent)] focus:outline-none"
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
              defaultValue={annoMax ?? ""}
              min={1500}
              max={2100}
              placeholder="1950"
              className="w-full rounded border border-[var(--color-border-hard)] bg-white px-2 py-1.5 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          {/* Casa editrice (dropdown top + free) */}
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
              className="w-full rounded border border-[var(--color-border-hard)] bg-white px-2 py-1.5 text-sm focus:border-[var(--color-accent)] focus:outline-none"
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
              className="w-full rounded border border-[var(--color-border-hard)] bg-white px-2 py-1.5 text-sm focus:border-[var(--color-accent)] focus:outline-none"
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
              className="w-full rounded border border-[var(--color-border-hard)] bg-white px-2 py-1.5 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
        </div>
      </fieldset>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-soft)]"
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
