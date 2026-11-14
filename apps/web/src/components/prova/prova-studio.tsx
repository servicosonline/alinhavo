"use client";

import type { PatternDocument } from "@alinhavo/geometry";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MapSummary } from "@alinhavo/cloth";
import { clearanceColor, fillColors, heat, LOOSE_MM, pressureColor } from "@/lib/prova/colors";
import type { ProvaEdges } from "@/lib/prova/edges";
import type { FabricId, FromWorker, PoseId, ProvaMaps, ToWorker } from "@/lib/prova/protocol";
import { formatCm } from "@/lib/units";
import { ui } from "../ui";
import { addCaptures, type Capture } from "@/lib/prova/captures";
import { AdjustPanel, type ProvaSaveMode } from "./adjust-panel";
import { ApprovalRequest, type ApprovalRequester } from "./approval-request";
import { CapturesPanel } from "./captures-panel";
import { GradeView } from "./grade-view";
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

type View = "tecido" | "pressao" | "folga";
/** Um tamanho (com ajuste, captura e aprovação) ou a grade inteira lado a lado (só ver). */
type Mode = "um" | "grade";
const MODES: { id: Mode; name: string }[] = [
  { id: "um", name: "Um tamanho" },
  { id: "grade", name: "Grade inteira" },
];
const VIEWS: { id: View; name: string }[] = [
  { id: "tecido", name: "Tecido" },
  { id: "pressao", name: "Pressão" },
  { id: "folga", name: "Folga" },
];

/** Porcentagem em português (0,05 → "5%"). */
function percent(fraction: number, digits = 1) {
  return `${(fraction * 100).toLocaleString("pt-BR", { maximumFractionDigits: digits })}%`;
}

/** Barra com a escala de cores e o que cada ponta significa. */
function Legend({ view, fabricLimit }: { view: Exclude<View, "tecido">; fabricLimit: number }) {
  const stops = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const [r, g, b] = heat(t);
    return `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)}) ${t * 100}%`;
  });
  const [left, right] = view === "pressao" ? ["Sem tensão", `${percent(fabricLimit, 0)} (limite)`] : [`${formatCm(LOOSE_MM)} cm ou mais`, "Encostado"];
  return (
    <div className="space-y-1" data-legend={view}>
      <div className="h-2.5 rounded-full" style={{ background: `linear-gradient(to right, ${stops.join(", ")})` }} aria-hidden />
      <div className="flex justify-between text-[11px] text-tinta-suave">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

type Status =
  | { kind: "loading" }
  | { kind: "running"; time: number; seamGap: number }
  | { kind: "paused"; time: number; seamGap: number }
  | { kind: "error"; message: string };

type Props = {
  doc: PatternDocument;
  /** Medidas por tamanho (nome da medida → mm). */
  measurementsBySize: Record<string, Record<string, number>>;
  /** O que fazer com um ajuste feito na Prova (salvar versão, só na tela ou só ver). */
  saveMode: ProvaSaveMode;
  /** Pedir aprovação por link (só no painel, para quem edita moldes). */
  approval?: ApprovalRequester;
};

export function ProvaStudio({ doc: sourceDoc, measurementsBySize, saveMode, approval }: Props) {
  // Molde em prova: começa no que veio da página e muda a cada ajuste aplicado.
  // Se a página mandar outro molde (versão nova salva), recomeça dele.
  const [work, setWork] = useState({ source: sourceDoc, doc: sourceDoc });
  if (work.source !== sourceDoc) setWork({ source: sourceDoc, doc: sourceDoc });
  const doc = work.source === sourceDoc ? work.doc : sourceDoc;
  const [edges, setEdges] = useState<ProvaEdges | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [captureNote, setCaptureNote] = useState<string | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ProvaScene | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [size, setSize] = useState(doc.baseSize);
  const [fabric, setFabric] = useState<FabricId>("planoLeve");
  const [pose, setPose] = useState<PoseId>("em-pe");
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [notes, setNotes] = useState<{ skipped: string[]; estimated: string[] }>({ skipped: [], estimated: [] });
  const [view, setView] = useState<View>("tecido");
  const [maps, setMaps] = useState<{ summary: MapSummary; fabricLimit: number } | null>(null);
  const [fabricLimit, setFabricLimit] = useState(0.05);
  const [mode, setMode] = useState<Mode>("um");
  const modeRef = useRef<Mode>("um");
  /** A Prova de um tamanho estava rodando quando a grade abriu (volta a rodar ao sair). */
  const resumeRef = useRef(false);
  const color = FABRICS.find((f) => f.id === fabric)!.color;
  const colorRef = useRef(color);
  const viewModeRef = useRef<View>("tecido");
  /** Últimos mapas recebidos e o limite do tecido, para pintar ao trocar a vista. */
  const lastMapsRef = useRef<{ maps: ProvaMaps | null; fabricLimit: number }>({ maps: null, fabricLimit: 0.05 });

  /** Pinta a roupa conforme a vista escolhida. Só lê refs: é estável. */
  const paint = useCallback((scene: ProvaScene | null) => {
    if (!scene) return;
    const mode = viewModeRef.current;
    const { maps: m, fabricLimit } = lastMapsRef.current;
    if (mode === "tecido" || !m) {
      scene.setMapColors(null, colorRef.current);
    } else if (mode === "pressao") {
      scene.setMapColors(fillColors(m.stretch, (s) => pressureColor(s, fabricLimit)), colorRef.current);
    } else {
      scene.setMapColors(fillColors(m.clearance, clearanceColor), colorRef.current);
    }
  }, []);

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
      scene.setEdges(msg.edges.lines, msg.edges.owner);
      paint(scene);
    };
    worker.onmessage = (e: MessageEvent<FromWorker>) => {
      const msg = e.data;
      const scene = sceneRef.current;
      if (msg.type === "ready") {
        lastReady = msg;
        lastMapsRef.current = { maps: null, fabricLimit: msg.fabricLimit };
        setMaps(null);
        setFabricLimit(msg.fabricLimit);
        setEdges(msg.edges);
        setSelected(null);
        if (scene) show(scene, msg);
        setNotes({ skipped: msg.skipped, estimated: msg.estimated });
        // Com a grade aberta, a Prova de um tamanho fica montada e parada (a CPU é da grade).
        if (modeRef.current === "grade") {
          resumeRef.current = true;
          setStatus({ kind: "paused", time: 0, seamGap: Infinity });
        } else {
          setStatus({ kind: "running", time: 0, seamGap: Infinity });
          worker.postMessage({ type: "play" } satisfies ToWorker);
        }
      } else if (msg.type === "frame") {
        scene?.updateGarment(msg.positions);
        if (msg.maps) {
          lastMapsRef.current = { ...lastMapsRef.current, maps: msg.maps };
          setMaps({ summary: msg.maps.summary, fabricLimit: lastMapsRef.current.fabricLimit });
          if (viewModeRef.current !== "tecido") paint(scene);
        }
        setStatus((s) => (s.kind === "paused" ? s : { kind: "running", time: msg.time, seamGap: msg.seamGap }));
      } else {
        setStatus({ kind: "error", message: msg.message });
      }
    };
    import("./scene").then(({ ProvaScene }) => {
      if (disposed || !viewRef.current) return;
      const scene = new ProvaScene(viewRef.current);
      sceneRef.current = scene;
      scene.onPick(setSelected);
      if (lastReady) show(scene, lastReady);
    });
    return () => {
      disposed = true;
      worker.terminate();
      workerRef.current = null;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [paint]);

  // Trocar tamanho, tecido, pose ou o molde monta a Prova de novo; as capturas antigas
  // mostram outra roupa, então saem (a aprovação guarda uma configuração só).
  const setupKey = `${size}|${fabric}|${pose}`;
  const [capturedFor, setCapturedFor] = useState({ setupKey, doc });
  if (capturedFor.setupKey !== setupKey || capturedFor.doc !== doc) {
    setCapturedFor({ setupKey, doc });
    setCaptures([]);
    setCaptureNote(null);
  }

  const capture = (angles: Capture["angle"][]) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const shots = angles.map((angle) => ({ angle, dataUrl: scene.capture(angle) }));
    const { list, dropped } = addCaptures(captures, shots);
    setCaptures(list);
    setCaptureNote(dropped > 0 ? `${dropped === 1 ? "Uma imagem ficou" : `${dropped} imagens ficaram`} de fora (até 4, de até 150 KB).` : null);
  };

  // Trocar tamanho, tecido ou pose monta a Prova de novo.
  useEffect(() => {
    colorRef.current = color;
    const worker = workerRef.current;
    if (!worker) return;
    setStatus({ kind: "loading" });
    const measurements = measurementsBySize[size] ?? {};
    worker.postMessage({ type: "init", setup: { doc, size, measurements, fabric, pose } } satisfies ToWorker);
  }, [doc, size, fabric, pose, measurementsBySize, color]);

  // A borda escolhida (pelo clique ou pela lista) fica destacada na roupa.
  useEffect(() => {
    sceneRef.current?.setSelected(selected);
  }, [selected]);

  const applied = (next: PatternDocument, text: string) => {
    setWork({ source: sourceDoc, doc: next });
    setSelected(null);
    setNotice(text);
  };

  // Trocar a vista só repinta (não remonta a Prova).
  useEffect(() => {
    viewModeRef.current = view;
    paint(sceneRef.current);
  }, [view, paint]);

  const changeMode = (next: Mode) => {
    if (next === mode) return;
    modeRef.current = next;
    setMode(next);
    const worker = workerRef.current;
    if (next === "grade") {
      resumeRef.current = status.kind === "running";
      if (status.kind === "running") {
        worker?.postMessage({ type: "pause" } satisfies ToWorker);
        setStatus({ kind: "paused", time: status.time, seamGap: status.seamGap });
      }
      return;
    }
    if (resumeRef.current && status.kind === "paused") {
      worker?.postMessage({ type: "play" } satisfies ToWorker);
      setStatus({ ...status, kind: "running" });
    }
    resumeRef.current = false;
  };

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
      {mode === "grade" && <GradeView doc={doc} measurementsBySize={measurementsBySize} fabric={fabric} pose={pose} color={color} view={view} />}
      <div
        ref={viewRef}
        className={`${mode === "grade" ? "hidden" : "relative"} h-[60vh] min-h-[22rem] overflow-hidden rounded-lg border border-tinta/15 bg-papel lg:h-[calc(100vh-10rem)]`}
      >
        {status.kind === "loading" && (
          <p className="absolute inset-x-0 top-3 text-center text-xs text-tinta-suave" role="status">
            Montando a Prova…
          </p>
        )}
      </div>

      <aside className="space-y-4" aria-label="Controles da Prova">
        <div className={`${ui.card} space-y-3 p-4`}>
          <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="Provar">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                data-mode={m.id}
                className={`rounded-md border px-2 py-1.5 text-sm ${mode === m.id ? "border-tinta bg-tinta text-papel" : "border-tinta/20 hover:bg-papel-escuro"}`}
                onClick={() => changeMode(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
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
            <select className={`${ui.input} text-sm`} value={size} onChange={(e) => setSize(e.target.value)} disabled={mode === "grade"}>
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
          <div className={`${mode === "grade" ? "hidden" : "grid"} grid-cols-2 gap-2`}>
            <button type="button" className={ui.buttonGhost} onClick={togglePlay} disabled={status.kind !== "running" && status.kind !== "paused"}>
              {status.kind === "paused" ? "Continuar" : "Pausar"}
            </button>
            <button type="button" className={ui.buttonGhost} onClick={restart} disabled={status.kind === "loading"}>
              Recomeçar
            </button>
          </div>
        </div>

        <div className={`${ui.card} space-y-3 p-4`}>
          <fieldset>
            <legend className="text-xs font-medium">Ver</legend>
            <div className="mt-1 grid grid-cols-3 gap-1" role="radiogroup" aria-label="Ver">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={view === v.id}
                  data-view={v.id}
                  className={`rounded-md border px-2 py-1.5 text-sm ${view === v.id ? "border-tinta bg-tinta text-papel" : "border-tinta/20 hover:bg-papel-escuro"}`}
                  onClick={() => setView(v.id)}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </fieldset>
          {view !== "tecido" && <Legend view={view} fabricLimit={fabricLimit} />}
          {view !== "tecido" && mode === "um" && (
            <div className="space-y-1 text-xs" data-map-summary>
              {!maps ? (
                <p className="text-tinta-suave">Calculando o mapa…</p>
              ) : view === "pressao" ? (
                <>
                  <p data-high-stretch={maps.summary.highStretch.toFixed(4)}>
                    Pressão alta: {percent(maps.summary.highStretch)} ({percent(maps.summary.highStretch / maps.fabricLimit, 0)} do limite do
                    tecido); 98% da roupa fica abaixo disso.
                  </p>
                  <p data-near-limit={maps.summary.areaNearLimit.toFixed(4)}>
                    Área perto do limite (acima de 80%): {percent(maps.summary.areaNearLimit, 0)} da roupa.
                  </p>
                </>
              ) : (
                <p data-clearance={`${maps.summary.minClearance.toFixed(1)}-${maps.summary.maxClearance.toFixed(1)}`}>
                  Folga de {formatCm(maps.summary.minClearance)} a {formatCm(maps.summary.maxClearance)} cm até o corpo.
                </p>
              )}
            </div>
          )}
        </div>

        {mode === "grade" ? (
          <p className="text-xs text-tinta-suave" data-grade-note>
            Cada tamanho veste o manequim com as medidas da sua linha na tabela. Para ajustar o molde, capturar imagens ou pedir aprovação,
            volte para Um tamanho.
          </p>
        ) : (
          <>
        <CapturesPanel
          captures={captures}
          onCapture={capture}
          onRemove={(i) => {
            setCaptures(captures.filter((_, k) => k !== i));
            setCaptureNote(null);
          }}
          disabled={status.kind !== "running" && status.kind !== "paused"}
          note={captureNote}
        >
          {approval && <ApprovalRequest requester={approval} settings={{ size, fabric, pose }} captures={captures} />}
        </CapturesPanel>

        <AdjustPanel
          doc={doc}
          edges={edges?.list ?? []}
          selected={selected}
          onSelect={setSelected}
          mode={saveMode}
          onApplied={applied}
          disabled={status.kind === "loading" || status.kind === "error"}
        />
        {notice && (
          <p className={`${ui.success} text-xs`} role="status" data-adjust-notice>
            {notice}
          </p>
        )}

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
          </>
        )}
        <p className="text-xs text-tinta-suave">
          Arraste para girar, use a roda ou dois dedos para aproximar.{mode === "um" ? " Clique numa borda para ajustar o molde." : ""}
        </p>
      </aside>
    </div>
  );
}
