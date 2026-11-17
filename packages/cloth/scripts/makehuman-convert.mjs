#!/usr/bin/env node
/**
 * Converte os dados do MakeHuman (CC0) no arquivo compacto do corpo realista
 * da Prova (`src/body/makehuman-data.ts`). Roda fora do app, uma vez, quando
 * os dados mudarem. Lê só ARQUIVOS DE DADOS (malha, targets, esqueleto e
 * pesos): nenhum código do MakeHuman (AGPL) é lido, copiado ou executado.
 *
 * Uso (na raiz do monorepo):
 *   git clone --depth 1 --filter=blob:none --sparse https://github.com/makehumancommunity/makehuman.git <pasta>
 *   (cd <pasta> && git sparse-checkout set makehuman/data/3dobjs makehuman/data/targets/macrodetails \
 *      makehuman/data/targets/measure makehuman/data/targets/torso makehuman/data/targets/stomach makehuman/data/rigs)
 *   node packages/cloth/scripts/makehuman-convert.mjs <pasta>/makehuman/data
 *
 * Origem e licença de cada arquivo: docs/06-riscos-e-licencas.md.
 *
 * Formato (todos little-endian; coordenadas do MakeHuman, que já são as da
 * Prova: Y para cima, frente em +Z, esquerda em +X; posições em 0,1 mm):
 *   cabeçalho JSON (comprimento em uint32 antes) com os nomes e as contagens;
 *   depois, em ordem: triângulos (uint16 × 3), posições da base feminina
 *   (int16 × 3 por vértice, os de desenho e depois os auxiliares das
 *   articulações), pesos de pele (por vértice de desenho, 4 × [grupo uint8,
 *   peso uint8]) e os targets (por target: índices uint16 e deltas int16 × 3).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const dataDir = process.argv[2];
if (!dataDir) {
  console.error("Uso: node makehuman-convert.mjs <pasta makehuman/data>");
  process.exit(1);
}
const here = dirname(fileURLToPath(import.meta.url));
const outFile = join(here, "..", "src", "body", "makehuman-data.ts");

/** Grupos de pele da Prova (os ossos do MakeHuman somados). */
const GROUPS = ["tronco", "bracoE", "antebracoE", "maoE", "bracoD", "antebracoD", "maoD", "coxaE", "canelaE", "peE", "coxaD", "canelaD", "peD"];

/** Osso do MakeHuman → grupo. Clavícula, peito, pescoço e cabeça andam com o tronco. */
function groupOf(bone) {
  const side = bone.endsWith(".L") ? "E" : bone.endsWith(".R") ? "D" : null;
  if (!side) return "tronco";
  if (/^(shoulder01|upperarm0[12])\./.test(bone)) return `braco${side}`;
  if (/^lowerarm0[12]\./.test(bone)) return `antebraco${side}`;
  if (/^(wrist|metacarpal|finger)/.test(bone)) return `mao${side}`;
  if (/^upperleg0[12]\./.test(bone)) return `coxa${side}`;
  if (/^lowerleg0[12]\./.test(bone)) return `canela${side}`;
  if (/^(foot|toe)/.test(bone)) return `pe${side}`;
  return "tronco"; // pelvis, clavicle, breast, olhos, orelhas…
}

/** Articulações usadas (cabeça do osso no esqueleto do MakeHuman). */
const JOINTS = {
  quadrilE: "upperleg01.L",
  joelhoE: "lowerleg01.L",
  tornozeloE: "foot.L",
  quadrilD: "upperleg01.R",
  joelhoD: "lowerleg01.R",
  tornozeloD: "foot.R",
  ombroE: "upperarm01.L",
  cotoveloE: "lowerarm01.L",
  punhoE: "wrist.L",
  ombroD: "upperarm01.R",
  cotoveloD: "lowerarm01.R",
  punhoD: "wrist.R",
  pescoco: "neck01",
  cabeca: "head",
};

/**
 * Targets: medidas (um par aumenta/diminui por medida da tabela), a forma do
 * tronco (costas em V), a barriga de gestante e o peso (mais magro, mais
 * cheio). `pair`: o "decr" vale para o peso negativo.
 */
const TARGETS = [
  { id: "busto", pair: "measure/measure-bust-circ" },
  { id: "cintura", pair: "measure/measure-waist-circ" },
  { id: "quadril", pair: "measure/measure-hips-circ" },
  { id: "alturaDoQuadril", pair: "measure/measure-waisttohip-dist" },
  { id: "coxaAltura", pair: "measure/measure-upperleg-height" },
  { id: "canelaAltura", pair: "measure/measure-lowerleg-height" },
  { id: "bracoComprimento", pair: "measure/measure-upperarm-length" },
  { id: "antebracoComprimento", pair: "measure/measure-lowerarm-length" },
  { id: "punho", pair: "measure/measure-wrist-circ" },
  { id: "ombro", pair: "measure/measure-shoulder-dist" },
  { id: "pescoco", pair: "measure/measure-neck-circ" },
  { id: "coxa", pair: "measure/measure-thigh-circ" },
  { id: "joelho", pair: "measure/measure-knee-circ" },
  { id: "tornozelo", pair: "measure/measure-ankle-circ" },
  { id: "braco", pair: "measure/measure-upperarm-circ" },
  { id: "costas", pair: "torso/torso-vshape" },
  { id: "gestante", incr: "stomach/stomach-pregnant-incr", decr: "stomach/stomach-pregnant-decr" },
  { id: "pesoF", incr: "macrodetails/universal-female-young-averagemuscle-maxweight", decr: "macrodetails/universal-female-young-averagemuscle-minweight" },
  { id: "pesoM", incr: "macrodetails/universal-male-young-averagemuscle-maxweight", decr: "macrodetails/universal-male-young-averagemuscle-minweight" },
];

// --- Malha base ---------------------------------------------------------------
const objText = readFileSync(join(dataDir, "3dobjs", "base.obj"), "utf8");
const V = [];
const bodyFaces = [];
let group = "";
for (const line of objText.split("\n")) {
  if (line.startsWith("v ")) {
    const p = line.trim().split(/\s+/);
    V.push([+p[1], +p[2], +p[3]]);
  } else if (line.startsWith("g ")) group = line.slice(2).trim();
  else if (line.startsWith("f ") && group === "body") {
    bodyFaces.push(line.trim().split(/\s+/).slice(1).map((t) => parseInt(t, 10) - 1));
  }
}
const skel = JSON.parse(readFileSync(join(dataDir, "rigs", "default.mhskel"), "utf8"));
const weightsFile = JSON.parse(readFileSync(join(dataDir, "rigs", "default_weights.mhw"), "utf8"));

// Vértices de desenho (os da pele, grupo "body") e os auxiliares das articulações usadas.
const used = new Set(bodyFaces.flat());
const drawn = [...used].sort((a, b) => a - b);
const jointVerts = new Set();
for (const bone of Object.values(JOINTS)) for (const i of skel.joints[skel.bones[bone].head]) if (!used.has(i)) jointVerts.add(i);
const order = [...drawn, ...[...jointVerts].sort((a, b) => a - b)];
const newIndex = new Map(order.map((old, i) => [old, i]));
if (order.length > 65535) throw new Error("vértices demais para uint16");

const tris = [];
for (const f of bodyFaces) for (let k = 1; k + 1 < f.length; k++) tris.push(newIndex.get(f[0]), newIndex.get(f[k]), newIndex.get(f[k + 1]));

// --- Targets ------------------------------------------------------------------
function readTarget(rel) {
  const text = readFileSync(join(dataDir, "targets", `${rel}.target`), "utf8");
  const out = new Map();
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const p = line.trim().split(/\s+/);
    if (p.length < 4) continue;
    out.set(parseInt(p[0], 10), [+p[1], +p[2], +p[3]]);
  }
  return out;
}
const Q = 1000; // unidade do MakeHuman (dm) → 0,1 mm
const q = (v) => Math.round(v * Q);

/** Média de vários targets (o corpo neutro de cada etnia). */
function mean(rels) {
  const out = new Map();
  for (const rel of rels) for (const [i, d] of readTarget(rel)) {
    const acc = out.get(i) ?? [0, 0, 0];
    for (let k = 0; k < 3; k++) acc[k] += d[k] / rels.length;
    out.set(i, acc);
  }
  return out;
}

// Base feminina: a malha do MakeHuman com a média das três etnias femininas
// jovens (a "universal-female-young-averagemuscle-averageweight" é vazia: a malha base já é ela).
const ethnic = (sex) => ["african", "asian", "caucasian"].map((e) => `macrodetails/${e}-${sex}-young`);
const femaleDelta = mean(ethnic("female"));
const femalePos = order.map((old) => {
  const d = femaleDelta.get(old) ?? [0, 0, 0];
  return [V[old][0] + d[0], V[old][1] + d[1], V[old][2] + d[2]];
});
// Base masculina como target da feminina: universal masculino + etnias masculinas − etnias femininas.
const maleUniversal = readTarget("macrodetails/universal-male-young-averagemuscle-averageweight");
const maleEthnic = mean(ethnic("male"));
const maleDelta = new Map();
for (const i of new Set([...maleUniversal.keys(), ...maleEthnic.keys(), ...femaleDelta.keys()])) {
  const a = maleUniversal.get(i) ?? [0, 0, 0];
  const b = maleEthnic.get(i) ?? [0, 0, 0];
  const c = femaleDelta.get(i) ?? [0, 0, 0];
  maleDelta.set(i, [a[0] + b[0] - c[0], a[1] + b[1] - c[1], a[2] + b[2] - c[2]]);
}

/** Target esparso nos vértices guardados, quantizado (deltas menores que 0,1 mm caem). */
function sparse(map) {
  const idx = [];
  const d = [];
  for (const [old, v] of map) {
    const i = newIndex.get(old);
    if (i === undefined) continue;
    const qv = v.map(q);
    if (qv.every((x) => x === 0)) continue;
    for (const x of qv) if (Math.abs(x) > 32767) throw new Error("delta grande demais");
    idx.push(i);
    d.push(...qv);
  }
  const ord = idx.map((_, k) => k).sort((a, b) => idx[a] - idx[b]);
  return { idx: Uint16Array.from(ord.map((k) => idx[k])), d: Int16Array.from(ord.flatMap((k) => d.slice(k * 3, k * 3 + 3))) };
}

const targetList = [{ id: "masculino", kind: "incr", data: sparse(maleDelta) }];
const files = new Set(["3dobjs/base.obj", "rigs/default.mhskel", "rigs/default_weights.mhw", ...ethnic("female").map((r) => `targets/${r}.target`), ...ethnic("male").map((r) => `targets/${r}.target`), "targets/macrodetails/universal-male-young-averagemuscle-averageweight.target"]);
for (const t of TARGETS) {
  const incr = t.pair ? `${t.pair}-incr` : t.incr;
  const decr = t.pair ? `${t.pair}-decr` : t.decr;
  targetList.push({ id: t.id, kind: "incr", data: sparse(readTarget(incr)) });
  targetList.push({ id: t.id, kind: "decr", data: sparse(readTarget(decr)) });
  files.add(`targets/${incr}.target`);
  files.add(`targets/${decr}.target`);
}

// --- Pesos de pele ---------------------------------------------------------------
const acc = drawn.map(() => new Float64Array(GROUPS.length));
for (const [bone, list] of Object.entries(weightsFile.weights)) {
  const g = GROUPS.indexOf(groupOf(bone));
  for (const [old, w] of list) {
    const i = newIndex.get(old);
    if (i !== undefined && i < drawn.length) acc[i][g] += w;
  }
}
const skin = new Uint8Array(drawn.length * 8);
acc.forEach((w, i) => {
  const top = [...w.keys()].sort((a, b) => w[b] - w[a]).slice(0, 4).filter((g) => w[g] > 0);
  if (top.length === 0) top.push(0), (w[0] = 1);
  const sum = top.reduce((s, g) => s + w[g], 0);
  let left = 255;
  top.forEach((g, k) => {
    const v = k === top.length - 1 ? left : Math.round((w[g] / sum) * 255);
    left -= v;
    skin[i * 8 + k * 2] = g;
    skin[i * 8 + k * 2 + 1] = v;
  });
});

// --- Gravação -------------------------------------------------------------------
const joints = Object.fromEntries(Object.entries(JOINTS).map(([k, bone]) => [k, skel.joints[skel.bones[bone].head].map((old) => newIndex.get(old))]));
let commit = "desconhecido";
try {
  commit = execSync("git rev-parse HEAD", { cwd: dataDir }).toString().trim();
} catch {
  /* fora de um clone git */
}
const header = {
  formato: 1,
  origem: { repositorio: "https://github.com/makehumancommunity/makehuman", commit, licenca: "CC0 1.0 Universal", arquivos: [...files].sort() },
  vertices: order.length,
  desenho: drawn.length,
  triangulos: tris.length / 3,
  grupos: GROUPS,
  articulacoes: joints,
  targets: targetList.map((t) => ({ id: t.id, tipo: t.kind, n: t.data.idx.length })),
};
const parts = [Uint16Array.from(tris), Int16Array.from(femalePos.flat().map(q)), skin];
for (const t of targetList) parts.push(t.data.idx, t.data.d);
const headerBytes = new TextEncoder().encode(JSON.stringify(header));
// Cada seção começa alinhada a 2 bytes (uint16/int16).
const pad = (n) => (n % 2 === 0 ? 0 : 1);
let size = 4 + headerBytes.length + pad(headerBytes.length);
for (const p of parts) size += p.byteLength + pad(p.byteLength);
const buf = new Uint8Array(size);
new DataView(buf.buffer).setUint32(0, headerBytes.length, true);
buf.set(headerBytes, 4);
let at = 4 + headerBytes.length + pad(headerBytes.length);
for (const p of parts) {
  buf.set(new Uint8Array(p.buffer, p.byteOffset, p.byteLength), at);
  at += p.byteLength + pad(p.byteLength);
}
const b64 = Buffer.from(buf).toString("base64");
const ts = `// Gerado por scripts/makehuman-convert.mjs: não edite à mão.
// Dados do MakeHuman (${header.origem.repositorio}, commit ${commit}), CC0 1.0 Universal.
// Só dados (malha, targets, esqueleto e pesos); nenhum código do MakeHuman. Ver docs/06-riscos-e-licencas.md.
export const MAKEHUMAN_DATA = "${b64}";
`;
writeFileSync(outFile, ts);
console.log(`ok: ${order.length} vértices (${drawn.length} de desenho), ${tris.length / 3} triângulos, ${targetList.length} targets`);
console.log(`binário ${(buf.length / 1024).toFixed(0)} KB, base64 ${(b64.length / 1024).toFixed(0)} KB`);
for (const t of header.targets) console.log(`  ${t.id} ${t.tipo}: ${t.n}`);
