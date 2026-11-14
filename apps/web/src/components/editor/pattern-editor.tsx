"use client";

import {
  addRectPiece,
  applyGrade,
  linearStep,
  moveHandle,
  movePoint,
  removePiece,
  removePoint,
  renamePiece,
  seamAllowanceOutline,
  segmentLengths,
  setBaseSize,
  setEdgeSeamAllowance,
  setPointGrading,
  setPointStepGrading,
  setSeamAllowance,
  setSizes,
  splitSegment,
  toggleCurve,
  translatePiece,
  validatePattern,
  type PatternDocument,
  type Piece,
  type Point,
} from "@alinhavo/geometry";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCm } from "@/lib/units";
import { ui } from "../ui";
import { PatternCanvas, type DragTarget, type Selection } from "./canvas";
import { ExportMenu } from "./export-menu";
import { CmField, TextField } from "../fields";
import { useHistory } from "./use-history";

export type SaveResult = { ok: true; version: number } | { ok: false; error: string };

/** Grade da tabela de medidas ligada ao molde. */
export type ChartGrade = { name: string; sizes: string[]; baseSize: string | null };

type Props = {
  initialDocument: PatternDocument;
  title: string;
  /** Ex.: "Versão 3". */
  subtitle?: string;
  readOnly?: boolean;
  /** Sem onSave, o editor funciona só no navegador (modo demonstração). */
  onSave?: (doc: PatternDocument, message: string) => Promise<SaveResult>;
  /** Tabela de medidas ligada ao molde: o editor oferece adotar a grade dela. */
  chartGrade?: ChartGrade | null;
};

const snapMm = (v: number) => Math.round(v); // arrastar encaixa no mm inteiro

export function PatternEditor({ initialDocument, title, subtitle, readOnly = false, onSave, chartGrade = null }: Props) {
  const history = useHistory(initialDocument);
  const doc = history.value;
  const [selection, setSelection] = useState<Selection>(null);
  const [fitKey, setFitKey] = useState(0);
  const [saved, setSaved] = useState<PatternDocument>(initialDocument);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [message, setMessage] = useState("");
  const [viewSizeChoice, setViewSize] = useState<string | null>(null);
  const [showGrade, setShowGrade] = useState(false);
  const dragStart = useRef<PatternDocument | null>(null);
  const viewSize = viewSizeChoice && doc.sizes.includes(viewSizeChoice) ? viewSizeChoice : doc.baseSize;
  const viewingBase = viewSize === doc.baseSize;

  const dirty = doc !== saved;
  const errors = useMemo(() => validatePattern(doc), [doc]);

  // Seleção some se o item deixou de existir (desfazer, apagar).
  const sel = useMemo<Selection>(() => {
    if (!selection) return null;
    const piece = doc.pieces.find((p) => p.id === selection.pieceId);
    if (!piece) return null;
    if (selection.kind === "point" && !(selection.pointId in piece.points)) return { kind: "piece", pieceId: piece.id };
    if (selection.kind === "segment" && selection.index >= piece.outline.length) return { kind: "piece", pieceId: piece.id };
    return selection;
  }, [selection, doc]);
  const piece = sel ? doc.pieces.find((p) => p.id === sel.pieceId) : undefined;

  // Avisa antes de sair com alterações não salvas.
  useEffect(() => {
    if (!dirty || !onSave) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, onSave]);

  const apply = useCallback(
    (next: PatternDocument) => {
      if (readOnly) return;
      setStatus(null);
      history.apply(next);
    },
    [history, readOnly],
  );

  // Atalhos de teclado (fora de campos de texto).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        history.redo();
      } else if ((e.key === "Delete" || e.key === "Backspace") && sel?.kind === "point" && !readOnly && viewingBase) {
        e.preventDefault();
        history.apply(removePoint(history.value, sel.pieceId, sel.pointId));
      } else if (e.key === "Escape") {
        setSelection(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history, sel, readOnly, viewingBase]);

  // ---- arrastar ----
  const onDragStart = useCallback(() => {
    dragStart.current = history.value;
  }, [history.value]);

  const onDragMove = useCallback(
    (t: DragTarget, d: Point) => {
      const base = dragStart.current;
      if (!base || readOnly) return;
      const p = base.pieces.find((x) => x.id === t.pieceId);
      if (!p) return;
      if (t.kind === "point") {
        const from = p.points[t.pointId]!;
        history.preview(movePoint(base, t.pieceId, t.pointId, { x: snapMm(from.x + d.x), y: snapMm(from.y + d.y) }));
      } else if (t.kind === "handle") {
        const seg = p.outline[t.index];
        if (seg?.kind !== "cubic") return;
        const from = seg[t.handle];
        history.preview(moveHandle(base, t.pieceId, t.index, t.handle, { x: snapMm(from.x + d.x), y: snapMm(from.y + d.y) }));
      } else {
        history.preview(translatePiece(base, t.pieceId, { x: snapMm(d.x), y: snapMm(d.y) }));
      }
    },
    [history, readOnly],
  );

  const onDragEnd = useCallback(() => {
    if (dragStart.current) history.commit(dragStart.current);
    dragStart.current = null;
    setStatus(null);
  }, [history]);

  async function save() {
    if (!onSave || errors.length > 0 || saving) return;
    setSaving(true);
    setStatus(null);
    const result = await onSave(doc, message);
    setSaving(false);
    if (result.ok) {
      setSaved(doc);
      setMessage("");
      setStatus({ tone: "ok", text: `Versão ${result.version} salva.` });
    } else {
      setStatus({ tone: "error", text: result.error });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-xs text-tinta-suave">
            {subtitle}
            {subtitle && " · "}
            {readOnly
              ? "Somente leitura"
              : !onSave
                ? "Demonstração: nada é salvo"
                : dirty
                  ? "Alterações não salvas"
                  : "Tudo salvo"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={ui.buttonGhost} onClick={history.undo} disabled={!history.canUndo || readOnly} title="Ctrl+Z">
            Desfazer
          </button>
          <button type="button" className={ui.buttonGhost} onClick={history.redo} disabled={!history.canRedo || readOnly} title="Ctrl+Y">
            Refazer
          </button>
          <button type="button" className={ui.buttonGhost} onClick={() => setFitKey((k) => k + 1)}>
            Enquadrar
          </button>
          <ExportMenu
            doc={doc}
            title={title}
            disabledReason={
              doc.pieces.length === 0
                ? "Crie pelo menos uma parte para exportar."
                : errors.length > 0
                  ? "Corrija os erros do molde antes de exportar."
                  : null
            }
          />
          <label className="flex items-center gap-1 text-sm">
            <span className="sr-only">Tamanho na tela</span>
            <select
              className="rounded-md border border-tinta/20 bg-white px-2 py-1.5 text-sm"
              value={viewSize}
              onChange={(e) => setViewSize(e.target.value)}
              aria-label="Tamanho na tela"
            >
              {doc.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                  {s === doc.baseSize ? " (base)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={showGrade} onChange={(e) => setShowGrade(e.target.checked)} />
            Sobrepor grade
          </label>
        </div>
      </div>
      {!viewingBase && (
        <p className="rounded-md bg-papel-escuro px-3 py-2 text-xs text-tinta" role="status">
          Vendo o tamanho <strong>{viewSize}</strong>, só para consulta. Para editar pontos, volte ao base{" "}
          <button type="button" className="underline" onClick={() => setViewSize(doc.baseSize)}>
            {doc.baseSize}
          </button>
          .
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
        <div className="h-[60vh] min-h-[22rem] overflow-hidden rounded-lg border border-tinta/15 lg:h-[calc(100vh-12rem)]">
          <PatternCanvas
            doc={doc}
            viewSize={viewSize}
            showGrade={showGrade}
            selection={sel}
            readOnly={readOnly}
            fitKey={fitKey}
            onSelect={setSelection}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
        </div>

        <aside className="space-y-4 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto" aria-label="Propriedades">
          {!piece && (
            <GradePanel
              doc={doc}
              readOnly={readOnly}
              onSizes={(sizes) => {
                const next = setSizes(doc, sizes);
                if (next === doc) return false;
                apply(next);
                return true;
              }}
              onBase={(base) => apply(setBaseSize(doc, base))}
              chartGrade={chartGrade}
              onApplyChart={(grade) => {
                if (!grade.baseSize) return "A tabela de medidas ainda não tem tamanho base.";
                const r = applyGrade(doc, grade.sizes, grade.baseSize);
                if ("error" in r) return r.error;
                apply(r.doc);
                return null;
              }}
            />
          )}

          {!piece && (
            <PiecesPanel
              doc={doc}
              readOnly={readOnly}
              onSelect={(id) => setSelection({ kind: "piece", pieceId: id })}
              onAdd={(name, w, h) => {
                const { doc: next, pieceId } = addRectPiece(doc, { name, width: w, height: h, origin: freeSpot(doc) });
                apply(next);
                setSelection({ kind: "piece", pieceId });
                setFitKey((k) => k + 1);
              }}
            />
          )}

          {piece && sel && (
            <div className={`${ui.card} space-y-4 p-4`}>
              <div className="flex items-center justify-between gap-2">
                <button type="button" className="text-xs text-tinta-suave hover:text-tinta" onClick={() => setSelection(null)}>
                  ← Todas as partes
                </button>
                <span className="text-xs text-tinta-suave">{piece.outline.length} segmentos</span>
              </div>

              {sel.kind === "piece" && (
                <PieceInspector
                  piece={piece}
                  readOnly={readOnly}
                  onRename={(n) => apply(renamePiece(doc, piece.id, n))}
                  onSeam={(mm) => apply(setSeamAllowance(doc, piece.id, mm))}
                  onSelectSegment={(i) => setSelection({ kind: "segment", pieceId: piece.id, index: i })}
                  onRemove={() => {
                    apply(removePiece(doc, piece.id));
                    setSelection(null);
                  }}
                />
              )}

              {sel.kind === "point" && (
                <PointInspector
                  piece={piece}
                  pointId={sel.pointId}
                  readOnly={readOnly || !viewingBase}
                  onMove={(p) => apply(movePoint(doc, piece.id, sel.pointId, p))}
                  onRemove={() => apply(removePoint(doc, piece.id, sel.pointId))}
                />
              )}

              {sel.kind === "point" && (
                <PointGrading
                  doc={doc}
                  piece={piece}
                  pointId={sel.pointId}
                  readOnly={readOnly}
                  onStep={(step) => apply(setPointStepGrading(doc, piece.id, sel.pointId, step))}
                  onSize={(size, delta) => apply(setPointGrading(doc, piece.id, sel.pointId, size, delta))}
                />
              )}

              {sel.kind === "segment" && (
                <SegmentInspector
                  piece={piece}
                  index={sel.index}
                  readOnly={readOnly}
                  onToggle={() => apply(toggleCurve(doc, piece.id, sel.index))}
                  onSplit={() => {
                    const { doc: next, pointId } = splitSegment(doc, piece.id, sel.index);
                    apply(next);
                    if (pointId) setSelection({ kind: "point", pieceId: piece.id, pointId });
                  }}
                  onSeam={(mm) => apply(setEdgeSeamAllowance(doc, piece.id, sel.index, mm))}
                />
              )}
            </div>
          )}

          {errors.length > 0 && (
            <div className={ui.error} role="alert">
              <p className="font-medium">Corrija antes de salvar:</p>
              <ul className="mt-1 list-disc pl-4">
                {errors.slice(0, 5).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {onSave && !readOnly && (
            <div className={`${ui.card} space-y-3 p-4`}>
              <label className="block text-xs">
                <span className="font-medium">Descrição da versão (opcional)</span>
                <input
                  className={`${ui.input} text-sm`}
                  value={message}
                  maxLength={500}
                  placeholder="Ex.: barra +4 cm depois da prova"
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>
              <button type="button" className={`${ui.buttonPrimary} w-full`} onClick={save} disabled={!dirty || saving || errors.length > 0}>
                {saving ? "Salvando…" : "Salvar nova versão"}
              </button>
            </div>
          )}

          {status && (
            <p className={status.tone === "ok" ? ui.success : ui.error} role={status.tone === "ok" ? "status" : "alert"}>
              {status.text}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function PiecesPanel({
  doc,
  readOnly,
  onSelect,
  onAdd,
}: {
  doc: PatternDocument;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onAdd: (name: string, widthMm: number, heightMm: number) => void;
}) {
  const [name, setName] = useState("");
  const [w, setW] = useState<number | null>(200);
  const [h, setH] = useState<number | null>(600);
  return (
    <div className="space-y-4">
      <div className={`${ui.card} p-4`}>
        <h2 className="text-sm font-medium">Partes</h2>
        {doc.pieces.length === 0 ? (
          <p className="mt-2 text-xs text-tinta-suave">Nenhuma parte ainda. Comece por um retângulo e ajuste os pontos.</p>
        ) : (
          <ul className="mt-2 divide-y divide-tinta/10">
            {doc.pieces.map((p) => (
              <li key={p.id}>
                <button type="button" className="flex w-full items-center justify-between py-2 text-left text-sm hover:text-linha" onClick={() => onSelect(p.id)}>
                  <span>{p.name}</span>
                  <span className="text-xs text-tinta-suave">{Object.keys(p.points).length} pontos</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-tinta-suave">
          Grade: {doc.sizes.join(", ")} · base {doc.baseSize}
        </p>
      </div>

      {!readOnly && (
        <form
          className={`${ui.card} space-y-3 p-4`}
          onSubmit={(e) => {
            e.preventDefault();
            if (!w || !h) return;
            onAdd(name || `Parte ${doc.pieces.length + 1}`, w, h);
            setName("");
          }}
        >
          <h2 className="text-sm font-medium">Nova parte</h2>
          <label className="block text-xs">
            <span className="font-medium">Nome</span>
            <input className={`${ui.input} text-sm`} value={name} maxLength={120} placeholder="Ex.: Frente" onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <CmField label="Largura" valueMm={w} min={10} max={3000} onCommit={setW} />
            <CmField label="Altura" valueMm={h} min={10} max={3000} onCommit={setH} />
          </div>
          <button type="submit" className={`${ui.buttonPrimary} w-full`}>
            Criar retângulo
          </button>
        </form>
      )}
    </div>
  );
}

function PieceInspector({
  piece,
  readOnly,
  onRename,
  onSeam,
  onSelectSegment,
  onRemove,
}: {
  piece: Piece;
  readOnly: boolean;
  onRename: (n: string) => void;
  onSeam: (mm: number) => void;
  onSelectSegment: (i: number) => void;
  onRemove: () => void;
}) {
  const lengths = segmentLengths(piece);
  const cut = seamAllowanceOutline(piece);
  return (
    <div className="space-y-4">
      <TextField key={`nome-${piece.id}-${piece.name}`} label="Nome da parte" value={piece.name} disabled={readOnly} onCommit={onRename} />
      <CmField
        key={`margem-${piece.id}-${piece.seamAllowance}`}
        label="Margem de costura padrão"
        valueMm={piece.seamAllowance}
        min={0}
        max={100}
        disabled={readOnly}
        onCommit={(mm) => mm !== null && onSeam(mm)}
      />
      <div>
        <h3 className="text-xs font-medium">Segmentos</h3>
        <ul className="mt-1 divide-y divide-tinta/10 text-sm">
          {piece.outline.map((seg, i) => (
            <li key={i}>
              <button type="button" className="flex w-full justify-between py-1.5 text-left hover:text-linha" onClick={() => onSelectSegment(i)}>
                <span>
                  {i + 1}. {seg.kind === "cubic" ? "curva" : "reta"}
                  {piece.seamAllowanceByEdge?.[i] !== undefined && <span className="text-xs text-linha"> · margem própria</span>}
                </span>
                <span className="font-mono text-xs">{formatCm(lengths[i] ?? 0)} cm</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-tinta-suave">Contorno de corte com {cut.length} vértices.</p>
      </div>
      {!readOnly && (
        <button type="button" className={`${ui.buttonGhost} w-full text-linha`} onClick={onRemove}>
          Apagar parte
        </button>
      )}
    </div>
  );
}

function PointInspector({
  piece,
  pointId,
  readOnly,
  onMove,
  onRemove,
}: {
  piece: Piece;
  pointId: string;
  readOnly: boolean;
  onMove: (p: Point) => void;
  onRemove: () => void;
}) {
  const p = piece.points[pointId]!;
  const canRemove = piece.outline.length > 3;
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Ponto <strong className="font-mono">{pointId}</strong> de {piece.name}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <CmField key={`x-${p.x}`} label="Horizontal (X)" valueMm={p.x} disabled={readOnly} onCommit={(mm) => mm !== null && onMove({ x: mm, y: p.y })} />
        <CmField key={`y-${p.y}`} label="Vertical (Y)" valueMm={p.y} disabled={readOnly} onCommit={(mm) => mm !== null && onMove({ x: p.x, y: mm })} />
      </div>
      {!readOnly && (
        <button type="button" className={`${ui.buttonGhost} w-full`} onClick={onRemove} disabled={!canRemove} title="Delete">
          {canRemove ? "Apagar ponto" : "A parte precisa de pelo menos 3 pontos"}
        </button>
      )}
    </div>
  );
}

function SegmentInspector({
  piece,
  index,
  readOnly,
  onToggle,
  onSplit,
  onSeam,
}: {
  piece: Piece;
  index: number;
  readOnly: boolean;
  onToggle: () => void;
  onSplit: () => void;
  onSeam: (mm: number | null) => void;
}) {
  const seg = piece.outline[index]!;
  const len = segmentLengths(piece)[index] ?? 0;
  const own = piece.seamAllowanceByEdge?.[index] ?? null;
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Segmento {index + 1} de {piece.name}: <strong>{seg.kind === "cubic" ? "curva" : "reta"}</strong>, {formatCm(len)} cm
      </p>
      {!readOnly && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={ui.buttonGhost} onClick={onToggle}>
            {seg.kind === "cubic" ? "Virar reta" : "Virar curva"}
          </button>
          <button type="button" className={ui.buttonGhost} onClick={onSplit}>
            Inserir ponto
          </button>
        </div>
      )}
      <CmField
        key={`seg-${index}-${own}`}
        label="Margem deste segmento"
        valueMm={own}
        allowEmpty
        min={0}
        max={100}
        placeholder={`padrão: ${formatCm(piece.seamAllowance)}`}
        disabled={readOnly}
        onCommit={onSeam}
      />
      {seg.kind === "cubic" && !readOnly && <p className="text-xs text-tinta-suave">Arraste os quadradinhos vermelhos para ajustar a curva.</p>}
    </div>
  );
}

function GradePanel({
  doc,
  readOnly,
  onSizes,
  onBase,
  chartGrade,
  onApplyChart,
}: {
  doc: PatternDocument;
  readOnly: boolean;
  /** Devolve false se a grade foi recusada. */
  onSizes: (sizes: string[]) => boolean;
  onBase: (base: string) => void;
  chartGrade: ChartGrade | null;
  /** Devolve o motivo se não deu para adotar a grade da tabela. */
  onApplyChart: (grade: ChartGrade) => string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const differsFromChart =
    chartGrade !== null &&
    (chartGrade.baseSize !== doc.baseSize ||
      chartGrade.sizes.length !== doc.sizes.length ||
      chartGrade.sizes.some((s, i) => s !== doc.sizes[i]));
  return (
    <div className={`${ui.card} space-y-3 p-4`}>
      <h2 className="text-sm font-medium">Grade de tamanhos</h2>
      {chartGrade && (
        <div className="rounded-md bg-papel-escuro px-3 py-2 text-xs">
          <p>
            Tabela ligada: <strong>{chartGrade.name}</strong> ({chartGrade.sizes.join(", ")}
            {chartGrade.baseSize ? `; base ${chartGrade.baseSize}` : ""})
          </p>
          {differsFromChart && !readOnly && (
            <button
              type="button"
              className="mt-1 underline"
              onClick={() => setError(onApplyChart(chartGrade))}
            >
              Usar a grade da tabela
            </button>
          )}
          {!differsFromChart && <p className="mt-1 text-tinta-suave">O molde já usa esta grade.</p>}
        </div>
      )}
      <TextField
        key={doc.sizes.join(",")}
        label="Tamanhos, do menor ao maior"
        value={doc.sizes.join(", ")}
        disabled={readOnly}
        onCommit={(text) => {
          const sizes = text.split(/[,;\s]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);
          const ok = onSizes(sizes);
          setError(
            ok
              ? null
              : `A grade precisa incluir o tamanho base (${doc.baseSize}) e não pode repetir tamanhos.`,
          );
        }}
      />
      {error && <p className="text-xs text-linha">{error}</p>}
      <label className="block text-xs">
        <span className="font-medium">Tamanho base (o que você desenha)</span>
        <select
          className={`${ui.input} text-sm`}
          value={doc.baseSize}
          disabled={readOnly}
          onChange={(e) => onBase(e.target.value)}
        >
          {doc.sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-tinta-suave">
        Trocar o base não muda nenhum tamanho: só passa a desenhar a partir dele.
      </p>
    </div>
  );
}

function PointGrading({
  doc,
  piece,
  pointId,
  readOnly,
  onStep,
  onSize,
}: {
  doc: PatternDocument;
  piece: Piece;
  pointId: string;
  readOnly: boolean;
  onStep: (step: Point) => void;
  onSize: (size: string, delta: Point | null) => void;
}) {
  const step = linearStep(piece, pointId, doc.sizes, doc.baseSize);
  const deltas = piece.grading?.[pointId] ?? {};
  const others = doc.sizes.filter((s) => s !== doc.baseSize);
  if (others.length === 0) return null;

  return (
    <div className="space-y-3 border-t border-tinta/10 pt-4">
      <h3 className="text-xs font-medium">Gradação do ponto {pointId}</h3>
      {step ? (
        <div className="grid grid-cols-2 gap-2">
          <CmField
            key={`sx-${pointId}-${step.x}`}
            label="Anda por tamanho (X)"
            valueMm={step.x}
            min={-200}
            max={200}
            disabled={readOnly}
            onCommit={(mm) => mm !== null && onStep({ x: mm, y: step.y })}
          />
          <CmField
            key={`sy-${pointId}-${step.y}`}
            label="Anda por tamanho (Y)"
            valueMm={step.y}
            min={-200}
            max={200}
            disabled={readOnly}
            onCommit={(mm) => mm !== null && onStep({ x: step.x, y: mm })}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-tinta-suave">Gradação irregular (cada tamanho com seu valor).</span>
          {!readOnly && (
            <button type="button" className="underline" onClick={() => onStep({ x: 0, y: 0 })}>
              Zerar
            </button>
          )}
        </div>
      )}
      <table className="w-full table-fixed text-xs">
        <thead>
          <tr className="text-left text-tinta-suave">
            <th className="w-16 py-1 pr-2 font-normal">Tamanho</th>
            <th className="py-1 pr-1 font-normal">X (cm)</th>
            <th className="py-1 font-normal">Y (cm)</th>
          </tr>
        </thead>
        <tbody>
          {doc.sizes.map((s) => {
            const d = deltas[s] ?? { x: 0, y: 0 };
            if (s === doc.baseSize) {
              return (
                <tr key={s} className="text-tinta-suave">
                  <td className="py-1 pr-2">{s} (base)</td>
                  <td className="px-3 py-1 font-mono">0</td>
                  <td className="px-3 py-1 font-mono">0</td>
                </tr>
              );
            }
            return (
              <tr key={s}>
                <td className="py-1 pr-2">{s}</td>
                <td className="pr-1">
                  <CmField
                    key={`${s}-x-${d.x}`}
                    label={`${s}, X`}
                    hideLabel
                    valueMm={d.x}
                    min={-500}
                    max={500}
                    disabled={readOnly}
                    onCommit={(mm) => mm !== null && onSize(s, { x: mm, y: d.y })}
                  />
                </td>
                <td>
                  <CmField
                    key={`${s}-y-${d.y}`}
                    label={`${s}, Y`}
                    hideLabel
                    valueMm={d.y}
                    min={-500}
                    max={500}
                    disabled={readOnly}
                    onCommit={(mm) => mm !== null && onSize(s, { x: d.x, y: mm })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Lugar livre para uma parte nova: à direita da última. */
function freeSpot(doc: PatternDocument): Point {
  const xs = doc.pieces.flatMap((p) => Object.values(p.points).map((q) => q.x));
  return { x: xs.length ? Math.round(Math.max(...xs) + 80) : 0, y: 0 };
}
