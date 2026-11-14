"use client";

import { FINISH_NAME, FINISH_ROW_GAP, LABEL_TEXT_MAX, segmentLengths, type Finish, type NewFinish, type Piece } from "@alinhavo/geometry";
import { useRef, useState } from "react";
import { defaultLabel, defaultPrint, defaultSeamFinish, firstEdge } from "@/lib/finish-defaults";
import { prepareFinishImage } from "@/lib/finish-image";
import { formatCm } from "@/lib/units";
import { CmField } from "../fields";
import { ui } from "../ui";

type Props = {
  piece: Piece;
  readOnly: boolean;
  onAdd: (finish: NewFinish) => boolean;
  onUpdate: (id: string, patch: Partial<NewFinish>) => boolean;
  onRemove: (id: string) => void;
};

const small = "rounded border border-tinta/20 bg-white px-1.5 py-1 text-xs";

/**
 * Acabamentos da parte no editor: pesponto e zíper num segmento, etiqueta e
 * estampa num retângulo preso a um ponto. Medidas em cm na tela, mm no molde.
 * O que não validar não entra (a mensagem diz).
 */
export function FinishesPanel({ piece, readOnly, onAdd, onUpdate, onRemove }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  /** Estampa: troca a imagem de uma existente (id) ou cria uma nova (null). */
  const replacing = useRef<string | null>(null);
  const lengths = segmentLengths(piece);
  const finishes = piece.finishes ?? [];
  const canSeam = firstEdge(piece) !== null;

  const add = (f: NewFinish | null) => {
    if (!f) return setError("A parte não tem segmento que aceite esse acabamento.");
    setError(onAdd(f) ? null : "Não foi possível pôr esse acabamento.");
  };
  const update = (id: string, patch: Partial<NewFinish>) => setError(onUpdate(id, patch) ? null : "Valor fora do permitido.");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    const r = await prepareFinishImage(file);
    setBusy(false);
    if ("error" in r) return setError(r.error);
    const id = replacing.current;
    if (id) update(id, { image: r.image });
    else add(defaultPrint(piece, r.image, r.width, r.height));
  }

  const segmentOptions = piece.outline.map((_, i) => (
    <option key={i} value={i} disabled={i === piece.fold}>
      Segmento {i + 1} ({formatCm(lengths[i] ?? 0)} cm){i === piece.fold ? ", dobra" : ""}
    </option>
  ));
  const pointOptions = Object.keys(piece.points).map((id) => (
    <option key={id} value={id}>
      Ponto {id}
    </option>
  ));

  return (
    <section className="space-y-3 border-t border-tinta/10 pt-3" aria-label="Acabamentos" data-finishes-panel>
      <h3 className="text-xs font-medium">Acabamentos</h3>
      {finishes.length === 0 && <p className="text-xs text-tinta-suave">Pesponto, zíper, etiqueta ou estampa nesta parte.</p>}

      {finishes.map((f, n) => (
        <FinishRow
          key={f.id}
          finish={f}
          number={n + 1}
          readOnly={readOnly}
          segmentLength={"segment" in f ? (lengths[f.segment] ?? 0) : 0}
          segmentOptions={segmentOptions}
          pointOptions={pointOptions}
          onUpdate={(patch) => update(f.id, patch)}
          onRemove={() => onRemove(f.id)}
          onReplaceImage={() => {
            replacing.current = f.id;
            fileRef.current?.click();
          }}
        />
      ))}

      {!readOnly && (
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" className={ui.buttonGhost} disabled={!canSeam} onClick={() => add(defaultSeamFinish(piece, "pesponto"))}>
            + Pesponto
          </button>
          <button type="button" className={ui.buttonGhost} disabled={!canSeam} onClick={() => add(defaultSeamFinish(piece, "ziper"))}>
            + Zíper
          </button>
          <button type="button" className={ui.buttonGhost} onClick={() => add(defaultLabel(piece))}>
            + Etiqueta
          </button>
          <button
            type="button"
            className={ui.buttonGhost}
            disabled={busy}
            onClick={() => {
              replacing.current = null;
              fileRef.current?.click();
            }}
          >
            {busy ? "Lendo…" : "+ Estampa"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            aria-label="Imagem da estampa"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      )}
      {error && (
        <p className="text-xs text-linha" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function FinishRow({
  finish: f,
  number,
  readOnly,
  segmentLength,
  segmentOptions,
  pointOptions,
  onUpdate,
  onRemove,
  onReplaceImage,
}: {
  finish: Finish;
  number: number;
  readOnly: boolean;
  segmentLength: number;
  segmentOptions: React.ReactNode;
  pointOptions: React.ReactNode;
  onUpdate: (patch: Partial<NewFinish>) => void;
  onRemove: () => void;
  onReplaceImage: () => void;
}) {
  return (
    <div className="space-y-2 rounded-md border border-tinta/15 p-2" data-finish-row={f.kind}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">
          {number}. {FINISH_NAME[f.kind]}
        </span>
        {!readOnly && (
          <button
            type="button"
            className="text-xs text-linha hover:underline"
            onClick={onRemove}
            aria-label={`Tirar ${FINISH_NAME[f.kind]} ${number}`}
          >
            Tirar
          </button>
        )}
      </div>

      {(f.kind === "pesponto" || f.kind === "ziper") && (
        <select
          className={`${small} w-full`}
          value={f.segment}
          disabled={readOnly}
          aria-label="Segmento"
          onChange={(e) => onUpdate({ segment: Number(e.target.value) })}
        >
          {segmentOptions}
        </select>
      )}

      {f.kind === "pesponto" && (
        <div className="grid grid-cols-2 gap-2">
          <CmField
            label="Da costura"
            valueMm={f.distance}
            min={0}
            max={50}
            disabled={readOnly}
            onCommit={(mm) => mm !== null && onUpdate({ distance: mm })}
          />
          <label className="block text-xs">
            <span className="font-medium">Carreiras</span>
            <select
              className={`${ui.input} mt-1 py-1.5 text-sm`}
              value={f.rows}
              disabled={readOnly}
              onChange={(e) => onUpdate({ rows: Number(e.target.value) as 1 | 2 })}
            >
              <option value={1}>Simples</option>
              <option value={2}>Duplo ({formatCm(FINISH_ROW_GAP)} cm)</option>
            </select>
          </label>
        </div>
      )}

      {f.kind === "ziper" && (
        <div className="grid grid-cols-2 gap-2">
          <CmField
            label="Começa em"
            valueMm={Math.round(f.from * segmentLength)}
            min={0}
            max={Math.max(0, segmentLength - 10)}
            disabled={readOnly}
            onCommit={(mm) => mm !== null && segmentLength > 0 && onUpdate({ from: mm / segmentLength })}
          />
          <CmField
            label="Comprimento"
            valueMm={Math.round((f.to - f.from) * segmentLength)}
            min={10}
            max={Math.round((1 - f.from) * segmentLength)}
            disabled={readOnly}
            onCommit={(mm) => mm !== null && segmentLength > 0 && onUpdate({ to: Math.min(1, f.from + mm / segmentLength) })}
          />
        </div>
      )}

      {(f.kind === "etiqueta" || f.kind === "estampa") && (
        <>
          <select
            className={`${small} w-full`}
            value={f.anchor}
            disabled={readOnly}
            aria-label="Preso ao ponto"
            onChange={(e) => onUpdate({ anchor: e.target.value })}
          >
            {pointOptions}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <CmField
              label="Dist. horizontal"
              valueMm={f.offset.x}
              min={-2000}
              max={2000}
              disabled={readOnly}
              onCommit={(mm) => mm !== null && onUpdate({ offset: { ...f.offset, x: mm } })}
            />
            <CmField
              label="Dist. vertical"
              valueMm={f.offset.y}
              min={-2000}
              max={2000}
              disabled={readOnly}
              onCommit={(mm) => mm !== null && onUpdate({ offset: { ...f.offset, y: mm } })}
            />
            <CmField
              label="Largura"
              valueMm={f.width}
              min={5}
              max={1000}
              disabled={readOnly}
              onCommit={(mm) => mm !== null && onUpdate({ width: mm })}
            />
            <CmField
              label="Altura"
              valueMm={f.height}
              min={5}
              max={1000}
              disabled={readOnly}
              onCommit={(mm) => mm !== null && onUpdate({ height: mm })}
            />
          </div>
          <label className="block text-xs">
            <span className="font-medium">Rotação</span>
            <select
              className={`${ui.input} mt-1 py-1.5 text-sm`}
              value={f.rotation}
              disabled={readOnly}
              onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
            >
              {[-90, -45, 0, 45, 90, 180].map((d) => (
                <option key={d} value={d}>
                  {d}°
                </option>
              ))}
              {![-90, -45, 0, 45, 90, 180].includes(f.rotation) && <option value={f.rotation}>{f.rotation}°</option>}
            </select>
          </label>
          {f.kind === "etiqueta" && <LabelText value={f.text} disabled={readOnly} onCommit={(text) => onUpdate({ text })} />}
          {f.kind === "estampa" && !readOnly && (
            <button type="button" className={`${ui.buttonGhost} w-full`} onClick={onReplaceImage}>
              Trocar imagem
            </button>
          )}
        </>
      )}
    </div>
  );
}

function LabelText({ value, disabled, onCommit }: { value: string; disabled: boolean; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="block text-xs">
      <span className="font-medium">Texto</span>
      <input
        className={`${ui.input} text-sm`}
        value={draft ?? value}
        maxLength={LABEL_TEXT_MAX}
        placeholder="Ex.: marca, composição, tamanho"
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null && draft !== value) onCommit(draft);
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
    </label>
  );
}
