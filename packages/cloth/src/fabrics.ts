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
  },
  planoLeve: {
    id: "planoLeve",
    name: "Plano leve",
    density: 100,
    stretch: { warp: 1e-6, weft: 2e-6, bias: 2e-5 },
    bend: 2e-3,
    thickness: 0.5,
    friction: 0.3,
  },
  jeans: {
    id: "jeans",
    name: "Jeans",
    density: 380,
    stretch: { warp: 2e-7, weft: 4e-7, bias: 4e-6 },
    bend: 2e-4,
    thickness: 1.5,
    friction: 0.5,
  },
} satisfies Record<string, Fabric>;

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
