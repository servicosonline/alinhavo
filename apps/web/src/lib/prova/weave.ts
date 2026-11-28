import type { FabricId } from "./protocol";

/**
 * Aparência de cada tecido na Prova: trama (relevo e cor dos fios), brilho e
 * tamanho real do ladrilho. Tudo gerado aqui, sem imagem de fora (sem
 * licença e sem download). Os valores são de olho, como os presets da
 * simulação: a calibrar com tecido de verdade.
 *
 * O ladrilho da trama vai no UV da roupa, que está em mm no tecido plano
 * (`garmentUv`): `tileMm` é quanto tecido real um ladrilho cobre, e os fios
 * saem alinhados ao fio do molde.
 *
 * Duas escalas: a trama (fração de mm) vai só no relevo, porque de longe ela
 * fica menor que um pixel e some; a cor leva o mesclado (fiapos ao longo do
 * fio e manchas leves, em cm), que é o que faz o tecido parecer tecido na
 * distância da Prova.
 */

export type WeaveKind = "tela" | "sarja" | "jersey";

export type FabricLook = {
  weave: WeaveKind;
  /** Lado do ladrilho da trama, em mm de tecido. */
  tileMm: number;
  /** Fios (ou colunas de malha) por ladrilho, em cada direção. */
  threads: number;
  /** Força do relevo no mapa de normais. */
  normalScale: number;
  roughness: number;
  /** Brilho aveludado das fibras (0 a 1), visto de raspão. */
  sheen: number;
  sheenRoughness: number;
  /** Lado do ladrilho do mesclado, em mm de tecido. */
  heatherMm: number;
  /** Fiapos (fios de tom diferente) por ladrilho do mesclado, na trama. */
  heatherStreaks: number;
  /** Quanto o mesclado escurece a cor no ponto mais escuro (0 a 1). No jeans, o índigo irregular. */
  heather: number;
  /** Fração de luz que atravessa o tecido (0 = opaco, 1 = transparente). Só chiffon, linho fino e viscose. */
  transmission?: number;
  /** Distância em mm para a luz perder metade da intensidade dentro do tecido (espessura óptica). */
  attenuationDistance?: number;
  /** Cor da luz após atravessar o tecido (hex). Tinge a translucidez com a cor do próprio tecido. */
  attenuationColor?: string;
};

export const FABRIC_LOOK: Record<FabricId, FabricLook> = {
  planoLeve: { weave: "tela", tileMm: 4, threads: 12, normalScale: 0.35, roughness: 0.82, sheen: 0.35, sheenRoughness: 0.55, heatherMm: 50, heatherStreaks: 50, heather: 0.05 },
  malha: { weave: "jersey", tileMm: 6, threads: 4, normalScale: 0.7, roughness: 0.9, sheen: 0.55, sheenRoughness: 0.45, heatherMm: 50, heatherStreaks: 40, heather: 0.07 },
  jeans: { weave: "sarja", tileMm: 6, threads: 12, normalScale: 0.85, roughness: 0.93, sheen: 0.12, sheenRoughness: 0.7, heatherMm: 80, heatherStreaks: 64, heather: 0.24 },
  // Biblioteca (nov/2026): também de olho, a calibrar.
  tricoline: { weave: "tela", tileMm: 3, threads: 14, normalScale: 0.3, roughness: 0.8, sheen: 0.3, sheenRoughness: 0.55, heatherMm: 50, heatherStreaks: 50, heather: 0.04 },
  viscose: { weave: "tela", tileMm: 3, threads: 14, normalScale: 0.2, roughness: 0.65, sheen: 0.6, sheenRoughness: 0.35, heatherMm: 50, heatherStreaks: 40, heather: 0.03, transmission: 0.2, attenuationDistance: 3, attenuationColor: "#f5f0e8" },
  linho: { weave: "tela", tileMm: 6, threads: 10, normalScale: 0.6, roughness: 0.92, sheen: 0.2, sheenRoughness: 0.65, heatherMm: 40, heatherStreaks: 80, heather: 0.14, transmission: 0.3, attenuationDistance: 5, attenuationColor: "#f0e8d8" },
  crepe: { weave: "tela", tileMm: 2, threads: 16, normalScale: 0.5, roughness: 0.88, sheen: 0.35, sheenRoughness: 0.5, heatherMm: 40, heatherStreaks: 40, heather: 0.05 },
  chiffon: { weave: "tela", tileMm: 2, threads: 16, normalScale: 0.15, roughness: 0.6, sheen: 0.7, sheenRoughness: 0.3, heatherMm: 50, heatherStreaks: 30, heather: 0.02, transmission: 0.6, attenuationDistance: 2, attenuationColor: "#fff8f0" },
  sarja: { weave: "sarja", tileMm: 5, threads: 12, normalScale: 0.7, roughness: 0.9, sheen: 0.15, sheenRoughness: 0.65, heatherMm: 60, heatherStreaks: 50, heather: 0.08 },
  jeansElastano: { weave: "sarja", tileMm: 6, threads: 12, normalScale: 0.8, roughness: 0.92, sheen: 0.15, sheenRoughness: 0.65, heatherMm: 80, heatherStreaks: 64, heather: 0.2 },
  ribana: { weave: "jersey", tileMm: 4, threads: 4, normalScale: 0.9, roughness: 0.9, sheen: 0.5, sheenRoughness: 0.45, heatherMm: 50, heatherStreaks: 40, heather: 0.06 },
  moletom: { weave: "jersey", tileMm: 8, threads: 4, normalScale: 0.6, roughness: 0.95, sheen: 0.45, sheenRoughness: 0.5, heatherMm: 40, heatherStreaks: 60, heather: 0.12 },
};

/** Lado padrão do ladrilho, em pixels. */
export const WEAVE_SIZE = 256;

const TAU = Math.PI * 2;
const fract = (x: number) => x - Math.floor(x);
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Perfil de um fio redondo: 1 no meio, 0 nas bordas (x de 0 a 1 dentro do fio). */
const thread = (x: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, x)));

/**
 * Altura (0 a 1) e onde a trama aparece (0 a 1) num ladrilho de `size` ×
 * `size` pixels, repetível nas quatro bordas (só funções periódicas no
 * ladrilho). Linha `y` cresce no fio (urdume, v do UV); coluna `x`, na trama.
 */
export function weaveTile(kind: WeaveKind, threads: number, size = WEAVE_SIZE): { height: Float32Array; weft: Float32Array } {
  const height = new Float32Array(size * size);
  const weft = new Float32Array(size * size);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const u = ((px + 0.5) / size) * threads;
      const v = ((py + 0.5) / size) * threads;
      const i = py * size + px;
      if (kind === "jersey") {
        // Colunas de laçadas em V: duas pernas por coluna, inclinadas, uma carreira por v.
        const a = fract(u) - 0.5;
        const b = fract(v * 1.5);
        // As pernas se juntam no meio da carreira e abrem nas pontas (contínuo de uma carreira para a outra).
        const leg = 0.14 + 0.32 * Math.abs(b - 0.5);
        const d = Math.abs(Math.abs(a) - leg);
        const h = Math.max(0, 1 - d / 0.2);
        height[i] = h * (0.75 + 0.25 * Math.cos(TAU * b));
        weft[i] = 0;
        continue;
      }
      const col = Math.floor(u);
      const row = Math.floor(v);
      // Fio do urdume (corre em v) e fio da trama (corre em u): quem fica por cima?
      const warpUp = kind === "tela" ? mod(col + row, 2) === 0 : mod(col - row, 4) !== 0;
      const warp = thread(fract(u));
      const fill = thread(fract(v));
      const top = warpUp ? warp : fill;
      const under = warpUp ? fill : warp;
      height[i] = 0.35 + 0.65 * top - 0.15 * under * (1 - top);
      weft[i] = warpUp ? 0 : fill;
    }
  }
  return { height, weft };
}

/**
 * Mapa de normais (RGBA 8 bits, espaço tangente, Y verde para cima) a partir
 * da altura, com vizinhos que dão a volta na borda (o ladrilho continua
 * repetível). `strength`: quanto o relevo inclina a normal.
 */
export function heightToNormal(height: Float32Array, size: number, strength: number): Uint8Array {
  const out = new Uint8Array(size * size * 4);
  const h = (x: number, y: number) => height[mod(y, size) * size + mod(x, size)]!;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      // Linha cresce para baixo na imagem; o verde do mapa aponta para cima.
      const dy = (h(x, y - 1) - h(x, y + 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      out[i] = Math.round((-dx / len * 0.5 + 0.5) * 255);
      out[i + 1] = Math.round((-dy / len * 0.5 + 0.5) * 255);
      out[i + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
      out[i + 3] = 255;
    }
  }
  return out;
}

/** Número de 0 a 1 que só depende dos inteiros (o mesmo em toda máquina). */
function hash(a: number, b: number, seed: number): number {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Interpolação suave entre nós (cosseno), para o ruído não ter quinas. */
const smooth = (a: number, b: number, t: number) => a + (b - a) * (0.5 - 0.5 * Math.cos(Math.PI * t));

/**
 * Ruído de valor 1D repetível: `knots` nós por volta, sorteados por (linha, nó).
 * `x` de 0 a 1 percorre a volta inteira.
 */
function loopNoise(x: number, knots: number, line: number, seed: number): number {
  const p = fract(x) * knots;
  const k = Math.floor(p);
  return smooth(hash(line, mod(k, knots), seed), hash(line, mod(k + 1, knots), seed), p - k);
}

/** Nós das manchas largas do mesclado, por volta, em cada direção. */
const BLOTCH = 4;

/**
 * Mesclado (RGBA 8 bits, multiplica a cor do tecido): fiapos que correm no
 * fio (`streaks` colunas, cada uma com o tom variando devagar ao longo dela)
 * e manchas largas. Repetível nas quatro bordas. Branco = a cor do tecido
 * como está; `strength` é quanto o ponto mais escuro escurece.
 */
export function heatherColor(size: number, streaks: number, strength: number, seed = 1): Uint8Array {
  const out = new Uint8Array(size * size * 4);
  const n = (x: number, y: number) => hash(mod(x, BLOTCH), mod(y, BLOTCH) + 101, seed);
  for (let py = 0; py < size; py++) {
    const v = (py + 0.5) / size;
    for (let px = 0; px < size; px++) {
      const u = (px + 0.5) / size;
      const col = Math.floor(u * streaks);
      // Cada coluna tem um tom próprio, que muda devagar ao longo do fio (6 nós por volta).
      const streak = hash(col, 999, seed) * 0.5 + loopNoise(v + hash(col, 7, seed), 6, col, seed) * 0.5;
      // Manchas: ruído 2D repetível.
      const bx = u * BLOTCH;
      const by = v * BLOTCH;
      const x0 = Math.floor(bx);
      const y0 = Math.floor(by);
      const top = smooth(n(x0, y0), n(x0 + 1, y0), bx - x0);
      const bottom = smooth(n(x0, y0 + 1), n(x0 + 1, y0 + 1), bx - x0);
      const blotch = smooth(top, bottom, by - y0);
      const c = 1 - strength * (0.65 * streak + 0.35 * blotch);
      const g = Math.round(c * 255);
      const i = (py * size + px) * 4;
      out[i] = g;
      out[i + 1] = g;
      out[i + 2] = g;
      out[i + 3] = 255;
    }
  }
  return out;
}
