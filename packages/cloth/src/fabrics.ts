/**
 * Camada física do tecido. Unidades da simulação: mm, g e s (força em
 * g·mm/s²). Complacência (compliance) é o inverso da rigidez no XPBD:
 * quanto maior, mais o tecido cede.
 *
 * Os valores dos presets são ESTIMATIVAS INICIAIS, a calibrar quando a
 * Prova estiver visível (comparando com peças reais). Os testes garantem só
 * as relações entre eles (jeans mais firme que malha; trama e viés cedem
 * mais que o urdume).
 */
export type Fabric = {
  id: string;
  /** Nome para a interface. */
  name: string;
  /** Gramatura, em g/m². */
  density: number;
  /** Complacência ao esticamento por direção em relação ao fio. */
  stretch: { warp: number; weft: number; bias: number };
  /** Complacência à flexão (dobra). */
  bend: number;
  /** Espessura, em mm (distância mínima ao corpo). */
  thickness: number;
  /** Atrito com o corpo, de 0 (escorrega) a 1 (gruda). */
  friction: number;
  /**
   * Esticamento máximo de uma aresta (0,05 = 5%). Limite rígido aplicado
   * depois das restrições: compensa a convergência limitada do XPBD em
   * malhas grandes, que deixaria o tecido mais mole do que ele é.
   */
  maxStretch: number;
};

export const FABRICS = {
  malha: {
    id: "malha",
    name: "Malha",
    density: 180,
    stretch: { warp: 2e-5, weft: 1.2e-4, bias: 6e-5 },
    bend: 5e-3,
    thickness: 1,
    friction: 0.4,
    maxStretch: 0.25,
  },
  planoLeve: {
    id: "planoLeve",
    name: "Plano leve",
    density: 100,
    stretch: { warp: 1e-6, weft: 2e-6, bias: 2e-5 },
    bend: 2e-3,
    thickness: 0.5,
    friction: 0.3,
    maxStretch: 0.05,
  },
  jeans: {
    id: "jeans",
    name: "Jeans",
    density: 380,
    stretch: { warp: 2e-7, weft: 4e-7, bias: 4e-6 },
    bend: 2e-4,
    thickness: 1.5,
    friction: 0.5,
    maxStretch: 0.03,
  },
  // Biblioteca (nov/2026): mesmas regras, valores também a calibrar.
  tricoline: {
    id: "tricoline",
    name: "Tricoline",
    density: 120,
    stretch: { warp: 8e-7, weft: 1.5e-6, bias: 1.5e-5 },
    bend: 1.5e-3,
    thickness: 0.4,
    friction: 0.35,
    maxStretch: 0.04,
  },
  viscose: {
    id: "viscose",
    name: "Viscose",
    density: 130,
    stretch: { warp: 1.5e-6, weft: 3e-6, bias: 4e-5 },
    bend: 6e-3,
    thickness: 0.4,
    friction: 0.25,
    maxStretch: 0.06,
  },
  linho: {
    id: "linho",
    name: "Linho",
    density: 170,
    stretch: { warp: 5e-7, weft: 1e-6, bias: 1e-5 },
    bend: 8e-4,
    thickness: 0.6,
    friction: 0.4,
    maxStretch: 0.035,
  },
  crepe: {
    id: "crepe",
    name: "Crepe",
    density: 150,
    stretch: { warp: 2e-6, weft: 4e-6, bias: 4e-5 },
    bend: 4e-3,
    thickness: 0.5,
    friction: 0.3,
    maxStretch: 0.07,
  },
  chiffon: {
    id: "chiffon",
    name: "Chiffon",
    density: 60,
    stretch: { warp: 2e-6, weft: 4e-6, bias: 5e-5 },
    bend: 1e-2,
    thickness: 0.2,
    friction: 0.2,
    maxStretch: 0.06,
  },
  sarja: {
    id: "sarja",
    name: "Sarja",
    density: 280,
    stretch: { warp: 3e-7, weft: 6e-7, bias: 6e-6 },
    bend: 4e-4,
    thickness: 1,
    friction: 0.45,
    maxStretch: 0.03,
  },
  jeansElastano: {
    id: "jeansElastano",
    name: "Jeans com elastano",
    density: 330,
    stretch: { warp: 4e-7, weft: 2e-5, bias: 2e-5 },
    bend: 3e-4,
    thickness: 1.3,
    friction: 0.5,
    maxStretch: 0.15,
  },
  ribana: {
    id: "ribana",
    name: "Ribana",
    density: 220,
    stretch: { warp: 3e-5, weft: 2.5e-4, bias: 1e-4 },
    bend: 4e-3,
    thickness: 1.2,
    friction: 0.45,
    maxStretch: 0.4,
  },
  moletom: {
    id: "moletom",
    name: "Moletom",
    density: 320,
    stretch: { warp: 1.5e-5, weft: 6e-5, bias: 3e-5 },
    bend: 1e-3,
    thickness: 2,
    friction: 0.5,
    maxStretch: 0.15,
  },
} satisfies Record<string, Fabric>;

export type FabricPreset = keyof typeof FABRICS;
export const FABRIC_PRESETS = Object.keys(FABRICS) as FabricPreset[];

/** Espessura máxima de um tecido na Prova, em mm (o contrato do Collider é testado até ela; ver body.test.ts). */
export const FABRIC_MAX_THICKNESS = 2.5;

/**
 * Ajuste do tecido cadastrado sobre o preset (o que a confecção sabe do tecido
 * dela). Todos opcionais: o que faltar fica o do preset.
 * - `weightGsm`: gramatura (g/m²);
 * - `thicknessMm`: espessura;
 * - `stretchPct`: quanto estica na trama (%), o limite do mapa de pressão;
 * - `drape`: caimento de 1 (armado) a 5 (fluido); 3 é o do preset.
 */
export type FabricTuning = { weightGsm?: number; thicknessMm?: number; stretchPct?: number; drape?: number };

export const FABRIC_TUNING_RANGE = {
  weightGsm: [20, 800],
  thicknessMm: [0.1, FABRIC_MAX_THICKNESS],
  stretchPct: [1, 100],
  drape: [1, 5],
} as const satisfies Record<keyof FabricTuning, readonly [number, number]>;

/** Caimento do preset (o meio da escala). */
export const DRAPE_DEFAULT = 3;
/** Quanto a complacência à flexão muda por ponto de caimento. */
const DRAPE_STEP = 2.8;

const clampTo = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));

/**
 * O tecido do preset ajustado pelo cadastro. Gramatura e espessura entram
 * direto; a elasticidade vira o limite de esticamento e cede a trama e o
 * viés na mesma proporção (o urdume fica); o caimento multiplica a
 * complacência à flexão. Valores fora do plausível ficam nos limites.
 */
export function tuneFabric(base: Fabric, tuning: FabricTuning = {}): Fabric {
  const out: Fabric = { ...base, stretch: { ...base.stretch } };
  const ok = (v: number | undefined): v is number => v !== undefined && Number.isFinite(v);
  if (ok(tuning.weightGsm)) out.density = clampTo(tuning.weightGsm, FABRIC_TUNING_RANGE.weightGsm);
  if (ok(tuning.thicknessMm)) out.thickness = clampTo(tuning.thicknessMm, FABRIC_TUNING_RANGE.thicknessMm);
  if (ok(tuning.stretchPct)) {
    const limit = clampTo(tuning.stretchPct, FABRIC_TUNING_RANGE.stretchPct) / 100;
    const ratio = limit / base.maxStretch;
    out.maxStretch = limit;
    out.stretch.weft = base.stretch.weft * ratio;
    out.stretch.bias = base.stretch.bias * ratio;
  }
  if (ok(tuning.drape)) out.bend = base.bend * DRAPE_STEP ** (clampTo(tuning.drape, FABRIC_TUNING_RANGE.drape) - DRAPE_DEFAULT);
  return out;
}

/**
 * Complacência de uma aresta conforme o ângulo com o fio: urdume a 0°,
 * viés a 45°, trama a 90°, interpolando entre eles. `along` e `across` são
 * os componentes da aresta nas coordenadas do fio (urdume, trama).
 */
export function stretchCompliance(fabric: Fabric, along: number, across: number): number {
  const angle = (Math.atan2(Math.abs(across), Math.abs(along)) * 180) / Math.PI; // 0..90
  const { warp, weft, bias } = fabric.stretch;
  return angle <= 45 ? warp + (bias - warp) * (angle / 45) : bias + (weft - bias) * ((angle - 45) / 45);
}
