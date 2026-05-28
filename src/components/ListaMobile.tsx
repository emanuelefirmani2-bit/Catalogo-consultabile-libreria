import Link from "next/link";
import { AlertCircle, MapPin } from "lucide-react";
import type { Volume } from "@/types/catalogo";
import { comeTesto } from "@/lib/formatters";

/**
 * Vista lista bibliografica densa per mobile (< sm).
 * Validata dai pattern UX 2026: "clarity is more" — densita + gerarchia
 * tipografica > card spaziose. Ogni voce e' tutta tap-target verso il
 * dettaglio.
 */
export function ListaMobile({ volumi }: { volumi: Volume[] }) {
  if (volumi.length === 0) {
    return (
      <div className="sm:hidden rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted)]">
        Nessun volume corrisponde ai filtri impostati.
      </div>
    );
  }
  return (
    <ol className="sm:hidden rounded border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
      {volumi.map((v) => (
        <li key={v.id} className="relative">
          <Link
            href={`/volume/${v.id}`}
            className="block px-4 py-3 active:bg-[#fbf8f0]"
          >
            {/* Riga 1: ingresso + strumento + flag verifica */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[var(--color-muted)]">
                <span className="font-mono">#{v.ingresso}</span>
                {v.specifica ? (
                  <>
                    {" · "}
                    <span className="italic">{v.specifica}</span>
                  </>
                ) : null}
              </p>
              {v.da_verificare ? (
                <AlertCircle
                  aria-label="da verificare"
                  className="size-4 text-[var(--color-warn)] shrink-0"
                />
              ) : null}
            </div>

            {/* Riga 2: titolo prominente */}
            <p className="mt-1 font-display text-lg leading-tight text-[var(--color-foreground)]">
              {v.titolo ?? "(senza titolo)"}
            </p>

            {/* Riga 3: autore */}
            <p className="mt-0.5 text-sm text-[var(--color-foreground)]">
              {comeTesto(v.autore)}
            </p>

            {/* Riga 4: casa editrice · anno */}
            <p className="mt-0.5 text-sm text-[var(--color-muted)]">
              {v.casa_editrice ?? "—"}
              {v.anno ? ` · ${v.anno}` : ""}
            </p>

            {/* Riga 5: collocazione (mono, con simbolo) */}
            {v.antica_collocazione ? (
              <p className="mt-1.5 text-xs text-[var(--color-muted)] inline-flex items-center gap-1">
                <MapPin aria-hidden className="size-3" />
                <span className="font-mono">{v.antica_collocazione}</span>
              </p>
            ) : null}
          </Link>
        </li>
      ))}
    </ol>
  );
}
