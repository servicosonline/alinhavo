/// <reference lib="webworker" />
import { garmentAtSize, migratePattern, validatePattern, type FoldLine, type GarmentFinish, type PatternDocument, type Piece, type Seam } from "@alinhavo/geometry";
import {
  createMannequin,
  createSimulation,
  FABRICS,
  tuneFabric,
  type Fabric,
  floorCollider,
  garmentDecals,
  garmentUv,
  meshPiece,
  pieceHalf,
  placeGarment,
  summarizeMaps,
  vertexClearance,
  vertexStretch,
  createMotionRun,
  decodeMakeHuman,
  mannequinBuilder,
  motionClip,
  realisticBuilder,
  realisticModel,
  buildRealistic,
  type Body,
  type BodyBuilder,
  type MakeHumanAsset,
  type Collider,
  type MotionId,
  type MotionRun,
  type PieceMesh,
  type Simulation,
} from "@alinhavo/cloth";
import {
  MAPS_EVERY,
  PROVA_ITERATIONS,
  PROVA_MESH_SPACING,
  PROVA_SEWING_TIME,
  type FabricId,
  type FromWorker,
  type MotionReadyMessage,
  type ProvaMaps,
  type ProvaPart,
  type ProvaSetup,
  type ToWorker,
} from "./protocol";
import { buildProvaEdges } from "./edges";
import { lookSize, prefixPieces } from "./look";
import { MOTION_FPS, packFrames } from "./motion";

/**
 * Worker da Prova: monta corpo, malhas e simulação fora da tela e manda as
 * posições a cada quadro (e os mapas a cada MAPS_EVERY). O cálculo pesado
 * fica no navegador do usuário, nunca no servidor. Com look, as outras
 * roupas entram na mesma simulação, cada uma na sua camada e com o seu tecido;
 * o molde em prova vem primeiro (vértices e triângulos), para o resumo e as bordas.
 */

const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (msg: FromWorker, transfer: Transferable[] = []) => scope.postMessage(msg, transfer);

type Running = {
  sim: Simulation;
  body: Collider;
  /** Espessura do tecido do molde em prova (desconta da folga até o corpo). */
  thickness: number;
  fabricLimit: number;
  restArea: Float64Array;
  /** Triângulos e vértices do molde em prova (os primeiros da simulação). */
  mainTriangles: number;
  mainVertices: number;
  frame: number;
  /** Medidas do corpo (o movimento monta o corpo de novo em cada pose, pelo montador). */
  table: Record<string, number>;
  builder: BodyBuilder;
  /** Os obstáculos de em pé (voltam depois do movimento). */
  colliders: Collider[];
};

let current: Running | null = null;
let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Lê e confere um molde; `who` entra na mensagem de erro. */
function readDoc(raw: PatternDocument, who: string): PatternDocument {
  const doc = migratePattern(raw);
  if (!doc) throw new Error(`${who}: o molde não pôde ser lido.`);
  const erros = validatePattern(doc);
  if (erros.length > 0) throw new Error(`${who}: corrija o molde antes de provar: ${erros[0]}`);
  return doc;
}

type Wear = {
  name: string;
  main: boolean;
  pieces: Piece[];
  seams: Seam[];
  finishes: GarmentFinish[];
  /** Linha da dobra das peças abertas: a malha sai simétrica por ela. */
  foldLine: Record<string, FoldLine>;
  fabric: FabricId;
  /** Física do tecido desta roupa (o preset, ajustado pelo cadastro no molde em prova). */
  physics: Fabric;
  layer: number;
};

/** O arquivo do corpo realista, lido uma vez e só quando pedido (~600 KB, num pedaço à parte do Worker). */
let makehuman: Promise<MakeHumanAsset> | null = null;
function loadMakeHuman(): Promise<MakeHumanAsset> {
  makehuman ??= import("@alinhavo/cloth/makehuman-data").then((m) => decodeMakeHuman(m.MAKEHUMAN_DATA));
  return makehuman;
}

/** O corpo da Prova e o montador do movimento: o manequim ou o realista. */
async function makeBody(setup: ProvaSetup): Promise<{ body: Body; builder: BodyBuilder; notes: string[] }> {
  if (setup.bodyKind !== "makehuman") {
    return {
      body: createMannequin(setup.measurements, setup.pose, setup.body, setup.conditions),
      builder: mannequinBuilder(setup.measurements, setup.body ?? {}, setup.conditions ?? {}),
      notes: [],
    };
  }
  const c = setup.conditions ?? {};
  // Gestante vale no realista; membro cortado e salto ainda só no manequim.
  const model = realisticModel(await loadMakeHuman(), setup.measurements, setup.body ?? {}, setup.sex ?? "feminino", c.belly);
  const missing = Object.keys(c.limbs ?? {}).length > 0 || (c.heel ?? 0) > 0;
  return {
    body: buildRealistic(model, setup.pose).body,
    builder: realisticBuilder(model),
    notes: missing ? ["O corpo realista ainda não tem membro cortado nem salto: essas condições valem só no manequim."] : [],
  };
}

async function build(setup: ProvaSetup, fresh: () => boolean = () => true) {
  const doc = readDoc(setup.doc, "Molde");
  if (!doc.sizes.includes(setup.size)) throw new Error(`O tamanho ${setup.size} não está na grade.`);

  const made = await makeBody(setup);
  if (!fresh()) return;
  const body = made.body;
  const lookNotes: string[] = [...made.notes];
  const main = garmentAtSize(doc, setup.size);
  const open = new Set(setup.openZippers ?? []);
  const wears: Wear[] = [
    {
      name: "Molde em prova",
      main: true,
      pieces: main.pieces,
      seams: main.seams,
      finishes: main.finishes,
      foldLine: main.foldLine,
      fabric: setup.fabric,
      physics: tuneFabric(FABRICS[setup.fabric], setup.fabricTuning),
      layer: setup.layer ?? 0,
    },
  ];
  (setup.extras ?? []).forEach((extra, k) => {
    // Partes renomeadas: duas roupas podem ter partes com o mesmo id.
    const other = prefixPieces(readDoc(extra.doc, extra.name), `look${k + 1}:`);
    const { size, fallback } = lookSize(other, setup.size);
    if (fallback) lookNotes.push(`${extra.name} não tem o tamanho ${setup.size}: vestiu o ${size}.`);
    const g = garmentAtSize(other, size);
    wears.push({ name: extra.name, main: false, pieces: g.pieces, seams: g.seams, finishes: g.finishes, foldLine: g.foldLine, fabric: extra.fabric, physics: FABRICS[extra.fabric], layer: extra.layer });
  });

  const skipped: string[] = [];
  const meshes: PieceMesh[] = [];
  const placed: { piece: Piece; wear: Wear }[] = [];
  const seams: Seam[] = [];
  const parts: ProvaPart[] = [];
  let vertex = 0;
  let triangle = 0;
  for (const wear of wears) {
    const inProva = wear.pieces.filter((p) => p.placement);
    for (const p of wear.pieces) if (!p.placement) skipped.push(wear.main ? p.name : `${p.name} (${wear.name})`);
    if (inProva.length === 0) {
      if (wear.main) throw new Error("Nenhuma parte tem posição na Prova. Escolha o lado do corpo em cada parte, no editor.");
      lookNotes.push(`${wear.name} ficou de fora: nenhuma parte tem posição na Prova.`);
      continue;
    }
    const ids = new Set(inProva.map((p) => p.id));
    seams.push(...wear.seams.filter((s) => ids.has(s.a.piece) && ids.has(s.b.piece)));
    const start = vertex;
    const triStart = triangle;
    for (const piece of inProva) {
      const mesh = meshPiece(piece, { spacing: PROVA_MESH_SPACING, mirror: wear.foldLine[piece.id] });
      meshes.push(mesh);
      placed.push({ piece, wear });
      vertex += mesh.positions.length / 2;
      triangle += mesh.triangles.length / 3;
    }
    parts.push({ name: wear.name, main: wear.main, start, count: vertex - start, triStart, triCount: triangle - triStart, fabric: wear.fabric, fabricLimit: wear.physics.maxStretch });
  }

  // Zíper aberto: só o do molde em prova, nas peças que entraram na simulação.
  const simulated = new Set(placed.filter((p) => p.wear.main).map((p) => p.piece.id));
  const openings = main.openings.filter((o) => open.has(o.finishId) && simulated.has(o.piece));

  const initial = placeGarment(
    meshes.map((mesh, i) => ({ mesh, placement: placed[i]!.piece.placement!, half: pieceHalf(placed[i]!.piece), layer: placed[i]!.wear.layer })),
    body.landmarks,
  );
  const fabric = wears[0]!.physics;
  const sim = createSimulation(
    meshes.map((mesh, i) => ({ mesh, initial: initial[i], fabric: placed[i]!.wear.physics, layer: placed[i]!.wear.layer })),
    { fabric, seams, openings, colliders: [body.collider, floorCollider(0)], iterations: PROVA_ITERATIONS, sewingTime: PROVA_SEWING_TIME },
  );

  // Área de cada triângulo no molde, na ordem da simulação (para o resumo).
  const restArea = new Float64Array(sim.triangles.length / 3);
  let k = 0;
  let mainTriangles = 0;
  meshes.forEach((mesh, i) => {
    for (const a of mesh.restArea) restArea[k++] = a;
    if (placed[i]!.wear.main) mainTriangles += mesh.restArea.length;
  });
  const mainMeshes = meshes.filter((_, i) => placed[i]!.wear.main);

  current = {
    sim,
    body: body.collider,
    thickness: fabric.thickness,
    fabricLimit: fabric.maxStretch,
    restArea,
    mainTriangles,
    mainVertices: parts[0]!.count,
    frame: 0,
    table: setup.measurements,
    builder: made.builder,
    colliders: [body.collider, floorCollider(0)],
  };

  post({
    type: "ready",
    body: { positions: body.mesh.positions, indices: body.mesh.indices },
    garment: {
      positions: Float32Array.from(sim.positions),
      indices: Uint32Array.from(sim.triangles),
      uv: garmentUv(meshes, sim.pieceOffset, sim.vertexCount),
    },
    skipped,
    estimated: body.fit.reading.estimated,
    fabricLimit: fabric.maxStretch,
    parts,
    lookNotes,
    edges: buildProvaEdges(mainMeshes, sim.pieceOffset, main),
    // Acabamentos de todas as roupas, presos à malha (a cena os move com o tecido).
    decals: garmentDecals(
      wears.flatMap((w) => w.finishes),
      meshes,
      sim.pieceOffset,
    ),
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
    // Resumo do molde em prova: os primeiros triângulos e vértices da simulação.
    summary: summarizeMaps(
      triStretch.subarray(0, r.mainTriangles),
      r.restArea.subarray(0, r.mainTriangles),
      clearance.subarray(0, r.mainVertices),
      r.fabricLimit,
    ),
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

/** Preparo do movimento em andamento (um quadro por vez, para "parar" chegar no meio). */
let motionJob: { run: MotionRun; motion: MotionId; garment: Float32Array[]; body: Float32Array[] } | null = null;

function stopMotion() {
  if (!motionJob) return;
  motionJob = null;
  if (timer) clearTimeout(timer);
  timer = null;
  // A roupa volta ao corpo em pé, parado.
  if (current) current.sim.setColliders(current.colliders, Infinity);
}

function motionTick() {
  timer = null;
  const job = motionJob;
  if (!job || !current) return;
  const frame = job.run.next();
  if (frame) {
    job.garment.push(frame.positions);
    job.body.push(frame.body.positions);
    post({ type: "motion-progress", motion: job.motion, done: job.garment.length, total: job.run.frameCount });
    timer = setTimeout(motionTick, 0);
    return;
  }
  const garment = packFrames(job.garment);
  const body = packFrames(job.body);
  const ready: MotionReadyMessage = { type: "motion-ready", motion: job.motion, fps: MOTION_FPS, frames: job.garment.length, garment, body, seat: job.run.seat };
  motionJob = null;
  // O movimento termina em pé: a roupa continua no corpo parado.
  current.sim.setColliders(current.colliders, Infinity);
  post(ready, [garment.buffer, body.buffer]);
}

function startMotion(motion: MotionId) {
  const r = current;
  if (!r) throw new Error("Monte a Prova antes do movimento.");
  stopMotion();
  running = false;
  if (timer) clearTimeout(timer);
  timer = null;
  const run = createMotionRun(r.sim, {
    clip: motionClip(motion),
    table: r.table,
    builder: r.builder,
    fixed: [floorCollider(0)],
    fps: MOTION_FPS,
  });
  motionJob = { run, motion, garment: [], body: [] };
  motionTick();
}

/** Cada "init" ganha um número: um corpo realista que termina de carregar depois de outro "init" é descartado. */
let initSeq = 0;

const fail = (err: unknown) => {
  running = false;
  post({ type: "error", message: err instanceof Error ? err.message : "Erro inesperado na simulação." });
};

scope.onmessage = (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  try {
    if (msg.type === "init") {
      motionJob = null;
      running = false;
      if (timer) clearTimeout(timer);
      timer = null;
      current = null;
      const seq = ++initSeq;
      build(msg.setup, () => seq === initSeq).catch(fail);
    } else if (msg.type === "play") {
      if (!current || running || motionJob) return;
      running = true;
      tick();
    } else if (msg.type === "pause") {
      running = false;
    } else if (msg.type === "motion") {
      startMotion(msg.motion);
    } else if (msg.type === "motion-stop") {
      stopMotion();
    }
  } catch (err) {
    fail(err);
  }
};
