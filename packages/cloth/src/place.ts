import type { BodyAnchor, BodySide, PiecePlacement } from "@alinhavo/geometry";
import type { BodyLandmarks, TorsoSection } from "./body/types";
import type { PieceMesh } from "./mesh";

/**
 * Posição inicial das partes em volta do corpo, antes de costurar. Cada
 * parte é "enrolada" numa elipse um pouco maior que o corpo na altura de
 * cada vértice: o centro da parte fica no lado escolhido, a borda de cima na
 * altura de referência, e o comprimento ao longo da elipse é o do molde
 * (a parte começa sem esticar na horizontal).
 *
 * Coordenadas do molde: u para a direita, v para baixo, como a parte é vista
 * pelo direito do tecido. No corpo: mm, Y para cima, frente em +Z, esquerda
 * do corpo em +X. A direita de quem olha a parte é sempre o ângulo
 * decrescente na elipse.
 */

/** Folga entre o corpo e a parte na posição inicial, em mm. */
export const PLACEMENT_CLEARANCE = 25;

/** Ângulo (na elipse, a partir de +X para +Z) do centro de cada lado do corpo. */
const SIDE_ANGLE: Record<BodySide, number> = {
  esquerda: 0,
  frente: Math.PI / 2,
  direita: Math.PI,
  costas: -Math.PI / 2,
};

export type PlacedPiece = { mesh: PieceMesh; placement: PiecePlacement };

/** Altura de cada referência no corpo. */
export function anchorHeight(landmarks: BodyLandmarks, anchor: BodyAnchor): number {
  switch (anchor) {
    case "ombro":
      return landmarks.shoulder.y;
    case "busto":
      return landmarks.bust.y;
    case "cintura":
      return landmarks.waist.y;
    case "quadril":
      return landmarks.hip.y;
  }
}

/**
 * Elipse do corpo na altura y, já com a folga. Entre as referências,
 * interpola; abaixo do quadril usa o quadril (saia e calça caem soltas em
 * volta das pernas); acima do ombro, o ombro.
 */
export function bodyEllipse(landmarks: BodyLandmarks, y: number, clearance = PLACEMENT_CLEARANCE) {
  const sections: TorsoSection[] = [landmarks.hip, landmarks.waist, landmarks.bust, landmarks.shoulder].sort((a, b) => a.y - b.y);
  let s: { halfWidth: number; halfDepth: number; centerZ: number };
  if (y <= sections[0]!.y) s = sections[0]!;
  else if (y >= sections.at(-1)!.y) s = sections.at(-1)!;
  else {
    let i = 0;
    while (y > sections[i + 1]!.y) i++;
    const a = sections[i]!;
    const b = sections[i + 1]!;
    const t = (y - a.y) / (b.y - a.y);
    s = {
      halfWidth: a.halfWidth + (b.halfWidth - a.halfWidth) * t,
      halfDepth: a.halfDepth + (b.halfDepth - a.halfDepth) * t,
      centerZ: a.centerZ + (b.centerZ - a.centerZ) * t,
    };
  }
  return { a: s.halfWidth + clearance, b: s.halfDepth + clearance, centerZ: s.centerZ };
}

/**
 * Ângulo na elipse (a, b) a uma distância `arc` (mm, ao longo da curva) do
 * ângulo `start`; arc positivo anda no sentido decrescente do ângulo.
 */
export function angleAtArc(a: number, b: number, start: number, arc: number): number {
  const dir = arc >= 0 ? -1 : 1;
  const target = Math.abs(arc);
  const step = 0.002;
  let phi = start;
  let walked = 0;
  while (walked < target) {
    const speed = Math.hypot(a * Math.sin(phi), b * Math.cos(phi)); // |dP/dφ|
    const ds = speed * step;
    if (walked + ds >= target) return phi + (dir * step * (target - walked)) / ds;
    walked += ds;
    phi += dir * step;
  }
  return phi;
}

/** Posições 3D iniciais (x, y, z por vértice) de cada parte, na mesma ordem. */
export function placeGarment(pieces: PlacedPiece[], landmarks: BodyLandmarks): Float64Array[] {
  return pieces.map(({ mesh, placement }) => {
    const count = mesh.positions.length / 2;
    let uMin = Infinity;
    let uMax = -Infinity;
    let vMin = Infinity;
    for (let i = 0; i < count; i++) {
      uMin = Math.min(uMin, mesh.positions[i * 2]!);
      uMax = Math.max(uMax, mesh.positions[i * 2]!);
      vMin = Math.min(vMin, mesh.positions[i * 2 + 1]!);
    }
    const uCenter = (uMin + uMax) / 2;
    const top = anchorHeight(landmarks, placement.anchor) + placement.offset;
    const start = SIDE_ANGLE[placement.side];
    const out = new Float64Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = mesh.positions[i * 2]!;
      const v = mesh.positions[i * 2 + 1]!;
      const y = top - (v - vMin);
      const e = bodyEllipse(landmarks, y);
      const phi = angleAtArc(e.a, e.b, start, u - uCenter);
      out[i * 3] = e.a * Math.cos(phi);
      out[i * 3 + 1] = y;
      out[i * 3 + 2] = e.centerZ + e.b * Math.sin(phi);
    }
    return out;
  });
}
