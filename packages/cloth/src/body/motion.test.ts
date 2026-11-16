import { describe, expect, it } from "vitest";
import { createMannequin, poseAngles } from "./mannequin";
import { bodyBones, boneStep, MOTIONS, motionBody, motionClip, motionDuration, motionPose, motionSeat, onSeat, seatCollider } from "./motion";

const BODY = { busto: 880, cintura: 720, quadril: 900, altura: 1650 };
const REST = { ...poseAngles("em-pe"), root: { yaw: 0, pitch: 0, roll: 0, x: 0, z: 0 } };

/** Pontos em volta do corpo, da canela ao ombro. */
const probes = (() => {
  const out: [number, number, number][] = [];
  for (let y = 150; y <= 1500; y += 90) for (let k = 0; k < 8; k++) out.push([Math.cos(k) * 190, y, Math.sin(k) * 150]);
  return out;
})();

const lowestOf = (positions: Float32Array) => {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 1; i < positions.length; i += 3) {
    min = Math.min(min, positions[i]!);
    max = Math.max(max, positions[i]!);
  }
  return { min, max };
};

describe("clipes", () => {
  it("todo clipe começa e termina em pé, sem giro", () => {
    for (const clip of MOTIONS) {
      expect(motionPose(clip, 0)).toEqual(REST);
      expect(motionPose(clip, motionDuration(clip))).toEqual(REST);
      expect(motionPose(clip, -1)).toEqual(REST);
    }
  });

  it("os ids são únicos e o tempo dos quadros-chave só anda para a frente", () => {
    expect(new Set(MOTIONS.map((m) => m.id)).size).toBe(7);
    for (const clip of MOTIONS) for (let k = 1; k < clip.keys.length; k++) expect(clip.keys[k]!.t).toBeGreaterThan(clip.keys[k - 1]!.t);
  });

  it("passa pelos quadros-chave e anda sem tranco (no máximo 25° por quadro de 1/60 s)", () => {
    const flat = (p: ReturnType<typeof motionPose>) => [...p.arms.flatMap((a) => [a.abduction, a.flexion, a.elbow]), ...p.legs.flatMap((l) => [l.abduction, l.flexion, l.knee]), p.root.yaw, p.root.pitch, p.root.roll];
    for (const clip of MOTIONS) {
      const mid = clip.keys[1]!;
      expect(flat(motionPose(clip, mid.t)).map((v) => Math.round(v * 1e6) / 1e6)).toEqual(flat(mid.pose).map((v) => Math.round(v * 1e6) / 1e6));
      let prev = flat(motionPose(clip, 0));
      for (let t = 1 / 60; t <= motionDuration(clip); t += 1 / 60) {
        const now = flat(motionPose(clip, t));
        for (let j = 0; j < now.length; j++) expect(Math.abs(now[j]! - prev[j]!)).toBeLessThan(25);
        prev = now;
      }
    }
  });
});

describe("corpo em movimento", () => {
  it("em pé, por ângulos, é o mesmo corpo da pose em pé, número a número", () => {
    const named = createMannequin(BODY, "em-pe");
    const moving = motionBody(BODY, REST);
    for (const [x, y, z] of probes) expect(moving.collider.query(x, y, z)).toEqual(named.collider.query(x, y, z));
    expect(Array.from(moving.mesh.positions)).toEqual(Array.from(named.mesh.positions));
  });

  it("só o colisor (sem a malha) mede igual perto do corpo", () => {
    const pose = motionPose(motionClip("correr"), 1.3);
    const full = motionBody(BODY, pose);
    const fast = motionBody(BODY, pose, {}, {}, { mesh: false });
    expect(fast.mesh.positions.length).toBe(0);
    for (const [x, y, z] of probes) {
      const d = full.collider.query(x, y, z).distance;
      if (d < 30) expect(fast.collider.query(x, y, z).distance).toBeCloseTo(d, 9);
    }
  });

  it("sentar e agachar descem o quadril; agachado fica mais baixo que sentado; os pés no chão", () => {
    const hipAt = (id: "sentar" | "agachar") => {
      const clip = motionClip(id);
      const b = motionBody(BODY, clip.keys[1]!.pose);
      return { hip: b.landmarks.legs.left[0]!.y, floor: lowestOf(b.mesh.positions).min };
    };
    const standing = createMannequin(BODY, "em-pe").landmarks.legs.left[0]!.y;
    const sit = hipAt("sentar");
    const squat = hipAt("agachar");
    expect(sit.hip).toBeLessThan(standing - 250);
    expect(sit.hip).toBeGreaterThan(380);
    expect(sit.hip).toBeLessThan(620);
    expect(squat.hip).toBeLessThan(sit.hip);
    for (const p of [sit, squat]) expect(Math.abs(p.floor)).toBeLessThan(15);
  });

  it("deitado: de costas no chão, a frente para cima e a cabeça para trás", () => {
    const clip = motionClip("deitar");
    const b = motionBody(BODY, clip.keys[1]!.pose);
    const { min, max } = lowestOf(b.mesh.positions);
    expect(min).toBeGreaterThan(-15);
    expect(min).toBeLessThan(40);
    expect(max).toBeLessThan(450);
    // Perto do peito (acima do chão, na frente), o colisor está fora; abaixo das costas, o chão.
    const bustZ = -(b.landmarks.bust.y - 0); // o busto andou para trás junto com o tronco
    expect(b.collider.query(0, max + 50, bustZ).distance).toBeGreaterThan(0);
    // A cabeça (o ponto mais longe dos pés) fica em −Z.
    let zMin = Infinity;
    for (let i = 2; i < b.mesh.positions.length; i += 3) zMin = Math.min(zMin, b.mesh.positions[i]!);
    expect(zMin).toBeLessThan(-1400);
  });

  it("o colisor girado devolve a direção para fora girada junto (de pé, por fora do ombro, aponta para o lado)", () => {
    const dance = motionPose(motionClip("dancar"), motionClip("dancar").keys[1]!.t);
    const b = motionBody(BODY, dance, {}, {}, { mesh: false });
    const q = b.collider.query(0, 1000, 400);
    expect(Math.hypot(q.normal.x, q.normal.y, q.normal.z)).toBeCloseTo(1, 6);
    expect(q.distance).toBeGreaterThan(0);
  });

  it("acenar: a mão direita passa do alto da cabeça", () => {
    const clip = motionClip("acenar");
    const b = motionBody(BODY, clip.keys[1]!.pose);
    const wrist = b.landmarks.arms.right[2]!;
    expect(wrist.y).toBeGreaterThan(BODY.altura - 60);
    expect(wrist.x).toBeLessThan(0); // direita do corpo = −X
  });
});

describe("banco do sentar", () => {
  it("fica embaixo da coxa sentada, sem pegar as canelas; em pé o quadril não chega nele", () => {
    const clip = motionClip("sentar");
    const seat = motionSeat(clip, BODY)!;
    expect(seat.top).toBeGreaterThan(300);
    expect(seat.top).toBeLessThan(600);
    const seated = motionBody(BODY, clip.keys[1]!.pose, {}, {}, { mesh: false });
    expect(onSeat(seated, seat)).toBe(true);
    expect(onSeat(motionBody(BODY, REST, {}, {}, { mesh: false }), seat)).toBe(false);
    // As canelas sentadas (do joelho ao tornozelo) ficam fora da caixa.
    const [, knee, ankle] = seated.landmarks.legs.left;
    const box = seatCollider(seat);
    for (let k = 0; k <= 4; k++) {
      const t = k / 4;
      const p = { x: knee!.x + (ankle!.x - knee!.x) * t, y: knee!.y + (ankle!.y - knee!.y) * t, z: knee!.z + (ankle!.z - knee!.z) * t };
      expect(box.query(p.x, p.y, p.z).distance).toBeGreaterThan(0);
    }
    expect(box.query(0, seat.top + 10, (seat.minZ + seat.maxZ) / 2)).toEqual({ distance: 10, normal: { x: 0, y: 1, z: 0 } });
    expect(motionSeat(motionClip("andar"), BODY)).toBeNull();
  });
});

describe("andar da pele (bodyBones, boneStep)", () => {
  it("o ponto acompanha o osso mais perto, dividido pelos subpassos; o tronco é um osso", () => {
    const a = motionBody(BODY, REST, {}, {}, { mesh: false });
    const bonesA = bodyBones(a);
    expect(bonesA).toHaveLength(13);
    const shifted = bonesA.map((b) => ({ a: { ...b.a, x: b.a.x + 8 }, b: { ...b.b, x: b.b.x + 8 } }));
    const step = boneStep(bonesA, shifted, 4);
    expect(step(0, 1100, 0)).toEqual({ x: 2, y: 0, z: 0 });
    // Joelho dobrando: um ponto na canela anda; um no peito, não.
    const pose = motionPose(motionClip("agachar"), 0.3);
    const bonesB = bodyBones(motionBody(BODY, pose, {}, {}, { mesh: false }));
    const knee = boneStep(bonesA, bonesB, 1);
    const [, k, ank] = a.landmarks.legs.left;
    const shin = knee((k!.x + ank!.x) / 2, (k!.y + ank!.y) / 2, (k!.z + ank!.z) / 2);
    expect(Math.hypot(shin.x, shin.y, shin.z)).toBeGreaterThan(5);
    const chest = knee(0, 1250, 120);
    expect(Math.hypot(chest.x, chest.y, chest.z)).toBeLessThan(Math.hypot(shin.x, shin.y, shin.z));
    expect(boneStep([], bonesA, 1)(0, 0, 0)).toEqual({ x: 0, y: 0, z: 0 });
  });
});

describe("curva entre os quadros-chave", () => {
  it("nunca passa do ponto: entre dois quadros iguais (sentado, parado) a pose não muda", () => {
    const clip = motionClip("sentar");
    const [, a, b] = clip.keys;
    for (let t = a!.t; t <= b!.t; t += 0.1) expect(motionPose(clip, t).legs[0].flexion).toBeCloseTo(a!.pose.legs[0].flexion, 9);
    // Em todo clipe, cada ângulo fica entre os valores dos dois quadros vizinhos.
    for (const c of MOTIONS) {
      for (let k = 0; k < c.keys.length - 1; k++) {
        const p = c.keys[k]!.pose.legs[0].flexion;
        const q = c.keys[k + 1]!.pose.legs[0].flexion;
        for (let s = 0; s <= 10; s++) {
          const v = motionPose(c, c.keys[k]!.t + ((c.keys[k + 1]!.t - c.keys[k]!.t) * s) / 10).legs[0].flexion;
          expect(v).toBeGreaterThanOrEqual(Math.min(p, q) - 1e-9);
          expect(v).toBeLessThanOrEqual(Math.max(p, q) + 1e-9);
        }
      }
    }
  });
});
