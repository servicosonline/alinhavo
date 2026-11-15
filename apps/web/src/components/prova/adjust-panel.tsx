"use client";

import { continuationSegments, segmentLengths, type PatternDocument, type SeamEdge } from "@alinhavo/geometry";
import { useMemo, useState } from "react";
import type { SaveResult } from "@/components/editor/pattern-editor";
import { applyProvaAdjustment, describeAdjustment } from "@/lib/prova/adjustment";
import { formatCm, parseCmToMm } from "@/lib/units";
import { ui } from "../ui";

/**
 * O que a Prova faz com um ajuste:
 * - save: grava uma versão nova do molde (painel, quem pode editar);
 * - local: só muda a Prova na tela (demonstração, sem onde salvar);
 * - editor: volta para o editor ao lado (tela dividida), como uma edição que
 *   se desfaz; salvar continua sendo no editor;
 * - readonly: mostra, mas não aplica (quem só tem leitura).
 */
export type ProvaSaveMode =
  | { kind: "save"; nextVersion: number; unsaved: boolean; onSave: (doc: PatternDocument, message: string) => Promise<SaveResult> }
  | { kind: "local" }
  | { kind: "editor"; onApply: (doc: PatternDocument, message: string) => void }
  | { kind: "readonly" };

const key = (e: SeamEdge) => `${e.piece}#${e.segment}`;

/** "Frente, segmento 3 (60 cm)", no tamanho base. */
export function edgeLabel(doc: PatternDocument, e: SeamEdge): string {
  const piece = doc.pieces.find((p) => p.id === e.piece);
  if (!piece) return `${e.piece}, segmento ${e.segment + 1}`;
  const len = segmentLengths(piece)[e.segment];
  return `${piece.name}, segmento ${e.segment + 1}${len === undefined ? "" : ` (${formatCm(len)} cm)`}`;
}

/** Aceita "4", "+4", "-3", "−3" e "2,5". */
function parseSignedCm(text: string): number | null {
  return parseCmToMm(text.trim().replace(/^\+/, "").replace(/^[−–]/, "-"));
}

type Props = {
  doc: PatternDocument;
  /** Segmentos do molde que têm borda na Prova. */
  edges: SeamEdge[];
  selected: number | null;
  onSelect: (index: number | null) => void;
  mode: ProvaSaveMode;
  /** O ajuste entrou: a Prova recomeça com o molde novo. */
  onApplied: (doc: PatternDocument, notice: string) => void;
  disabled: boolean;
};

export function AdjustPanel({ doc, edges, selected, onSelect, mode, onApplied, disabled }: Props) {
  const edge = selected === null ? null : (edges[selected] ?? null);
  return (
    <div className={`${ui.card} space-y-3 p-4`} data-adjust>
      <h2 className="text-xs font-medium">Ajustar o molde</h2>
      <label className="block text-xs">
        <span className="text-tinta-suave">Clique numa borda da roupa (ex.: a barra) ou escolha aqui:</span>
        <select
          className={`${ui.input} text-sm`}
          value={selected ?? ""}
          onChange={(e) => onSelect(e.target.value === "" ? null : Number(e.target.value))}
          disabled={edges.length === 0}
          data-edge-select
        >
          <option value="">Nenhuma borda escolhida</option>
          {edges.map((e, i) => (
            <option key={key(e)} value={i}>
              {edgeLabel(doc, e)}
            </option>
          ))}
        </select>
      </label>
      {/* A chave zera o campo e as marcações quando a borda muda. */}
      {edge && <AdjustForm key={key(edge)} doc={doc} edge={edge} mode={mode} onApplied={onApplied} onCancel={() => onSelect(null)} disabled={disabled} />}
    </div>
  );
}

function AdjustForm({
  doc,
  edge,
  mode,
  onApplied,
  onCancel,
  disabled,
}: {
  doc: PatternDocument;
  edge: SeamEdge;
  mode: ProvaSaveMode;
  onApplied: Props["onApplied"];
  onCancel: () => void;
  disabled: boolean;
}) {
  const continuation = useMemo(() => continuationSegments(doc, edge), [doc, edge]);
  const [text, setText] = useState("");
  const [also, setAlso] = useState<Set<string>>(() => new Set(continuation.map(key)));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mm = parseSignedCm(text);
  const chosen = [edge, ...continuation.filter((e) => also.has(key(e)))];
  const preview = mm !== null && mm !== 0 ? describeAdjustment(doc, chosen, mm) : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mm === null || mm === 0) return setError("Digite quantos cm, por exemplo 4 para alongar ou -3 para encurtar.");
    if (Math.abs(mm) > 500) return setError("Ajuste de até 50 cm por vez.");
    const result = applyProvaAdjustment(doc, { edges: chosen, mm });
    if (result.applied.length === 0) {
      return setError("Este segmento não pode ser movido assim (dobra, ou encurtar mais do que a peça mede).");
    }
    const skippedNote =
      result.skipped.length > 0 ? ` Não deu para mover: ${result.skipped.map((s) => edgeLabel(doc, s)).join("; ")}.` : "";
    if (mode.kind === "editor") {
      mode.onApply(result.doc, result.message);
      onApplied(result.doc, `Ajuste levado ao molde: ${result.message.replace(/^Prova: /, "")}. Ctrl+Z desfaz; salve no editor.${skippedNote}`);
      return;
    }
    if (mode.kind === "local") {
      onApplied(result.doc, `Ajuste aplicado só na tela: ${result.message.replace(/^Prova: /, "")}.${skippedNote}`);
      return;
    }
    if (mode.kind !== "save") return;
    setBusy(true);
    const message = result.message + (mode.unsaved ? " (com as alterações do editor)" : "");
    const saved = await mode.onSave(result.doc, message);
    setBusy(false);
    if (!saved.ok) return setError(saved.error);
    onApplied(result.doc, `Versão ${saved.version} salva: ${result.message.replace(/^Prova: /, "")}.${skippedNote}`);
  };

  return (
    <form className="space-y-3" onSubmit={submit} data-adjust-form>
      <label className="block text-xs">
        <span className="font-medium">Deslocar (cm)</span>
        <input
          className={`${ui.input} text-sm`}
          inputMode="decimal"
          placeholder="ex.: 4 ou -3"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-describedby="ajuste-dica"
          data-adjust-cm
        />
        <span id="ajuste-dica" className="mt-1 block text-[11px] text-tinta-suave">
          Positivo empurra a borda para fora da peça (alonga ou alarga); negativo, para dentro.
        </span>
      </label>

      {continuation.length > 0 && (
        <fieldset className="text-xs">
          <legend className="font-medium">Aplicar também em</legend>
          <p className="text-[11px] text-tinta-suave">Continuam esta borda pelas costuras; sem eles, a costura fica com lados diferentes.</p>
          {continuation.map((c) => (
            <label key={key(c)} className="mt-1 flex items-center gap-2">
              <input
                type="checkbox"
                checked={also.has(key(c))}
                onChange={(e) => {
                  const next = new Set(also);
                  if (e.target.checked) next.add(key(c));
                  else next.delete(key(c));
                  setAlso(next);
                }}
              />
              {edgeLabel(doc, c)}
            </label>
          ))}
        </fieldset>
      )}

      {preview && (
        <p className="text-[11px] text-tinta-suave" data-adjust-preview>
          {preview}
        </p>
      )}
      {mode.kind === "save" && mode.unsaved && (
        <p className="text-[11px] text-linha">As alterações não salvas do editor entram junto nesta versão.</p>
      )}
      {mode.kind === "editor" && <p className="text-[11px] text-tinta-suave">O ajuste muda o molde no editor ao lado; ainda não salva versão.</p>}
      {mode.kind === "local" && <p className="text-[11px] text-tinta-suave">Na demonstração, o ajuste vale só nesta tela.</p>}
      {mode.kind === "readonly" && <p className="text-[11px] text-tinta-suave">Só donos, admins e modelistas salvam ajustes no molde.</p>}
      {error && (
        <p className={`${ui.error} text-xs`} role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" className={`${ui.buttonPrimary} flex-1`} disabled={disabled || busy || mode.kind === "readonly"}>
          {mode.kind === "save" ? (busy ? "Salvando…" : `Salvar como versão ${mode.nextVersion}`) : mode.kind === "editor" ? "Aplicar no molde" : "Aplicar na Prova"}
        </button>
        <button type="button" className={ui.buttonGhost} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
