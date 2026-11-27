/**
 * Gera texturas PBR (normal map + roughness map) para os presets de tecido.
 * Usa sharp (disponível no projeto) para gerar imagens WebP otimizadas.
 *
 * Cada tecido tem uma assinatura visual baseada nos parâmetros do FABRIC_LOOK:
 * - threads: densidade da trama (fios por tile)
 * - weave: tipo de entrelaçamento ("tela", "sarja", "cetim")
 * - roughness: rugosidade base do material
 * - normalScale: intensidade do relevo
 *
 * Rodar: node scripts/generate-fabric-textures.mjs
 */

import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "apps", "web", "public", "textures", "fabrics");

const SIZE = 512; // px — bom equilíbrio entre detalhe e tamanho (~30-60KB WebP)

/**
 * Ruído value noise simples (hash-based), suficiente para padrões de trama.
 * Retorna 0..1.
 */
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff;
}

function smoothNoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = hash(ix, iy);
  const n10 = hash(ix + 1, iy);
  const n01 = hash(ix, iy + 1);
  const n11 = hash(ix + 1, iy + 1);
  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sy;
}

function fbm(x, y, octaves = 4) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += smoothNoise(x * freq, y * freq) * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return val;
}

/** Configuração de cada tecido para geração procedural. */
const PRESETS = {
  chiffon: {
    weave: "plain",
    threads: 28,
    roughnessBase: 0.55,
    roughnessVar: 0.15,
    normalStrength: 0.4,
    description: "Trama aberta e leve, fios finos",
  },
  linho: {
    weave: "plain",
    threads: 16,
    roughnessBase: 0.85,
    roughnessVar: 0.12,
    normalStrength: 1.2,
    description: "Trama irregular, fios grossos, textura visível",
  },
  viscose: {
    weave: "plain",
    threads: 22,
    roughnessBase: 0.6,
    roughnessVar: 0.1,
    normalStrength: 0.5,
    description: "Trama uniforme, superfície lisa com leve brilho",
  },
  jeans: {
    weave: "twill",
    threads: 20,
    roughnessBase: 0.75,
    roughnessVar: 0.2,
    normalStrength: 1.0,
    description: "Sarja diagonal, textura pronunciada",
  },
  malha: {
    weave: "knit",
    threads: 18,
    roughnessBase: 0.65,
    roughnessVar: 0.15,
    normalStrength: 0.8,
    description: "Malha jersey, loops visíveis",
  },
  planoLeve: {
    weave: "plain",
    threads: 24,
    roughnessBase: 0.7,
    roughnessVar: 0.1,
    normalStrength: 0.6,
    description: "Tecido plano leve, trama fechada",
  },
};

/**
 * Gera um heightmap da trama do tecido.
 * Valores maiores = mais alto (fio por cima).
 */
function generateHeightmap(preset) {
  const data = new Float32Array(SIZE * SIZE);
  const { weave, threads } = preset;
  const tileSize = SIZE / threads;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const tx = x / tileSize;
      const ty = y / tileSize;
      let h;

      if (weave === "plain") {
        // Trama tela: alternância warp/weft
        const wx = Math.sin(tx * Math.PI) * 0.5 + 0.5;
        const wy = Math.sin(ty * Math.PI) * 0.5 + 0.5;
        const checker = ((Math.floor(tx) + Math.floor(ty)) % 2 === 0) ? wx : wy;
        h = checker * 0.7 + fbm(x * 0.05, y * 0.05, 3) * 0.3;
      } else if (weave === "twill") {
        // Sarja: padrão diagonal 2/1
        const diag = (tx + ty) * 0.5;
        const twill = Math.sin(diag * Math.PI * 2) * 0.5 + 0.5;
        h = twill * 0.6 + fbm(x * 0.04, y * 0.04, 3) * 0.4;
      } else if (weave === "knit") {
        // Malha: padrão de loops em V
        const kx = Math.sin(tx * Math.PI * 2);
        const ky = Math.cos(ty * Math.PI);
        const knit = (kx * kx + ky * ky) * 0.5;
        h = knit * 0.5 + fbm(x * 0.06, y * 0.06, 3) * 0.5;
      } else {
        h = fbm(x * 0.05, y * 0.05, 4);
      }

      data[y * SIZE + x] = Math.max(0, Math.min(1, h));
    }
  }
  return data;
}

/**
 * Converte heightmap em normal map (tangent space).
 * Formato RGB: R=X, G=Y, B=Z (OpenGL convention).
 */
function heightToNormalMap(heightmap, strength) {
  const buf = Buffer.alloc(SIZE * SIZE * 3);
  const dx = 1 / SIZE;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const idx = y * SIZE + x;
      const left = heightmap[y * SIZE + ((x - 1 + SIZE) % SIZE)];
      const right = heightmap[y * SIZE + ((x + 1) % SIZE)];
      const up = heightmap[((y - 1 + SIZE) % SIZE) * SIZE + x];
      const down = heightmap[((y + 1) % SIZE) * SIZE + x];

      const dX = (right - left) * strength;
      const dY = (down - up) * strength;
      const dZ = 1.0;
      const len = Math.sqrt(dX * dX + dY * dY + dZ * dZ);

      const px = idx * 3;
      buf[px] = Math.round(((dX / len) * 0.5 + 0.5) * 255);     // R
      buf[px + 1] = Math.round(((dY / len) * 0.5 + 0.5) * 255); // G
      buf[px + 2] = Math.round(((dZ / len) * 0.5 + 0.5) * 255); // B
    }
  }
  return buf;
}

/**
 * Gera roughness map a partir do heightmap + parâmetros do tecido.
 * Áreas mais altas (fios expostos) são mais ásperas; vales são mais lisos.
 */
function generateRoughnessMap(heightmap, base, variance) {
  const buf = Buffer.alloc(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const h = heightmap[i];
    const r = base + (h - 0.5) * variance * 2;
    buf[i] = Math.round(Math.max(0, Math.min(1, r)) * 255);
  }
  return buf;
}

async function generateForPreset(name, config) {
  const dir = join(OUT, name);
  mkdirSync(dir, { recursive: true });

  console.log(`  Gerando ${name} (${config.description})...`);
  const heightmap = generateHeightmap(config);

  // Normal map
  const normalBuf = heightToNormalMap(heightmap, config.normalStrength);
  await sharp(normalBuf, { raw: { width: SIZE, height: SIZE, channels: 3 } })
    .webp({ quality: 80 })
    .toFile(join(dir, "normal.webp"));

  // Roughness map (grayscale)
  const roughBuf = generateRoughnessMap(heightmap, config.roughnessBase, config.roughnessVar);
  await sharp(roughBuf, { raw: { width: SIZE, height: SIZE, channels: 1 } })
    .webp({ quality: 80 })
    .toFile(join(dir, "roughness.webp"));

  console.log(`  ✓ ${name}: normal.webp + roughness.webp`);
}

console.log("Gerando texturas PBR para tecidos...\n");
for (const [name, config] of Object.entries(PRESETS)) {
  await generateForPreset(name, config);
}
console.log("\nConcluído! Texturas em:", OUT);