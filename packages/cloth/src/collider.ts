/** Vetor 3D, em mm. */
export type Vec3 = { x: number; y: number; z: number };

/**
 * Obstáculo para o tecido: diz a distância com sinal até a superfície
 * (positiva fora, negativa dentro) e a direção para fora. O corpo do
 * manequim (Passo 3) implementa esta mesma interface.
 */
export type Collider = {
  query(x: number, y: number, z: number): { distance: number; normal: Vec3 };
};

const UP: Vec3 = { x: 0, y: 1, z: 0 };

function normalize(x: number, y: number, z: number): Vec3 {
  const len = Math.hypot(x, y, z);
  return len > 1e-12 ? { x: x / len, y: y / len, z: z / len } : UP;
}

export function sphereCollider(center: Vec3, radius: number): Collider {
  return {
    query(x, y, z) {
      const dx = x - center.x;
      const dy = y - center.y;
      const dz = z - center.z;
      return { distance: Math.hypot(dx, dy, dz) - radius, normal: normalize(dx, dy, dz) };
    },
  };
}

/** Cápsula: segmento de `a` a `b` com raio. Boa para braços, pernas e tronco. */
export function capsuleCollider(a: Vec3, b: Vec3, radius: number): Collider {
  const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const len2 = ab.x * ab.x + ab.y * ab.y + ab.z * ab.z;
  return {
    query(x, y, z) {
      const t = len2 > 0 ? Math.max(0, Math.min(1, ((x - a.x) * ab.x + (y - a.y) * ab.y + (z - a.z) * ab.z) / len2)) : 0;
      const dx = x - (a.x + ab.x * t);
      const dy = y - (a.y + ab.y * t);
      const dz = z - (a.z + ab.z * t);
      return { distance: Math.hypot(dx, dy, dz) - radius, normal: normalize(dx, dy, dz) };
    },
  };
}

/** Chão: plano horizontal na altura `y` (o tecido fica acima). */
export function floorCollider(y = 0): Collider {
  return { query: (_x, py) => ({ distance: py - y, normal: UP }) };
}
