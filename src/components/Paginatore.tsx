import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { costruisciHref } from "@/lib/url";

/**
 * Controlli di paginazione: << prev — pagine numeriche — next >>.
 * Mostra finestra di 5 pagine attorno alla corrente.
 */
export function Paginatore({
  pagina,
  totalePagine,
  totale,
  perPagina,
  searchParams,
}: {
  pagina: number;
  totalePagine: number;
  totale: number;
  perPagina: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (totalePagine <= 1) {
    return (
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        {totale} {totale === 1 ? "volume trovato" : "volumi trovati"}.
      </p>
    );
  }

  const finestra = generaFinestra(pagina, totalePagine);
  const inizio = (pagina - 1) * perPagina + 1;
  const fine = Math.min(pagina * perPagina, totale);

  const link = (
    p: number,
    etichetta: React.ReactNode,
    disattivato = false,
    chiave?: string,
  ) => {
    if (disattivato) {
      return (
        <span
          key={chiave ?? `disabled-${p}`}
          className="px-3 py-1.5 text-sm text-[var(--color-muted)] opacity-40"
        >
          {etichetta}
        </span>
      );
    }
    const href = costruisciHref("/", searchParams, { pagina: p });
    const attivo = p === pagina;
    return (
      <Link
        key={chiave ?? `p-${p}`}
        href={href}
        aria-current={attivo ? "page" : undefined}
        className={
          attivo
            ? "px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-accent)] rounded"
            : "px-3 py-1.5 text-sm text-[var(--color-foreground)] hover:text-[var(--color-accent)] hover:underline rounded"
        }
      >
        {etichetta}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Paginazione catalogo"
      className="mt-5 flex items-center justify-between flex-wrap gap-3"
    >
      <p className="text-sm text-[var(--color-muted)]">
        {inizio.toLocaleString("it-IT")}–{fine.toLocaleString("it-IT")} di{" "}
        <strong className="text-[var(--color-foreground)]">
          {totale.toLocaleString("it-IT")}
        </strong>{" "}
        volumi
      </p>

      <div className="flex items-center gap-1">
        {link(
          pagina - 1,
          <span className="inline-flex items-center gap-1">
            <ChevronLeft aria-hidden className="size-4" />
            Prec.
          </span>,
          pagina <= 1,
          "prev",
        )}
        {finestra[0] > 1 ? (
          <>
            {link(1, "1", false, "first")}
            {finestra[0] > 2 ? (
              <span key="dots-left" className="px-2 text-[var(--color-muted)]">…</span>
            ) : null}
          </>
        ) : null}
        {finestra.map((p) => link(p, String(p), false, `win-${p}`))}
        {finestra[finestra.length - 1] < totalePagine ? (
          <>
            {finestra[finestra.length - 1] < totalePagine - 1 ? (
              <span key="dots-right" className="px-2 text-[var(--color-muted)]">…</span>
            ) : null}
            {link(totalePagine, String(totalePagine), false, "last")}
          </>
        ) : null}
        {link(
          pagina + 1,
          <span className="inline-flex items-center gap-1">
            Succ.
            <ChevronRight aria-hidden className="size-4" />
          </span>,
          pagina >= totalePagine,
          "next",
        )}
      </div>
    </nav>
  );
}

function generaFinestra(pagina: number, totale: number): number[] {
  const span = 2; // 2 prima, 2 dopo
  const min = Math.max(1, pagina - span);
  const max = Math.min(totale, pagina + span);
  const out: number[] = [];
  for (let i = min; i <= max; i++) out.push(i);
  return out;
}
