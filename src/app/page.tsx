import { cercaCatalogo, caseEditriciTop } from "@/lib/catalogo-query";
import { primaStringa, primoIntero } from "@/lib/url";
import { Cerca } from "@/components/Cerca";
import { Tabella } from "@/components/Tabella";
import { ListaMobile } from "@/components/ListaMobile";
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

  // Il <select> mobile invia un campo combinato `ordineMobile` tipo
  // "autore:desc". Se presente, ha la precedenza su ordina/direzione separati.
  const ordineMobile = primaStringa(sp.ordineMobile);
  let ordinaRaw: ColonnaOrdinabile | undefined = undefined;
  let direzione: DirezioneOrdine | undefined = undefined;
  if (ordineMobile) {
    const [c, d] = ordineMobile.split(":");
    if (c && COLONNE_VALIDE.includes(c as ColonnaOrdinabile)) {
      ordinaRaw = c as ColonnaOrdinabile;
    }
    if (d === "asc" || d === "desc") direzione = d;
  }
  if (!ordinaRaw) {
    const v = primaStringa(sp.ordina) as ColonnaOrdinabile | undefined;
    if (v && COLONNE_VALIDE.includes(v)) ordinaRaw = v;
  }
  if (!direzione) {
    const v = primaStringa(sp.direzione);
    if (v === "asc" || v === "desc") direzione = v;
  }
  const ordina = ordinaRaw;

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
        ordina={ordina}
        direzione={direzione}
        caseEditrici={caseEditrici}
      />

      <section>
        <ListaMobile volumi={risultato.volumi} />
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
