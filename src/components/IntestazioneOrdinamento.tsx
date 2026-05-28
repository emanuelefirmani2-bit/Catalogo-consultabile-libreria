import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { costruisciHref } from "@/lib/url";
import type { ColonnaOrdinabile, DirezioneOrdine } from "@/types/catalogo";

/**
 * Cella <th> cliccabile per ordinare la tabella per quella colonna.
 * Toggle asc → desc → (default = ingresso_num asc).
 */
export function IntestazioneOrdinamento({
  etichetta,
  colonna,
  ordinaAttuale,
  direzioneAttuale,
  searchParams,
  className,
}: {
  etichetta: string;
  colonna: ColonnaOrdinabile;
  ordinaAttuale?: ColonnaOrdinabile;
  direzioneAttuale?: DirezioneOrdine;
  searchParams: Record<string, string | string[] | undefined>;
  className?: string;
}) {
  const attiva = ordinaAttuale === colonna;
  let prossimaDirezione: DirezioneOrdine | null = "asc";
  if (attiva) {
    prossimaDirezione = direzioneAttuale === "asc" ? "desc" : null;
  }

  const href = costruisciHref("/", searchParams, {
    ordina: prossimaDirezione === null ? null : colonna,
    direzione: prossimaDirezione,
    pagina: 1,
  });

  return (
    <th
      scope="col"
      className={`text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider ${className ?? ""}`}
    >
      <Link
        href={href}
        className="inline-flex items-center gap-1 hover:text-[var(--color-accent)]"
        aria-label={`Ordina per ${etichetta}`}
      >
        <span>{etichetta}</span>
        {attiva ? (
          direzioneAttuale === "asc" ? (
            <ArrowUp aria-hidden className="size-3" />
          ) : (
            <ArrowDown aria-hidden className="size-3" />
          )
        ) : (
          <ArrowUpDown aria-hidden className="size-3 opacity-40" />
        )}
      </Link>
    </th>
  );
}
