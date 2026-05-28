/**
 * Lista classifica top-N (case editrici, strumenti) con barre proporzionali.
 */
export function ListaTop({
  titolo,
  sottotitolo,
  voci,
  totaleRiferimento,
}: {
  titolo: string;
  sottotitolo?: string;
  voci: Array<{ valore: string; conteggio: number }>;
  totaleRiferimento?: number;
}) {
  const maxN = Math.max(...voci.map((v) => v.conteggio), 1);

  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="font-display text-xl mb-1">{titolo}</h3>
      {sottotitolo ? (
        <p className="text-xs text-[var(--color-muted)] mb-3">{sottotitolo}</p>
      ) : null}
      <ol className="space-y-2">
        {voci.map((v, i) => {
          const pct = (v.conteggio / maxN) * 100;
          const ptcTot = totaleRiferimento
            ? (v.conteggio / totaleRiferimento) * 100
            : null;
          return (
            <li key={`${v.valore}-${i}`}>
              <div className="flex items-baseline justify-between gap-2 text-sm mb-0.5">
                <span className="text-[var(--color-foreground)] truncate">
                  <span className="text-[var(--color-muted)] font-mono mr-1.5">
                    {i + 1}.
                  </span>
                  {v.valore}
                </span>
                <span className="font-mono text-xs text-[var(--color-muted)] shrink-0">
                  {v.conteggio.toLocaleString("it-IT")}
                  {ptcTot !== null ? ` · ${ptcTot.toFixed(1)}%` : ""}
                </span>
              </div>
              <div className="h-1.5 bg-[#f3eee2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent)]/70 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
