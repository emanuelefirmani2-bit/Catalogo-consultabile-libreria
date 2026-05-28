import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { isAdminLoggato } from "@/lib/admin-auth";
import { cercaCatalogo } from "@/lib/catalogo-query";
import { comeTesto, tronca } from "@/lib/formatters";
import { primaStringa } from "@/lib/url";

/**
 * Pagina admin per cercare un record da modificare.
 * Riusa la query di catalogo ma stampa una tabella semplificata coi link verso
 * la pagina di modifica /admin/volume/[id].
 */
export default async function AdminCercaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!(await isAdminLoggato())) redirect("/admin/login");
  const sp = await searchParams;
  const q = primaStringa(sp.q);

  const risultato = await cercaCatalogo({
    q,
    perPagina: 50,
  });

  return (
    <div className="space-y-4">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Torna all&apos;admin
      </Link>

      <header>
        <h2 className="font-display text-2xl">Ricerca record da modificare</h2>
        <p className="text-sm text-[var(--color-muted)]">
          {risultato.totale.toLocaleString("it-IT")} risultati per &laquo;{q ?? ""}&raquo;
        </p>
      </header>

      <form
        action="/admin/cerca"
        method="GET"
        className="flex gap-2 flex-wrap"
      >
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="ingresso, autore, titolo…"
          className="flex-1 min-w-64 rounded border border-[var(--color-border-hard)] bg-white px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
        />
        <button
          type="submit"
          className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-soft)]"
        >
          Cerca
        </button>
      </form>

      {risultato.volumi.length === 0 ? (
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)] text-center">
          Nessun risultato.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
            <thead className="bg-[#f3eee2] text-xs uppercase text-[var(--color-muted)]">
              <tr>
                <th className="px-3 py-2 text-left">Ingresso</th>
                <th className="px-3 py-2 text-left">Autore</th>
                <th className="px-3 py-2 text-left">Titolo</th>
                <th className="px-3 py-2 text-left">Collocazione</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {risultato.volumi.map((v) => (
                <tr key={v.id} className="hover:bg-[#fbf8f0]">
                  <td className="px-3 py-2 font-mono whitespace-nowrap">
                    {v.ingresso}
                  </td>
                  <td className="px-3 py-2">{comeTesto(v.autore)}</td>
                  <td className="px-3 py-2">{tronca(v.titolo, 70)}</td>
                  <td className="px-3 py-2 font-mono text-[var(--color-muted)] whitespace-nowrap">
                    {comeTesto(v.antica_collocazione)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/volume/${v.id}`}
                      className="inline-flex items-center gap-1 rounded bg-[var(--color-accent)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-accent-soft)]"
                    >
                      <Pencil aria-hidden className="size-3" />
                      Modifica
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
