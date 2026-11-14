/// <reference lib="webworker" />
import { garmentAtSize, migratePattern, validatePattern } from "@alinhavo/geometry";
import {
  createMannequin,
  createSimulation,
  FABRICS,
  floorCollider,
  meshPiece,
  placeGarment,
  type Simulation,
} from "@alinhavo/cloth";
import { PROVA_ITERATIONS, PROVA_MESH_SPACING, type FromWorker, type ProvaSetup, type ToWorker } from "./protocol";

/**
 * Worker da Prova: monta corpo, malhas e simulação fora da tela e manda as
 * posições a cada quadro. O cálculo pesado fica no navegador do usuário,
 * nunca no servidor.
 */

const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (msg: FromWorker, transfer: Transferable[] = []) => scope.postMessage(msg, transfer);

let sim: Simulation | null = null;
let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;

function build(setup: ProvaSetup) {
  const doc = migratePattern(setup.doc);
  if (!doc) throw new Error("O molde não pôde ser lido.");
  const erros = validatePattern(doc);
  if (erros.length > 0) throw new Error(`Corrija o molde antes de provar: ${erros[0]}`);
  if (!doc.sizes.includes(setup.size)) throw new Error(`O tamanho ${setup.size} não está na grade.`);

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
  sim = createSimulation(
    meshes.map((mesh, i) => ({ mesh, initial: initial[i] })),
    {
      fabric: FABRICS[setup.fabric],
      seams,
      colliders: [body.collider, floorCollider(0)],
      iterations: PROVA_ITERATIONS,
    },
  );

  // Triângulos da roupa com índices globais (a ordem das partes é a da simulação).
  const indices: number[] = [];
  let offset = 0;
  for (const mesh of meshes) {
    for (const t of mesh.triangles) indices.push(t + offset);
    offset += mesh.positions.length / 2;
  }

  post(
    {
      type: "ready",
      body: { positions: body.mesh.positions, indices: body.mesh.indices },
      garment: { positions: Float32Array.from(sim.positions), indices: Uint32Array.from(indices) },
      skipped,
      estimated: body.fit.reading.estimated,
    },
  );
}

function tick() {
  timer = null;
  if (!running || !sim) return;
  sim.step();
  post({ type: "frame", positions: Float32Array.from(sim.positions), time: sim.time, seamGap: sim.seamGap() });
  timer = setTimeout(tick, 0);
}

scope.onmessage = (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  try {
    if (msg.type === "init") {
      running = false;
      if (timer) clearTimeout(timer);
      timer = null;
      sim = null;
      build(msg.setup);
    } else if (msg.type === "play") {
      if (!sim || running) return;
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
