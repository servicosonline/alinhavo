import { describe, expect, it } from "vitest";
import { FABRIC_LOOK, heatherColor, heightToNormal, weaveTile, type WeaveKind } from "./weave";

const SIZE = 64;
const KINDS: WeaveKind[] = ["tela", "sarja", "jersey"];

describe("weaveTile", () => {
  it.each(KINDS)("%s repete sem emenda (a borda continua do outro lado)", (kind) => {
    const { height } = weaveTile(kind, 8, SIZE);
    const at = (x: number, y: number) => height[y * SIZE + x]!;
    // O salto da última coluna para a primeira não é maior que os saltos dentro do ladrilho.
    let inner = 0;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE - 1; x++) inner = Math.max(inner, Math.abs(at(x + 1, y) - at(x, y)));
    for (let y = 0; y < SIZE - 1; y++) for (let x = 0; x < SIZE; x++) inner = Math.max(inner, Math.abs(at(x, y + 1) - at(x, y)));
    for (let y = 0; y < SIZE; y++) expect(Math.abs(at(0, y) - at(SIZE - 1, y))).toBeLessThanOrEqual(inner + 1e-6);
    for (let x = 0; x < SIZE; x++) expect(Math.abs(at(x, 0) - at(x, SIZE - 1))).toBeLessThanOrEqual(inner + 1e-6);
  });

  it.each(KINDS)("%s fica entre 0 e 1 e tem relevo", (kind) => {
    const { height, weft } = weaveTile(kind, 8, SIZE);
    expect(Math.min(...height)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...height)).toBeLessThanOrEqual(1);
    expect(Math.max(...height) - Math.min(...height)).toBeGreaterThan(0.3);
    expect(Math.min(...weft)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...weft)).toBeLessThanOrEqual(1);
  });

  it("sarja: o urdume cobre 3 de 4 cruzamentos (a trama aparece em 1/4)", () => {
    const threads = 8;
    const { weft } = weaveTile("sarja", threads, SIZE);
    const cell = SIZE / threads;
    let shown = 0;
    for (let r = 0; r < threads; r++) for (let c = 0; c < threads; c++) if (weft[(r * cell + cell / 2) * SIZE + c * cell + cell / 2]! > 0.5) shown++;
    expect(shown / (threads * threads)).toBeCloseTo(0.25, 5);
  });
});

describe("heightToNormal", () => {
  it("plano dá a normal para fora (128, 128, 255)", () => {
    const n = heightToNormal(new Float32Array(SIZE * SIZE).fill(0.5), SIZE, 4);
    expect([n[0], n[1], n[2], n[3]]).toEqual([128, 128, 255, 255]);
  });

  it("rampa subindo para a direita inclina a normal para a esquerda (vermelho abaixo de 128)", () => {
    const h = new Float32Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) h[y * SIZE + x] = Math.sin((x / SIZE) * Math.PI * 2);
    const n = heightToNormal(h, SIZE, 4);
    const i = (5 * SIZE + 2) * 4; // perto do início, onde a altura sobe
    expect(n[i]!).toBeLessThan(128);
    expect(n[i + 2]!).toBeGreaterThan(128);
  });

  it("normais com comprimento 1", () => {
    const { height } = weaveTile("jersey", 4, SIZE);
    const n = heightToNormal(height, SIZE, 6);
    for (let i = 0; i < n.length; i += 4) {
      const v = [n[i]!, n[i + 1]!, n[i + 2]!].map((c) => (c / 255) * 2 - 1);
      expect(Math.hypot(v[0]!, v[1]!, v[2]!)).toBeCloseTo(1, 1);
    }
  });
});

describe("heatherColor e FABRIC_LOOK", () => {
  const gray = (c: Uint8Array) => Array.from({ length: c.length / 4 }, (_, i) => c[i * 4]!);

  it("só escurece, até a força pedida, e varia de verdade", () => {
    const g = gray(heatherColor(SIZE, 16, 0.3));
    expect(Math.max(...g)).toBeLessThanOrEqual(255);
    expect(Math.min(...g)).toBeGreaterThanOrEqual(Math.floor(255 * 0.7) - 1);
    expect(Math.max(...g) - Math.min(...g)).toBeGreaterThan(20);
  });

  it("repete sem emenda ao longo do fio (a borda de cima continua na de baixo)", () => {
    const g = gray(heatherColor(SIZE, 16, 0.3));
    const at = (x: number, y: number) => g[y * SIZE + x]!;
    let inner = 0;
    for (let y = 0; y < SIZE - 1; y++) for (let x = 0; x < SIZE; x++) inner = Math.max(inner, Math.abs(at(x, y + 1) - at(x, y)));
    for (let x = 0; x < SIZE; x++) expect(Math.abs(at(x, 0) - at(x, SIZE - 1))).toBeLessThanOrEqual(inner);
  });

  it("é determinístico e muda com a semente", () => {
    expect(heatherColor(SIZE, 16, 0.3, 4)).toEqual(heatherColor(SIZE, 16, 0.3, 4));
    expect(heatherColor(SIZE, 16, 0.3, 4)).not.toEqual(heatherColor(SIZE, 16, 0.3, 5));
  });

  it("jeans é o mais mesclado, e a malha brilha mais que o jeans", () => {
    expect(FABRIC_LOOK.jeans.heather).toBeGreaterThan(FABRIC_LOOK.malha.heather);
    expect(FABRIC_LOOK.jeans.heather).toBeGreaterThan(FABRIC_LOOK.planoLeve.heather);
    expect(FABRIC_LOOK.malha.sheen).toBeGreaterThan(FABRIC_LOOK.jeans.sheen);
    for (const look of Object.values(FABRIC_LOOK)) {
      expect(look.tileMm).toBeGreaterThan(0);
      expect(look.heatherMm).toBeGreaterThan(look.tileMm);
      expect(look.roughness).toBeGreaterThan(0);
      expect(look.roughness).toBeLessThanOrEqual(1);
    }
  });
});
