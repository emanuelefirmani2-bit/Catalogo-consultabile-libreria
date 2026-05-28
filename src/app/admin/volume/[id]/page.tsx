import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { isAdminLoggato } from "@/lib/admin-auth";
import { creaClientAdmin } from "@/lib/supabase/server";
import { trovaVolumePerId } from "@/lib/catalogo-query";

interface FormErrors {
  generale?: string;
  ingresso?: string;
}

async function salva(formData: FormData) {
  "use server";
  if (!(await isAdminLoggato())) redirect("/admin/login");

  const idRaw = String(formData.get("id") ?? "");
  const id = parseInt(idRaw, 10);
  if (!Number.isFinite(id)) redirect("/admin");

  const stringaONull = (k: string): string | null => {
    const v = formData.get(k);
    if (v === null) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  };
  const boolDaCheckbox = (k: string): boolean => {
    return formData.get(k) === "on" || formData.get(k) === "true";
  };

  const patch = {
    ingresso: stringaONull("ingresso") ?? "",
    autore: stringaONull("autore"),
    titolo: stringaONull("titolo"),
    specifica: stringaONull("specifica"),
    partitura_parti_formato: stringaONull("partitura_parti_formato"),
    antica_collocazione: stringaONull("antica_collocazione"),
    casa_editrice: stringaONull("casa_editrice"),
    anno: stringaONull("anno"),
    pagine: stringaONull("pagine"),
    data_ingresso: stringaONull("data_ingresso"),
    revisore: stringaONull("revisore"),
    provenienza: stringaONull("provenienza"),
    posizione_led: stringaONull("posizione_led"),
    note: stringaONull("note"),
    da_verificare: boolDaCheckbox("da_verificare"),
  };

  if (!patch.ingresso) {
    redirect(`/admin/volume/${id}?errore=ingresso`);
  }

  const supa = creaClientAdmin();
  const { error } = await supa.from("catalogo").update(patch).eq("id", id);
  if (error) {
    redirect(`/admin/volume/${id}?errore=${encodeURIComponent(error.message)}`);
  }
  redirect(`/admin/volume/${id}?salvato=1`);
}

export default async function ModificaVolumePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvato?: string; errore?: string }>;
}) {
  if (!(await isAdminLoggato())) redirect("/admin/login");
  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (!Number.isFinite(idNum)) notFound();

  const sp = await searchParams;
  const v = await trovaVolumePerId(idNum);
  if (!v) notFound();

  const errori: FormErrors = {};
  if (sp.errore === "ingresso") {
    errori.ingresso = "Il numero d'ingresso è obbligatorio.";
  } else if (sp.errore) {
    errori.generale = sp.errore;
  }

  return (
    <article className="space-y-5">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Torna all&apos;admin
      </Link>

      <header className="flex items-end justify-between flex-wrap gap-2 border-b border-[var(--color-border)] pb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
            Modifica record · ingresso {v.ingresso}
          </p>
          <h2 className="font-display text-2xl mt-1">
            {v.autore ?? "—"} · {v.titolo ?? "(senza titolo)"}
          </h2>
        </div>
        <Link
          href={`/volume/${v.id}`}
          className="inline-flex items-center gap-1.5 rounded border border-[var(--color-border-hard)] bg-white px-3 py-1.5 text-sm hover:bg-[#f3eee2]"
        >
          <Eye aria-hidden className="size-4" />
          Vedi scheda pubblica
        </Link>
      </header>

      {sp.salvato ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Modifiche salvate correttamente.
        </div>
      ) : null}
      {errori.generale ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errori.generale}
        </div>
      ) : null}

      <form action={salva} className="space-y-6">
        <input type="hidden" name="id" value={v.id} />

        <Sezione titolo="Dati dal registro originale">
          <Campo
            etichetta="Ingresso"
            nome="ingresso"
            valore={v.ingresso}
            obbligatorio
            mono
            errore={errori.ingresso}
          />
          <Campo etichetta="Autore" nome="autore" valore={v.autore} />
          <Campo etichetta="Titolo" nome="titolo" valore={v.titolo} textarea />
          <Campo
            etichetta="Specifica (strumento / organico)"
            nome="specifica"
            valore={v.specifica}
          />
          <Campo
            etichetta="Partitura / Parti / Formato"
            nome="partitura_parti_formato"
            valore={v.partitura_parti_formato}
          />
          <Campo
            etichetta="Antica collocazione"
            nome="antica_collocazione"
            valore={v.antica_collocazione}
            mono
          />
          <Campo
            etichetta="Casa editrice"
            nome="casa_editrice"
            valore={v.casa_editrice}
          />
          <Campo etichetta="Anno di stampa" nome="anno" valore={v.anno} />
          <Campo etichetta="Pagine" nome="pagine" valore={v.pagine} />
        </Sezione>

        <Sezione titolo="Dati di registrazione (predisposti per import futuro)">
          <Campo
            etichetta="Data ingresso in biblioteca"
            nome="data_ingresso"
            valore={v.data_ingresso}
            tipo="date"
          />
          <Campo etichetta="Revisore" nome="revisore" valore={v.revisore} />
          <Campo
            etichetta="Provenienza"
            nome="provenienza"
            valore={v.provenienza}
          />
        </Sezione>

        <Sezione titolo="Annotazioni & qualità dati">
          <Campo
            etichetta="Note bibliotecario"
            nome="note"
            valore={v.note}
            textarea
          />
          <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <label htmlFor="da_verificare" className="text-sm text-[var(--color-muted)]">
              Da verificare
            </label>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                id="da_verificare"
                name="da_verificare"
                type="checkbox"
                defaultChecked={v.da_verificare}
                className="size-4 accent-[var(--color-accent)]"
              />
              <span className="text-sm text-[var(--color-muted)]">
                Marca questo record come &laquo;da verificare sul cartaceo&raquo;
              </span>
            </div>
          </div>
        </Sezione>

        <Sezione titolo="Localizzazione fisica (predisposta per integrazione ESP32)">
          {/* TODO ESP32: la posizione LED sarà assegnata in massa via uno
              strumento dedicato di mapping scaffale → ingresso. */}
          <Campo
            etichetta="Posizione LED"
            nome="posizione_led"
            valore={v.posizione_led}
            mono
            placeholder="es. 12 oppure 12-15"
          />
        </Sezione>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-soft)]"
          >
            <Save aria-hidden className="size-4" />
            Salva modifiche
          </button>
          <Link
            href={`/volume/${v.id}`}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
          >
            Annulla
          </Link>
        </div>
      </form>
    </article>
  );
}

function Sezione({
  titolo,
  children,
}: {
  titolo: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="font-display text-lg mb-2">{titolo}</legend>
      <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
        {children}
      </div>
    </fieldset>
  );
}

function Campo({
  etichetta,
  nome,
  valore,
  textarea,
  mono,
  tipo,
  obbligatorio,
  errore,
  placeholder,
}: {
  etichetta: string;
  nome: string;
  valore: string | null | undefined;
  textarea?: boolean;
  mono?: boolean;
  tipo?: "text" | "date";
  obbligatorio?: boolean;
  errore?: string;
  placeholder?: string;
}) {
  const idHtml = `c-${nome}`;
  return (
    <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
      <label
        htmlFor={idHtml}
        className="text-sm text-[var(--color-muted)] pt-1.5"
      >
        {etichetta}
        {obbligatorio ? <span className="text-[var(--color-accent)]"> *</span> : null}
      </label>
      <div className="sm:col-span-2">
        {textarea ? (
          <textarea
            id={idHtml}
            name={nome}
            defaultValue={valore ?? ""}
            rows={3}
            placeholder={placeholder}
            className={
              "w-full rounded border border-[var(--color-border-hard)] bg-white px-2 py-1.5 text-sm focus:border-[var(--color-accent)] focus:outline-none " +
              (mono ? "font-mono" : "")
            }
          />
        ) : (
          <input
            id={idHtml}
            name={nome}
            type={tipo ?? "text"}
            required={obbligatorio}
            defaultValue={valore ?? ""}
            placeholder={placeholder}
            className={
              "w-full rounded border border-[var(--color-border-hard)] bg-white px-2 py-1.5 text-sm focus:border-[var(--color-accent)] focus:outline-none " +
              (mono ? "font-mono" : "")
            }
          />
        )}
        {errore ? (
          <p className="mt-1 text-xs text-red-700">{errore}</p>
        ) : null}
      </div>
    </div>
  );
}
