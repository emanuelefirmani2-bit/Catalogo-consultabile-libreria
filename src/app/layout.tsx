import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const fontCormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Digital Library Braga — Catalogo",
    template: "%s · Digital Library Braga",
  },
  description:
    "Catalogo di consultazione del fondo storico della Biblioteca del Conservatorio Statale di Musica «G. Braga» di Teramo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className={`${fontCormorant.variable} ${fontInter.variable}`}>
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="mx-auto max-w-7xl px-6 py-6 flex items-end justify-between flex-wrap gap-3">
            <div>
              <Link href="/" className="block">
                <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-foreground)]">
                  Digital Library Braga
                </h1>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Biblioteca del Conservatorio Statale di Musica «G. Braga» — Teramo
                </p>
              </Link>
            </div>
            <nav className="text-sm flex gap-5 text-[var(--color-muted)]">
              <Link href="/" className="hover:text-[var(--color-accent)]">
                Catalogo
              </Link>
              <Link href="/statistiche" className="hover:text-[var(--color-accent)]">
                Statistiche
              </Link>
              <Link href="/admin" className="hover:text-[var(--color-accent)]">
                Admin
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
        </main>

        <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="mx-auto max-w-7xl px-6 py-5 text-xs text-[var(--color-muted)] flex items-center justify-between flex-wrap gap-2">
            <span>
              Catalogo di consultazione · fondo storico ·{" "}
              <span className="italic">Digital Library Braga</span>
            </span>
            <span>Progetto di dottorato di ricerca · E. Firmani</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
