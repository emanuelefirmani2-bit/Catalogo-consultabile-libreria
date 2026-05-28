"use client";
import { useState, useRef } from "react";
import { Upload, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface ReportImport {
  righeLette: number;
  aggiornati: number;
  aggiunti: number;
  ignorati: number;
  errori: Array<{ ingresso: string | null; messaggio: string }>;
  colonneNonRiconosciute: string[];
}

export function CaricamentoExcel() {
  const [stato, setStato] = useState<
    "idle" | "caricamento" | "ok" | "errore"
  >("idle");
  const [report, setReport] = useState<ReportImport | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragHover, setDragHover] = useState(false);
  const [nomeFile, setNomeFile] = useState<string | null>(null);

  async function invia(file: File) {
    setStato("caricamento");
    setReport(null);
    setErrMsg(null);
    setNomeFile(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/reimport", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setStato("errore");
        setErrMsg(json?.errore ?? `Errore HTTP ${res.status}`);
        return;
      }
      setReport(json);
      setStato("ok");
    } catch (e) {
      setStato("errore");
      setErrMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="font-display text-xl mb-1">Re-import Excel del catalogo</h3>
      <p className="text-sm text-[var(--color-muted)] mb-4">
        Carica un nuovo file Excel. Il sistema fa il <em>merge intelligente</em>:
        aggiorna i record esistenti per <code>Ingresso</code>, aggiunge i nuovi,
        e <strong>non cancella</strong> i dati esistenti se una cella del nuovo file
        è vuota. Le <em>note</em> e i record marcati <em>da verificare</em> non
        vengono toccati.
      </p>

      <label
        htmlFor="file-excel"
        onDragEnter={(e) => {
          e.preventDefault();
          setDragHover(true);
        }}
        onDragLeave={() => setDragHover(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragHover(false);
          const f = e.dataTransfer.files?.[0];
          if (f) invia(f);
        }}
        className={
          "flex flex-col items-center justify-center gap-2 rounded border-2 border-dashed p-8 cursor-pointer transition-colors " +
          (dragHover
            ? "border-[var(--color-accent)] bg-[#fbf8f0]"
            : "border-[var(--color-border-hard)] hover:border-[var(--color-accent)]")
        }
      >
        <Upload aria-hidden className="size-7 text-[var(--color-muted)]" />
        <span className="text-sm font-medium">
          Trascina qui il file Excel o clicca per sceglierlo
        </span>
        <span className="text-xs text-[var(--color-muted)]">
          .xlsx (max 25 MB)
        </span>
        <input
          id="file-excel"
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) invia(f);
          }}
        />
      </label>

      {/* Stato */}
      {stato === "caricamento" ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Import in corso — può richiedere fino a un minuto…
        </div>
      ) : null}

      {stato === "errore" && errMsg ? (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800 flex items-start gap-2">
          <AlertTriangle aria-hidden className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Errore durante l&apos;import</p>
            <p className="mt-1">{errMsg}</p>
          </div>
        </div>
      ) : null}

      {stato === "ok" && report ? (
        <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 aria-hidden className="size-4" />
            Import completato {nomeFile ? `(${nomeFile})` : ""}
          </div>
          <ul className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Statlet label="Righe lette" v={report.righeLette} />
            <Statlet label="Aggiornati" v={report.aggiornati} />
            <Statlet label="Aggiunti" v={report.aggiunti} />
            <Statlet label="Ignorati" v={report.ignorati} />
          </ul>
          {report.colonneNonRiconosciute.length > 0 ? (
            <p className="mt-3 text-xs">
              <strong>Colonne ignorate:</strong>{" "}
              {report.colonneNonRiconosciute.join(", ")}
            </p>
          ) : null}
          {report.errori.length > 0 ? (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer font-medium">
                {report.errori.length} errori
              </summary>
              <ul className="mt-2 list-disc pl-5 space-y-0.5">
                {report.errori.slice(0, 50).map((e, i) => (
                  <li key={i}>
                    {e.ingresso ? `[${e.ingresso}] ` : ""}
                    {e.messaggio}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Statlet({ label, v }: { label: string; v: number }) {
  return (
    <li>
      <div className="text-xs text-emerald-900/70">{label}</div>
      <div className="font-display text-2xl text-emerald-900">{v}</div>
    </li>
  );
}
