/**
 * Ajuste dos tecidos às medidas de bancada (`docs/10-calibracao-tecidos.md`).
 *
 * - Gramatura, espessura, atrito e limite de esticamento entram direto.
 * - Complacência ao esticamento (fio, trama, viés): pela tira com 500 g.
 * - Flexão: o comprimento de flexão pela **régua na borda da mesa** (a
 *   queda média de fio e trama). A flexão de curvatura segura tecido plano e
 *   não depende da malha, então a régua simulada responde ao valor como a de
 *   verdade. O **disco** fica de conferência (coeficiente e ondas, com aviso).
 */
import { FABRIC_MAX_THICKNESS, FABRICS, type Fabric } from "../fabrics";
import { cantileverDrop, discDrape, hangStrain, type BenchOptions } from "./bench";
import {
  bendAnisotropy,
  DIRECTIONS,
  frictionOf,
  HANG_STRIP_WIDTH,
  hangStrain as measuredStrain,
  meanDrop,
  type Direction,
  type Sample,
} from "./measurements";

/** Faixa de busca do comprimento de flexão (mm) e do esticamento (complacência). */
export const BENDING_LENGTH_RANGE: readonly [number, number] = [2, 300];
export const STRETCH_RANGE: readonly [number, number] = [1e-10, 1e-3];
/** Acima disso, a diferença de flexão entre fio e trama não cabe numa flexão só. */
export const MAX_BEND_ANISOTROPY = 2;

export type BisectResult = { value: number; atBound: boolean };

/**
 * Bissecção em escala logarítmica de um `f` monótono (crescente ou
 * decrescente, descoberto pelas pontas) até `f(valor) = alvo`. Alvo fora do
 * que as pontas alcançam: devolve a ponta, com `atBound`.
 */
export function logBisect(f: (c: number) => number, target: number, [lo, hi]: readonly [number, number], steps = 16): BisectResult {
  let a = Math.log(lo);
  let b = Math.log(hi);
  const fa = f(lo);
  const fb = f(hi);
  const increasing = fb >= fa;
  const below = increasing ? target <= fa : target >= fa;
  const above = increasing ? target >= fb : target <= fb;
  if (below) return { value: lo, atBound: true };
  if (above) return { value: hi, atBound: true };
  for (let s = 0; s < steps; s++) {
    const m = (a + b) / 2;
    const fm = f(Math.exp(m));
    if (fm < target === increasing) a = m;
    else b = m;
  }
  return { value: Math.exp((a + b) / 2), atBound: false };
}

/** Comprimento de flexão que dá a queda medida na régua (`overhangMm` para fora; mais comprido = cai menos). */
export function fitBendingLengthFromRuler(base: Fabric, overhangMm: number, dropMm: number, options: BenchOptions = {}): BisectResult {
  return logBisect((bendingLength) => cantileverDrop({ ...base, bendingLength }, overhangMm, options).dropMm, dropMm, BENDING_LENGTH_RANGE, 14);
}

export type StretchTargets = Record<Direction, number>;

/**
 * Complacências de fio, trama e viés que dão o esticamento medido a 500 g.
 * As três se influenciam (a tira no viés tem arestas no fio e na trama), então
 * as três andam juntas: a cada rodada, cada complacência é multiplicada pela
 * razão medido ÷ simulado da sua direção (o esticamento é quase proporcional
 * à complacência que manda naquela tira). Ajustar uma de cada vez não
 * funciona: com as outras ainda longe, a primeira vai para a ponta da faixa.
 */
export function fitStretch(
  base: Fabric,
  targets: StretchTargets,
  realWidthMm = HANG_STRIP_WIDTH,
  loadG = 500,
): { stretch: Fabric["stretch"]; atBound: Direction[]; limited: Direction[] } {
  const stretch = { ...base.stretch };
  const key = { fio: "warp", trama: "weft", vies: "bias" } as const;
  const [lo, hi] = STRETCH_RANGE;
  const strains = () => Object.fromEntries(DIRECTIONS.map((d) => [d, hangStrain({ ...base, stretch }, d, loadG, realWidthMm).strain])) as StretchTargets;
  for (let round = 0; round < 40; round++) {
    const now = strains();
    let worst = 0;
    for (const d of DIRECTIONS) {
      const ratio = targets[d] / Math.max(now[d], 1e-9);
      worst = Math.max(worst, Math.abs(ratio - 1));
      stretch[key[d]] = Math.min(hi, Math.max(lo, stretch[key[d]] * ratio));
    }
    if (worst < 0.002) break;
  }
  const final = strains();
  const atBound = DIRECTIONS.filter((d) => Math.abs(final[d] / targets[d] - 1) > 0.02);
  const limited = DIRECTIONS.filter((d) => hangStrain({ ...base, stretch }, d, loadG, realWidthMm).limited);
  return { stretch, atBound, limited };
}

export type SampleFit = {
  sampleId: string;
  fabric: Fabric;
  measured: { cc?: number; waves?: number; strain500: StretchTargets; dropMm: number };
  simulated: { cc: number; waves: number; strain500: StretchTargets; dropMm: number };
  warnings: string[];
};

/** Ajusta um tecido a uma amostra, a partir do preset dela. */
export function fitSample(sample: Sample, options: BenchOptions = {}): SampleFit {
  const preset = FABRICS[sample.preset];
  const warnings: string[] = [];
  const width = sample.peso.larguraMm ?? HANG_STRIP_WIDTH;
  const strain500 = Object.fromEntries(DIRECTIONS.map((d) => [d, measuredStrain(sample, d).g500])) as StretchTargets;
  const strain2000 = DIRECTIONS.map((d) => measuredStrain(sample, d).g2000);

  let thickness = sample.espessuraMm;
  if (thickness > FABRIC_MAX_THICKNESS) {
    warnings.push(`espessura ${thickness} mm acima do que a Prova aceita (${FABRIC_MAX_THICKNESS} mm): ficou no limite`);
    thickness = FABRIC_MAX_THICKNESS;
  }
  // O limite é o maior esticamento com 2 kg, e nunca abaixo do medido com 500 g (senão a complacência não teria como chegar lá).
  const maxStretch = Math.max(0.01, ...strain2000, ...DIRECTIONS.map((d) => strain500[d] * 1.05));
  let fabric: Fabric = {
    ...preset,
    density: sample.gramatura,
    thickness,
    friction: frictionOf(sample) ?? preset.friction,
    maxStretch,
  };

  const s = fitStretch(fabric, strain500, width);
  fabric = { ...fabric, stretch: s.stretch };
  for (const d of s.atBound) warnings.push(`esticamento no ${d}: a simulação não chegou a 2% da medida (a malha da Prova não alcança, ou as direções brigam)`);
  for (const d of s.limited) warnings.push(`esticamento no ${d}: com 500 g a tira já chega no limite; o limite manda, não a complacência`);

  const anis = bendAnisotropy(sample);
  if (anis > MAX_BEND_ANISOTROPY) {
    warnings.push(`a régua no fio e na trama difere ${anis.toFixed(1)}×: uma flexão só erra muito neste tecido`);
  }

  const b = fitBendingLengthFromRuler(fabric, sample.regua.foraMm, meanDrop(sample), options);
  fabric = { ...fabric, bendingLength: b.value };
  if (b.atBound) warnings.push(`régua (queda de ${meanDrop(sample)} mm) fora do que a flexão alcança: ficou na ponta`);

  const drape = discDrape(fabric, options);
  if (sample.disco && Math.abs(drape.cc - sample.disco.cc) > CALIBRATION_TOLERANCE.cc) {
    warnings.push(`disco: coeficiente medido ${sample.disco.cc}, simulado ${drape.cc.toFixed(2)} (a flexão vem da régua)`);
  }
  if (sample.disco && Math.abs(drape.waves - sample.disco.ondas) > 1) {
    warnings.push(`ondas no disco: medidas ${sample.disco.ondas}, simuladas ${drape.waves}`);
  }
  const drop = cantileverDrop(fabric, sample.regua.foraMm, options).dropMm;
  return {
    sampleId: sample.id,
    fabric,
    measured: { cc: sample.disco?.cc, waves: sample.disco?.ondas, strain500, dropMm: meanDrop(sample) },
    simulated: {
      cc: drape.cc,
      waves: drape.waves,
      strain500: Object.fromEntries(DIRECTIONS.map((d) => [d, hangStrain(fabric, d, 500, width).strain])) as StretchTargets,
      dropMm: drop,
    },
    warnings,
  };
}

const geo = (xs: number[]) => Math.exp(xs.reduce((s, x) => s + Math.log(x), 0) / xs.length);
const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

/**
 * O preset a partir das amostras: média geométrica nas complacências (elas
 * variam em ordens de grandeza) e aritmética no resto.
 */
export function averageFabric(base: Fabric, fits: Fabric[]): Fabric {
  if (fits.length === 0) return base;
  return {
    ...base,
    density: avg(fits.map((f) => f.density)),
    thickness: avg(fits.map((f) => f.thickness)),
    friction: avg(fits.map((f) => f.friction)),
    maxStretch: avg(fits.map((f) => f.maxStretch)),
    bendingLength: geo(fits.map((f) => f.bendingLength)),
    stretch: {
      warp: geo(fits.map((f) => f.stretch.warp)),
      weft: geo(fits.map((f) => f.stretch.weft)),
      bias: geo(fits.map((f) => f.stretch.bias)),
    },
  };
}

/**
 * Quanto o preset pode ficar longe da média das amostras dele (o teste de
 * `calibration.test.ts`). Iniciais, a revisar com as primeiras medidas.
 */
export const CALIBRATION_TOLERANCE = {
  /** Coeficiente de caimento no disco, absoluto (conferência: a flexão vem da régua). */
  cc: 0.08,
  /** Esticamento a 500 g, relativo. */
  strain: 0.2,
  /** Gramatura e espessura, relativo. */
  direct: 0.1,
} as const;
