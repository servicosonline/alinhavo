import { describe, expect, it } from "vitest";
import { FABRIC_MAX_THICKNESS, FABRICS } from "../fabrics";
import { MAX_OVERESTIMATE, TRUSTED_CLEARANCE_MM } from "../collider";
import { MAKEHUMAN_DATA } from "./makehuman-data";
import { decodeMakeHuman, fitRealistic, PARAM_LIMIT, SKIN_GROUPS } from "./makehuman";
import { bodyBones, motionClip, motionPose, posedWith } from "./motion";
import { buildRealistic, createRealisticBody, realisticBuilder, realisticModel } from "./realistic";
import type { MeasurementKey } from "./measurements";

const asset = decodeMakeHuman(MAKEHUMAN_DATA);
const TABELA_M = { busto: 880, cintura: 720, quadril: 900, altura: 1650 };

describe("arquivo do corpo realista", () => {
  it("é pequeno e diz a origem e a licença de cada arquivo (CC0, só dados do MakeHuman)", () => {
    // Base64 de ~1,2 MB de dados (~610 KB comprimido no download).
    expect(MAKEHUMAN_DATA.length).toBeLessThan(1_700_000);
    expect(asset.source.licenca).toBe("CC0 1.0 Universal");
    expect(asset.source.repositorio).toBe("https://github.com/makehumancommunity/makehuman");
    expect(asset.source.arquivos).toContain("3dobjs/base.obj");
    expect(asset.source.arquivos).toContain("rigs/default.mhskel");
    expect(asset.source.arquivos).toContain("rigs/default_weights.mhw");
    // Só arquivos de dados: nada de código (.py) do MakeHuman.
    for (const f of asset.source.arquivos) expect(f).toMatch(/\.(obj|target|mhskel|mhw)$/);
  });

  it("lê a malha, os pesos (somam 1) e os targets", () => {
    expect(asset.drawnCount).toBeGreaterThan(10_000);
    expect(asset.triangles.length % 3).toBe(0);
    for (let i = 0; i < asset.triangles.length; i++) expect(asset.triangles[i]!).toBeLessThan(asset.drawnCount);
    for (let v = 0; v < asset.drawnCount; v += 97) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += asset.skinWeights[v * 4 + k]!;
        expect(asset.skinGroups[v * 4 + k]!).toBeLessThan(SKIN_GROUPS.length);
      }
      expect(sum).toBeCloseTo(1, 5);
    }
    for (const id of ["busto", "cintura", "quadril", "masculino", "pesoF", "pesoM"]) expect(asset.targets[id]?.incr.idx.length).toBeGreaterThan(0);
  });
});

describe("ajuste às medidas (mínimos quadrados)", () => {
  const cases = [
    { name: "feminino M", table: TABELA_M, sex: "feminino" as const },
    { name: "plus size", table: { busto: 1100, cintura: 950, quadril: 1150, altura: 1600 }, sex: "feminino" as const },
    { name: "masculino", table: { busto: 1000, cintura: 850, quadril: 980, altura: 1780 }, sex: "masculino" as const },
  ];
  for (const c of cases) {
    it(`${c.name}: busto, cintura e quadril batem a 2%, a altura exata e as outras medidas a 7%`, () => {
      const fit = fitRealistic(asset, c.table, {}, c.sex);
      const want = fit.reading.values;
      const rel = (k: MeasurementKey) => Math.abs(fit.obtained[k] - want[k]) / want[k];
      expect(rel("altura")).toBeLessThan(0.002);
      for (const k of ["busto", "cintura", "quadril"] as const) expect(rel(k), k).toBeLessThan(0.02);
      for (const k of ["entrepernas", "comprimentoDoBraco", "punho", "pescoco", "coxa", "joelho", "tornozelo", "braco"] as const) expect(rel(k), k).toBeLessThan(0.07);
      for (const w of Object.values(fit.weights)) expect(Math.abs(w)).toBeLessThanOrEqual(PARAM_LIMIT);
    });
  }

  it("medida trocada na tela entra no ajuste (o corpo segue o quadril maior)", () => {
    const a = fitRealistic(asset, TABELA_M);
    const b = fitRealistic(asset, TABELA_M, { quadril: 1000 });
    expect(b.obtained.quadril - a.obtained.quadril).toBeGreaterThan(80);
    expect(Math.abs(b.obtained.quadril - 1000) / 1000).toBeLessThan(0.02);
  });
});

describe("corpo realista", () => {
  const model = realisticModel(asset, TABELA_M);

  it("entra pelo contrato Body: tipo, pés no chão, referências de cima para baixo", () => {
    const body = createRealisticBody(asset, TABELA_M, "em-pe");
    expect(body.kind).toBe("makehuman");
    expect(body.pose).toBe("em-pe");
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 1; i < body.mesh.positions.length; i += 3) {
      minY = Math.min(minY, body.mesh.positions[i]!);
      maxY = Math.max(maxY, body.mesh.positions[i]!);
    }
    expect(Math.abs(minY)).toBeLessThan(15);
    expect(Math.abs(maxY - 1650)).toBeLessThan(20);
    const l = body.landmarks;
    expect(l.crotch.y).toBeLessThan(l.hip.y + 1);
    expect(l.hip.y).toBeLessThan(l.waist.y);
    expect(l.waist.y).toBeLessThan(l.bust.y);
    expect(l.bust.y).toBeLessThan(l.shoulder.y);
    expect(l.shoulder.y).toBeLessThan(l.neck.y);
    for (const chain of [l.legs.left, l.legs.right, l.arms.left, l.arms.right]) {
      expect(chain).toHaveLength(3);
      expect(chain[0]!.y).toBeGreaterThan(chain[1]!.y);
      expect(chain[1]!.y).toBeGreaterThan(chain[2]!.y);
    }
    expect(l.legs.left[0]!.x).toBeGreaterThan(0); // esquerda em +X
    expect(l.shoulderPoints.left.x).toBeGreaterThan(0);
    expect(l.headTop).toBeGreaterThan(l.neck.y);
  });

  it("a pele do tronco fica dentro do colisor (a roupa não deixa o corpo aparecer por baixo)", () => {
    const { body } = buildRealistic(model, "em-pe");
    const P = body.mesh.positions;
    let outside = 0;
    for (let v = 0; v < P.length / 3; v++) if (body.collider.query(P[v * 3]!, P[v * 3 + 1]!, P[v * 3 + 2]!).distance > 5) outside++;
    // Fica de fora só o que o cone não pega: dedos abertos e a ponta do polegar.
    expect(outside / (P.length / 3)).toBeLessThan(0.04);
  });

  it("perto da pele a distância cumpre o contrato do Collider (o simulador pula perguntas com ela)", () => {
    const band = Math.max(FABRIC_MAX_THICKNESS, ...Object.values(FABRICS).map((f) => f.thickness)) + TRUSTED_CLEARANCE_MM;
    const h = 0.5;
    const steps = [
      [h, 0, 0], [-h, 0, 0], [0, h, 0], [0, -h, 0], [0, 0, h], [0, 0, -h],
    ] as const;
    for (const pose of ["em-pe", "passo", "bracos-abertos"] as const) {
      const { body } = buildRealistic(model, pose);
      const P = body.mesh.positions;
      let worst = 0;
      let where = "";
      let checked = 0;
      for (let v = 0; v < P.length / 3; v += 5) {
        const s = { x: P[v * 3]!, y: P[v * 3 + 1]!, z: P[v * 3 + 2]! };
        const n = body.collider.query(s.x, s.y, s.z).normal;
        for (let t = 0.5; t <= band; t += 0.5) {
          const p = { x: s.x + n.x * t, y: s.y + n.y * t, z: s.z + n.z * t };
          const d = body.collider.query(p.x, p.y, p.z).distance;
          if (d <= 0 || d > band) continue;
          checked++;
          for (const [ex, ey, ez] of steps) {
            const rate = (d - body.collider.query(p.x + ex, p.y + ey, p.z + ez).distance) / h;
            if (rate > worst) {
              worst = rate;
              where = `${pose} (${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}) d=${d.toFixed(2)}`;
            }
          }
        }
      }
      expect(checked).toBeGreaterThan(1000);
      expect(worst, where).toBeLessThanOrEqual(MAX_OVERESTIMATE);
    }
  }, 60_000);

  it("a malha anda com o esqueleto: o braço sobe no aceno, o tronco fica no lugar", () => {
    const builder = realisticBuilder(model);
    const clip = motionClip("acenar");
    const rest = posedWith(builder, motionPose(clip, 0)).body;
    const up = posedWith(builder, motionPose(clip, 1.2)).body;
    // Punho direito (−X) bem acima do ombro; o esquerdo parado.
    expect(up.landmarks.arms.right[2]!.y).toBeGreaterThan(up.landmarks.shoulderPoints.right.y);
    expect(up.landmarks.arms.left[2]!.y).toBeCloseTo(rest.landmarks.arms.left[2]!.y, 3);
    expect(up.landmarks.waist.y).toBeCloseTo(rest.landmarks.waist.y, 3);
    // A malha vai junto: há pele acima de 1,5 m do lado de fora do ombro direito (a mão e o antebraço).
    let raised = 0;
    for (let i = 0; i < up.mesh.positions.length; i += 3) if (up.mesh.positions[i]! < -250 && up.mesh.positions[i + 1]! > 1500) raised++;
    expect(raised).toBeGreaterThan(300);
    // Os ossos do corpo (o atrito contra a pele que anda) saem das referências, como no manequim.
    expect(bodyBones(up)).toHaveLength(bodyBones(rest).length);
  });

  it("deitar gira o corpo inteiro e o apoia no chão", () => {
    const builder = realisticBuilder(model);
    const lying = posedWith(builder, motionPose(motionClip("deitar"), 2.5), { mesh: false }).body;
    let below = 0;
    for (let x = -300; x <= 300; x += 50) for (let z = -1800; z <= 300; z += 50) if (lying.collider.query(x, -5, z).distance < 0) below++;
    expect(below).toBe(0);
    expect(lying.collider.query(0, 300, -800).distance).toBeLessThan(200);
  });
});
