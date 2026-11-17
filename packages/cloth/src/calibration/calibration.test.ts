import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FABRIC_PRESETS, FABRICS, type Fabric } from "../fabrics";
import { boxCollider, cantileverDrop, discCollider, discDrape, hangStrain } from "./bench";
import { CALIBRATION_TOLERANCE, fitBendingLengthFromRuler, fitStretch, logBisect } from "./fit";
import { DIRECTIONS, hangStrain as measuredStrain, readSamples, sampleProblems, type Sample } from "./measurements";

/** Uma amostra só no formato: números de exemplo, não medida. */
const exemplo = (): Sample => ({
  id: "exemplo",
  preset: "tricoline",
  tecido: { nome: "Tricoline de teste" },
  medidoEm: "2026-11-20",
  medidoPor: "teste",
  gramatura: 118,
  espessuraMm: 0.31,
  regua: { foraMm: 150, fio: { quedaMm: 74 }, trama: { quedaMm: 81 } },
  peso: {
    fio: { zeroMm: 200, g500Mm: 201, g2000Mm: 203 },
    trama: { zeroMm: 200, g500Mm: 202, g2000Mm: 206 },
    vies: { zeroMm: 200, g500Mm: 209, g2000Mm: 226 },
  },
  disco: { cc: 0.62, ondas: 6 },
  fotos: ["calibration/fotos/exemplo/regua.jpg"],
});

describe("medidas.json", () => {
  it("lê uma amostra completa", () => {
    expect(sampleProblems(exemplo())).toEqual([]);
    expect(readSamples({ formato: 1, amostras: [exemplo()] })).toHaveLength(1);
    const s = measuredStrain(exemplo(), "vies");
    expect(s.g500).toBeCloseTo(0.045);
    expect(s.g2000).toBeCloseTo(0.13);
  });

  it("recusa o que não confere, com a razão em português", () => {
    const semFoto = { ...exemplo(), fotos: [] };
    expect(sampleProblems(semFoto).join()).toMatch(/fotos/);
    const encolheu = exemplo();
    encolheu.peso.fio = { zeroMm: 200, g500Mm: 199, g2000Mm: 203 };
    expect(sampleProblems(encolheu).join()).toMatch(/crescer/);
    expect(sampleProblems({ ...exemplo(), preset: "seda" }).join()).toMatch(/preset desconhecido/);
    expect(sampleProblems({ ...exemplo(), gramatura: 5000 }).join()).toMatch(/gramatura/);
    expect(() => readSamples({ formato: 1, amostras: [exemplo(), exemplo()] })).toThrow(/repetido/);
    expect(() => readSamples({ amostras: [] })).toThrow(/formato/);
  });

  it("o arquivo do repositório lê sem problema", () => {
    expect(() => readSamples(JSON.parse(readFileSync(new URL("../../calibration/medidas.json", import.meta.url), "utf8")))).not.toThrow();
  });
});

describe("colisores da bancada", () => {
  it("a mesa e o disco dão a distância exata (cumprem o contrato do Collider)", () => {
    const mesa = boxCollider({ x: -10, y: 0, z: -10 }, { x: 10, y: 5, z: 0 });
    expect(mesa.query(0, 7, -5).distance).toBeCloseTo(2);
    expect(mesa.query(0, 7, -5).normal.y).toBe(1);
    expect(mesa.query(0, 8, 4).distance).toBeCloseTo(5); // diagonal da quina: 3 acima, 4 à frente
    expect(mesa.query(0, 4, -5).distance).toBeCloseTo(-1);
    const disco = discCollider({ x: 0, z: 0 }, 100, 90, 10);
    expect(disco.query(0, 103, 0).distance).toBeCloseTo(3);
    expect(disco.query(95, 95, 0).distance).toBeCloseTo(5);
    expect(disco.query(95, 95, 0).normal.x).toBeCloseTo(1);
    expect(disco.query(0, 99, 0).distance).toBeCloseTo(-1);
  });
});

describe("tira com peso (equilíbrio estático)", () => {
  const solto: Fabric = { ...FABRICS.malha, maxStretch: 2 };

  it("a trama cede mais que o fio; dobrar o peso quase dobra o esticamento (pequeno)", () => {
    const fio = hangStrain(solto, "fio", 500, 50);
    const trama = hangStrain(solto, "trama", 500, 50);
    expect(fio.converged && trama.converged).toBe(true);
    expect(trama.strain).toBeGreaterThan(fio.strain);
    const jeans = { ...FABRICS.jeans, maxStretch: 2 };
    const a = hangStrain(jeans, "fio", 200, 50).strain;
    const b = hangStrain(jeans, "fio", 400, 50).strain;
    expect(b / a).toBeGreaterThan(1.8);
    expect(b / a).toBeLessThan(2.2);
  });

  it("a carga é por largura: tira real mais larga com o mesmo peso estica menos", () => {
    const estreita = hangStrain(solto, "fio", 500, 50).strain;
    const larga = hangStrain(solto, "fio", 500, 100).strain;
    expect(larga).toBeLessThan(estreita);
  });

  it("nunca passa do limite de esticamento, e avisa quando chega nele", () => {
    const r = hangStrain(FABRICS.malha, "trama", 2000, 50);
    expect(r.strain).toBeLessThanOrEqual(FABRICS.malha.maxStretch + 1e-3);
    expect(r.limited).toBe(true);
  });

  it("o ajuste acha de volta as complacências de um tecido conhecido", () => {
    const alvo: Fabric = { ...FABRICS.jeans, maxStretch: 0.5, stretch: { warp: 3e-7, weft: 2e-6, bias: 8e-6 } };
    const targets = Object.fromEntries(DIRECTIONS.map((d) => [d, hangStrain(alvo, d, 500, 50).strain])) as Record<
      (typeof DIRECTIONS)[number],
      number
    >;
    const partida: Fabric = { ...alvo, stretch: { warp: 1e-5, weft: 1e-5, bias: 1e-5 } };
    const fit = fitStretch(partida, targets);
    expect(fit.atBound).toEqual([]);
    for (const d of DIRECTIONS) {
      const got = hangStrain({ ...partida, stretch: fit.stretch }, d, 500, 50).strain;
      expect(Math.abs(got / targets[d] - 1), d).toBeLessThan(0.02);
    }
  });
});

describe("caimento no disco", () => {
  it("mais flexão (menos complacência) = mais armado; jeans arma mais que chiffon", () => {
    const mole = discDrape({ ...FABRICS.tricoline, bendingLength: 20 });
    const firme = discDrape({ ...FABRICS.tricoline, bendingLength: 60 });
    expect(mole.settled && firme.settled).toBe(true);
    expect(firme.cc).toBeGreaterThan(mole.cc + 0.2);
    expect(discDrape(FABRICS.jeans).cc).toBeGreaterThan(discDrape(FABRICS.chiffon).cc);
    for (const r of [mole, firme]) {
      expect(r.cc).toBeGreaterThan(0);
      expect(r.cc).toBeLessThan(1);
    }
  });

  it("bissecção: monótona nos dois sentidos, ponta quando o alvo está fora", () => {
    expect(logBisect((c) => c, 1e-3, [1e-6, 1], 40).value).toBeCloseTo(1e-3, 6);
    expect(logBisect((c) => -c, -1e-3, [1e-6, 1], 40).value).toBeCloseTo(1e-3, 6);
    expect(logBisect((c) => c, 5, [1e-6, 1])).toEqual({ value: 1, atBound: true });
  });
});

describe("régua na borda da mesa", () => {
  // Até nov/2026 a flexão era uma distância entre vértices opostos e não
  // segurava tecido plano (toda tira caía quase reta). A de curvatura segura,
  // e a régua passou a ajustar a flexão.
  it("a tira plana se segura conforme o tecido: jeans cai bem menos que chiffon", () => {
    // 100 mm para fora: 2 × o comprimento do jeans (a norma usa a tira caindo 41,5°).
    // Na malha de 30 mm a queda sai até ~25% maior que a da fórmula de Peirce
    // (só 3 triângulos no balanço); a calibração ajusta nesta malha mesmo.
    const jeans = cantileverDrop(FABRICS.jeans, 100);
    const chiffon = cantileverDrop(FABRICS.chiffon, 100);
    expect(jeans.reachMm).toBeGreaterThan(50); // fica para fora da mesa
    expect(chiffon.reachMm).toBeLessThan(10); // pende reto
    expect(jeans.dropMm).toBeLessThan(chiffon.dropMm - 20);
  });

  it("o ajuste acha de volta o comprimento de flexão pela queda", () => {
    const drop = cantileverDrop({ ...FABRICS.tricoline, bendingLength: 45 }, 120).dropMm;
    const fit = fitBendingLengthFromRuler(FABRICS.tricoline, 120, drop);
    expect(fit.atBound).toBe(false);
    expect(fit.value / 45).toBeGreaterThan(0.95);
    expect(fit.value / 45).toBeLessThan(1.05);
  });
});

describe("presets calibrados reproduzem as medidas", () => {
  const samples = readSamples(JSON.parse(readFileSync(new URL("../../calibration/medidas.json", import.meta.url), "utf8")));
  const byPreset = FABRIC_PRESETS.map((id) => ({ id, list: samples.filter((s) => s.preset === id) })).filter((p) => p.list.length > 0);

  // Sem medidas ainda (fase A do plano), não há o que conferir. Medida nova e
  // preset atualizado (`calibration/resultado.json` → `fabrics.ts`) vão juntos.
  it.skipIf(byPreset.length > 0)("sem amostras medidas ainda", () => {
    expect(samples).toEqual([]);
  });

  for (const { id, list } of byPreset) {
    it(`${id} (${list.length} amostra${list.length > 1 ? "s" : ""})`, () => {
      const f = FABRICS[id];
      const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
      const tol = CALIBRATION_TOLERANCE;
      expect(Math.abs(f.density / mean(list.map((s) => s.gramatura)) - 1)).toBeLessThan(tol.direct);
      expect(Math.abs(f.thickness / mean(list.map((s) => s.espessuraMm)) - 1)).toBeLessThan(tol.direct);
      for (const d of DIRECTIONS) {
        const want = mean(list.map((s) => measuredStrain(s, d).g500));
        const got = hangStrain(f, d, 500, mean(list.map((s) => s.peso.larguraMm ?? 50))).strain;
        expect(Math.abs(got / want - 1), `${id} ${d}`).toBeLessThan(tol.strain);
      }
      const discs = list.flatMap((s) => (s.disco ? [s.disco.cc] : []));
      if (discs.length > 0) expect(Math.abs(discDrape(f).cc - mean(discs))).toBeLessThan(tol.cc);
    });
  }
});
