/**
 * Tipos do js-aruco2 (MIT), só com o que o Alinhavo usa. O pacote é
 * CommonJS sem tipos e exporta `{ AR }` (via `this.AR = AR`).
 * Incluído por referência em `src/aruco.ts`, para valer também quando o app
 * compila este pacote.
 */
declare module "js-aruco2" {
  type Corner = { x: number; y: number };
  type Marker = { id: number; corners: Corner[]; hammingDistance: number };
  type ImageLike = { width: number; height: number; data: ArrayLike<number> };

  class Detector {
    constructor(config?: { dictionaryName?: string; maxHammingDistance?: number });
    detect(image: ImageLike): Marker[];
  }

  class Dictionary {
    constructor(name: string);
    /** Códigos em bits ("0"/"1"), linha a linha, sem a borda preta. */
    codeList: string[];
    /** Lado do marcador em módulos, com a borda preta. */
    markSize: number;
  }

  const AR: { Detector: typeof Detector; Dictionary: typeof Dictionary };
  const mod: { AR: typeof AR };
  export default mod;
}
