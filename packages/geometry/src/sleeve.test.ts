import { describe, expect, it } from "vitest";
import { documento, saiaReta } from "./fixtures";
import { migratePattern, validatePattern, type Piece } from "./pattern";
import { addSeam } from "./seams";
import { drawnHalfSide, garmentAtSize, pairCopy, PAIR_SUFFIX } from "./unfold";

/** Manga simplificada: a "saia reta" das fixtures vestindo o braço esquerdo, cortada em par. */
function manga(): Piece {
  return { ...saiaReta(), id: "manga", name: "Manga", cutPair: true, placement: { side: "frente", anchor: "ombro", offset: 0, arm: "esquerda" } };
}

describe("formato 6 (manga)", () => {
  it("documento do formato 5 sobe para o 6 sem mudar as partes", () => {
    const v5 = { ...documento([saiaReta()]), schema: 5 };
    expect(migratePattern(v5)).toEqual({ ...v5, schema: 7 });
    expect(migratePattern({ ...v5, seams: undefined })).toBeNull();
  });

  it("valida o braço: esquerda ou direita, e nunca junto com a perna", () => {
    expect(validatePattern(documento([manga()]))).toEqual([]);
    const ruim = { ...manga(), placement: { ...manga().placement!, arm: "meio" as "esquerda" } };
    expect(validatePattern(documento([ruim]))).toEqual(["Manga: posição na Prova inválida."]);
    const dois = { ...manga(), placement: { ...manga().placement!, leg: "esquerda" as const } };
    expect(validatePattern(documento([dois]))).toEqual(["Manga: a parte veste uma perna ou um braço, não os dois."]);
  });

  it("o cortar par veste o outro braço", () => {
    expect(pairCopy(manga()).piece.placement?.arm).toBe("direita");
    const g = garmentAtSize(documento([manga()]), "M");
    expect(g.pieces.map((p) => p.placement?.arm)).toEqual(["esquerda", "direita"]);
  });

  it("manga em par com o corpo na dobra: cada manga é costurada na metade do seu lado", () => {
    // Corpo: frente na dobra pelo centro (segmento 3); a "cava" é a lateral (segmento 1).
    const corpo: Piece = { ...saiaReta(), id: "corpo", name: "Corpo", fold: 3, placement: { side: "frente", anchor: "ombro", offset: 0 } };
    const doc = addSeam(documento([corpo, manga()]), { piece: "manga", segment: 1 }, { piece: "corpo", segment: 1 }, "same").doc;
    const g = garmentAtSize(doc, "M");
    expect(g.seams).toHaveLength(2);
    const lado = drawnHalfSide(corpo); // a metade desenhada da frente
    expect(lado).toBe("esquerda");
    const half = (seg: number) => (g.origin.corpo![seg]!.mirrored ? "espelhada" : "desenhada");
    const daManga = g.seams.find((s) => s.a.piece === "manga")!;
    const doPar = g.seams.find((s) => s.a.piece === "manga" + PAIR_SUFFIX)!;
    // A manga veste o braço esquerdo: vai na metade desenhada (o lado esquerdo do corpo), no mesmo sentido.
    expect(half(daManga.b.segment)).toBe("desenhada");
    expect(daManga.direction).toBe("same");
    // O par (braço direito) vai na metade espelhada; as duas cópias andam ao contrário, o sentido se mantém.
    expect(half(doPar.b.segment)).toBe("espelhada");
    expect(doPar.direction).toBe("same");
    expect(g.origin.corpo![daManga.b.segment]!.segment).toBe(1);
    expect(g.origin.corpo![doPar.b.segment]!.segment).toBe(1);

    // Manga no braço direito: o contrário, e cada uma cruza (só uma das cópias anda ao contrário).
    const direita = { ...manga(), placement: { ...manga().placement!, arm: "direita" as const } };
    const g2 = garmentAtSize(addSeam(documento([corpo, direita]), { piece: "manga", segment: 1 }, { piece: "corpo", segment: 1 }, "same").doc, "M");
    const m2 = g2.seams.find((s) => s.a.piece === "manga")!;
    expect(g2.origin.corpo![m2.b.segment]!.mirrored).toBe(true);
    expect(m2.direction).toBe("opposite");
  });
});
