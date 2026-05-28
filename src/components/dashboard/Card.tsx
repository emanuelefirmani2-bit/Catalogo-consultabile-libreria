export function Card({
  titolo,
  valore,
  sottotitolo,
  tono,
}: {
  titolo: string;
  valore: string | number;
  sottotitolo?: string;
  tono?: "default" | "warn" | "accent";
}) {
  const colore =
    tono === "warn"
      ? "text-[var(--color-warn)]"
      : tono === "accent"
        ? "text-[var(--color-accent)]"
        : "text-[var(--color-foreground)]";
  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
        {titolo}
      </p>
      <p className={`font-display text-3xl mt-1 ${colore}`}>{valore}</p>
      {sottotitolo ? (
        <p className="mt-1 text-xs text-[var(--color-muted)]">{sottotitolo}</p>
      ) : null}
    </div>
  );
}
