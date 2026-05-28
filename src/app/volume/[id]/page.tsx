import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookMarked,
  CircleHelp,
  MapPin,
} from "lucide-react";
import { trovaVolumePerId } from "@/lib/catalogo-query";
import { comeCampoDettaglio } from "@/lib/formatters";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (!Number.isFinite(idNum)) return { title: "Volume non trovato" };
  const v = await trovaVolumePerId(idNum);
  if (!v) return { title: "Volume non trovato" };
  const titolo = v.titolo ?? "(senza titolo)";
  const autore = v.autore ?? "Autore ignoto";
  return { title: `${autore} — ${titolo.slice(0, 60)}` };
}

export default async function VolumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (!Number.isFinite(idNum)) notFound();

  const v = await trovaVolumePerId(idNum);
  if (!v) notFound();

  return (
    <article className="space-y-6">
      {/* Breadcrumb / back */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Torna al catalogo
        </Link>
      </div>

      {/* Intestazione */}
      <header className="border-b border-[var(--color-border)] pb-5">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
          Numero d&apos;ingresso{" "}
          <span className="font-mono text-[var(--color-foreground)]">
            {v.ingresso}
          </span>
        </p>
        <h2 className="font-display text-3xl sm:text-4xl mt-1">
          {v.titolo ?? "Titolo non disponibile"}
        </h2>
        <p className="mt-1 text-lg text-[var(--color-muted)]">
          {v.autore ?? "Autore non disponibile"}
        </p>

        {v.da_verificare ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded border border-[var(--color-warn)]/30 bg-[var(--color-warn)]/10 px-3 py-1.5 text-sm text-[var(--color-warn)]">
            <AlertCircle aria-hidden className="size-4" />
            Record marcato per verifica
          </div>
        ) : null}
      </header>

      {/* Dettagli */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <h3 className="font-display text-xl mb-3 flex items-center gap-2">
            <BookMarked aria-hidden className="size-5 text-[var(--color-accent)]" />
            Dati bibliografici
          </h3>
          <dl className="divide-y divide-[var(--color-border)] rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
            <Campo etichetta="Specifica (strumento / organico)" valore={v.specifica} />
            <Campo etichetta="Partitura / Parti / Formato" valore={v.partitura_parti_formato} />
            <Campo etichetta="Casa editrice" valore={v.casa_editrice} />
            <Campo etichetta="Anno di stampa" valore={v.anno} />
            <Campo etichetta="Pagine" valore={v.pagine} />
            <Campo
              etichetta="Antica collocazione"
              valore={v.antica_collocazione}
              mono
            />
          </dl>

          {/* Campi futuri (Data ingresso, Revisore, Provenienza) */}
          <h3 className="font-display text-xl mt-6 mb-3 flex items-center gap-2">
            <CircleHelp aria-hidden className="size-5 text-[var(--color-muted)]" />
            Dati di registrazione
          </h3>
          <dl className="divide-y divide-[var(--color-border)] rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
            <Campo etichetta="Data di ingresso in biblioteca" valore={v.data_ingresso} />
            <Campo etichetta="Revisore" valore={v.revisore} />
            <Campo etichetta="Provenienza" valore={v.provenienza} />
          </dl>

          {v.note ? (
            <section className="mt-6">
              <h3 className="font-display text-xl mb-3">Note del bibliotecario</h3>
              <p className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm whitespace-pre-wrap text-[var(--color-foreground)]">
                {v.note}
              </p>
            </section>
          ) : null}
        </section>

        {/* Sidebar: localizzazione + LED placeholder */}
        <aside>
          <h3 className="font-display text-xl mb-3 flex items-center gap-2">
            <MapPin aria-hidden className="size-5 text-[var(--color-accent)]" />
            Localizzazione fisica
          </h3>
          <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                Collocazione
              </p>
              <p className="mt-1 font-mono text-lg">
                {v.antica_collocazione ?? "—"}
              </p>
            </div>

            {/* TODO ESP32: pulsante "Localizza sullo scaffale" agganciato al
                gateway pick-to-light, attivo solo quando posizione_led è impostato. */}
            <button
              type="button"
              disabled
              title="Funzionalità in arrivo: integrazione pick-to-light con scaffale fisico"
              className="w-full mt-2 rounded border border-[var(--color-border-hard)] bg-[#f3eee2] px-3 py-2 text-sm text-[var(--color-muted)] cursor-not-allowed"
            >
              Localizza sullo scaffale (in arrivo)
            </button>

            <p className="text-xs text-[var(--color-muted)]">
              Posizione LED:{" "}
              <span className="font-mono">{v.posizione_led ?? "non assegnata"}</span>
            </p>
          </div>

          <p className="mt-4 text-xs text-[var(--color-muted)]">
            Record aggiornato il{" "}
            <time dateTime={v.updated_at}>
              {new Date(v.updated_at).toLocaleDateString("it-IT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </p>
        </aside>
      </div>
    </article>
  );
}

function Campo({
  etichetta,
  valore,
  mono,
}: {
  etichetta: string;
  valore: string | null | undefined;
  mono?: boolean;
}) {
  const { testo, vuoto } = comeCampoDettaglio(valore);
  return (
    <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
      <dt className="text-sm text-[var(--color-muted)]">{etichetta}</dt>
      <dd
        className={
          "sm:col-span-2 text-sm " +
          (vuoto
            ? "italic text-[var(--color-muted)]"
            : "text-[var(--color-foreground)]") +
          (mono && !vuoto ? " font-mono" : "")
        }
      >
        {testo}
      </dd>
    </div>
  );
}
