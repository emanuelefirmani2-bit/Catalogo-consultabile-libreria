import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Search } from "lucide-react";
import { isAdminLoggato, logout } from "@/lib/admin-auth";
import { CaricamentoExcel } from "@/components/admin/CaricamentoExcel";

export default async function AdminPage() {
  if (!(await isAdminLoggato())) {
    redirect("/admin/login");
  }

  async function azionaLogout() {
    "use server";
    await logout();
    redirect("/admin/login");
  }

  async function vaiAModifica(formData: FormData) {
    "use server";
    const raw = String(formData.get("ingresso") ?? "").trim();
    if (!raw) redirect("/admin");
    // Reindirizziamo alla rotta admin di modifica per ingresso
    redirect(`/admin/cerca?q=${encodeURIComponent(raw)}`);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">Area Admin</h2>
          <p className="text-sm text-[var(--color-muted)]">
            Gestione catalogo — re-import del file Excel e modifica dei singoli
            record.
          </p>
        </div>
        <form action={azionaLogout}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded border border-[var(--color-border-hard)] bg-white px-3 py-1.5 text-sm hover:bg-[#f3eee2]"
          >
            <LogOut aria-hidden className="size-4" />
            Esci
          </button>
        </form>
      </header>

      <CaricamentoExcel />

      <section className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="font-display text-xl mb-1">Modifica un singolo record</h3>
        <p className="text-sm text-[var(--color-muted)] mb-4">
          Cerca un record per numero d&apos;ingresso, autore o titolo per
          aprirne la scheda di modifica.
        </p>
        <form action={vaiAModifica} className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-muted)]"
            />
            <input
              name="ingresso"
              type="search"
              placeholder="es. 4763, Verdi, La Traviata…"
              className="w-full rounded border border-[var(--color-border-hard)] bg-white py-2 pl-9 pr-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-soft)]"
          >
            Cerca
          </button>
        </form>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Suggerimento: per la modifica diretta puoi anche aprire una scheda dal{" "}
          <Link href="/" className="link">
            catalogo pubblico
          </Link>{" "}
          — comparirà un bottone &laquo;Modifica record&raquo; se sei loggato.
        </p>
      </section>
    </div>
  );
}
