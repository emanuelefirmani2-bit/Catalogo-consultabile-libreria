/**
 * Lista a barre orizzontali della % di completezza per ogni campo.
 */
const ETICHETTE: Record<string, string> = {
  ingresso: "Ingresso",
  autore: "Autore",
  titolo: "Titolo",
  specifica: "Strumento / organico",
  partitura_parti_formato: "Partitura / Parti / Formato",
  antica_collocazione: "Antica collocazione",
  casa_editrice: "Casa editrice",
  anno: "Anno",
  pagine: "Pagine",
  data_ingresso: "Data ingresso (futuro)",
  revisore: "Revisore (futuro)",
  provenienza: "Provenienza (futuro)",
  posizione_led: "Posizione LED (ESP32)",
};

export function BarreCompletezza({
  completezza,
  totale,
}: {
  completezza: Record<string, number>;
  totale: number;
}) {
  const ordine = Object.entries(completezza).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="font-display text-xl mb-3">Completezza per campo</h3>
      <p className="text-xs text-[var(--color-muted)] mb-4">
        Percentuale di record con valore inserito.
      </p>
      <ul className="space-y-2.5">
        {ordine.map(([campo, n]) => {
          const pct = totale > 0 ? (n / totale) * 100 : 0;
          return (
            <li key={campo}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-[var(--color-foreground)]">
                  {ETICHETTE[campo] ?? campo}
                </span>
                <span className="font-mono text-xs text-[var(--color-muted)]">
                  {n.toLocaleString("it-IT")} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-[#e5dfd3] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor:
                      pct >= 90
                        ? "#5a7a35"
                        : pct >= 50
                          ? "#b45309"
                          : "#a44545",
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
