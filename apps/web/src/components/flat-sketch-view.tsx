import { sketchPath, type FlatSketch, type SketchView } from "@alinhavo/export/flat-sketch";

/** Uma vista do desenho técnico em SVG (mm), com o nome embaixo. */
function View({ view }: { view: SketchView }) {
  const pad = 20;
  const { minX, minY, maxX, maxY } = view.bounds;
  const w = maxX - minX + 2 * pad;
  const h = maxY - minY + 2 * pad;
  return (
    <figure className="flex flex-1 flex-col items-center" data-sketch-view={view.side}>
      <svg
        viewBox={`${minX - pad} ${minY - pad} ${w} ${h}`}
        className="h-64 w-full max-w-xs"
        role="img"
        aria-label={`Desenho técnico: ${view.side === "frente" ? "frente" : "costas"}`}
      >
        {view.pieces.map((p, i) => (
          <path key={`p${i}`} d={sketchPath(p, true)} fill="none" stroke="var(--tinta-suave)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
        ))}
        {view.outline.map((p, i) => (
          <path
            key={`o${i}`}
            d={sketchPath(p, true)}
            fill="rgb(246 241 231 / 0.6)"
            stroke="var(--tinta)"
            strokeWidth={1.6}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {view.marks.map((m, i) => {
          if (m.kind === "pesponto") {
            return m.lines.map((l, k) => (
              <path
                key={`m${i}-${k}`}
                d={sketchPath(l, false)}
                fill="none"
                stroke="var(--tinta)"
                strokeWidth={0.8}
                strokeDasharray="3 2"
                vectorEffect="non-scaling-stroke"
              />
            ));
          }
          if (m.kind === "ziper") {
            return (
              <g key={`m${i}`}>
                <path
                  d={sketchPath(m.band, true)}
                  fill="rgb(92 86 76 / 0.15)"
                  stroke="var(--tinta)"
                  strokeWidth={0.8}
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={sketchPath(m.axis, false)}
                  fill="none"
                  stroke="var(--tinta)"
                  strokeWidth={1.4}
                  strokeDasharray="1 1"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          }
          if (m.kind === "pedraria") {
            return (
              <g key={`m${i}`}>
                {m.stones.map((s, k) => (
                  <circle key={k} cx={s.x} cy={s.y} r={m.radius} fill="none" stroke="var(--tinta)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
                ))}
              </g>
            );
          }
          const cx = m.corners.reduce((s, p) => s + p.x, 0) / m.corners.length;
          const cy = m.corners.reduce((s, p) => s + p.y, 0) / m.corners.length;
          return (
            <g key={`m${i}`}>
              <path
                d={sketchPath(m.corners, true)}
                fill="none"
                stroke="var(--tinta-suave)"
                strokeWidth={0.8}
                strokeDasharray="3 2"
                vectorEffect="non-scaling-stroke"
              />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(12, w / 30)} fill="var(--tinta-suave)">
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="text-xs text-tinta-suave">{view.side === "frente" ? "Frente" : "Costas"}</figcaption>
    </figure>
  );
}

/** Desenho técnico plano da ficha (gerado do molde): as vistas lado a lado. */
export function FlatSketchView({ sketch }: { sketch: FlatSketch }) {
  if (sketch.views.length === 0) return null;
  return (
    <div className="space-y-1" data-flat-sketch>
      <div className="flex flex-wrap gap-4">
        {sketch.views.map((v) => (
          <View key={v.side} view={v} />
        ))}
      </div>
      {sketch.skipped.length > 0 && (
        <p className="text-xs text-tinta-suave">Fora do desenho (partes laterais ou sem posição): {sketch.skipped.join(", ")}.</p>
      )}
    </div>
  );
}
