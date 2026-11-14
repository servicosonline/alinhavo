/// <reference lib="webworker" />
import { garmentAtSize, migratePattern, validatePattern } from "@alinhavo/geometry";
import {
  createMannequin,
  createSimulation,
  FABRICS,
  floorCollider,
  meshPiece,
  placeGarment,
  summarizeMaps,
  vertexClearance,
  vertexStretch,
  type Collider,
  type Simulation,
} from "@alinhavo/cloth";
import {
  MAPS_EVERY,
  PROVA_ITERATIONS,
  PROVA_MESH_SPACING,
  type FromWorker,
  type ProvaMaps,
  type ProvaSetup,
  type ToWorker,
} from "./protocol";
import { buildProvaEdges } from "./edges";

/**
 * Worker da Prova: monta corpo, malhas e simulação fora da tela e manda as
 * posições a cada quadro (e os mapas a cada MAPS_EVERY). O cálculo pesado
 * fica no navegador do usuário, nunca no servidor.
 */

const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (msg: FromWorker, transfer: Transferable[] = []) => scope.postMessage(msg, transfer);

type Running = {
  sim: Simulation;
  body: Collider;
  thickness: number;
  fabricLimit: number;
  restArea: Float64Array;
  frame: number;
};

let current: Running | null = null;
let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;

function build(setup: ProvaSetup) {
  const doc = migratePattern(setup.doc);
  if (!doc) throw new Error("O molde não pôde ser lido.");
  const erros = validatePattern(doc);
  if (erros.length > 0) throw new Error(`Corrija o molde antes de provar: ${erros[0]}`);
  if (!doc.sizes.includes(setup.size)) throw new Error(`O tamanho ${setup.size} não está na grade.`);

  const fabric = FABRICS[setup.fabric];
  const body = createMannequin(setup.measurements, setup.pose);
  const garment = garmentAtSize(doc, setup.size);
  const placed = garment.pieces.filter((p) => p.placement);
  const skipped = garment.pieces.filter((p) => !p.placement).map((p) => p.name);
  if (placed.length === 0) throw new Error("Nenhuma parte tem posição na Prova. Escolha o lado do corpo em cada parte, no editor.");
  const ids = new Set(placed.map((p) => p.id));
  const seams = garment.seams.filter((s) => ids.has(s.a.piece) && ids.has(s.b.piece));

  const meshes = placed.map((p) => meshPiece(p, { spacing: PROVA_MESH_SPACING }));
  const initial = placeGarment(
    meshes.map((mesh, i) => ({ mesh, placement: placed[i]!.placement! })),
    body.landmarks,
  );
  const sim = createSimulation(
    meshes.map((mesh, i) => ({ mesh, initial: initial[i] })),
    { fabric, seams, colliders: [body.collider, floorCollider(0)], iterations: PROVA_ITERATIONS },
  );

  // Área de cada triângulo no molde, na ordem da simulação (para o resumo).
  const restArea = new Float64Array(sim.triangles.length / 3);
  let k = 0;
  for (const mesh of meshes) for (const a of mesh.restArea) restArea[k++] = a;

  current = { sim, body: body.collider, thickness: fabric.thickness, fabricLimit: fabric.maxStretch, restArea, frame: 0 };

  post({
    type: "ready",
    body: { positions: body.mesh.positions, indices: body.mesh.indices },
    garment: { positions: Float32Array.from(sim.positions), indices: Uint32Array.from(sim.triangles) },
    skipped,
    estimated: body.fit.reading.estimated,
    fabricLimit: fabric.maxStretch,
    edges: buildProvaEdges(meshes, sim.pieceOffset, garment.origin),
  });
}

function maps(r: Running): ProvaMaps {
  const triStretch = r.sim.triangleStretch();
  const stretch = vertexStretch(r.sim.triangles, triStretch, r.sim.vertexCount);
  // Folga só até o corpo (o chão não conta).
  const clearance = vertexClearance(r.sim.positions, [r.body], r.thickness);
  return {
    stretch: Float32Array.from(stretch),
    clearance: Float32Array.from(clearance),
    summary: summarizeMaps(triStretch, r.restArea, clearance, r.fabricLimit),
  };
}

function tick() {
  timer = null;
  const r = current;
  if (!running || !r) return;
  r.sim.step();
  const withMaps = r.frame % MAPS_EVERY === 0 ? maps(r) : undefined;
  r.frame++;
  post({ type: "frame", positions: Float32Array.from(r.sim.positions), time: r.sim.time, seamGap: r.sim.seamGap(), maps: withMaps });
  timer = setTimeout(tick, 0);
}

scope.onmessage = (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  try {
    if (msg.type === "init") {
      running = false;
      if (timer) clearTimeout(timer);
      timer = null;
      current = null;
      build(msg.setup);
    } else if (msg.type === "play") {
      if (!current || running) return;
      running = true;
      tick();
    } else if (msg.type === "pause") {
      running = false;
    }
  } catch (err) {
    running = false;
    post({ type: "error", message: err instanceof Error ? err.message : "Erro inesperado na simulação." });
  }
};
