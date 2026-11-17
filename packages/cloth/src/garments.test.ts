import { describe, expect, it } from "vitest";
import { garmentAtSize, validatePattern, type PatternDocument } from "@alinhavo/geometry";
import { createMannequin, type BodyConditions } from "./body/mannequin";
import { floorCollider } from "./collider";
import { FABRICS } from "./fabrics";
import { meshPiece } from "./mesh";
import { pieceHalf, placeGarment } from "./place";
import { createSimulation } from "./simulation";
import { calca, saia, top } from "./test-garments";

const BODY = { busto: 880, cintura: 720, quadril: 900, altura: 1650 };

/** Monta e simula `seconds` s; devolve a simulação, o corpo e as peças. */
function provar(doc: PatternDocument, seconds: number, conditions: BodyConditions = {}) {
  const body = createMannequin(BODY, "em-pe", {}, conditions);
  const { pieces, seams, foldLine } = garmentAtSize(doc, "M");
  // Como no Worker da Prova: malha simétrica pela linha da dobra.
  const meshes = pieces.map((p) => meshPiece(p, { spacing: 30, mirror: foldLine[p.id] }));
  const initial = placeGarment(
    meshes.map((mesh, i) => ({ mesh, placement: pieces[i]!.placement!, half: pieceHalf(pieces[i]!) })),
    body.landmarks,
  );
  const sim = createSimulation(
    meshes.map((mesh, i) => ({ mesh, initial: initial[i] })),
    { fabric: FABRICS.planoLeve, seams, colliders: [body.collider, floorCollider(0)], iterations: 2, sewingTime: 2 },
  );
  const gap0 = sim.seamGap();
  for (let f = 0; f < seconds * 60; f++) sim.step();
  return { sim, body, gap0, pieces };
}

function resumo(sim: ReturnType<typeof provar>["sim"], body: ReturnType<typeof provar>["body"]) {
  let top = -Infinity;
  let bottom = Infinity;
  let closest = Infinity;
  for (let i = 0; i < sim.vertexCount; i++) {
    const [x, y, z] = [sim.positions[i * 3]!, sim.positions[i * 3 + 1]!, sim.positions[i * 3 + 2]!];
    top = Math.max(top, y);
    bottom = Math.min(bottom, y);
    // A barra deitada no chão pode ficar embaixo da sola, espremida entre o
    // pé e o chão (não dá para cumprir os dois): ali não é a perna atravessando.
    const onFloor = y <= FABRICS.planoLeve.thickness + 0.5;
    if (!onFloor) closest = Math.min(closest, body.collider.query(x, y, z).distance);
  }
  return { top, bottom, closest, gap: sim.seamGap(), finite: sim.positions.every(Number.isFinite) };
}

describe("calça e top de teste", () => {
  it("os moldes são válidos", () => {
    expect(validatePattern(calca())).toEqual([]);
    expect(validatePattern(top())).toEqual([]);
  });

  it("a calça se costura, fica na cintura e as pernas não atravessam o corpo", () => {
    const { sim, body, gap0 } = provar(calca(), 4);
    const r = resumo(sim, body);
    console.info("calça", { gap0: Math.round(gap0), ...r, waist: body.landmarks.waist.y });
    expect(r.finite).toBe(true);
    expect(r.gap).toBeLessThan(2);
    expect(r.top).toBeLessThan(body.landmarks.waist.y + 30);
    expect(r.top).toBeGreaterThan(body.landmarks.waist.y - 100); // não escorregou
    expect(r.bottom).toBeGreaterThan(0); // a barra não atravessa o chão
    expect(r.closest).toBeGreaterThan(FABRICS.planoLeve.thickness - 0.5);
  }, 120_000);

  it("o top fica preso pelas alças nos ombros", () => {
    const { sim, body, gap0 } = provar(top(), 4);
    const r = resumo(sim, body);
    console.info("top", { gap0: Math.round(gap0), ...r, shoulder: body.landmarks.shoulder.y });
    expect(r.finite).toBe(true);
    expect(r.gap).toBeLessThan(2);
    expect(r.top).toBeGreaterThan(body.landmarks.shoulder.y - 20); // alças sobre os ombros
    expect(r.top).toBeLessThan(body.landmarks.shoulder.y + 80);
    // No manequim, o braço se sobrepõe ao tronco na axila (uns 15 mm, entre o
    // busto e o ombro): ali não existe posição fora dos dois, e a lateral do top
    // fica até uns milímetros dentro. Limitação do manequim, não da roupa (o
    // corpo realista resolve). Só ali tolera 5 mm; no resto, fora do corpo.
    const L = body.landmarks;
    for (let i = 0; i < sim.vertexCount; i++) {
      const [x, y, z] = [sim.positions[i * 3]!, sim.positions[i * 3 + 1]!, sim.positions[i * 3 + 2]!];
      const d = body.collider.query(x, y, z).distance;
      const axila = Math.abs(x) > 120 && y > L.bust.y - 60 && y < L.shoulder.y;
      if (axila) expect(d).toBeGreaterThan(-5);
      else expect(d).toBeGreaterThan(FABRICS.planoLeve.thickness - 0.5);
    }
  }, 120_000);
});

describe("roupa em corpo com condição", () => {
  it("calça sem a perna esquerda: costura, fica na cintura e a perna vazia cai sem explodir", () => {
    const { sim, body } = provar(calca(), 4, { limbs: { leftLeg: 0 } });
    const r = resumo(sim, body);
    expect(r.finite).toBe(true);
    expect(r.gap).toBeLessThan(2);
    expect(r.top).toBeGreaterThan(body.landmarks.waist.y - 100);
    expect(r.bottom).toBeGreaterThan(-1);
    expect(r.closest).toBeGreaterThan(-3);
  }, 60_000);

  // O caso do vídeo de referência: com salto, a mesma calça fica curta. Antes de
  // nov/2026 a calça escorregava pelo quadril quando o chão não sustentava as
  // pernas (o empurrão do corpo esticava a cintura além do limite do tecido).
  it("calça de salto: a cintura fica acima do quadril e a barra não desce", () => {
    const flat = provar(calca(), 6);
    const heels = provar(calca(), 6, { heel: 80 });
    const a = resumo(flat.sim, flat.body);
    const h = resumo(heels.sim, heels.body);
    expect(h.finite).toBe(true);
    expect(h.gap).toBeLessThan(2);
    // A cintura não passa do quadril.
    expect(h.top).toBeGreaterThan(heels.body.landmarks.hip.y);
    // A barra não desce. (A calça de teste é comprida: de salto de 8 cm ainda
    // encosta no chão, porque assenta uns 3 cm mais baixo no corpo.)
    expect(h.bottom).toBeGreaterThanOrEqual(a.bottom);
  }, 240_000);

  it("saia na gestante: costura e não atravessa a barriga", () => {
    const { sim, body } = provar(saia(), 4, { belly: 1050 });
    const r = resumo(sim, body);
    expect(r.finite).toBe(true);
    expect(r.gap).toBeLessThan(2);
    expect(r.closest).toBeGreaterThan(-3);
  }, 60_000);
});
