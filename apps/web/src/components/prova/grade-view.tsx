"use client";

import type { PatternDocument } from "@alinhavo/geometry";
import type { BodyKind, BodySex, MapSummary } from "@alinhavo/cloth";
import { useCallback, useEffect, useRef, useState } from "react";
import { GRADE_SETTLE_TIME, GRADE_STATE_NAME, gradeConcurrency, nextToStart, tightestSize, type GradeSlotState } from "@/lib/prova/grade";
import type { LookExtra } from "@/lib/prova/look";
import { garmentPaint } from "@/lib/prova/paint";
import type { FabricId, FromWorker, PoseId, ProvaMaps, ProvaPart, ToWorker } from "@/lib/prova/protocol";
import type { RenderQuality } from "@/lib/prova/quality";
import { formatCm } from "@/lib/units";
import type { GradeScene } from "./grade-scene";

export type GradeMapView = "tecido" | "pressao" | "folga";

type Row = {
  size: string;
  state: GradeSlotState;
  time: number;
  summary: MapSummary | null;
  message?: string;
};

type Props = {
  doc: PatternDocument;
  measurementsBySize: Record<string, Record<string, number>>;
  fabric: FabricId;
  pose: PoseId;
  /** Corpo: manequim ou realista (e a base do realista). */
  bodyKind?: BodyKind;
  sex?: BodySex;
  /** Cor do tecido (vista "tecido"). */
  color: string;
  view: GradeMapView;
  /** Look: camada do molde em prova e as outras roupas (cada tamanho veste o look inteiro). */
  layer: number;
  extras: LookExtra[];
  /** Qualidade do desenho (a mesma da Prova de um tamanho). */
  quality: RenderQuality;
};

const percent = (fraction: number, digits = 1) => `${(fraction * 100).toLocaleString("pt-BR", { maximumFractionDigits: digits })}%`;

/**
 * Grade inteira na Prova: um manequim por tamanho, com as medidas da sua linha
 * da tabela, lado a lado. Cada tamanho roda no seu Worker (o mesmo da Prova de
 * um tamanho); alguns de cada vez, e cada um para em GRADE_SETTLE_TIME s, com a
 * roupa assentada, para comparar. Só mostra: ajuste, captura e aprovação ficam
 * na Prova de um tamanho.
 */
export function GradeView({ doc, measurementsBySize, fabric, pose, bodyKind = "manequim", sex = "feminino", color, view, layer, extras, quality }: Props) {
  const viewRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GradeScene | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [fabricLimit, setFabricLimit] = useState(0.05);
  /** Últimos mapas de cada tamanho, para repintar ao trocar a vista. */
  const mapsRef = useRef<(ProvaMaps | null)[]>([]);
  /** Roupas (com o look) e total de vértices de cada tamanho. */
  const partsRef = useRef<{ parts: ProvaPart[]; vertices: number }[]>([]);
  const colorRef = useRef(color);
  const viewModeRef = useRef(view);
  const qualityRef = useRef(quality);

  /** Pinta um tamanho conforme a vista. Só lê refs: é estável. */
  const paint = useCallback((i: number) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const { parts, vertices } = partsRef.current[i] ?? { parts: [], vertices: 0 };
    scene.setMapColors(i, garmentPaint(viewModeRef.current, mapsRef.current[i] ?? null, parts, vertices), colorRef.current);
  }, []);

  // Cena: criada uma vez, descartada ao sair.
  useEffect(() => {
    let disposed = false;
    import("./grade-scene").then(({ GradeScene }) => {
      if (disposed || !viewRef.current) return;
      sceneRef.current = new GradeScene(viewRef.current, qualityRef.current);
      setSceneReady(true);
    });
    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Molde, tecido, pose ou medidas: a grade recomeça do zero.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!sceneReady || !scene) return;
    const sizes = doc.sizes;
    const states: GradeSlotState[] = sizes.map(() => "fila");
    const workers: (Worker | null)[] = sizes.map(() => null);
    const concurrency = gradeConcurrency(navigator.hardwareConcurrency, sizes.length);
    mapsRef.current = sizes.map(() => null);
    partsRef.current = sizes.map(() => ({ parts: [], vertices: 0 }));
    scene.setSizes(sizes);
    setRows(sizes.map((size) => ({ size, state: "fila", time: 0, summary: null })));

    const patch = (i: number, next: Partial<Row>) => setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...next } : r)));
    const finish = (i: number, state: "pronto" | "erro", message?: string) => {
      states[i] = state;
      workers[i]?.terminate();
      workers[i] = null;
      patch(i, { state, ...(message ? { message } : {}) });
      startNext();
    };
    const start = (i: number) => {
      states[i] = "montando";
      patch(i, { state: "montando" });
      const worker = new Worker(new URL("../../lib/prova/prova.worker.ts", import.meta.url), { type: "module" });
      workers[i] = worker;
      worker.onmessage = (e: MessageEvent<FromWorker>) => {
        const msg = e.data;
        // Mensagem que chegou depois de o tamanho terminar: ignora.
        if (states[i] !== "montando" && states[i] !== "simulando") return;
        if (msg.type === "ready") {
          scene.setBody(i, msg.body.positions, msg.body.indices);
          scene.setGarment(i, msg.garment.positions, msg.garment.indices, colorRef.current, msg.decals, msg.garment.uv, msg.parts);
          partsRef.current[i] = { parts: msg.parts, vertices: msg.garment.positions.length / 3 };
          setFabricLimit(msg.fabricLimit);
          paint(i);
          states[i] = "simulando";
          patch(i, { state: "simulando" });
          worker.postMessage({ type: "play" } satisfies ToWorker);
        } else if (msg.type === "frame") {
          scene.updateGarment(i, msg.positions);
          if (!msg.maps) return;
          mapsRef.current[i] = msg.maps;
          if (viewModeRef.current !== "tecido") paint(i);
          patch(i, { time: msg.time, summary: msg.maps.summary });
          // Pronto num quadro com mapa: a tabela fica com o estado final.
          if (msg.time >= GRADE_SETTLE_TIME) finish(i, "pronto");
        } else if (msg.type === "error") {
          finish(i, "erro", msg.message);
        }
      };
      worker.postMessage({
        type: "init",
        setup: {
          doc,
          size: sizes[i]!,
          measurements: measurementsBySize[sizes[i]!] ?? {},
          fabric,
          pose,
          bodyKind,
          sex,
          layer,
          extras,
        },
      } satisfies ToWorker);
    };
    const startNext = () => {
      for (const i of nextToStart(states, concurrency)) start(i);
    };
    startNext();
    return () => {
      for (const w of workers) w?.terminate();
    };
  }, [sceneReady, doc, measurementsBySize, fabric, pose, bodyKind, sex, layer, extras, paint]);

  // Trocar a qualidade refaz os materiais (e repinta, que eles voltam na cor do tecido).
  useEffect(() => {
    qualityRef.current = quality;
    sceneRef.current?.setQuality(quality);
    for (let i = 0; i < mapsRef.current.length; i++) paint(i);
  }, [quality, paint]);

  // Trocar a vista ou a cor do tecido só repinta.
  useEffect(() => {
    colorRef.current = color;
    viewModeRef.current = view;
    for (let i = 0; i < mapsRef.current.length; i++) paint(i);
  }, [color, view, paint]);

  const tightest = tightestSize(rows);
  const done = rows.filter((r) => r.state === "pronto").length;

  return (
    <div className="space-y-3">
      <div
        ref={viewRef}
        className="relative h-[60vh] min-h-[22rem] overflow-hidden rounded-lg border border-tinta/15 bg-papel lg:h-[calc(100vh-22rem)]"
        data-grade-view
      >
        {!sceneReady && (
          <p className="absolute inset-x-0 top-3 text-center text-xs text-tinta-suave" role="status">
            Montando a grade…
          </p>
        )}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-tinta/10 bg-white">
        <table className="w-full text-left text-xs" data-grade-table>
          <caption className="px-3 pt-2 text-left text-tinta-suave" aria-live="polite">
            {done === rows.length && rows.length > 0
              ? `Grade pronta: ${rows.length} tamanhos, cada um com ${GRADE_SETTLE_TIME} s de simulação.`
              : `${done} de ${rows.length} tamanhos prontos. Cada tamanho para em ${GRADE_SETTLE_TIME} s, com a roupa assentada.`}
          </caption>
          <thead className="text-tinta-suave">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                Tamanho
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Pressão alta
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Perto do limite
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Folga
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size} className="border-t border-tinta/10" data-grade-row={r.size} data-state={r.state}>
                <th scope="row" className="px-3 py-1.5 font-medium">
                  {r.size}
                  {r.size === doc.baseSize ? " (base)" : ""}
                  {r.size === tightest && rows.filter((x) => x.summary).length > 1 && (
                    <span className="ml-1.5 rounded bg-linha/10 px-1.5 py-0.5 text-[10px] font-normal text-linha">mais justo</span>
                  )}
                </th>
                <td className="px-3 py-1.5" data-high-stretch={r.summary?.highStretch.toFixed(4) ?? ""}>
                  {r.summary ? `${percent(r.summary.highStretch)} (${percent(r.summary.highStretch / fabricLimit, 0)} do limite)` : "—"}
                </td>
                <td className="px-3 py-1.5">{r.summary ? percent(r.summary.areaNearLimit) : "—"}</td>
                <td className="px-3 py-1.5">{r.summary ? `${formatCm(r.summary.minClearance)} a ${formatCm(r.summary.maxClearance)} cm` : "—"}</td>
                <td className={`px-3 py-1.5 ${r.state === "erro" ? "text-linha" : ""}`}>
                  {r.state === "erro" ? (r.message ?? GRADE_STATE_NAME.erro) : GRADE_STATE_NAME[r.state]}
                  {r.state === "simulando" ? ` · ${r.time.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
