import { leggiStatistiche } from "@/lib/statistiche-query";
import { Card } from "@/components/dashboard/Card";
import { BarreCompletezza } from "@/components/dashboard/BarreCompletezza";
import { IstogrammaDecenni } from "@/components/dashboard/IstogrammaDecenni";
import { ListaTop } from "@/components/dashboard/ListaTop";

// Cache 5 minuti: i dati cambiano poco e la dashboard non richiede freschezza assoluta.
export const revalidate = 300;

export const metadata = { title: "Statistiche" };

export default async function StatistichePage() {
  const s = await leggiStatistiche();

  const perSecoloOrdinato = Object.entries(s.per_secolo).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl">Statistiche del catalogo</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Quadro quantitativo del catalogo: composizione, qualità del dato,
          distribuzione cronologica.
        </p>
      </header>

      {/* Numeri principali */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          titolo="Totale volumi"
          valore={s.totale.toLocaleString("it-IT")}
          sottotitolo="record nel catalogo"
        />
        <Card
          titolo="Da verificare"
          valore={s.da_verificare.toLocaleString("it-IT")}
          tono="warn"
          sottotitolo="marcati per controllo cartaceo"
        />
        <Card
          titolo="Con note"
          valore={s.con_note.toLocaleString("it-IT")}
          tono="accent"
          sottotitolo="annotazioni bibliotecario"
        />
        <Card
          titolo="Senza anno"
          valore={(s.per_secolo["Assente"] ?? 0).toLocaleString("it-IT")}
          sottotitolo="anno di stampa non rilevato"
        />
      </section>

      {/* Distribuzione per secolo + istogramma decenni */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="font-display text-xl mb-2">Distribuzione per secolo</h3>
          <p className="text-xs text-[var(--color-muted)] mb-4">
            Estrazione automatica dell&apos;anno (primo gruppo di 4 cifre).
          </p>
          <dl className="space-y-2">
            {perSecoloOrdinato.map(([secolo, n]) => {
              const pct = s.totale > 0 ? (n / s.totale) * 100 : 0;
              return (
                <div key={secolo} className="flex items-center justify-between text-sm">
                  <dt className="text-[var(--color-foreground)]">{secolo}</dt>
                  <dd className="font-mono text-xs text-[var(--color-muted)]">
                    {n.toLocaleString("it-IT")} · {pct.toFixed(1)}%
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
        <div className="lg:col-span-2">
          <IstogrammaDecenni dati={s.per_decennio} />
        </div>
      </section>

      {/* Top case editrici + top strumenti */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListaTop
          titolo="Top 15 case editrici"
          sottotitolo="aggregato case-insensitive (Ricordi/RICORDI → unico)"
          voci={s.case_editrici_top}
          totaleRiferimento={s.totale}
        />
        <ListaTop
          titolo="Top 15 strumenti / organico"
          sottotitolo="campo Specifica, aggregato case-insensitive"
          voci={s.strumenti_top}
          totaleRiferimento={s.totale}
        />
      </section>

      {/* Completezza per campo */}
      <section>
        <BarreCompletezza completezza={s.completezza} totale={s.totale} />
      </section>

      <footer className="text-xs text-[var(--color-muted)]">
        Dati calcolati lato server via funzione SQL{" "}
        <code>statistiche_catalogo()</code>, cache 5 minuti. Aggiornano
        automaticamente al re-import del catalogo o alla modifica di un
        singolo record.
      </footer>
    </div>
  );
}
