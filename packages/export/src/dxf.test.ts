import DxfParser from "dxf-parser";
import { describe, expect, it } from "vitest";
import { exportDxfAama } from "./dxf";
import { saia } from "./fixture";

const FIXED = new Date(2026, 10, 14, 9, 5, 7);

type Vertex = { x: number; y: number };
type Entity = { type: string; layer: string; text?: string; vertices?: Vertex[]; shape?: boolean; name?: string; position?: Vertex };

/** Lê o arquivo com um leitor DXF independente (não com o nosso código). */
function ler(dxf: string) {
  const parsed = new DxfParser().parseSync(dxf) as unknown as {
    blocks: Record<string, { name: string; entities?: Entity[] }>;
    entities: Entity[];
    tables: { layer: { layers: Record<string, unknown> } };
  };
  return parsed;
}

const caixa = (vs: Vertex[]) => ({
  minX: Math.min(...vs.map((v) => v.x)),
  maxX: Math.max(...vs.map((v) => v.x)),
  minY: Math.min(...vs.map((v) => v.y)),
  maxY: Math.max(...vs.map((v) => v.y)),
});

describe("DXF-AAMA", () => {
  const dxf = exportDxfAama(saia(), { styleName: "Saia base", date: FIXED });
  const parsed = ler(dxf);

  it("abre num leitor DXF independente, com as camadas numeradas", () => {
    expect(Object.keys(parsed.tables.layer.layers).sort()).toEqual(["0", "1", "14", "2", "3", "7"]);
    expect(dxf.startsWith("0\r\nSECTION\r\n")).toBe(true);
    expect(dxf.trimEnd().endsWith("EOF")).toBe(true);
  });

  it("tem uma BLOCK por peça e tamanho, todas inseridas na origem", () => {
    expect(Object.keys(parsed.blocks).sort()).toEqual(
      ["Costas_da_saia_G", "Costas_da_saia_M", "Costas_da_saia_P", "Frente_G", "Frente_M", "Frente_P"].sort(),
    );
    const inserts = parsed.entities.filter((e) => e.type === "INSERT");
    expect(inserts).toHaveLength(6);
    expect(inserts.every((e) => e.position?.x === 0 && e.position?.y === 0)).toBe(true);
  });

  it("textos do molde e da peça", () => {
    const estilo = parsed.entities.filter((e) => e.type === "TEXT").map((e) => e.text);
    expect(estilo).toEqual([
      "Style Name: Saia base",
      "Creation Date: 2026-11-14",
      "Creation Time: 09:05:07",
      "Author: Alinhavo",
      "Sample Size: M",
      "Grading Rule Table:",
      "Units: METRIC",
    ]);
    const peca = parsed.blocks.Frente_G!.entities!.filter((e) => e.type === "TEXT").map((e) => e.text);
    expect(peca).toEqual(["Piece Name: Frente", "Size: G", "Quantity: 1"]);
  });

  it("peça de cortar par sai com quantidade 2", () => {
    const doc = saia();
    doc.pieces = doc.pieces.map((p, i) => (i === 0 ? { ...p, fold: undefined, cutPair: true as const } : p));
    const par = ler(exportDxfAama(doc, { styleName: "Calça", date: FIXED }));
    const nome = doc.pieces[0]!.name;
    const textos = par.blocks[`${nome}_M`]!.entities!.filter((e) => e.type === "TEXT").map((e) => e.text);
    expect(textos).toContain("Quantity: 2");
  });

  it("linha de corte na camada 1 e de costura na 14, fechadas e em mm", () => {
    const ents = parsed.blocks.Frente_M!.entities!;
    const corte = ents.find((e) => e.type === "POLYLINE" && e.layer === "1")!;
    const costura = ents.find((e) => e.type === "POLYLINE" && e.layer === "14")!;
    expect(corte.shape).toBe(true);
    expect(costura.shape).toBe(true);
    // costura: 200 × 600; corte: 1 cm nas laterais e cintura, 3 cm na barra
    expect(caixa(costura.vertices!)).toEqual({ minX: 0, maxX: 200, minY: -600, maxY: 0 });
    expect(caixa(corte.vertices!)).toEqual({ minX: -10, maxX: 210, minY: -630, maxY: 10 });
  });

  it("inverte o Y: a peça não sai espelhada", () => {
    // No editor a cintura (y=0) fica em cima e a barra (y=600) embaixo. No DXF,
    // em cima é Y maior: a cintura tem que ter Y maior que a barra.
    const costura = parsed.blocks.Frente_M!.entities!.find((e) => e.type === "POLYLINE" && e.layer === "14")!;
    const [primeiro] = costura.vertices!; // ponto A, canto da cintura
    expect(primeiro).toMatchObject({ x: 0, y: 0 });
    expect(Math.min(...costura.vertices!.map((v) => v.y))).toBe(-600);
  });

  it("gradua: o G é 1 cm mais largo e 1,5 cm mais comprido", () => {
    const g = parsed.blocks.Frente_G!.entities!.find((e) => e.type === "POLYLINE" && e.layer === "14")!;
    expect(caixa(g.vertices!)).toEqual({ minX: 0, maxX: 210, minY: -615, maxY: 0 });
  });

  it("quinas na camada 2, pontos de curva na 3 e fio na 7", () => {
    const frente = parsed.blocks.Frente_M!.entities!;
    expect(frente.filter((e) => e.type === "POINT" && e.layer === "2")).toHaveLength(8); // 4 da costura + 4 do corte
    expect(frente.filter((e) => e.type === "POINT" && e.layer === "3")).toHaveLength(0); // só retas
    const fio = frente.find((e) => e.type === "LINE" && e.layer === "7")!;
    expect(fio.vertices).toEqual([
      { x: 100, y: -100, z: 0 },
      { x: 100, y: -500, z: 0 },
    ]);
    const costas = parsed.blocks.Costas_da_saia_M!.entities!;
    expect(costas.filter((e) => e.type === "POINT" && e.layer === "3").length).toBeGreaterThan(4); // curva da lateral
  });

  it("exporta só os tamanhos pedidos, e tira acentos dos textos", () => {
    const doc = saia();
    doc.pieces[0]!.name = "Calça frente";
    const um = ler(exportDxfAama(doc, { styleName: "Coleção verão", sizes: ["G"], date: FIXED }));
    expect(Object.keys(um.blocks).sort()).toEqual(["Calca_frente_G", "Costas_da_saia_G"]);
    expect(um.entities.find((e) => e.type === "TEXT")?.text).toBe("Style Name: Colecao verao");
    expect(() => exportDxfAama(doc, { styleName: "x", sizes: ["XG"] })).toThrow(/Nenhum tamanho/);
  });
});
