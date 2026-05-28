import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { Volume, ColonnaOrdinabile, DirezioneOrdine } from "@/types/catalogo";
import { comeTesto, tronca } from "@/lib/formatters";
import { IntestazioneOrdinamento } from "./IntestazioneOrdinamento";

export function Tabella({
  volumi,
  ordina,
  direzione,
  searchParams,
}: {
  volumi: Volume[];
  ordina?: ColonnaOrdinabile;
  direzione?: DirezioneOrdine;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (volumi.length === 0) {
    return (
      <div className="hidden sm:block rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
        Nessun volume corrisponde ai filtri impostati.
      </div>
    );
  }

  const intestColonna = (
    etichetta: string,
    colonna: ColonnaOrdinabile,
    extra?: string,
  ) => (
    <IntestazioneOrdinamento
      etichetta={etichetta}
      colonna={colonna}
      ordinaAttuale={ordina}
      direzioneAttuale={direzione}
      searchParams={searchParams}
      className={`px-3 py-3 ${extra ?? ""}`}
    />
  );

  return (
    <div className="hidden sm:block overflow-x-auto rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="min-w-full divide-y divide-[var(--color-border)]">
        <thead className="bg-[#f3eee2]">
          <tr>
            {intestColonna("Ingresso", "ingresso_num", "w-24")}
            {intestColonna("Autore", "autore", "w-56")}
            {intestColonna("Titolo", "titolo")}
            {intestColonna("Casa editrice", "casa_editrice", "w-40")}
            {intestColonna("Anno", "anno_num", "w-20")}
            {intestColonna("Collocazione", "antica_collocazione", "w-28")}
            <th scope="col" className="px-3 py-3 w-8" aria-label="Stato" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {volumi.map((v) => (
            <tr
              key={v.id}
              className="hover:bg-[#fbf8f0] transition-colors"
            >
              <td className="px-3 py-2.5 text-sm font-mono text-[var(--color-foreground)] whitespace-nowrap">
                <Link
                  href={`/volume/${v.id}`}
                  className="link no-underline hover:underline"
                  title={`Numero d'ingresso ${v.ingresso}`}
                >
                  {v.ingresso}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-sm">
                <Link href={`/volume/${v.id}`} className="hover:text-[var(--color-accent)]">
                  {comeTesto(v.autore)}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-sm">
                <Link href={`/volume/${v.id}`} className="hover:text-[var(--color-accent)]">
                  <span title={v.titolo ?? undefined}>{tronca(v.titolo, 90)}</span>
                </Link>
                {v.specifica ? (
                  <div className="text-xs text-[var(--color-muted)] italic">
                    {tronca(v.specifica, 70)}
                  </div>
                ) : null}
              </td>
              <td className="px-3 py-2.5 text-sm text-[var(--color-muted)] whitespace-nowrap">
                {comeTesto(v.casa_editrice)}
              </td>
              <td className="px-3 py-2.5 text-sm text-[var(--color-muted)] whitespace-nowrap">
                {comeTesto(v.anno)}
              </td>
              <td className="px-3 py-2.5 text-sm font-mono text-[var(--color-muted)] whitespace-nowrap">
                {comeTesto(v.antica_collocazione)}
              </td>
              <td className="px-3 py-2.5 text-center">
                {v.da_verificare ? (
                  <span title="Record marcato per verifica" aria-label="da verificare">
                    <AlertCircle
                      aria-hidden
                      className="size-4 text-[var(--color-warn)] inline"
                    />
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
