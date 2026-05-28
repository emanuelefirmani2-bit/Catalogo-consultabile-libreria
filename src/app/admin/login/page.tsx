import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { tentaLogin, isAdminLoggato } from "@/lib/admin-auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string; ritorna?: string }>;
}) {
  // Se già loggato, vai direttamente alla dashboard admin
  if (await isAdminLoggato()) {
    redirect("/admin");
  }
  const sp = await searchParams;

  async function aziona(formData: FormData) {
    "use server";
    const pw = String(formData.get("password") ?? "");
    const ritorna = String(formData.get("ritorna") ?? "/admin");
    const ok = await tentaLogin(pw);
    if (!ok) {
      redirect(`/admin/login?errore=1&ritorna=${encodeURIComponent(ritorna)}`);
    }
    redirect(ritorna && ritorna.startsWith("/admin") ? ritorna : "/admin");
  }

  return (
    <div className="mx-auto max-w-md mt-12">
      <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lock aria-hidden className="size-5 text-[var(--color-accent)]" />
          <h2 className="font-display text-2xl">Accesso Admin</h2>
        </div>
        <p className="text-sm text-[var(--color-muted)] mb-5">
          Inserisci la password di amministrazione per accedere alla gestione
          del catalogo.
        </p>

        {sp.errore ? (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Password errata. Riprova.
          </div>
        ) : null}

        <form action={aziona} className="space-y-4">
          <input type="hidden" name="ritorna" value={sp.ritorna ?? "/admin"} />
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded border border-[var(--color-border-hard)] bg-white px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-soft)]"
          >
            Accedi
          </button>
        </form>
      </div>
    </div>
  );
}
