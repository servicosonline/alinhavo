import type { Vec3 } from "../collider";

/**
 * Formas do manequim: seção superelíptica do tronco, interpolação
 * monótona entre seções e distâncias com sinal de cone arredondado e
 * elipsoide. Tudo puro, em mm.
 */

// --- Superelipse: |x/a|^n + |z/b|^n = 1 ---------------------------------------

/** Ponto da superelipse no parâmetro t (0 a 2π). */
export function superellipsePoint(a: number, b: number, n: number, t: number): { x: number; z: number } {
  const c = Math.cos(t);
  const s = Math.sin(t);
  const e = 2 / n;
  return { x: a * Math.sign(c) * Math.abs(c) ** e, z: b * Math.sign(s) * Math.abs(s) ** e };
}

/** Perímetro da superelipse, em mm (polígono fino: erro desprezível). */
export function superellipsePerimeter(a: number, b: number, n: number, samples = 2048): number {
  let total = 0;
  let prev = superellipsePoint(a, b, n, 0);
  for (let i = 1; i <= samples; i++) {
    const p = superellipsePoint(a, b, n, (2 * Math.PI * i) / samples);
    total += Math.hypot(p.x - prev.x, p.z - prev.z);
    prev = p;
  }
  return total;
}

/** Distância do centro até a borda na direção (cos θ, sin θ). */
export function superellipseRadius(a: number, b: number, n: number, cos: number, sin: number): number {
  return (Math.abs(cos / a) ** n + Math.abs(sin / b) ** n) ** (-1 / n);
}

// --- Interpolação monótona (PCHIP, Fritsch–Carlson) -------------------------

/**
 * Interpolador cúbico monótono pelos pontos (xs crescentes). Passa exatamente
 * pelos pontos e não cria picos entre eles (o tronco não ganha "barriga"
 * entre a cintura e o quadril).
 */
export function pchip(xs: readonly number[], ys: readonly number[]): (x: number) => number {
  const n = xs.length;
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(xs[i + 1]! - xs[i]!);
    d.push((ys[i + 1]! - ys[i]!) / h[i]!);
  }
  const m = new Array<number>(n).fill(0);
  m[0] = d[0] ?? 0;
  m[n - 1] = d[n - 2] ?? 0;
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1]! * d[i]! <= 0) continue;
    const w1 = 2 * h[i]! + h[i - 1]!;
    const w2 = h[i]! + 2 * h[i - 1]!;
    m[i] = (w1 + w2) / (w1 / d[i - 1]! + w2 / d[i]!);
  }
  return (x: number) => {
    if (x <= xs[0]!) return ys[0]!;
    if (x >= xs[n - 1]!) return ys[n - 1]!;
    let i = 0;
    while (x > xs[i + 1]!) i++;
    const t = (x - xs[i]!) / h[i]!;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i]! +
      (t3 - 2 * t2 + t) * h[i]! * m[i]! +
      (-2 * t3 + 3 * t2) * ys[i + 1]! +
      (t3 - t2) * h[i]! * m[i + 1]!
    );
  };
}

// --- Distâncias com sinal ---------------------------------------------------

/**
 * Cone arredondado: o "tubo" de a (raio r1) a b (raio r2), com pontas
 * esféricas. Distância exata (Inigo Quilez, licença MIT).
 */
export function sdRoundCone(p: Vec3, a: Vec3, b: Vec3, r1: number, r2: number): number {
  const ba = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const l2 = ba.x * ba.x + ba.y * ba.y + ba.z * ba.z;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pa = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
  const y = pa.x * ba.x + pa.y * ba.y + pa.z * ba.z;
  const z = y - l2;
  const qx = pa.x * l2 - ba.x * y;
  const qy = pa.y * l2 - ba.y * y;
  const qz = pa.z * l2 - ba.z * y;
  const x2 = qx * qx + qy * qy + qz * qz;
  const y2 = y * y * l2;
  const z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

/** Elipsoide de semieixos r centrado em c (aproximação boa perto da superfície). */
export function sdEllipsoid(p: Vec3, c: Vec3, r: Vec3): number {
  const x = (p.x - c.x) / r.x;
  const y = (p.y - c.y) / r.y;
  const z = (p.z - c.z) / r.z;
  const k0 = Math.hypot(x, y, z);
  const k1 = Math.hypot(x / r.x, y / r.y, z / r.z);
  return k1 > 0 ? (k0 * (k0 - 1)) / k1 : -Math.min(r.x, r.y, r.z);
}
