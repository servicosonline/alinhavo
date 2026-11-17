"use client";

import type { PatternDocument } from "@alinhavo/geometry";
import type { MarkerLayout, NestPlacement } from "@alinhavo/nesting";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ui } from "@/components/ui";
import { saveMarker } from "@/app/painel/[orgId]/produtos/[productId]/encaixe/actions";
import { formatEfficiency, formatMeters, formatPerGarment, layoutFromRun, readMarkerInput, type MarkerInput } from "@/lib/encaixe/marker";
import { createNestRunner, NestCancelled, type NestRunner } from "@/lib/encaixe/nest-runner";
import { enqueueNestJob } from "@/app/painel/[orgId]/encaixes/actions";
import { formatCm } from "@/lib/units";
import { MarkerView } from "./marker-view";

type Status =
  | { kind: "idle" }
  | { kind: "running"; done: number; total: number }
  | { kind: "done"; layout: MarkerLayout; input: MarkerInput; placements: NestPlacement[] }
  | { kind: "error"; message: string };

/**
 * Tela do Encaixe: demanda por tamanho e tecido, encaixe no Worker, risco
 * desenhado e salvar. Mudar qualquer campo descarta o risco calculado.
 */
export function EncaixeStudio({
  orgId,
  productId,
  version,
  doc,
  defaultWidthMm,
  canSave,
}: {
  orgId: string;
  productId: string;
  version: number;
  doc: PatternDocument;
  defaultWidthMm: number;
  canSave: boolean;
}) {
  const [demand, setDemand] = useState<Record<string, string>>(() => Object.fromEntries(doc.sizes.map((s) => [s, "1"])));
  const [width, setWidth] = useState(() => formatCm(defaultWidthMm));
  const [gap, setGap] = useState("0");
  const [oneWay, setOneWay] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [saved, setSaved] = useState<{ error?: string; ok?: string; number?: number } | null>(null);
  const [saving, startSaving] = useTransition();
  const runnerRef = useRef<NestRunner | null>(null);
  const [queued, setQueued] = useState<{ error?: string; ok?: string } | null>(null);
  const [queuing, startQueuing] = useTransition();

  const piecesPerGarment = useMemo(() => doc.pieces.reduce((s, p) => s + (p.cutPair ? 2 : 1), 0), [doc]);

  useEffect(() => {
    const runner = createNestRunner();
    runnerRef.current = runner;
    return () => runner.dispose();
  }, []);

  const changed = () => {
    setSaved(null);
    setQueued(null);
    if (status.kind !== "running") setStatus({ kind: "idle" });
  };

  const read = () => readMarkerInput(doc.sizes, { demand, width, gap, oneWay }, piecesPerGarment);

  const run = async () => {
    const r = read();
    setSaved(null);
    setQueued(null);
    if ("error" in r) {
      setStatus({ kind: "error", message: r.error });
      return;
    }
    setStatus({ kind: "running", done: 0, total: 0 });
    try {
      const { pieces, result } = await runnerRef.current!.run({ doc, ...r.input }, (done, total) => setStatus({ kind: "running", done, total }));
      const out = layoutFromRun(pieces, result, r.input);
      setStatus("error" in out ? { kind: "error", message: out.error } : { kind: "done", layout: out.layout, input: r.input, placements: result.placements });
    } catch (err) {
      if (err instanceof NestCancelled) return;
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Erro no encaixe." });
    }
  };

  const cancel = () => {
    runnerRef.current?.cancel();
    setStatus({ kind: "idle" });
  };

  const enqueue = () => {
    const r = read();
    setSaved(null);
    if ("error" in r) {
      setQueued({ error: r.error });
      return;
    }
    startQueuing(async () => {
      setQueued(await enqueueNestJob(orgId, productId, r.input));
    });
  };

  const save = () => {
    if (status.kind !== "done") return;
    const { input, placements } = status;
    startSaving(async () => {
      setSaved(await saveMarker(orgId, productId, version, input, placements));
    });
  };

  const running = status.kind === "running";

  return (
    <section className={`${ui.card} space-y-4`} aria-labelledby="novo-encaixe" data-section="novo-encaixe">
      <h2 id="novo-encaixe" className={ui.h2}>
        Novo encaixe
      </h2>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <fieldset className="space-y-2" disabled={running}>
          <legend className={ui.label}>Peças por tamanho</legend>
          <div className="flex flex-wrap gap-2">
            {doc.sizes.map((s) => (
              <label key={s} className="block w-20">
                <span className="text-xs text-tinta-suave">{s}</span>
                <input
                  name={`demanda-${s}`}
                  inputMode="numeric"
                  value={demand[s] ?? ""}
                  onChange={(e) => {
                    setDemand((d) => ({ ...d, [s]: e.target.value }));
                    changed();
                  }}
                  className={ui.input}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="grid gap-3 sm:grid-cols-3 sm:items-end" disabled={running}>
          <label className="block">
            <span className={ui.label}>Largura útil do tecido (cm)</span>
            <input
              name="largura"
              inputMode="decimal"
              value={width}
              onChange={(e) => {
                setWidth(e.target.value);
                changed();
              }}
              className={ui.input}
            />
          </label>
          <label className="block">
            <span className={ui.label}>Folga entre peças (cm)</span>
            <input
              name="folga"
              inputMode="decimal"
              value={gap}
              onChange={(e) => {
                setGap(e.target.value);
                changed();
              }}
              className={ui.input}
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              name="sentido"
              checked={oneWay}
              onChange={(e) => {
                setOneWay(e.target.checked);
                changed();
              }}
            />
            Tecido com sentido (não gira peças)
          </label>
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className={ui.buttonPrimary} disabled={running}>
            {running ? "Encaixando…" : "Encaixar"}
          </button>
          {running && (
            <button type="button" className={ui.buttonGhost} onClick={cancel}>
              Cancelar
            </button>
          )}
          {canSave && !running && (
            <button type="button" className={ui.buttonGhost} onClick={enqueue} disabled={queuing} data-enqueue>
              {queuing ? "Pondo na fila…" : "Pôr na fila"}
            </button>
          )}
          {running && status.total > 0 && (
            <span className="text-sm text-tinta-suave" role="status">
              {status.done} de {status.total} peças
            </span>
          )}
        </div>
      </form>

      {queued?.error && (
        <p className={ui.error} role="alert">
          {queued.error}
        </p>
      )}
      {queued?.ok && (
        <p className={ui.success} role="status" data-queued>
          {queued.ok}{" "}
          <Link href={`/painel/${orgId}/encaixes`} className="underline">
            Ver a fila
          </Link>
        </p>
      )}

      {status.kind === "error" && (
        <p className={ui.error} role="alert">
          {status.message}
        </p>
      )}

      {status.kind === "done" && (
        <div className="space-y-3" data-result>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-tinta-suave">Comprimento</dt>
              <dd className="font-semibold" data-length>
                {formatMeters(status.layout.lengthMm)}
              </dd>
            </div>
            <div>
              <dt className="text-tinta-suave">Aproveitamento</dt>
              <dd className="font-semibold" data-efficiency>
                {formatEfficiency(status.layout.efficiency)}
              </dd>
            </div>
            <div>
              <dt className="text-tinta-suave">Por peça pronta</dt>
              <dd className="font-semibold">{formatPerGarment(status.layout.lengthMm, status.layout.demand)}</dd>
            </div>
            <div>
              <dt className="text-tinta-suave">Peças cortadas</dt>
              <dd className="font-semibold">{status.layout.placements.length}</dd>
            </div>
          </dl>
          <MarkerView layout={status.layout} sizes={doc.sizes} />
          {canSave ? (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={ui.buttonPrimary} onClick={save} disabled={saving || saved?.ok !== undefined}>
                {saving ? "Salvando…" : "Salvar encaixe"}
              </button>
              {saved?.error && (
                <p className={`${ui.error} text-sm`} role="alert">
                  {saved.error}
                </p>
              )}
              {saved?.ok && (
                <p className={`${ui.success} text-sm`} role="status">
                  {saved.ok}{" "}
                  <Link href={`/painel/${orgId}/produtos/${productId}/encaixe?risco=${saved.number}`} className="underline">
                    Abrir
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <p className={ui.muted}>Você pode encaixar para conferir, mas só donos, admins e modelistas salvam.</p>
          )}
        </div>
      )}
    </section>
  );
}
