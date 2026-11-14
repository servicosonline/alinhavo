"use client";

import {
  pieceAtSize,
  seamAllowanceOutline,
  segmentLengths,
  segmentStart,
  type PatternDocument,
  type Point,
} from "@alinhavo/geometry";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCm } from "@/lib/units";
import { piecePath, polygonPath, segmentPath } from "./svg-path";

export type Selection =
  | { kind: "piece"; pieceId: string }
  | { kind: "point"; pieceId: string; pointId: string }
  | { kind: "segment"; pieceId: string; index: number }
  | null;

export type DragTarget =
  | { kind: "point"; pieceId: string; pointId: string }
  | { kind: "handle"; pieceId: string; index: number; handle: "c1" | "c2" }
  | { kind: "piece"; pieceId: string };

type Viewport = { cx: number; cy: number; scale: number }; // centro em mm, px por mm

const MIN_SCALE = 0.05;
const MAX_SCALE = 40;

type Props = {
  doc: PatternDocument;
  /** Tamanho desenhado. Fora do base, o desenho é só para consulta. */
  viewSize: string;
  /** Sobrepõe o contorno de todos os outros tamanhos. */
  showGrade: boolean;
  selection: Selection;
  readOnly: boolean;
  /** Mude o número para enquadrar todas as partes na tela. */
  fitKey: number;
  onSelect: (s: Selection) => void;
  onDragStart: (t: DragTarget) => void;
  /** `delta` em mm desde o início do arrasto. */
  onDragMove: (t: DragTarget, delta: Point) => void;
  onDragEnd: (t: DragTarget) => void;
};

export function PatternCanvas({
  doc: source,
  viewSize,
  showGrade,
  selection,
  readOnly: readOnlyProp,
  fitKey,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
}: Props) {
  // O que se vê: o documento no tamanho escolhido. Edita-se só no base.
  const doc = useMemo(
    () =>
      viewSize === source.baseSize || !source.sizes.includes(viewSize)
        ? source
        : { ...source, pieces: source.pieces.map((p) => pieceAtSize(p, viewSize)) },
    [source, viewSize],
  );
  const readOnly = readOnlyProp || doc !== source;
  const ghosts = useMemo(
    () =>
      showGrade
        ? source.pieces.flatMap((p) =>
            source.sizes
              .filter((s) => s !== viewSize)
              .map((s) => ({ key: `${p.id}:${s}`, d: piecePath(pieceAtSize(p, s)) })),
          )
        : [],
    [source, showGrade, viewSize],
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const measured = size.w > 0 && size.h > 0;
  const [vp, setVp] = useState<Viewport>({ cx: 150, cy: 300, scale: 1 });
  const drag = useRef<
    | { mode: "pan"; startClient: Point; startVp: Viewport }
    | { mode: "edit"; target: DragTarget; startMm: Point; moved: boolean }
    | null
  >(null);

  // Tamanho do quadro em px.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setSize({ w: Math.max(1, entry.contentRect.width), h: Math.max(1, entry.contentRect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const vb = useMemo(() => {
    const w = size.w / vp.scale;
    const h = size.h / vp.scale;
    return { x: vp.cx - w / 2, y: vp.cy - h / 2, w, h };
  }, [size, vp]);

  const toMm = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = svgRef.current!.getBoundingClientRect();
      return { x: vb.x + (clientX - rect.left) / vp.scale, y: vb.y + (clientY - rect.top) / vp.scale };
    },
    [vb, vp.scale],
  );

  // Contornos de corte (com margem), calculados uma vez por mudança do documento.
  const cutLines = useMemo(() => doc.pieces.map((p) => ({ id: p.id, d: polygonPath(seamAllowanceOutline(p)) })), [doc]);

  // Enquadrar tudo: só quando pedem (fitKey) ou quando o quadro ganha tamanho.
  // Documento e tamanho vêm por ref para que editar não reenquadre a tela.
  const latest = useRef({ doc, size });
  useEffect(() => {
    latest.current = { doc, size };
  });
  useEffect(() => {
    if (!measured) return;
    setVp(fitViewport(latest.current.doc, latest.current.size));
  }, [fitKey, measured]);

  // Zoom com a roda, em volta do cursor (listener não passivo para bloquear a rolagem da página).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      setVp((v) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const scale = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE);
        const w = rect.width / v.scale;
        const h = rect.height / v.scale;
        const mx = v.cx - w / 2 + (e.clientX - rect.left) / v.scale;
        const my = v.cy - h / 2 + (e.clientY - rect.top) / v.scale;
        // mantém o ponto sob o cursor parado
        const k = v.scale / scale;
        return { scale, cx: mx + (v.cx - mx) * k, cy: my + (v.cy - my) * k };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (factor: number) => setVp((v) => ({ ...v, scale: clamp(v.scale * factor, MIN_SCALE, MAX_SCALE) }));

  // Um só tratador para o SVG inteiro: os elementos clicáveis levam data-hit e
  // os dados do alvo. Assim nenhum callback com refs desce como propriedade.
  function capture(pointerId: number) {
    try {
      svgRef.current?.setPointerCapture(pointerId);
    } catch {
      // ponteiro já solto: o arrasto segue sem captura
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    const hit = parseHit((e.target as Element).closest("[data-hit]"));

    if (!hit) {
      // fundo: limpa a seleção e começa a mover a vista
      onSelect(null);
      drag.current = { mode: "pan", startClient: { x: e.clientX, y: e.clientY }, startVp: vp };
      capture(e.pointerId);
      return;
    }
    if (hit.kind === "segment") {
      onSelect({ kind: "segment", pieceId: hit.pieceId, index: hit.index });
      return;
    }
    if (hit.kind === "handle") {
      onSelect({ kind: "segment", pieceId: hit.pieceId, index: hit.index });
    } else {
      onSelect(hit);
    }
    if (readOnly) return;
    drag.current = { mode: "edit", target: hit, startMm: toMm(e.clientX, e.clientY), moved: false };
    capture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    if (d.mode === "pan") {
      setVp({
        ...d.startVp,
        cx: d.startVp.cx - (e.clientX - d.startClient.x) / d.startVp.scale,
        cy: d.startVp.cy - (e.clientY - d.startClient.y) / d.startVp.scale,
      });
      return;
    }
    const now = toMm(e.clientX, e.clientY);
    const delta = { x: now.x - d.startMm.x, y: now.y - d.startMm.y };
    if (!d.moved) {
      if (Math.hypot(delta.x, delta.y) * vp.scale < 3) return; // ignora tremidas de clique
      d.moved = true;
      onDragStart(d.target);
    }
    onDragMove(d.target, delta);
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    if (svgRef.current?.hasPointerCapture(e.pointerId)) svgRef.current.releasePointerCapture(e.pointerId);
    if (d?.mode === "edit" && d.moved) onDragEnd(d.target);
  }

  const px = (n: number) => n / vp.scale; // n pixels de tela em mm

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-white">
      <svg
        ref={svgRef}
        role="img"
        aria-label="Área de desenho do molde"
        className="block h-full w-full touch-none select-none"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          <pattern id="grade-1cm" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" stroke="rgb(29 27 24 / 0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </pattern>
          <pattern id="grade-10cm" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#grade-1cm)" />
            <path d="M100 0H0V100" fill="none" stroke="rgb(29 27 24 / 0.16)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </pattern>
        </defs>
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={vp.scale > 0.4 ? "url(#grade-10cm)" : "white"} />

        {/* Outros tamanhos da grade, só o contorno */}
        <g className="pointer-events-none" data-grade-overlay>
          {ghosts.map((g) => (
            <path key={g.key} d={g.d} fill="none" stroke="rgb(92 86 76 / 0.55)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
        </g>

        {doc.pieces.map((piece) => {
          const selectedPiece = selection?.pieceId === piece.id;
          const cut = cutLines.find((c) => c.id === piece.id)?.d ?? "";
          return (
            <g key={piece.id}>
              <path d={cut} fill="none" stroke="var(--linha)" strokeWidth={1} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
              <path
                d={piecePath(piece)}
                fill={selectedPiece ? "rgb(194 65 45 / 0.06)" : "rgb(246 241 231 / 0.7)"}
                stroke="var(--tinta)"
                strokeWidth={selectedPiece ? 2 : 1.5}
                vectorEffect="non-scaling-stroke"
                className={readOnly ? "cursor-pointer" : "cursor-move"}
                data-hit="piece"
                data-piece={piece.id}
              />
              {/* Faixa larga e invisível em cada segmento, para clicar com folga */}
              {piece.outline.map((_, i) => (
                <path
                  key={i}
                  d={segmentPath(piece, i)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer"
                  data-hit="segment"
                  data-piece={piece.id}
                  data-index={i}
                />
              ))}
              <text
                x={centroid(piece.points).x}
                y={centroid(piece.points).y}
                textAnchor="middle"
                fontSize={px(13)}
                fill="var(--tinta-suave)"
                className="pointer-events-none"
              >
                {piece.name}
              </text>
            </g>
          );
        })}

        <SelectionOverlay doc={doc} selection={selection} px={px} readOnly={readOnly} />

        {doc.pieces.map((piece) =>
          Object.entries(piece.points).map(([id, p]) => {
            const sel = selection?.kind === "point" && selection.pieceId === piece.id && selection.pointId === id;
            return (
              <circle
                key={`${piece.id}:${id}`}
                cx={p.x}
                cy={p.y}
                r={px(sel ? 6 : 4.5)}
                fill={sel ? "var(--linha)" : "white"}
                stroke="var(--tinta)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                className={readOnly ? "cursor-pointer" : "cursor-grab"}
                data-hit="point"
                data-piece={piece.id}
                data-point={id}
              />
            );
          }),
        )}
      </svg>

      <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-md border border-tinta/15 bg-white/90 p-1 text-sm shadow-sm">
        <button type="button" className="h-7 w-7 rounded hover:bg-papel-escuro" onClick={() => zoomBy(1 / 1.25)} aria-label="Afastar">
          −
        </button>
        <span className="w-14 text-center font-mono text-xs text-tinta-suave" aria-live="polite">
          {Math.round(vp.scale * 100)}%
        </span>
        <button type="button" className="h-7 w-7 rounded hover:bg-papel-escuro" onClick={() => zoomBy(1.25)} aria-label="Aproximar">
          +
        </button>
      </div>
    </div>
  );
}

function SelectionOverlay({
  doc,
  selection,
  px,
  readOnly,
}: {
  doc: PatternDocument;
  selection: Selection;
  px: (n: number) => number;
  readOnly: boolean;
}) {
  if (selection?.kind !== "segment") return null;
  const piece = doc.pieces.find((p) => p.id === selection.pieceId);
  const seg = piece?.outline[selection.index];
  if (!piece || !seg) return null;
  const a = piece.points[segmentStart(piece, selection.index)]!;
  const b = piece.points[seg.to]!;
  const len = segmentLengths(piece)[selection.index] ?? 0;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

  return (
    <g>
      <path d={segmentPath(piece, selection.index)} fill="none" stroke="var(--linha)" strokeWidth={3} vectorEffect="non-scaling-stroke" className="pointer-events-none" />
      {seg.kind === "cubic" &&
        (
          [
            ["c1", a, seg.c1],
            ["c2", b, seg.c2],
          ] as const
        ).map(([h, anchor, c]) => (
          <g key={h}>
            <line x1={anchor.x} y1={anchor.y} x2={c.x} y2={c.y} stroke="var(--tinta-suave)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <rect
              x={c.x - px(4)}
              y={c.y - px(4)}
              width={px(8)}
              height={px(8)}
              fill="var(--linha)"
              className={readOnly ? "" : "cursor-grab"}
              data-hit="handle"
              data-piece={piece.id}
              data-index={selection.index}
              data-handle={h}
            />
          </g>
        ))}
      <g className="pointer-events-none" transform={`translate(${mid.x} ${mid.y - px(10)})`}>
        <rect x={-px(30)} y={-px(10)} width={px(60)} height={px(16)} rx={px(3)} fill="var(--tinta)" />
        <text textAnchor="middle" y={px(2)} fontSize={px(11)} fill="var(--papel)">
          {formatCm(len)} cm
        </text>
      </g>
    </g>
  );
}

type Hit = DragTarget | { kind: "segment"; pieceId: string; index: number };

/** Lê o alvo do clique a partir dos atributos data-* do elemento. */
function parseHit(el: Element | null): Hit | null {
  if (!el) return null;
  const d = (el as SVGElement).dataset;
  const pieceId = d.piece;
  if (!pieceId) return null;
  const index = Number(d.index);
  switch (d.hit) {
    case "piece":
      return { kind: "piece", pieceId };
    case "point":
      return d.point ? { kind: "point", pieceId, pointId: d.point } : null;
    case "segment":
      return Number.isInteger(index) ? { kind: "segment", pieceId, index } : null;
    case "handle":
      return Number.isInteger(index) && (d.handle === "c1" || d.handle === "c2")
        ? { kind: "handle", pieceId, index, handle: d.handle }
        : null;
    default:
      return null;
  }
}

function fitViewport(doc: PatternDocument, size: { w: number; h: number }): Viewport {
  const pts = doc.pieces.flatMap((p) => seamAllowanceOutline(p));
  if (pts.length === 0) return { cx: 0, cy: 0, scale: 1 };
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const margin = 40; // px
  const scale = Math.min(
    (size.w - margin * 2) / Math.max(maxX - minX, 1),
    (size.h - margin * 2) / Math.max(maxY - minY, 1),
  );
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, scale: clamp(scale, MIN_SCALE, MAX_SCALE) };
}

function centroid(points: Record<string, Point>): Point {
  const list = Object.values(points);
  const n = Math.max(list.length, 1);
  return { x: list.reduce((s, p) => s + p.x, 0) / n, y: list.reduce((s, p) => s + p.y, 0) / n };
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
