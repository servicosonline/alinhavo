"use client";

import {
  addFinish,
  addRectPiece,
  addSeam,
  applyGrade,
  applyShrinkageCompensation,
  BODY_ANCHORS,
  BODY_SIDES,
  flipSeam,
  linearStep,
  removeFinish,
  removeSeam,
  seamAt,
  seamIssuesAcrossSizes,
  updateFinish,
  seamLengths,
  setCutPair,
  setFold,
  setGrainlineAngle,
  setPlacement,
  setSegmentLength,
  type BodyAnchor,
  type BodyLeg,
  type BodySide,
  type PiecePlacement,
  type Seam,
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
import Link from "next/link";
import { BrandSymbol } from "../brand-mark";
import { ModuleIcon, type ModuleIconName } from "../icons";
import { ui } from "../ui";
import { PatternCanvas, type DragTarget, type Selection } from "./canvas";
import { ExportMenu } from "./export-menu";
import { FinishesPanel } from "./finishes-panel";
import { GradePresetChips, SeamPresetChips } from "./presets";
import { ProvaSide, type SideProva } from "./prova-side";
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
  /** Abre a Prova 3D com o documento atual. Sem ele, o botão "Provar" não aparece. */
  onTryOn?: (doc: PatternDocument) => void;
  /** Trilha na barra do editor ("Verão 27 › Saia evasê › Molde v4", marca/README.md §9). */
  trail?: React.ReactNode;
  /** Trilho de ícones à esquerda (os módulos ao redor do molde). */
  rail?: EditorRailItem[];
  /** "Pedir aprovação" na barra (leva à Prova, onde a aprovação é pedida). */
  approvalHref?: string;
  /** Prova 3D ao lado do editor (tela dividida). Sem ela, o botão "Prova ao lado" não aparece. */
  sideProva?: SideProva;
  /** Composição do tecido do produto ligado (etiqueta de composição pronta). Sem ela, a etiqueta pronta fica desligada. */
  fabricComposition?: string | null;
  /** Exportar fora do plano: o aviso no lugar do menu (sem ele, exporta). */
  exportLocked?: string | null;
};

/** Na tela dividida, o painel da direita mostra as propriedades do molde ou os controles da Prova. */
type SideTab = "molde" | "prova";

export type EditorRailItem = { icon: ModuleIconName; label: string; href?: string; active?: boolean };

/** Costuras cujos dois lados não têm o mesmo comprimento (mais de 0,5 mm), no base ou nos tamanhos da grade. */
function openSeams(doc: PatternDocument): string[] {
  const out: string[] = [];
  const issues = seamIssuesAcrossSizes(doc, 0.5);
  for (const issue of issues) {
    const seam = doc.seams.find((s) => s.id === issue.seamId);
    if (!seam) continue;
    const a = doc.pieces.find((p) => p.id === seam.a.piece)?.name ?? "";
    const b = doc.pieces.find((p) => p.id === seam.b.piece)?.name ?? "";
    const baseLen = issue.bySize[doc.baseSize];
    const otherSizes = Object.keys(issue.bySize).filter((s) => s !== doc.baseSize);
    if (baseLen) {
      const gradeSuffix = otherSizes.length > 0 ? ` (e em ${otherSizes.join(", ")})` : "";
      out.push(`A costura ${seamNumber(doc, seam)} não fecha: ${a} ${formatCm(baseLen.a)} cm, ${b} ${formatCm(baseLen.b)} cm${gradeSuffix}.`);
    } else if (otherSizes.length > 0) {
      const firstSize = otherSizes[0]!;
      const l = issue.bySize[firstSize]!;
      out.push(
        `A costura ${seamNumber(doc, seam)} abre na grade (${otherSizes.join(", ")}): em ${firstSize}, ${a} ${formatCm(l.a)} cm e ${b} ${formatCm(l.b)} cm.`,
      );
    }
  }
  return out;
}

const snapMm = (v: number) => Math.round(v); // arrastar encaixa no mm inteiro

export function PatternEditor({ initialDocument, title, subtitle, readOnly = false, onSave, chartGrade = null, onTryOn, trail, rail, approvalHref, sideProva, fabricComposition = null, exportLocked = null }: Props) {
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
  /** Segmento esperando o par para virar costura ("Costurar com…"). */
  const [sewFrom, setSewFrom] = useState<{ pieceId: string; index: number } | null>(null);
  const dragStart = useRef<PatternDocument | null>(null);
  const [split, setSplit] = useState(false);
  const [sideTab, setSideTab] = useState<SideTab>("molde");
  /** Onde a Prova ao lado põe os controles (elemento do painel da direita). */
  const [provaControls, setProvaControls] = useState<HTMLDivElement | null>(null);
  const viewSize = viewSizeChoice && doc.sizes.includes(viewSizeChoice) ? viewSizeChoice : doc.baseSize;
  const viewingBase = viewSize === doc.baseSize;

  const dirty = doc !== saved;
  const errors = useMemo(() => validatePattern(doc), [doc]);
  const seamAlerts = useMemo(() => openSeams(doc), [doc]);
  const tryOnBlocked =
    errors.length > 0
      ? "Corrija os erros do molde antes de provar."
      : !doc.pieces.some((p) => p.placement)
        ? "Escolha o lado do corpo de pelo menos uma parte (seção Na Prova)."
        : null;

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
        if (sewFrom) setSewFrom(null);
        else setSelection(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history, sel, readOnly, viewingBase, sewFrom]);

  /**
   * Seleção vinda do quadro. No modo "Costurar com…", o próximo segmento
   * clicado vira o outro lado da costura; clicar em outra coisa cancela.
   */
  const onCanvasSelect = useCallback(
    (s: Selection) => {
      if (!sewFrom) {
        setSelection(s);
        return;
      }
      const from = sewFrom;
      setSewFrom(null);
      if (s?.kind !== "segment") {
        setSelection(s);
        return;
      }
      const { doc: next, seamId } = addSeam(history.value, { piece: from.pieceId, segment: from.index }, { piece: s.pieceId, segment: s.index });
      if (seamId) {
        apply(next);
      } else {
        setStatus({
          tone: "error",
          text: "Esse segmento não pode ser costurado: é o mesmo (use Costurar com o par numa parte de cortar par), é dobra ou já está em outra costura.",
        });
      }
      setSelection({ kind: "segment", pieceId: from.pieceId, index: from.index });
    },
    [sewFrom, history.value, apply],
  );

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
    // Moldura da prancha "Produto" do manual (marca/README.md §9): barra com a trilha e a ação principal,
    // ferramentas, trilho de ícones à esquerda, o papel no centro e o painel de propriedades à direita.
    <div className="overflow-hidden rounded-2xl border border-tinta/10 bg-white shadow-[0_24px_50px_-36px_rgb(29_27_24/0.45)]" data-editor>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-tinta/10 px-4 py-3">
        <BrandSymbol className="hidden size-7 shrink-0 sm:block" />
        <div className="min-w-0 flex-1">
          {trail && <div className="truncate text-xs text-tinta-suave">{trail}</div>}
          <h1 className="flex min-w-0 items-baseline gap-2">
            <span className="truncate font-display text-lg font-semibold tracking-tight">{title}</span>
            {subtitle && <span className="shrink-0 font-mono text-xs font-normal text-tinta-suave">{subtitle.replace(/^Versão /, "v")}</span>}
            <span className="hidden shrink-0 text-xs font-normal text-tinta-suave sm:inline">
              ·{" "}
              {readOnly
                ? "Somente leitura"
                : !onSave
                  ? "Demonstração: nada é salvo"
                  : dirty
                    ? "Alterações não salvas"
                    : "Tudo salvo"}
            </span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {approvalHref && (
            <Link href={approvalHref} className={ui.buttonGhost} data-pedir-aprovacao>
              Pedir aprovação
            </Link>
          )}
          {onTryOn && (
            <button
              type="button"
              className={`${ui.buttonPrimary} py-1.5`}
              onClick={() => onTryOn(doc)}
              disabled={tryOnBlocked !== null}
              title={tryOnBlocked ?? "Ver o molde costurado no manequim"}
            >
              <ModuleIcon name="prova" className="size-4" />
              Provar
            </button>
          )}
          {sideProva && (
            <button
              type="button"
              // Tela dividida só a partir do lg; no celular a Prova iria para baixo do molde.
              className={`${ui.buttonGhost} max-lg:hidden`}
              aria-pressed={split}
              data-split-toggle
              onClick={() => {
                setSplit(!split);
                setSideTab(split ? "molde" : "prova");
                // Enquadra depois que o quadro mudou de largura.
                requestAnimationFrame(() => setFitKey((k) => k + 1));
              }}
              title="Editar o molde e ver a Prova 3D lado a lado"
            >
              {split ? "Fechar a Prova" : "Prova ao lado"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-tinta/10 bg-papel/60 px-4 py-2" role="toolbar" aria-label="Ferramentas do molde">
        <button type="button" className={ui.buttonGhost} onClick={history.undo} disabled={!history.canUndo || readOnly} title="Ctrl+Z">
          Desfazer
        </button>
        <button type="button" className={ui.buttonGhost} onClick={history.redo} disabled={!history.canRedo || readOnly} title="Ctrl+Y">
          Refazer
        </button>
        <button type="button" className={ui.buttonGhost} onClick={() => setFitKey((k) => k + 1)}>
          Enquadrar
        </button>
        <span className="mx-1 hidden h-6 w-px bg-tinta/15 sm:block" aria-hidden="true" />
        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-tinta-suave">Tamanho</span>
          <select className={ui.select} value={viewSize} onChange={(e) => setViewSize(e.target.value)} aria-label="Tamanho na tela">
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
        <div className="ml-auto">
          <ExportMenu
            doc={doc}
            title={title}
            disabledReason={
              exportLocked
                ? exportLocked
                : doc.pieces.length === 0
                ? "Crie pelo menos uma parte para exportar."
                : errors.length > 0
                  ? "Corrija os erros do molde antes de exportar."
                  : null
            }
          />
        </div>
      </div>
      {sewFrom && (
        <p className="flex flex-wrap items-center justify-between gap-2 border-b border-tinta/10 bg-costura/10 px-4 py-2 text-xs text-tinta" role="status">
          <span>
            Clique no segmento que será costurado com o segmento {sewFrom.index + 1} de{" "}
            <strong>{doc.pieces.find((p) => p.id === sewFrom.pieceId)?.name}</strong>. Esc cancela.
          </span>
          <button type="button" className="underline" onClick={() => setSewFrom(null)}>
            Cancelar
          </button>
        </p>
      )}
      {!viewingBase && (
        <p className="border-b border-tinta/10 bg-papel-escuro px-4 py-2 text-xs text-tinta" role="status">
          Vendo o tamanho <strong>{viewSize}</strong>, só para consulta. Para editar pontos, volte ao base{" "}
          <button type="button" className="underline" onClick={() => setViewSize(doc.baseSize)}>
            {doc.baseSize}
          </button>
          .
        </p>
      )}

      <div
        className={`grid ${
          rail?.length
            ? split
              ? "lg:grid-cols-[3.5rem_1fr_1fr_21rem]"
              : "lg:grid-cols-[3.5rem_1fr_21rem]"
            : split
              ? "lg:grid-cols-[1fr_1fr_21rem]"
              : "lg:grid-cols-[1fr_21rem]"
        }`}
        data-split={split ? "on" : "off"}
      >
        {rail && rail.length > 0 && (
          <nav aria-label="Módulos" className="hidden border-r border-tinta/10 py-3 lg:block">
            <ul className="flex flex-col items-center gap-2">
              {rail.map((r) => {
                const cls = `grid size-10 place-items-center rounded-xl transition ${r.active ? "bg-linha/10 text-linha" : "text-tinta hover:bg-papel hover:text-linha"}`;
                return (
                  <li key={r.label}>
                    {r.href && !r.active ? (
                      <Link href={r.href} className={cls} title={r.label} aria-label={r.label}>
                        <ModuleIcon name={r.icon} className="size-6" />
                      </Link>
                    ) : (
                      <span className={cls} title={r.label} aria-label={r.label} aria-current={r.active ? "page" : undefined} role="img">
                        <ModuleIcon name={r.icon} className="size-6" />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
        <div className="h-[60vh] min-h-[22rem] overflow-hidden lg:h-[calc(100vh-15rem)]">
          <PatternCanvas
            doc={doc}
            viewSize={viewSize}
            showGrade={showGrade}
            selection={sel}
            readOnly={readOnly}
            fitKey={fitKey}
            sewing={sewFrom !== null}
            onSelect={onCanvasSelect}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
        </div>

        {split && sideProva && (
          <div className="border-t border-tinta/10 lg:border-t-0 lg:border-l">
            <ProvaSide
              doc={doc}
              ready={tryOnBlocked === null}
              notReady={tryOnBlocked ?? ""}
              readOnly={readOnly}
              prova={sideProva}
              controlsTarget={provaControls}
              onApply={apply}
            />
          </div>
        )}

        <aside className="space-y-4 border-t border-tinta/10 bg-white p-4 lg:max-h-[calc(100vh-15rem)] lg:overflow-y-auto lg:border-t-0 lg:border-l" aria-label="Propriedades">
          {split && (
            <div className="grid grid-cols-2 gap-1" role="tablist" aria-label="Painel">
              {(["molde", "prova"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={sideTab === t}
                  data-side-tab={t}
                  className={`rounded-md border px-2 py-1.5 text-sm ${sideTab === t ? "border-tinta bg-tinta text-papel" : "border-tinta/20 hover:bg-papel-escuro"}`}
                  onClick={() => setSideTab(t)}
                >
                  {t === "molde" ? "Molde" : "Prova"}
                </button>
              ))}
            </div>
          )}
          {split && <div ref={setProvaControls} className={sideTab === "prova" ? "" : "hidden"} data-prova-controls />}
          <div className={split && sideTab === "prova" ? "hidden" : "space-y-4"}>
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
                  doc={doc}
                  piece={piece}
                  readOnly={readOnly}
                  onRename={(n) => apply(renamePiece(doc, piece.id, n))}
                  onSeam={(mm) => apply(setSeamAllowance(doc, piece.id, mm))}
                  onPlacement={(p) => apply(setPlacement(doc, piece.id, p))}
                  onCutPair={(on) => apply(setCutPair(doc, piece.id, on))}
                  onGrainAngle={(deg) => apply(setGrainlineAngle(doc, piece.id, deg))}
                  onShrinkage={(warpPct, weftPct) => apply(applyShrinkageCompensation(doc, warpPct, weftPct, piece.id))}
                  onSelectSegment={(i) => setSelection({ kind: "segment", pieceId: piece.id, index: i })}
                  onRemove={() => {
                    apply(removePiece(doc, piece.id));
                    setSelection(null);
                  }}
                />
              )}

              {sel.kind === "piece" && (
                <FinishesPanel
                  piece={piece}
                  readOnly={readOnly || !viewingBase}
                  composition={fabricComposition}
                  onAdd={(f, edgeAllowanceMm) => {
                    const r = addFinish(doc, piece.id, f);
                    // Margem do segmento junto, numa edição só (o Ctrl+Z desfaz as duas).
                    if (r.finishId) apply(edgeAllowanceMm !== undefined && "segment" in f ? setEdgeSeamAllowance(r.doc, piece.id, f.segment, edgeAllowanceMm) : r.doc);
                    return r.finishId !== null;
                  }}
                  onUpdate={(id, patch) => {
                    const next = updateFinish(doc, piece.id, id, patch);
                    if (next !== doc) apply(next);
                    return next !== doc;
                  }}
                  onRemove={(id) => apply(removeFinish(doc, piece.id, id))}
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
                  doc={doc}
                  piece={piece}
                  index={sel.index}
                  readOnly={readOnly}
                  viewingBase={viewingBase}
                  onStartSew={() => setSewFrom({ pieceId: piece.id, index: sel.index })}
                  onSewPair={() => {
                    const r = addSeam(doc, { piece: piece.id, segment: sel.index }, { piece: piece.id, segment: sel.index });
                    if (r.seamId) apply(r.doc);
                  }}
                  onUnsew={(id) => apply(removeSeam(doc, id))}
                  onFlip={(id) => apply(flipSeam(doc, id))}
                  onFold={(on) => apply(setFold(doc, piece.id, on ? sel.index : null))}
                  onToggle={() => apply(toggleCurve(doc, piece.id, sel.index))}
                  onSplit={() => {
                    const { doc: next, pointId } = splitSegment(doc, piece.id, sel.index);
                    apply(next);
                    if (pointId) setSelection({ kind: "point", pieceId: piece.id, pointId });
                  }}
                  onSeam={(mm) => apply(setEdgeSeamAllowance(doc, piece.id, sel.index, mm))}
                  onLength={(mm) => apply(setSegmentLength(doc, piece.id, sel.index, mm))}
                />
              )}
            </div>
          )}

          {seamAlerts.length > 0 && (
            <div className="space-y-1.5 rounded-xl bg-linha/10 px-3.5 py-3 text-sm text-linha" role="status" data-costura-aberta>
              {seamAlerts.slice(0, 4).map((a) => (
                <p key={a}>{a}</p>
              ))}
              {seamAlerts.length > 4 && <p className="text-xs">E mais {seamAlerts.length - 4}.</p>}
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
          </div>
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
        <h2 className={ui.eyebrow}>Partes</h2>
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
          <h2 className={ui.eyebrow}>Nova parte</h2>
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

/** Número da costura para mostrar (posição na lista, a partir de 1). */
function seamNumber(doc: PatternDocument, seam: Seam): number {
  return doc.seams.findIndex((s) => s.id === seam.id) + 1;
}

const SIDE_LABEL: Record<BodySide, string> = { frente: "Frente", costas: "Costas", esquerda: "Lado esquerdo", direita: "Lado direito" };
const ANCHOR_LABEL: Record<BodyAnchor, string> = { ombro: "Ombro", busto: "Busto", cintura: "Cintura", quadril: "Quadril" };

function PieceInspector({
  doc,
  piece,
  readOnly,
  onRename,
  onSeam,
  onPlacement,
  onCutPair,
  onGrainAngle,
  onShrinkage,
  onSelectSegment,
  onRemove,
}: {
  doc: PatternDocument;
  piece: Piece;
  readOnly: boolean;
  onRename: (n: string) => void;
  onSeam: (mm: number) => void;
  onPlacement: (p: PiecePlacement | null) => void;
  onCutPair: (on: boolean) => void;
  /** Fio em graus a partir do urdume (0° urdume, 90° trama, 45° viés); null tira o fio. */
  onGrainAngle: (deg: number | null) => void;
  /** Amplia a parte para compensar o encolhimento do tecido (% no urdume e % na trama). */
  onShrinkage: (warpPct: number, weftPct: number) => void;
  onSelectSegment: (i: number) => void;
  onRemove: () => void;
}) {
  const lengths = segmentLengths(piece);
  const cut = seamAllowanceOutline(piece);
  const placement = piece.placement;
  const grainDeg = grainAngleOf(piece);
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
      <SeamPresetChips valueMm={piece.seamAllowance} disabled={readOnly} onPick={onSeam} />
      <label className="flex items-start gap-2 text-sm" title={piece.fold !== undefined ? "Parte cortada na dobra não é cortada em par" : undefined}>
        <input
          type="checkbox"
          className="mt-1"
          checked={!!piece.cutPair}
          disabled={readOnly || piece.fold !== undefined}
          onChange={(e) => onCutPair(e.target.checked)}
          data-cut-pair
        />
        <span>
          Cortar par (espelhado)
          <span className="block text-xs text-tinta-suave">
            {piece.fold !== undefined
              ? "Desmarque a dobra para cortar em par."
              : "Duas peças, a segunda espelhada (ex.: frente da calça). Na Prova, uma de cada lado."}
          </span>
        </span>
      </label>
      <fieldset className="space-y-2 border-t border-tinta/10 pt-3">
        <legend className="text-xs font-medium">Na Prova</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs">
            <span>Lado do corpo</span>
            <select
              className={`${ui.input} text-sm`}
              value={placement?.side ?? ""}
              disabled={readOnly}
              onChange={(e) => {
                const side = e.target.value as BodySide | "";
                onPlacement(side ? { side, anchor: placement?.anchor ?? "cintura", offset: placement?.offset ?? 0 } : null);
              }}
            >
              <option value="">Não vai para a Prova</option>
              {BODY_SIDES.map((s) => (
                <option key={s} value={s}>
                  {SIDE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span>Borda de cima na altura do</span>
            <select
              className={`${ui.input} text-sm`}
              value={placement?.anchor ?? "cintura"}
              disabled={readOnly || !placement}
              onChange={(e) => placement && onPlacement({ ...placement, anchor: e.target.value as BodyAnchor })}
            >
              {BODY_ANCHORS.map((a) => (
                <option key={a} value={a}>
                  {ANCHOR_LABEL[a]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {placement && (
          <label className="block text-xs">
            <span>Veste um membro</span>
            <select
              className={`${ui.input} text-sm`}
              value={placement.arm ? `braco:${placement.arm}` : placement.leg ? `perna:${placement.leg}` : ""}
              disabled={readOnly}
              onChange={(e) => {
                const [kind, side] = e.target.value.split(":") as ["perna" | "braco" | "", BodyLeg | undefined];
                const next: PiecePlacement = { ...placement };
                delete next.leg;
                delete next.arm;
                if (kind === "perna" && side) next.leg = side;
                if (kind === "braco" && side) next.arm = side;
                onPlacement(next);
              }}
              data-limb
            >
              <option value="">Nenhum (saia, blusa, corpo)</option>
              <option value="perna:esquerda">Perna esquerda, abaixo do gancho{piece.cutPair ? " (o par veste a direita)" : ""}</option>
              <option value="perna:direita">Perna direita, abaixo do gancho{piece.cutPair ? " (o par veste a esquerda)" : ""}</option>
              <option value="braco:esquerda">Braço esquerdo, manga{piece.cutPair ? " (o par veste o direito)" : ""}</option>
              <option value="braco:direita">Braço direito, manga{piece.cutPair ? " (o par veste o esquerdo)" : ""}</option>
            </select>
          </label>
        )}
        {placement && (
          <CmField
            key={`ajuste-${piece.id}-${placement.offset}`}
            label="Ajuste de altura (sobe com positivo)"
            valueMm={placement.offset}
            min={-1000}
            max={1000}
            disabled={readOnly}
            onCommit={(mm) => onPlacement({ ...placement, offset: mm ?? 0 })}
          />
        )}
      </fieldset>
      <fieldset className="space-y-2 border-t border-tinta/10 pt-3" data-fio>
        <legend className="text-xs font-medium">Fio do tecido</legend>
        <p className="text-xs text-tinta-suave">
          {grainDeg === null ? "Sem fio desenhado (o encaixe usa o vertical)." : `Fio a ${grainDeg}° do urdume.`}
        </p>
        {!readOnly && (
          <div className="grid grid-cols-2 gap-2">
            {GRAIN_PRESETS.map((g) => (
              <button
                key={g.deg}
                type="button"
                className={`${ui.buttonGhost} text-xs`}
                aria-pressed={grainDeg === g.deg}
                onClick={() => onGrainAngle(g.deg)}
                data-grain={g.deg}
              >
                {g.label}
              </button>
            ))}
            {piece.grainline && (
              <button type="button" className={`${ui.buttonGhost} text-xs`} onClick={() => onGrainAngle(null)}>
                Tirar fio
              </button>
            )}
          </div>
        )}
      </fieldset>
      {!readOnly && <ShrinkageCompensation key={piece.id} onApply={onShrinkage} />}
      <div>
        <h3 className={ui.eyebrow}>Segmentos</h3>
        <ul className="mt-1 divide-y divide-tinta/10 text-sm">
          {piece.outline.map((seg, i) => {
            const seam = seamAt(doc, { piece: piece.id, segment: i });
            return (
            <li key={i}>
              <button type="button" className="flex w-full justify-between py-1.5 text-left hover:text-linha" onClick={() => onSelectSegment(i)}>
                <span>
                  {i + 1}. {seg.kind === "cubic" ? "curva" : "reta"}
                  {piece.seamAllowanceByEdge?.[i] !== undefined && <span className="text-xs text-linha"> · margem própria</span>}
                  {piece.fold === i && <span className="text-xs text-tinta-suave"> · dobra</span>}
                  {seam && <span className="text-xs text-costura"> · costura {seamNumber(doc, seam)}</span>}
                </span>
                <span className="font-mono text-xs">{formatCm(lengths[i] ?? 0)} cm</span>
              </button>
            </li>
            );
          })}
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

const GRAIN_PRESETS: { deg: number; label: string }[] = [
  { deg: 0, label: "0° urdume" },
  { deg: 90, label: "90° trama" },
  { deg: 45, label: "45° viés" },
];

/** Ângulo do fio da parte em graus a partir do urdume (eixo Y), de 0 a 179; null sem fio. */
function grainAngleOf(piece: Piece): number | null {
  const g = piece.grainline;
  if (!g) return null;
  const dx = g.to.x - g.from.x;
  const dy = g.to.y - g.from.y;
  if (Math.hypot(dx, dy) < 1e-6) return null;
  const deg = Math.round((Math.atan2(dx, dy) * 180) / Math.PI);
  return ((deg % 180) + 180) % 180;
}

/** Compensação de encolhimento: amplia a parte pelo urdume e pela trama (uma edição, desfaz com Ctrl+Z). */
function ShrinkageCompensation({ onApply }: { onApply: (warpPct: number, weftPct: number) => void }) {
  const [warp, setWarp] = useState("");
  const [weft, setWeft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const parse = (v: string) => (v.trim() === "" ? 0 : Number(v.replace(",", ".")));
  return (
    <fieldset className="space-y-2 border-t border-tinta/10 pt-3" data-encolhimento>
      <legend className="text-xs font-medium">Compensar encolhimento</legend>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs">
          <span>Urdume (%)</span>
          <input className={`${ui.input} text-sm`} inputMode="decimal" value={warp} placeholder="0" onChange={(e) => setWarp(e.target.value)} />
        </label>
        <label className="block text-xs">
          <span>Trama (%)</span>
          <input className={`${ui.input} text-sm`} inputMode="decimal" value={weft} placeholder="0" onChange={(e) => setWeft(e.target.value)} />
        </label>
      </div>
      <button
        type="button"
        className={`${ui.buttonGhost} w-full`}
        onClick={() => {
          const w = parse(warp);
          const t = parse(weft);
          if (!Number.isFinite(w) || !Number.isFinite(t) || w < 0 || t < 0 || w > 50 || t > 50 || (w === 0 && t === 0)) {
            setError("Informe entre 0 e 50% em pelo menos um dos sentidos.");
            return;
          }
          setError(null);
          onApply(w, t);
          setWarp("");
          setWeft("");
        }}
      >
        Ampliar a parte
      </button>
      <p className="text-xs text-tinta-suave">Amplia pelo fio da parte para a peça voltar à medida depois de lavada. Aplique uma vez só.</p>
      {error && <p className="text-xs text-linha">{error}</p>}
    </fieldset>
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
      <div>
        <h3 className={ui.eyebrow}>Ponto selecionado</h3>
        <p className="mt-1 text-sm">
          <strong className="font-mono">{pointId}</strong> de {piece.name}
        </p>
      </div>
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
  doc,
  piece,
  index,
  readOnly,
  viewingBase,
  onToggle,
  onSplit,
  onSeam,
  onLength,
  onStartSew,
  onSewPair,
  onUnsew,
  onFlip,
  onFold,
}: {
  doc: PatternDocument;
  piece: Piece;
  index: number;
  readOnly: boolean;
  /** Comprimento exato só no tamanho base (os outros vêm da gradação). */
  viewingBase: boolean;
  onLength: (mm: number) => void;
  onToggle: () => void;
  onSplit: () => void;
  onSeam: (mm: number | null) => void;
  onStartSew: () => void;
  onSewPair: () => void;
  onUnsew: (seamId: string) => void;
  onFlip: (seamId: string) => void;
  onFold: (on: boolean) => void;
}) {
  const seg = piece.outline[index]!;
  const len = segmentLengths(piece)[index] ?? 0;
  const own = piece.seamAllowanceByEdge?.[index] ?? null;
  const isFold = piece.fold === index;
  const seam = seamAt(doc, { piece: piece.id, segment: index });
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Segmento {index + 1} de {piece.name}: <strong>{seg.kind === "cubic" ? "curva" : "reta"}</strong>, {formatCm(len)} cm
      </p>
      {seg.kind === "line" && !readOnly && viewingBase && (
        <CmField
          key={`comp-${piece.id}-${index}-${len}`}
          label="Comprimento exato (move o ponto final)"
          valueMm={Math.round(len * 10) / 10}
          min={1}
          max={10000}
          onCommit={(mm) => mm !== null && onLength(mm)}
        />
      )}
      {seam ? (
        <SeamInfo doc={doc} seam={seam} pieceId={piece.id} index={index} readOnly={readOnly} onUnsew={onUnsew} onFlip={onFlip} />
      ) : (
        !readOnly && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={ui.buttonGhost} onClick={onStartSew} disabled={isFold} title={isFold ? "A dobra não é costurada" : undefined}>
              Costurar com…
            </button>
            <button
              type="button"
              className={ui.buttonGhost}
              onClick={() => onFold(!isFold)}
              disabled={!isFold && (seg.kind !== "line" || !!piece.cutPair)}
              title={!isFold && piece.cutPair ? "Parte de cortar par não tem dobra" : !isFold && seg.kind !== "line" ? "A dobra precisa ser reta" : undefined}
            >
              {isFold ? "Desmarcar dobra" : "Marcar como dobra"}
            </button>
            {piece.cutPair && (
              <button type="button" className={`${ui.buttonGhost} col-span-2`} onClick={onSewPair} data-sew-pair>
                Costurar com o par (gancho)
              </button>
            )}
          </div>
        )
      )}
      {isFold && (
        <p className="text-xs text-tinta-suave">Dobra: a parte é cortada no tecido dobrado e, na Prova, vira inteira espelhada por este segmento.</p>
      )}
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
      <SeamPresetChips valueMm={own ?? undefined} disabled={readOnly} onPick={onSeam} />
      {seg.kind === "cubic" && !readOnly && <p className="text-xs text-tinta-suave">Arraste os quadradinhos vermelhos para ajustar a curva.</p>}
    </div>
  );
}

/** Com quem o segmento está costurado, a diferença de comprimento e o sentido. */
function SeamInfo({
  doc,
  seam,
  pieceId,
  index,
  readOnly,
  onUnsew,
  onFlip,
}: {
  doc: PatternDocument;
  seam: Seam;
  pieceId: string;
  index: number;
  readOnly: boolean;
  onUnsew: (seamId: string) => void;
  onFlip: (seamId: string) => void;
}) {
  const thisIsA = seam.a.piece === pieceId && seam.a.segment === index;
  const other = thisIsA ? seam.b : seam.a;
  const otherName = doc.pieces.find((p) => p.id === other.piece)?.name ?? other.piece;
  const lengths = seamLengths(doc).get(seam.id);
  const diff = lengths ? (thisIsA ? lengths.diff : -lengths.diff) : 0;
  return (
    <div className="space-y-2 rounded-md border border-costura/30 bg-costura/5 p-3 text-xs">
      <p className="text-sm">
        <strong className="text-costura">Costura {seamNumber(doc, seam)}</strong>{" "}
        {seam.a.piece === seam.b.piece && seam.a.segment === seam.b.segment
          ? `com o mesmo segmento do par espelhado de ${otherName}.`
          : `com o segmento ${other.segment + 1} de ${otherName}.`}
      </p>
      <p>
        {Math.abs(diff) < 0.5
          ? "Os dois lados têm o mesmo comprimento."
          : `Este lado tem ${formatCm(Math.abs(diff))} cm a ${diff > 0 ? "mais" : "menos"} que o outro.`}
      </p>
      <p className="text-tinta-suave">
        {seam.direction === "opposite"
          ? "Junta o começo deste segmento com o fim do outro."
          : "Junta o começo deste segmento com o começo do outro."}
      </p>
      {!readOnly && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={ui.buttonGhost} onClick={() => onFlip(seam.id)}>
            Inverter sentido
          </button>
          <button type="button" className={ui.buttonGhost} onClick={() => onUnsew(seam.id)}>
            Desfazer costura
          </button>
        </div>
      )}
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
      <h2 className={ui.eyebrow}>Gradação</h2>
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
      <h3 className={ui.eyebrow}>Gradação do ponto {pointId}</h3>
      {!readOnly && <GradePresetChips piece={piece} pointId={pointId} step={step} onStep={onStep} />}
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
