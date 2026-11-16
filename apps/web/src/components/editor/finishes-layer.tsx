import { finishShapes, type Piece, type Point } from "@alinhavo/geometry";

const pts = (line: readonly Point[]) => line.map((p) => `${p.x},${p.y}`).join(" ");

/**
 * Acabamentos desenhados na parte (SVG em mm, a parte já no tamanho em vista):
 * pesponto tracejado, zíper como faixa com os dentes no meio, etiqueta,
 * estampa e bordado como retângulo (estampa e bordado com a imagem), pedraria
 * como um círculo por pedra, no tamanho e na cor dela. Só desenho: não recebe clique.
 */
export function FinishesLayer({ piece, px }: { piece: Piece; px: (n: number) => number }) {
  const shapes = finishShapes(piece);
  if (shapes.length === 0) return null;
  const images = new Map((piece.finishes ?? []).flatMap((f) => (f.kind === "estampa" || f.kind === "bordado" ? [[f.id, f.image] as const] : [])));
  const texts = new Map((piece.finishes ?? []).flatMap((f) => (f.kind === "etiqueta" ? [[f.id, f.text] as const] : [])));
  return (
    <g className="pointer-events-none" data-finishes={piece.id}>
      {shapes.map((s) => {
        if (s.kind === "pesponto") {
          return (
            <g key={s.id} data-finish="pesponto">
              {s.lines.map((line, k) => (
                <polyline
                  key={k}
                  points={pts(line)}
                  fill="none"
                  stroke="var(--costura)"
                  strokeWidth={1.2}
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          );
        }
        if (s.kind === "ziper") {
          return (
            <g key={s.id} data-finish="ziper">
              <polygon
                points={pts(s.band)}
                fill="rgb(92 86 76 / 0.25)"
                stroke="var(--tinta-suave)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={pts(s.axis)}
                fill="none"
                stroke="var(--tinta)"
                strokeWidth={2}
                strokeDasharray="1.5 1.5"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        }
        if (s.kind === "pedraria") {
          return (
            <g key={s.id} data-finish="pedraria">
              {s.stones.map((p, k) => (
                <circle key={k} cx={p.x} cy={p.y} r={s.radius} fill={s.color} stroke="var(--tinta-suave)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          );
        }
        const transform = `translate(${s.center.x} ${s.center.y}) rotate(${s.rotation})`;
        const w = s.width;
        const h = s.height;
        return (
          <g key={s.id} transform={transform} data-finish={s.kind}>
            {(s.kind === "estampa" || s.kind === "bordado") && images.get(s.id) && (
              <image href={images.get(s.id)} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio="xMidYMid meet" opacity={0.9} />
            )}
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              fill={s.kind === "etiqueta" ? "rgb(255 255 255 / 0.85)" : "none"}
              strokeWidth={1}
              stroke={s.kind === "bordado" ? "var(--costura)" : "var(--tinta-suave)"}
              strokeDasharray={s.kind === "estampa" ? "3 3" : s.kind === "bordado" ? "1.5 1.5" : undefined}
              vectorEffect="non-scaling-stroke"
            />
            {s.kind === "etiqueta" && (
              <text x={0} y={px(4)} textAnchor="middle" fontSize={Math.min(h * 0.5, px(11))} fill="var(--tinta)">
                {texts.get(s.id) || "Etiqueta"}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
