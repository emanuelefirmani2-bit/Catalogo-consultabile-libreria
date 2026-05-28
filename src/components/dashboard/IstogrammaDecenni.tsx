/**
 * Istogramma SVG dei record per decennio.
 * SSR puro: niente librerie, niente client JS.
 */
export function IstogrammaDecenni({
  dati,
}: {
  dati: Array<{ decennio: number; n: number }>;
}) {
  if (dati.length === 0) {
    return (
      <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="font-display text-xl mb-2">Distribuzione per decennio</h3>
        <p className="text-sm text-[var(--color-muted)]">Nessun dato.</p>
      </div>
    );
  }

  const W = 720;
  const H = 220;
  const PADDING_L = 36;
  const PADDING_R = 12;
  const PADDING_T = 12;
  const PADDING_B = 36;
  const inner_w = W - PADDING_L - PADDING_R;
  const inner_h = H - PADDING_T - PADDING_B;
  const max = Math.max(...dati.map((d) => d.n));
  const barW = inner_w / dati.length;
  const gap = Math.max(2, barW * 0.18);

  // Tick verticali ~5 livelli
  const tickStep = niceTickStep(max);
  const ticks: number[] = [];
  for (let t = 0; t <= max; t += tickStep) ticks.push(t);
  if (ticks[ticks.length - 1] < max) ticks.push(max);

  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="font-display text-xl mb-2">Distribuzione per decennio</h3>
      <p className="text-xs text-[var(--color-muted)] mb-4">
        Numero di volumi per decennio di pubblicazione (solo record con anno
        parsabile).
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Istogramma volumi per decennio"
        className="w-full h-auto"
      >
        {/* Griglia */}
        {ticks.map((t) => {
          const y = PADDING_T + inner_h - (t / max) * inner_h;
          return (
            <g key={t}>
              <line
                x1={PADDING_L}
                x2={W - PADDING_R}
                y1={y}
                y2={y}
                stroke="#e5dfd3"
                strokeDasharray="2 3"
              />
              <text
                x={PADDING_L - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                fill="#6b6253"
              >
                {t}
              </text>
            </g>
          );
        })}
        {/* Barre */}
        {dati.map((d, i) => {
          const h = (d.n / max) * inner_h;
          const x = PADDING_L + i * barW + gap / 2;
          const y = PADDING_T + inner_h - h;
          return (
            <g key={d.decennio}>
              <rect
                x={x}
                y={y}
                width={barW - gap}
                height={h}
                fill="#7a1f1f"
                opacity={0.85}
              >
                <title>{`${d.decennio}: ${d.n} volumi`}</title>
              </rect>
              {/* etichetta x ogni 2 decenni per non sovraffollare */}
              {i % 2 === 0 ? (
                <text
                  x={x + (barW - gap) / 2}
                  y={H - PADDING_B + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#6b6253"
                >
                  {d.decennio}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function niceTickStep(max: number): number {
  const raw = max / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  let step: number;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  return step * mag;
}
