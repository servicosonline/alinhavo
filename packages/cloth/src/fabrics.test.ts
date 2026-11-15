import { describe, expect, it } from "vitest";
import { garmentAtSize } from "@alinhavo/geometry";
import { createMannequin } from "./body/mannequin";
import { floorCollider } from "./collider";
import { DRAPE_DEFAULT, FABRIC_MAX_THICKNESS, FABRIC_PRESETS, FABRIC_TUNING_RANGE, FABRICS, tuneFabric } from "./fabrics";
import { meshPiece } from "./mesh";
import { pieceHalf, placeGarment } from "./place";
import { createSimulation } from "./simulation";
import { saia } from "./test-garments";

describe("biblioteca de tecidos", () => {
  it("cada preset tem o id da chave e valores plausíveis", () => {
    for (const id of FABRIC_PRESETS) {
      const f = FABRICS[id];
      expect(f.id).toBe(id);
      expect(f.name.length).toBeGreaterThan(0);
      expect(f.thickness).toBeLessThanOrEqual(FABRIC_MAX_THICKNESS);
      expect(f.maxStretch).toBeGreaterThan(0);
      // O urdume (fio) é o que menos cede; o viés cede mais que o urdume.
      expect(f.stretch.warp, id).toBeLessThanOrEqual(f.stretch.weft);
      expect(f.stretch.warp, id).toBeLessThan(f.stretch.bias);
    }
  });

  it("relações entre eles: malhas esticam mais que planos; jeans com elastano estica mais que jeans; chiffon é o mais leve e fluido", () => {
    expect(FABRICS.ribana.maxStretch).toBeGreaterThan(FABRICS.tricoline.maxStretch);
    expect(FABRICS.malha.maxStretch).toBeGreaterThan(FABRICS.linho.maxStretch);
    expect(FABRICS.jeansElastano.maxStretch).toBeGreaterThan(FABRICS.jeans.maxStretch);
    expect(FABRICS.jeansElastano.stretch.weft).toBeGreaterThan(FABRICS.jeans.stretch.weft);
    const all = FABRIC_PRESETS.map((id) => FABRICS[id]);
    expect(Math.min(...all.map((f) => f.density))).toBe(FABRICS.chiffon.density);
    expect(Math.max(...all.map((f) => f.bend))).toBe(FABRICS.chiffon.bend);
    // Armado: jeans e sarja dobram menos que viscose.
    expect(FABRICS.sarja.bend).toBeLessThan(FABRICS.viscose.bend);
  });
});

describe("tecido cadastrado sobre o preset", () => {
  it("sem ajuste, é o preset", () => {
    expect(tuneFabric(FABRICS.malha)).toEqual(FABRICS.malha);
    expect(tuneFabric(FABRICS.malha, { drape: DRAPE_DEFAULT })).toEqual(FABRICS.malha);
  });

  it("gramatura e espessura entram direto; elasticidade vira o limite e cede a trama; caimento muda a flexão", () => {
    const base = FABRICS.tricoline;
    const t = tuneFabric(base, { weightGsm: 140, thicknessMm: 0.6, stretchPct: 8, drape: 5 });
    expect(t.density).toBe(140);
    expect(t.thickness).toBe(0.6);
    expect(t.maxStretch).toBeCloseTo(0.08, 9);
    expect(t.stretch.weft).toBeCloseTo(base.stretch.weft * 2, 12);
    expect(t.stretch.warp).toBe(base.stretch.warp);
    expect(t.bend).toBeGreaterThan(base.bend * 5);
    expect(tuneFabric(base, { drape: 1 }).bend).toBeLessThan(base.bend / 5);
    // Não muda o preset original.
    expect(base.stretch.weft).toBe(FABRICS.tricoline.stretch.weft);
  });

  it("valores fora do plausível ficam nos limites; o que não é número é ignorado", () => {
    const t = tuneFabric(FABRICS.malha, { weightGsm: 99999, thicknessMm: 50, stretchPct: -3, drape: Number.NaN });
    expect(t.density).toBe(FABRIC_TUNING_RANGE.weightGsm[1]);
    expect(t.thickness).toBe(FABRIC_MAX_THICKNESS);
    expect(t.maxStretch).toBe(FABRIC_TUNING_RANGE.stretchPct[0] / 100);
    expect(t.bend).toBe(FABRICS.malha.bend);
  });
});

describe("simulação nos tecidos novos", () => {
  it.each(FABRIC_PRESETS.filter((id) => !["malha", "planoLeve", "jeans"].includes(id)))(
    "a saia costura e não explode em %s",
    (id) => {
      const body = createMannequin({ busto: 880, cintura: 720, quadril: 900, altura: 1650 });
      const { pieces, seams, foldLine } = garmentAtSize(saia(), "M");
      const meshes = pieces.map((p) => meshPiece(p, { spacing: 30, mirror: foldLine[p.id] }));
      const initial = placeGarment(
        meshes.map((mesh, i) => ({ mesh, placement: pieces[i]!.placement!, half: pieceHalf(pieces[i]!) })),
        body.landmarks,
      );
      const sim = createSimulation(
        meshes.map((mesh, i) => ({ mesh, initial: initial[i] })),
        { fabric: FABRICS[id], seams, colliders: [body.collider, floorCollider(0)], iterations: 2, sewingTime: 1 },
      );
      for (let f = 0; f < 150; f++) sim.step();
      expect(sim.positions.every(Number.isFinite)).toBe(true);
      expect(sim.seamGap()).toBeLessThan(3);
      let bottom = Infinity;
      for (let i = 1; i < sim.positions.length; i += 3) bottom = Math.min(bottom, sim.positions[i]!);
      expect(bottom).toBeGreaterThan(-1); // não atravessa o chão
    },
    60_000,
  );
});
