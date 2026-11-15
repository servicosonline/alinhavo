import { layoutOutline, type MarkerLayout } from "@alinhavo/nesting";
import { formatCm } from "@/lib/units";
import { sizeColor } from "@/lib/encaixe/marker";

/**
 * Desenho do risco (SVG em mm): o tecido na horizontal, X no comprimento e
 * Y na largura (de cima para baixo). Altura fixa na tela; riscos longos rolam de
 * lado dentro do quadro (a página não ganha rolagem lateral).
 */
export function MarkerView({ layout, sizes, height = 260 }: { layout: MarkerLayout; sizes: readonly string[]; height?: number }) {
  const W = layout.widthMm;
  const L = Math.max(layout.lengthMm, 1);
  const pad = Math.max(W, L) * 0.01;
  const width = Math.round((height * (L + 2 * pad)) / (W + 2 * pad));
  const font = W / 28;
  const shown = sizes.filter((s) => layout.demand[s]);

  return (
    <figure className="space-y-2" data-marker>
      <div className="w-fit max-w-full overflow-x-auto rounded-md border border-tinta/15 bg-white">
        <svg
          viewBox={`${-pad} ${-pad} ${L + 2 * pad} ${W + 2 * pad}`}
          width={width}
          height={height}
          role="img"
          aria-label={`Risco de ${formatCm(L)} cm por ${formatCm(W)} cm com ${layout.placements.length} peças`}
        >
          <rect x={0} y={0} width={L} height={W} fill="#faf7f2" stroke="#2b2622" strokeOpacity={0.35} strokeWidth={W / 400} strokeDasharray={`${W / 80} ${W / 120}`} />
          {layout.placements.map((pl) => {
            const piece = layout.pieces.find((p) => p.id === pl.pieceId);
            const pts = layoutOutline(layout, pl);
            if (!piece || pts.length === 0) return null;
            const xs = pts.map((p) => p.x);
            const ys = pts.map((p) => p.y);
            const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
            const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
            return (
              <g key={`${pl.pieceId}#${pl.copy}`} data-piece={pl.pieceId}>
                <polygon
                  points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill={sizeColor(sizes, piece.size)}
                  stroke="#2b2622"
                  strokeWidth={W / 600}
                />
                <text x={cx} y={cy} fontSize={font} textAnchor="middle" dominantBaseline="middle" fill="#2b2622">
                  {piece.size}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="flex flex-wrap gap-3 text-xs text-tinta-suave">
        {shown.map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm border border-tinta/30" style={{ background: sizeColor(sizes, s) }} />
            {s}
          </span>
        ))}
        <span>Largura do tecido na vertical; o fio corre no comprimento.</span>
      </figcaption>
    </figure>
  );
}
