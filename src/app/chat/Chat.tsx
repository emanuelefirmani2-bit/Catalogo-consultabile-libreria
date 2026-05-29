"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Send,
  Sparkles,
  Loader2,
  Wrench,
  AlertTriangle,
  MessageCircle,
  RotateCcw,
} from "lucide-react";

const SUGGERIMENTI = [
  "Quanti volumi di Verdi ci sono?",
  "Mostrami le opere per pianoforte solo del Novecento",
  "Qual è la casa editrice più rappresentata nel catalogo?",
  "Trova i record marcati da verificare",
  "Cosa abbiamo di Bucchi?",
];

/**
 * Mini parser markdown inline: gestisce **grassetto** e *corsivo*.
 * Non rendere mai HTML grezzo — costruisce ReactNode così niente XSS.
 * Volutamente minimale: il chat NON è un editor markdown.
 */
function parseMarkdownInline(testo: string, baseKey: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Regex unica per **bold** o *italic*, in ordine di precedenza
  const re = /(\*\*([^*]+)\*\*|\*([^*\n]+)\*)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(testo)) !== null) {
    if (m.index > lastIdx) out.push(testo.slice(lastIdx, m.index));
    if (m[2] !== undefined) {
      out.push(<strong key={`${baseKey}-b${i}`}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      out.push(<em key={`${baseKey}-i${i}`}>{m[3]}</em>);
    }
    lastIdx = m.index + m[0].length;
    i++;
  }
  if (lastIdx < testo.length) out.push(testo.slice(lastIdx));
  return out;
}

/**
 * Trasforma il testo dell'AI in ReactNode con:
 *   - citazioni [#NUM] → link a /ingresso/NUM (redirect a /volume/[id])
 *   - markdown inline base (**grassetto**, *corsivo*)
 */
function renderTestoAI(testo: string, baseKey: string) {
  const out: ReactNode[] = [];
  const re = /\[#([0-9]+(?:\.[0-9]+)?)\]/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(testo)) !== null) {
    if (m.index > lastIdx) {
      out.push(
        ...parseMarkdownInline(
          testo.slice(lastIdx, m.index),
          `${baseKey}-t${i}`,
        ),
      );
    }
    out.push(
      <Link
        key={`${baseKey}-cit${i}`}
        href={`/ingresso/${encodeURIComponent(m[1])}`}
        className="link font-mono"
        title={`Apri la scheda del record n. ${m[1]}`}
      >
        [#{m[1]}]
      </Link>,
    );
    lastIdx = m.index + m[0].length;
    i++;
  }
  if (lastIdx < testo.length) {
    out.push(
      ...parseMarkdownInline(testo.slice(lastIdx), `${baseKey}-tail`),
    );
  }
  return out;
}

export function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  async function inviaProsa(testo: string) {
    if (!testo.trim() || isLoading) return;
    setInput("");
    await sendMessage({ text: testo });
  }

  function nuovaChat() {
    if (isLoading) return;
    setMessages([]);
    setInput("");
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] sm:h-[calc(100vh-260px)] min-h-[480px]">
      {/* Barra superiore: nuova chat (solo se ci sono messaggi) */}
      {messages.length > 0 ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={nuovaChat}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded border border-[var(--color-border-hard)] bg-white px-3 py-1.5 text-xs text-[var(--color-foreground)] hover:bg-[#f3eee2] disabled:opacity-50"
            title="Inizia una nuova conversazione"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            Nuova chat
          </button>
        </div>
      ) : null}

      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Sparkles aria-hidden className="size-8 mx-auto text-[var(--color-accent)]" />
            <h3 className="font-display text-xl mt-3">
              Interroga il catalogo
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted)] max-w-md mx-auto">
              Fai una domanda in linguaggio naturale: l&apos;assistente AI cerca
              direttamente nel catalogo e ti risponde citando i record trovati.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto text-left">
              {SUGGERIMENTI.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => inviaProsa(s)}
                  disabled={isLoading}
                  className="rounded border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-foreground)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-lg bg-[var(--color-accent)] text-white px-3.5 py-2 text-sm whitespace-pre-wrap"
                    : "max-w-[90%] space-y-2 text-sm"
                }
              >
                {m.role === "user" ? (
                  m.parts.map((p, i) =>
                    p.type === "text" ? <span key={i}>{p.text}</span> : null,
                  )
                ) : (
                  m.parts.map((p, i) => {
                    if (p.type === "text") {
                      return (
                        <div
                          key={i}
                          className="whitespace-pre-wrap leading-relaxed"
                        >
                          {renderTestoAI(p.text, `${m.id}-p${i}`)}
                        </div>
                      );
                    }
                    if (p.type.startsWith("tool-")) {
                      const toolName = p.type.replace("tool-", "");
                      const stato = (p as { state?: string }).state ?? "";
                      const inProgress =
                        stato === "input-streaming" ||
                        stato === "input-available";
                      return (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-hard)] bg-[#f3eee2] px-2.5 py-1 text-xs text-[var(--color-muted)]"
                        >
                          {inProgress ? (
                            <Loader2 aria-hidden className="size-3 animate-spin" />
                          ) : (
                            <Wrench aria-hidden className="size-3" />
                          )}
                          <span className="font-mono">{toolName}</span>
                        </div>
                      );
                    }
                    return null;
                  })
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && messages.length > 0 ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 text-xs text-[var(--color-muted)]">
              <Loader2 aria-hidden className="size-3 animate-spin" />
              <span>Sto pensando…</span>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 inline-flex items-start gap-2">
            <AlertTriangle aria-hidden className="size-4 shrink-0 mt-0.5" />
            <div>{error.message}</div>
          </div>
        ) : null}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          inviaProsa(input);
        }}
        className="mt-3 flex gap-2"
      >
        <div className="relative flex-1">
          <MessageCircle
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-muted)]"
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Chiedi qualcosa sul catalogo…"
            className="w-full rounded border border-[var(--color-border-hard)] bg-white py-2.5 pl-9 pr-3 text-base sm:text-sm placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-soft)] disabled:opacity-50"
        >
          <Send aria-hidden className="size-4" />
          <span className="hidden sm:inline">Invia</span>
        </button>
      </form>
    </div>
  );
}
