import "server-only";
import { tool } from "ai";
import { z } from "zod";
import {
  cercaCatalogo,
  trovaVolumePerId,
  PER_PAGINA_MAX,
} from "@/lib/catalogo-query";
import { leggiStatistiche } from "@/lib/statistiche-query";

/**
 * Tool esposti all'agente AI. L'LLM non ha mai accesso diretto al DB:
 * chiama queste funzioni con parametri tipizzati Zod. I valori di ritorno
 * sono progettati per essere "LLM-friendly" (campi essenziali, valori
 * leggibili, niente NULL ambigui).
 */

export const aiTools = {
  cerca_catalogo: tool({
    description:
      "Cerca volumi nel catalogo del fondo storico della Biblioteca del Conservatorio G. Braga. " +
      "Usa parametri specifici quando possibile (autore esatto, range di anni, casa editrice) " +
      "invece di una q generica. Restituisce fino a `limite` record (default 10, max 50) e il " +
      "conteggio totale dei risultati. Ogni record ha un `id` da usare in trova_volume_per_id " +
      "per dettagli completi.",
    inputSchema: z.object({
      q: z
        .string()
        .optional()
        .describe(
          "Ricerca testuale libera: cerca in ingresso, autore, titolo, casa editrice e collocazione. Usa quando l'utente fa una richiesta generica.",
        ),
      annoMin: z
        .number()
        .int()
        .optional()
        .describe("Filtra solo volumi con anno >= annoMin"),
      annoMax: z
        .number()
        .int()
        .optional()
        .describe("Filtra solo volumi con anno <= annoMax"),
      casaEditrice: z
        .string()
        .optional()
        .describe(
          "Match case-insensitive esatto sulla casa editrice (es. 'Ricordi', 'Zanibon')",
        ),
      specifica: z
        .string()
        .optional()
        .describe(
          "Strumento o organico (match parziale). Es: 'pianoforte', 'violino', 'canto e pianoforte'",
        ),
      collocazione: z
        .string()
        .optional()
        .describe(
          "Prefisso della collocazione antica (es. 'A VI', 'B III'). Match prefix.",
        ),
      limite: z
        .number()
        .int()
        .min(1)
        .max(PER_PAGINA_MAX)
        .optional()
        .describe("Numero massimo di record da restituire (default 10, max 50)"),
    }),
    execute: async (args) => {
      const limite = args.limite ?? 10;
      const r = await cercaCatalogo({
        q: args.q,
        annoMin: args.annoMin,
        annoMax: args.annoMax,
        casaEditrice: args.casaEditrice,
        specifica: args.specifica,
        collocazione: args.collocazione,
        perPagina: limite,
        ordina: "ingresso_num",
        direzione: "asc",
      });
      return {
        totale: r.totale,
        mostrati: r.volumi.length,
        risultati: r.volumi.map((v) => ({
          id: v.id,
          ingresso: v.ingresso,
          autore: v.autore ?? null,
          titolo: v.titolo ?? null,
          specifica: v.specifica ?? null,
          casa_editrice: v.casa_editrice ?? null,
          anno: v.anno ?? null,
          collocazione: v.antica_collocazione ?? null,
          da_verificare: v.da_verificare,
        })),
      };
    },
  }),

  trova_volume_per_id: tool({
    description:
      "Recupera tutti i dettagli di un singolo volume dato il suo `id` numerico. " +
      "Usa quando l'utente vuole approfondire un record specifico (autore, titolo completo, " +
      "pagine, note bibliotecario, ecc).",
    inputSchema: z.object({
      id: z.number().int().describe("ID numerico del volume (chiave primaria)"),
    }),
    execute: async ({ id }) => {
      const v = await trovaVolumePerId(id);
      if (!v) return { trovato: false };
      return {
        trovato: true,
        volume: {
          id: v.id,
          ingresso: v.ingresso,
          autore: v.autore,
          titolo: v.titolo,
          specifica: v.specifica,
          partitura_parti_formato: v.partitura_parti_formato,
          antica_collocazione: v.antica_collocazione,
          casa_editrice: v.casa_editrice,
          anno: v.anno,
          pagine: v.pagine,
          data_ingresso: v.data_ingresso,
          revisore: v.revisore,
          provenienza: v.provenienza,
          posizione_led: v.posizione_led,
          note: v.note,
          da_verificare: v.da_verificare,
        },
      };
    },
  }),

  statistiche_catalogo: tool({
    description:
      "Restituisce le statistiche aggregate dell'intero catalogo: totale record, " +
      "completezza per ogni campo, distribuzione per secolo e per decennio, " +
      "classifica top 15 case editrici e strumenti. Usa quando l'utente chiede " +
      "panoramica/overview o domande tipo 'quale casa editrice ha più volumi?'.",
    inputSchema: z.object({}),
    execute: async () => {
      const s = await leggiStatistiche();
      return s;
    },
  }),
};
