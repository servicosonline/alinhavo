/**
 * Camada física do tecido. Unidades da simulação: mm, g e s (força em
 * g·mm/s²). Complacência (compliance) é o inverso da rigidez no XPBD:
 * quanto maior, mais o tecido cede.
 *
 * Os valores dos presets são ESTIMATIVAS INICIAIS, a calibrar com as
 * medidas de bancada (`docs/10-calibracao-tecidos.md`). Os testes garantem só
 * as relações entre eles (jeans mais firme que malha; trama e viés cedem
 * mais que o urdume).
 *
 * Comprimento de flexão (`bendingLength`): ESTIMATIVA, sem amostra medida.
 * Só a ordem de grandeza tem referência: a ASTM D1388 dimensiona a tira para
 * tecidos de 1 a 3+ cm, e o exemplo de algodão dos manuais do teste da régua
 * dá 2,5 a 2,7 cm. A ordem entre os tecidos é de olho (chiffon o mais fluido,
 * jeans o mais armado; malhas abaixo dos planos de mesmo peso).
 */
export type Fabric = {
  id: string;
  /** Nome para a interface. */
  name: string;
  /** Gramatura, em g/m². */
  density: number;
  /** Complacência ao esticamento por direção em relação ao fio. */
  stretch: { warp: number; weft: number; bias: number };
  /**
   * Comprimento de flexão de Peirce, em mm: o que o teste da régua mede
   * (ASTM D1388; com a tira caindo 41,5°, é metade do que está para fora da
   * mesa). Maior = mais armado. Vira a rigidez da flexão de curvatura
   * (`bendingRigidity`), que segura tecido plano e não depende do tamanho da
   * malha. Com o mesmo comprimento, o caimento não muda com a gramatura: o
   * tecido mais pesado é mais rígido na mesma proporção.
   */
  bendingLength: number;
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
    bendingLength: 18,
    thickness: 1,
    friction: 0.4,
    maxStretch: 0.25,
  },
  planoLeve: {
    id: "planoLeve",
    name: "Plano leve",
    density: 100,
    stretch: { warp: 1e-6, weft: 2e-6, bias: 2e-5 },
    bendingLength: 22,
    thickness: 0.5,
    friction: 0.3,
    maxStretch: 0.05,
  },
  jeans: {
    id: "jeans",
    name: "Jeans",
    density: 380,
    stretch: { warp: 2e-7, weft: 4e-7, bias: 4e-6 },
    bendingLength: 50,
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
    bendingLength: 28,
    thickness: 0.4,
    friction: 0.35,
    maxStretch: 0.04,
  },
  viscose: {
    id: "viscose",
    name: "Viscose",
    density: 130,
    stretch: { warp: 1.5e-6, weft: 3e-6, bias: 4e-5 },
    bendingLength: 16,
    thickness: 0.4,
    friction: 0.25,
    maxStretch: 0.06,
  },
  linho: {
    id: "linho",
    name: "Linho",
    density: 170,
    stretch: { warp: 5e-7, weft: 1e-6, bias: 1e-5 },
    bendingLength: 32,
    thickness: 0.6,
    friction: 0.4,
    maxStretch: 0.035,
  },
  crepe: {
    id: "crepe",
    name: "Crepe",
    density: 150,
    stretch: { warp: 2e-6, weft: 4e-6, bias: 4e-5 },
    bendingLength: 18,
    thickness: 0.5,
    friction: 0.3,
    maxStretch: 0.07,
  },
  chiffon: {
    id: "chiffon",
    name: "Chiffon",
    density: 60,
    stretch: { warp: 2e-6, weft: 4e-6, bias: 5e-5 },
    bendingLength: 10,
    thickness: 0.2,
    friction: 0.2,
    maxStretch: 0.06,
  },
  sarja: {
    id: "sarja",
    name: "Sarja",
    density: 280,
    stretch: { warp: 3e-7, weft: 6e-7, bias: 6e-6 },
    bendingLength: 38,
    thickness: 1,
    friction: 0.45,
    maxStretch: 0.03,
  },
  jeansElastano: {
    id: "jeansElastano",
    name: "Jeans com elastano",
    density: 330,
    stretch: { warp: 4e-7, weft: 2e-5, bias: 2e-5 },
    bendingLength: 42,
    thickness: 1.3,
    friction: 0.5,
    maxStretch: 0.15,
  },
  ribana: {
    id: "ribana",
    name: "Ribana",
    density: 220,
    stretch: { warp: 3e-5, weft: 2.5e-4, bias: 1e-4 },
    bendingLength: 20,
    thickness: 1.2,
    friction: 0.45,
    maxStretch: 0.4,
  },
  moletom: {
    id: "moletom",
    name: "Moletom",
    density: 320,
    stretch: { warp: 1.5e-5, weft: 6e-5, bias: 3e-5 },
    bendingLength: 30,
    thickness: 2,
    friction: 0.5,
    maxStretch: 0.15,
  },
} satisfies Record<string, Fabric>;

export type FabricPreset = keyof typeof FABRICS;
export const FABRIC_PRESETS = Object.keys(FABRICS) as FabricPreset[];

/** Gravidade padrão, em mm/s², a do teste da régua (o comprimento de flexão é medido nela). */
export const STANDARD_GRAVITY = 9810;

/**
 * Rigidez à flexão por largura, em g·mm²/s² (energia por curvatura² e por
 * área): B = peso por área × c³ (Peirce), com c = `bendingLength`.
 */
export function bendingRigidity(fabric: Fabric): number {
  return fabric.density * 1e-6 * STANDARD_GRAVITY * Math.max(0, fabric.bendingLength) ** 3;
}

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
/**
 * Quanto a rigidez à flexão muda por ponto de caimento (o comprimento de
 * flexão muda a raiz cúbica disso, ~1,4×). De olho, como a escala.
 */
const DRAPE_STEP = 2.8;

const clampTo = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));

/**
 * O tecido do preset ajustado pelo cadastro. Gramatura e espessura entram
 * direto; a elasticidade vira o limite de esticamento e cede a trama e o
 * viés na mesma proporção (o urdume fica); o caimento divide a rigidez à
 * flexão (5 = mais fluido). Valores fora do plausível ficam nos limites.
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
  if (ok(tuning.drape)) {
    const steps = clampTo(tuning.drape, FABRIC_TUNING_RANGE.drape) - DRAPE_DEFAULT;
    out.bendingLength = base.bendingLength * DRAPE_STEP ** (-steps / 3);
  }
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
