"use client";

import type { PatternDocument } from "@alinhavo/geometry";
import { useEffect, useRef, useState } from "react";
import type { FabricId, FromWorker, PoseId, ToWorker } from "@/lib/prova/protocol";
import { formatCm } from "@/lib/units";
import { ui } from "../ui";
import type { ProvaScene } from "./scene";

const FABRICS: { id: FabricId; name: string; color: string }[] = [
  { id: "planoLeve", name: "Plano leve", color: "#d8c3a5" },
  { id: "malha", name: "Malha", color: "#8a9db3" },
  { id: "jeans", name: "Jeans", color: "#4a6687" },
];
const POSES: { id: PoseId; name: string }[] = [
  { id: "em-pe", name: "Em pé" },
  { id: "passo", name: "Passo" },
];

/** Nome legível das medidas que o corpo pode estimar. */
const MEASUREMENT_NAME: Record<string, string> = {
  altura: "altura",
  busto: "busto",
  cintura: "cintura",
  quadril: "quadril",
  alturaDoQuadril: "altura do quadril",
  entrepernas: "entrepernas",
  comprimentoDoBraco: "comprimento do braço",
  punho: "punho",
  ombro: "ombro",
  larguraDasCostas: "largura das costas",
  pescoco: "pescoço",
  coxa: "coxa",
  joelho: "joelho",
  tornozelo: "tornozelo",
  braco: "braço",
};

type Status =
  | { kind: "loading" }
  | { kind: "running"; time: number; seamGap: number }
  | { kind: "paused"; time: number; seamGap: number }
  | { kind: "error"; message: string };

type Props = {
  doc: PatternDocument;
  /** Medidas por tamanho (nome da medida → mm). */
  measurementsBySize: Record<string, Record<string, number>>;
};

export function ProvaStudio({ doc, measurementsBySize }: Props) {
  const viewRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ProvaScene | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [size, setSize] = useState(doc.baseSize);
  const [fabric, setFabric] = useState<FabricId>("planoLeve");
  const [pose, setPose] = useState<PoseId>("em-pe");
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [notes, setNotes] = useState<{ skipped: string[]; estimated: string[] }>({ skipped: [], estimated: [] });
  const color = FABRICS.find((f) => f.id === fabric)!.color;
  const colorRef = useRef(color);

  // Cena e Worker: criados uma vez, descartados ao sair da página.
  useEffect(() => {
    let disposed = false;
    const worker = new Worker(new URL("../../lib/prova/prova.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    /** A cena carrega à parte: o último "pronto" fica guardado até ela existir. */
    let lastReady: Extract<FromWorker, { type: "ready" }> | null = null;
    const show = (scene: ProvaScene, msg: Extract<FromWorker, { type: "ready" }>) => {
      scene.setBody(msg.body.positions, msg.body.indices);
      scene.setGarment(msg.garment.positions, msg.garment.indices, colorRef.current);
    };
    worker.onmessage = (e: MessageEvent<FromWorker>) => {
      const msg = e.data;
      const scene = sceneRef.current;
      if (msg.type === "ready") {
        lastReady = msg;
        if (scene) show(scene, msg);
        setNotes({ skipped: msg.skipped, estimated: msg.estimated });
        setStatus({ kind: "running", time: 0, seamGap: Infinity });
        worker.postMessage({ type: "play" } satisfies ToWorker);
      } else if (msg.type === "frame") {
        scene?.updateGarment(msg.positions);
        setStatus((s) => (s.kind === "paused" ? s : { kind: "running", time: msg.time, seamGap: msg.seamGap }));
      } else {
        setStatus({ kind: "error", message: msg.message });
      }
    };
    import("./scene").then(({ ProvaScene }) => {
      if (disposed || !viewRef.current) return;
      const scene = new ProvaScene(viewRef.current);
      sceneRef.current = scene;
      if (lastReady) show(scene, lastReady);
    });
    return () => {
      disposed = true;
      worker.terminate();
      workerRef.current = null;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Trocar tamanho, tecido ou pose monta a Prova de novo.
  useEffect(() => {
    colorRef.current = color;
    const worker = workerRef.current;
    if (!worker) return;
    setStatus({ kind: "loading" });
    const measurements = measurementsBySize[size] ?? {};
    worker.postMessage({ type: "init", setup: { doc, size, measurements, fabric, pose } } satisfies ToWorker);
  }, [doc, size, fabric, pose, measurementsBySize, color]);

  const togglePlay = () => {
    const worker = workerRef.current;
    if (!worker) return;
    if (status.kind === "running") {
      worker.postMessage({ type: "pause" } satisfies ToWorker);
      setStatus({ kind: "paused", time: status.time, seamGap: status.seamGap });
    } else if (status.kind === "paused") {
      worker.postMessage({ type: "play" } satisfies ToWorker);
      setStatus({ ...status, kind: "running" });
    }
  };
  const restart = () => {
    workerRef.current?.postMessage({
      type: "init",
      setup: { doc, size, measurements: measurementsBySize[size] ?? {}, fabric, pose },
    } satisfies ToWorker);
    setStatus({ kind: "loading" });
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_18rem]">
      <div ref={viewRef} className="relative h-[60vh] min-h-[22rem] overflow-hidden rounded-lg border border-tinta/15 bg-papel lg:h-[calc(100vh-10rem)]">
        {status.kind === "loading" && (
          <p className="absolute inset-x-0 top-3 text-center text-xs text-tinta-suave" role="status">
            Montando a Prova…
          </p>
        )}
      </div>

      <aside className="space-y-4" aria-label="Controles da Prova">
        <div className={`${ui.card} space-y-3 p-4`}>
          <label className="block text-xs">
            <span className="font-medium">Corpo</span>
            <select className={`${ui.input} text-sm`} value="manequim" onChange={() => {}}>
              <option value="manequim">Manequim</option>
              <option value="makehuman" disabled>
                Realista (em breve)
              </option>
            </select>
          </label>
          <label className="block text-xs">
            <span className="font-medium">Tamanho</span>
            <select className={`${ui.input} text-sm`} value={size} onChange={(e) => setSize(e.target.value)}>
              {doc.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                  {s === doc.baseSize ? " (base)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="font-medium">Tecido</span>
            <select className={`${ui.input} text-sm`} value={fabric} onChange={(e) => setFabric(e.target.value as FabricId)}>
              {FABRICS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="font-medium">Pose</span>
            <select className={`${ui.input} text-sm`} value={pose} onChange={(e) => setPose(e.target.value as PoseId)}>
              {POSES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={ui.buttonGhost} onClick={togglePlay} disabled={status.kind !== "running" && status.kind !== "paused"}>
              {status.kind === "paused" ? "Continuar" : "Pausar"}
            </button>
            <button type="button" className={ui.buttonGhost} onClick={restart} disabled={status.kind === "loading"}>
              Recomeçar
            </button>
          </div>
        </div>

        <div className={`${ui.card} space-y-2 p-4 text-xs`} role="status" aria-live="polite" data-prova-status={status.kind}>
          {status.kind === "loading" && <p>Montando o corpo e as peças…</p>}
          {(status.kind === "running" || status.kind === "paused") && (
            <>
              <p>
                {status.kind === "paused" ? "Pausado" : "Simulando"} · {status.time.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s
              </p>
              <p data-seam-gap={Number.isFinite(status.seamGap) ? status.seamGap.toFixed(2) : ""}>
                {!Number.isFinite(status.seamGap)
                  ? "Costurando…"
                  : status.seamGap < 1
                    ? "Costuras fechadas."
                    : `Costuras fechando: maior vão de ${formatCm(status.seamGap)} cm.`}
              </p>
            </>
          )}
          {status.kind === "error" && <p className="text-linha">{status.message}</p>}
          {notes.skipped.length > 0 && (
            <p className="text-tinta-suave">Fora da Prova (sem posição no corpo): {notes.skipped.join(", ")}.</p>
          )}
          {notes.estimated.length > 0 && (
            <p className="text-tinta-suave">
              Medidas estimadas pela altura: {notes.estimated.map((k) => MEASUREMENT_NAME[k] ?? k).join(", ")}.
            </p>
          )}
        </div>
        <p className="text-xs text-tinta-suave">Arraste para girar, use a roda ou dois dedos para aproximar.</p>
      </aside>
    </div>
  );
}
