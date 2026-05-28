import { cercaCatalogo, caseEditriciTop } from "@/lib/catalogo-query";
import { primaStringa, primoIntero } from "@/lib/url";
import { Cerca } from "@/components/Cerca";
import { Tabella } from "@/components/Tabella";
import { Paginatore } from "@/components/Paginatore";
import type { ColonnaOrdinabile, DirezioneOrdine } from "@/types/catalogo";

const COLONNE_VALIDE: ColonnaOrdinabile[] = [
  "ingresso_num",
  "autore",
  "titolo",
  "casa_editrice",
  "anno_num",
  "antica_collocazione",
];

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  const q = primaStringa(sp.q);
  const annoMin = primoIntero(sp.annoMin);
  const annoMax = primoIntero(sp.annoMax);
  const casaEditrice = primaStringa(sp.casaEditrice);
  const specifica = primaStringa(sp.specifica);
  const collocazione = primaStringa(sp.collocazione);

  const ordinaRaw = primaStringa(sp.ordina) as ColonnaOrdinabile | undefined;
  const ordina =
    ordinaRaw && COLONNE_VALIDE.includes(ordinaRaw) ? ordinaRaw : undefined;
  const direzioneRaw = primaStringa(sp.direzione);
  const direzione: DirezioneOrdine | undefined =
    direzioneRaw === "asc" || direzioneRaw === "desc"
      ? direzioneRaw
      : undefined;

  const pagina = primoIntero(sp.pagina) ?? 1;

  const [risultato, caseEditrici] = await Promise.all([
    cercaCatalogo({
      q,
      annoMin,
      annoMax,
      casaEditrice,
      specifica,
      collocazione,
      ordina,
      direzione,
      pagina,
    }),
    caseEditriciTop(30),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-2xl text-[var(--color-foreground)]">
          Catalogo del fondo storico
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {risultato.totale.toLocaleString("it-IT")} volumi nel catalogo —
          ricerca per autore, titolo, casa editrice o collocazione.
        </p>
      </section>

      <Cerca
        q={q}
        annoMin={annoMin}
        annoMax={annoMax}
        casaEditrice={casaEditrice}
        specifica={specifica}
        collocazione={collocazione}
        caseEditrici={caseEditrici}
      />

      <section>
        <Tabella
          volumi={risultato.volumi}
          ordina={ordina}
          direzione={direzione}
          searchParams={sp}
        />
        <Paginatore
          pagina={risultato.pagina}
          totalePagine={risultato.totalePagine}
          totale={risultato.totale}
          perPagina={risultato.perPagina}
          searchParams={sp}
        />
      </section>
    </div>
  );
}
