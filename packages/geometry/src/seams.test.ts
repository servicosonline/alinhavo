import { describe, expect, it } from "vitest";
import { removePiece, removePoint, splitSegment } from "./edit";
import { documento, saiaCurva, saiaReta } from "./fixtures";
import { migratePattern, validatePattern, type PatternDocument, type Piece } from "./pattern";
import { addSeam, continuationSegments, removeSeam, seamAt, seamLengths } from "./seams";

function costas(): Piece {
  return { ...saiaReta(), id: "costas", name: "Costas" };
}

/** Frente e costas com a lateral (segmento 1) costurada. */
function saiaCosturada(): PatternDocument {
  const { doc } = addSeam(documento([saiaReta(), costas()]), { piece: "frente", segment: 1 }, { piece: "costas", segment: 1 });
  return doc;
}

describe("migratePattern", () => {
  it("documento do formato 1 sobe até o atual com a lista de costuras vazia, sem mudar o original", () => {
    const v1 = { schema: 1, unit: "mm", sizes: ["P", "M", "G"], baseSize: "M", pieces: [saiaReta()] };
    const snapshot = JSON.stringify(v1);
    const doc = migratePattern(v1);
    expect(doc).toEqual({ ...v1, schema: 7, seams: [] });
    expect(validatePattern(doc!)).toEqual([]);
    expect(JSON.stringify(v1)).toBe(snapshot);
  });

  it("documento do formato 2 sobe para o 4 sem perder as costuras", () => {
    const v2 = { ...saiaCosturada(), schema: 2 };
    const doc = migratePattern(v2);
    expect(doc).toEqual({ ...v2, schema: 7 });
    expect(validatePattern(doc!)).toEqual([]);
  });

  it("documento do formato atual passa como está", () => {
    const doc = saiaCosturada();
    expect(migratePattern(doc)).toBe(doc);
  });

  it("recusa o que não é documento de molde ou tem versão desconhecida", () => {
    expect(migratePattern(null)).toBeNull();
    expect(migratePattern("molde")).toBeNull();
    expect(migratePattern({ ...documento(), schema: 8 })).toBeNull();
    expect(migratePattern({ ...documento(), schema: 2, seams: undefined })).toBeNull();
    expect(migratePattern({ ...documento(), seams: undefined })).toBeNull();
  });
});

describe("validação das costuras", () => {
  const erros = (seams: unknown) =>
    validatePattern({ ...documento([saiaReta(), costas()]), seams } as PatternDocument);

  it("costura válida não gera erro", () => {
    expect(validatePattern(saiaCosturada())).toEqual([]);
  });

  it("documento ainda no formato 1 é recusado (precisa passar por migratePattern)", () => {
    const v1 = { schema: 1, unit: "mm", sizes: ["M"], baseSize: "M", pieces: [] } as unknown as PatternDocument;
    expect(validatePattern(v1).join(" ")).toMatch(/Versão de documento desconhecida: 1/);
  });

  it("parte ou segmento inexistente", () => {
    expect(erros([{ id: "c", a: { piece: "manga", segment: 0 }, b: { piece: "costas", segment: 1 }, direction: "opposite" }])).toEqual([
      "Costura 1: a parte manga não existe.",
    ]);
    expect(erros([{ id: "c", a: { piece: "frente", segment: 4 }, b: { piece: "costas", segment: 1 }, direction: "opposite" }])).toEqual([
      "Costura 1: Frente não tem o segmento 5.",
    ]);
  });

  it("segmento costurado nele mesmo, em duas costuras, sentido e id inválidos", () => {
    const lado = { piece: "frente", segment: 1 };
    expect(erros([{ id: "c", a: lado, b: lado, direction: "opposite" }])).toContain(
      "Costura 1: um segmento só se costura nele mesmo numa parte de cortar par (com o par espelhado).",
    );
    expect(
      erros([
        { id: "c1", a: lado, b: { piece: "costas", segment: 1 }, direction: "opposite" },
        { id: "c1", a: lado, b: { piece: "costas", segment: 3 }, direction: "torto" },
      ]),
    ).toEqual([
      "Costura 2: id repetido (c1).",
      "Costura 2: sentido inválido.",
      "Costura 2: o segmento já está em outra costura.",
    ]);
  });

  it("lista de costuras faltando", () => {
    expect(erros(undefined)).toEqual(["A lista de costuras está faltando."]);
  });
});

describe("addSeam / removeSeam", () => {
  it("costura dois segmentos com id novo e sentido oposto por padrão", () => {
    const doc = saiaCosturada();
    expect(doc.seams).toEqual([
      { id: "costura1", a: { piece: "frente", segment: 1 }, b: { piece: "costas", segment: 1 }, direction: "opposite" },
    ]);
    expect(seamAt(doc, { piece: "costas", segment: 1 })?.id).toBe("costura1");
    expect(seamAt(doc, { piece: "costas", segment: 0 })).toBeUndefined();
  });

  it("recusa segmento já costurado, inexistente ou repetido", () => {
    const doc = saiaCosturada();
    expect(addSeam(doc, { piece: "frente", segment: 1 }, { piece: "costas", segment: 3 }).doc).toBe(doc);
    expect(addSeam(doc, { piece: "frente", segment: 9 }, { piece: "costas", segment: 3 }).seamId).toBeNull();
    expect(addSeam(doc, { piece: "frente", segment: 0 }, { piece: "frente", segment: 0 }).seamId).toBeNull();
  });

  it("aceita costura dentro da mesma parte e no mesmo sentido", () => {
    const { doc, seamId } = addSeam(documento(), { piece: "frente", segment: 1 }, { piece: "frente", segment: 3 }, "same");
    expect(seamId).toBe("costura1");
    expect(doc.seams[0]!.direction).toBe("same");
    expect(validatePattern(doc)).toEqual([]);
  });

  it("removeSeam desfaz só a costura pedida", () => {
    const doc = saiaCosturada();
    expect(removeSeam(doc, "costura1").seams).toEqual([]);
    expect(removeSeam(doc, "nao-existe")).toBe(doc);
  });
});

describe("costuras acompanham a edição", () => {
  it("dividir o segmento costurado desfaz a costura", () => {
    const { doc } = splitSegment(saiaCosturada(), "frente", 1);
    expect(doc.seams).toEqual([]);
    expect(validatePattern(doc)).toEqual([]);
  });

  it("dividir um segmento anterior empurra a numeração da costura", () => {
    const { doc } = splitSegment(saiaCosturada(), "frente", 0);
    expect(doc.seams[0]!.a).toEqual({ piece: "frente", segment: 2 });
    expect(doc.seams[0]!.b).toEqual({ piece: "costas", segment: 1 });
    expect(validatePattern(doc)).toEqual([]);
  });

  it("dividir um segmento posterior não muda a costura", () => {
    const before = saiaCosturada();
    const { doc } = splitSegment(before, "frente", 2);
    expect(doc.seams).toEqual(before.seams);
  });

  it("apagar um ponto renumera ou desfaz, conforme o segmento", () => {
    const base = saiaCosturada();
    const { doc: comPonto } = splitSegment(base, "frente", 0); // A–P1–B: costura vai para o 2
    // Apagar P1 junta os segmentos 0 e 1: a costura (agora no 2) volta para o 1.
    const semPonto = removePoint(comPonto, "frente", "P1");
    expect(semPonto.seams[0]!.a).toEqual({ piece: "frente", segment: 1 });
    // Apagar C junta a lateral (1) com a barra (2): a costura da lateral se desfaz.
    expect(removePoint(base, "frente", "C").seams).toEqual([]);
    // Apagar o ponto inicial A junta o último e o primeiro segmento; a lateral passa a ser o 0.
    const semInicio = removePoint(base, "frente", "A");
    expect(semInicio.seams[0]!.a).toEqual({ piece: "frente", segment: 0 });
    expect(validatePattern(semInicio)).toEqual([]);
  });

  it("apagar uma parte tira as costuras dela", () => {
    const doc = removePiece(saiaCosturada(), "costas");
    expect(doc.pieces.map((p) => p.id)).toEqual(["frente"]);
    expect(doc.seams).toEqual([]);
  });
});

describe("seamLengths", () => {
  it("mede os dois lados no tamanho pedido", () => {
    const doc = saiaCosturada();
    expect(seamLengths(doc).get("costura1")).toEqual({ a: 600, b: 600, diff: 0 });
    // No G a lateral desce 15 mm nas duas partes.
    expect(seamLengths(doc, "G").get("costura1")?.a).toBeCloseTo(615, 9);
  });

  it("aponta a diferença quando um lado é maior", () => {
    const { doc } = addSeam(documento([saiaCurva(), costas()]), { piece: "frente", segment: 1 }, { piece: "costas", segment: 1 });
    const l = seamLengths(doc).get("costura1")!;
    expect(l.b).toBe(600);
    expect(l.a).toBeGreaterThan(600); // a lateral curva é mais comprida que a reta
    expect(l.diff).toBeGreaterThan(1);
    expect(l.diff).toBeCloseTo(l.a - l.b, 12);
  });
});

describe("continuationSegments", () => {
  it("a barra da frente continua na barra das costas pela costura lateral (mesmo sentido)", () => {
    const { doc } = addSeam(documento([saiaReta(), costas()]), { piece: "frente", segment: 1 }, { piece: "costas", segment: 1 }, "same");
    expect(continuationSegments(doc, { piece: "frente", segment: 2 })).toEqual([{ piece: "costas", segment: 2 }]);
    expect(continuationSegments(doc, { piece: "frente", segment: 0 })).toEqual([{ piece: "costas", segment: 0 }]);
  });

  it("com a costura em sentido oposto, acha o segmento certo do outro lado", () => {
    // Costas percorridas ao contrário: centro, barra, lateral de baixo para cima, cintura.
    const invertidas: Piece = {
      ...costas(),
      outline: [
        { kind: "line", to: "D" }, // 0: centro
        { kind: "line", to: "C" }, // 1: barra
        { kind: "line", to: "B" }, // 2: lateral, de baixo para cima
        { kind: "line", to: "A" }, // 3: cintura
      ],
      seamAllowanceByEdge: { 1: 30 },
    };
    const { doc } = addSeam(documento([saiaReta(), invertidas]), { piece: "frente", segment: 1 }, { piece: "costas", segment: 2 }, "opposite");
    expect(continuationSegments(doc, { piece: "frente", segment: 2 })).toEqual([{ piece: "costas", segment: 1 }]);
    expect(continuationSegments(doc, { piece: "frente", segment: 0 })).toEqual([{ piece: "costas", segment: 3 }]);
  });

  it("segue a corrente por várias peças e não volta ao segmento de partida", () => {
    // frente | lado | costas, laterais costuradas: a barra passa pelas três.
    const lado: Piece = { ...saiaReta(), id: "lado", name: "Lado" };
    let doc = documento([saiaReta(), lado, costas()]);
    doc = addSeam(doc, { piece: "frente", segment: 1 }, { piece: "lado", segment: 3 }, "opposite").doc;
    doc = addSeam(doc, { piece: "lado", segment: 1 }, { piece: "costas", segment: 3 }, "opposite").doc;
    expect(continuationSegments(doc, { piece: "frente", segment: 2 })).toEqual([
      { piece: "lado", segment: 2 },
      { piece: "costas", segment: 2 },
    ]);
  });

  it("sem costura nas pontas, não há continuação; a dobra não entra", () => {
    expect(continuationSegments(documento([saiaReta(), costas()]), { piece: "frente", segment: 2 })).toEqual([]);
    // Com a barra das costas marcada como dobra, a continuação cairia nela: fica de fora.
    const dobrada: Piece = { ...costas(), fold: 2 };
    const { doc } = addSeam(documento([saiaReta(), dobrada]), { piece: "frente", segment: 1 }, { piece: "costas", segment: 1 }, "same");
    expect(continuationSegments(doc, { piece: "frente", segment: 2 })).toEqual([]);
    expect(continuationSegments(doc, { piece: "frente", segment: 9 })).toEqual([]);
  });
});
