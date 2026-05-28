import "server-only";
import * as XLSX from "xlsx";
import { creaClientAdmin } from "@/lib/supabase/server";

/**
 * Mappatura "robusta" delle intestazioni Excel verso le colonne DB.
 * Normalizziamo l'header rimuovendo accenti/spazi/punteggiatura per accettare
 * varianti (es. "Casa Editrice" / "casa editrice" / "Casa  Editrice" / "casa-editrice").
 */
const ALIAS: Record<string, string> = {
  ingresso: "ingresso",
  numeroingresso: "ingresso",
  ndingresso: "ingresso",

  autore: "autore",
  autori: "autore",

  titolo: "titolo",

  specifica: "specifica",
  strumento: "specifica",
  organico: "specifica",

  partituraparti: "partitura_parti_formato",
  partituraparts: "partitura_parti_formato",
  partituraparti_formato: "partitura_parti_formato",
  partituraparti_parti_formato: "partitura_parti_formato",
  partituraform: "partitura_parti_formato",
  partituraparti_parts_formato: "partitura_parti_formato",
  partituraparts_formato: "partitura_parti_formato",
  formato: "partitura_parti_formato",

  collocazione: "antica_collocazione",
  anticacollocazione: "antica_collocazione",
  collocazioneantica: "antica_collocazione",

  casaeditrice: "casa_editrice",
  editore: "casa_editrice",

  anno: "anno",
  annostampa: "anno",
  annodistampa: "anno",

  pagine: "pagine",
  numpagine: "pagine",
  numerodipagine: "pagine",

  // Campi FUTURI
  data: "data_ingresso",
  dataingresso: "data_ingresso",
  datadiingresso: "data_ingresso",

  revisore: "revisore",
  revisori: "revisore",

  provenienza: "provenienza",
  origine: "provenienza",

  // Campo tecnico
  led: "posizione_led",
  posizioneled: "posizione_led",
};

function normalizzaHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Trim + null per stringa vuota. */
function norm(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/** Parsa data_ingresso → ISO YYYY-MM-DD se possibile, altrimenti null. */
function parseDate(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number") {
    // serial Excel → date
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    const yyyy = String(d.y).padStart(4, "0");
    const mm = String(d.m).padStart(2, "0");
    const dd = String(d.d).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  const s = String(v).trim();
  if (!s) return null;
  // Pattern ISO o DD/MM/YYYY o DD-MM-YYYY
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return s;
  const ita = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/.exec(s);
  if (ita) {
    const yyyy = ita[3].length === 2 ? `20${ita[3]}` : ita[3];
    return `${yyyy}-${ita[2].padStart(2, "0")}-${ita[1].padStart(2, "0")}`;
  }
  return null;
}

export interface RisultatoImport {
  righeLette: number;
  aggiornati: number;
  aggiunti: number;
  ignorati: number;
  errori: Array<{ ingresso: string | null; messaggio: string }>;
  colonneNonRiconosciute: string[];
}

/**
 * Esegue il merge intelligente di un Excel sul catalogo:
 *   - match per `ingresso`
 *   - aggiorna record esistenti (campi non vuoti del nuovo Excel sovrascrivono)
 *   - inserisce record nuovi
 *   - NON cancella un valore esistente se la cella nuova è vuota
 *   - preserva sempre i campi locali `note`, `da_verificare`, `posizione_led`
 */
export async function mergeExcelSulCatalogo(
  buffer: ArrayBuffer,
): Promise<RisultatoImport> {
  const supa = creaClientAdmin();
  const wb = XLSX.read(buffer, { cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // Estrazione AOA per leggere gli header reali
  const aoa: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
    raw: false,
  });
  if (aoa.length === 0) {
    return {
      righeLette: 0,
      aggiornati: 0,
      aggiunti: 0,
      ignorati: 0,
      errori: [{ ingresso: null, messaggio: "Foglio vuoto" }],
      colonneNonRiconosciute: [],
    };
  }

  const headerRow = aoa[0].map((h) => (h ? String(h) : ""));
  const mapColonneIdx: Record<string, number> = {};
  const colonneNonRiconosciute: string[] = [];
  headerRow.forEach((h, i) => {
    if (!h) return;
    const key = ALIAS[normalizzaHeader(h)];
    if (key) mapColonneIdx[key] = i;
    else colonneNonRiconosciute.push(h);
  });

  // Servono almeno ingresso + (autore o titolo)
  if (mapColonneIdx.ingresso === undefined) {
    return {
      righeLette: 0,
      aggiornati: 0,
      aggiunti: 0,
      ignorati: 0,
      errori: [
        {
          ingresso: null,
          messaggio:
            "Colonna 'Ingresso' non trovata nell'Excel. Impossibile fare il merge.",
        },
      ],
      colonneNonRiconosciute,
    };
  }

  // Estraiamo gli ingressi presenti per fare bulk-lookup degli esistenti
  const righe = aoa
    .slice(1)
    .filter((r) => r.some((v) => v !== null && String(v).trim() !== ""));
  const ingressiExcel: string[] = [];
  for (const r of righe) {
    const i = norm(r[mapColonneIdx.ingresso]);
    if (i) ingressiExcel.push(i);
  }

  // Recupera record esistenti per quegli ingressi
  const esistenti = new Map<
    string,
    { id: number; campi: Record<string, string | null> }
  >();
  const CHUNK_LOOKUP = 500;
  for (let i = 0; i < ingressiExcel.length; i += CHUNK_LOOKUP) {
    const slice = ingressiExcel.slice(i, i + CHUNK_LOOKUP);
    const { data, error } = await supa
      .from("catalogo")
      .select(
        "id,ingresso,autore,titolo,specifica,partitura_parti_formato,antica_collocazione,casa_editrice,anno,pagine,data_ingresso,revisore,provenienza",
      )
      .in("ingresso", slice);
    if (error) {
      return {
        righeLette: righe.length,
        aggiornati: 0,
        aggiunti: 0,
        ignorati: 0,
        errori: [{ ingresso: null, messaggio: `Errore lookup: ${error.message}` }],
        colonneNonRiconosciute,
      };
    }
    for (const r of data ?? []) {
      const rec = r as Record<string, unknown>;
      esistenti.set(String(rec.ingresso), {
        id: Number(rec.id),
        campi: {
          autore: (rec.autore as string | null) ?? null,
          titolo: (rec.titolo as string | null) ?? null,
          specifica: (rec.specifica as string | null) ?? null,
          partitura_parti_formato:
            (rec.partitura_parti_formato as string | null) ?? null,
          antica_collocazione:
            (rec.antica_collocazione as string | null) ?? null,
          casa_editrice: (rec.casa_editrice as string | null) ?? null,
          anno: (rec.anno as string | null) ?? null,
          pagine: (rec.pagine as string | null) ?? null,
          data_ingresso: (rec.data_ingresso as string | null) ?? null,
          revisore: (rec.revisore as string | null) ?? null,
          provenienza: (rec.provenienza as string | null) ?? null,
        },
      });
    }
  }

  // Processa riga per riga
  const aggiornaBatch: Array<{ id: number; patch: Record<string, unknown> }> =
    [];
  const inserisciBatch: Array<Record<string, unknown>> = [];
  const errori: RisultatoImport["errori"] = [];
  let ignorati = 0;

  const CAMPI_TESTO = [
    "autore",
    "titolo",
    "specifica",
    "partitura_parti_formato",
    "antica_collocazione",
    "casa_editrice",
    "anno",
    "pagine",
    "revisore",
    "provenienza",
  ] as const;

  for (const r of righe) {
    const ingresso = norm(r[mapColonneIdx.ingresso]);
    if (!ingresso) {
      ignorati++;
      continue;
    }
    const exist = esistenti.get(ingresso);
    if (exist) {
      // UPDATE: solo i campi non vuoti nel nuovo Excel sovrascrivono
      const patch: Record<string, unknown> = {};
      for (const k of CAMPI_TESTO) {
        const idx = mapColonneIdx[k];
        if (idx === undefined) continue;
        const v = norm(r[idx]);
        if (v !== null && v !== exist.campi[k]) {
          patch[k] = v;
        }
      }
      // data_ingresso speciale: parse → null in caso non parsabile
      if (mapColonneIdx.data_ingresso !== undefined) {
        const d = parseDate(r[mapColonneIdx.data_ingresso]);
        if (d !== null && d !== exist.campi.data_ingresso) patch.data_ingresso = d;
      }
      if (Object.keys(patch).length > 0) {
        aggiornaBatch.push({ id: exist.id, patch });
      } else {
        ignorati++;
      }
    } else {
      // INSERT nuovo record
      const nuovo: Record<string, unknown> = { ingresso };
      for (const k of CAMPI_TESTO) {
        const idx = mapColonneIdx[k];
        if (idx !== undefined) {
          const v = norm(r[idx]);
          if (v !== null) nuovo[k] = v;
        }
      }
      if (mapColonneIdx.data_ingresso !== undefined) {
        const d = parseDate(r[mapColonneIdx.data_ingresso]);
        if (d !== null) nuovo.data_ingresso = d;
      }
      inserisciBatch.push(nuovo);
    }
  }

  // Esegue gli UPDATE uno per uno (sono pochi nella maggioranza dei casi)
  let aggiornati = 0;
  for (const u of aggiornaBatch) {
    const { error } = await supa
      .from("catalogo")
      .update(u.patch)
      .eq("id", u.id);
    if (error) {
      errori.push({
        ingresso: null,
        messaggio: `update id=${u.id}: ${error.message}`,
      });
    } else {
      aggiornati++;
    }
  }

  // Esegue gli INSERT in chunk
  let aggiunti = 0;
  const CHUNK_INS = 500;
  for (let i = 0; i < inserisciBatch.length; i += CHUNK_INS) {
    const slice = inserisciBatch.slice(i, i + CHUNK_INS);
    const { error } = await supa.from("catalogo").insert(slice);
    if (error) {
      errori.push({
        ingresso: null,
        messaggio: `insert chunk ${i}: ${error.message}`,
      });
    } else {
      aggiunti += slice.length;
    }
  }

  return {
    righeLette: righe.length,
    aggiornati,
    aggiunti,
    ignorati,
    errori,
    colonneNonRiconosciute,
  };
}
