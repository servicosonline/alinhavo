import { PAIR_SUFFIX, type BodyAnchor, type BodyLeg, type BodySide, type Piece, type PiecePlacement } from "@alinhavo/geometry";
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
/** Folga a mais por camada do look, em mm: a roupa de cima começa por fora da de baixo. */
export const LAYER_CLEARANCE = 25;

/** Ângulo (na elipse, a partir de +X para +Z) do centro de cada lado do corpo. */
const SIDE_ANGLE: Record<BodySide, number> = {
  esquerda: 0,
  frente: Math.PI / 2,
  direita: Math.PI,
  costas: -Math.PI / 2,
};

/**
 * `half`: a metade do corpo que uma parte de cortar par veste (ver
 * `pieceHalf`); ela fica entre o centro do lado e a lateral daquela metade.
 * `layer`: a camada no look (0, padrão, é a de dentro); cada camada começa
 * LAYER_CLEARANCE mm mais longe do corpo.
 */
export type PlacedPiece = { mesh: PieceMesh; placement: PiecePlacement; half?: BodyLeg; layer?: number };

/**
 * A metade do corpo de uma parte de cortar par ou da cópia dela: a perna da
 * posição ou, sem perna, a parte desenhada à esquerda e o par à direita.
 * Undefined para parte inteira (sem par).
 */
export function pieceHalf(piece: Piece): BodyLeg | undefined {
  if (piece.cutPair) return piece.placement?.leg ?? "esquerda";
  if (piece.id.endsWith(PAIR_SUFFIX)) return piece.placement?.leg ?? "direita";
  return undefined;
}

/** Ângulo do centro da parte: o do lado, ou o meio da metade (frente/costas de par). */
function centerAngle(side: BodySide, half: BodyLeg | undefined): number {
  const base = SIDE_ANGLE[side];
  if (!half || (side !== "frente" && side !== "costas")) return base;
  const lateral = half === "esquerda" ? 0 : side === "frente" ? Math.PI : -Math.PI;
  return (base + lateral) / 2;
}

/** Faixa acima do gancho em que a parte passa do quadril para a perna, em mm. */
export const LEG_BLEND = 80;

/** Centro e raio da perna na altura y (interpola o eixo; fora dele, a ponta mais perto). */
export function legAt(landmarks: BodyLandmarks, leg: BodyLeg, y: number): { x: number; z: number; r: number } {
  const s = landmarks.legs[leg === "esquerda" ? "left" : "right"];
  if (y >= s[0]!.y) return s[0]!;
  if (y <= s.at(-1)!.y) return s.at(-1)!;
  let i = 0;
  while (y < s[i + 1]!.y) i++;
  const a = s[i]!;
  const b = s[i + 1]!;
  const t = (a.y - y) / (a.y - b.y);
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, r: a.r + (b.r - a.r) * t };
}

/**
 * Altura de cada referência no corpo. "Ombro" é o alto da linha do ombro,
 * junto do pescoço (onde pousa a alça ou a costura do ombro), e não a ponta
 * do ombro: começando mais baixo, a costura fecharia dentro do tronco.
 */
export function anchorHeight(landmarks: BodyLandmarks, anchor: BodyAnchor): number {
  switch (anchor) {
    case "ombro":
      return landmarks.neck.y;
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

/**
 * Posições 3D iniciais (x, y, z por vértice) de cada parte, na mesma ordem.
 * Com `placement.leg`, abaixo do gancho a parte se enrola na perna (frente
 * da perna para parte da frente, trás para a das costas), com uma transição
 * de LEG_BLEND mm acima do gancho.
 */
export function placeGarment(pieces: PlacedPiece[], landmarks: BodyLandmarks): Float64Array[] {
  return pieces.map(({ mesh, placement, half, layer = 0 }) => {
    const clearance = PLACEMENT_CLEARANCE + layer * LAYER_CLEARANCE;
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
    const start = centerAngle(placement.side, half);
    const leg = placement.leg;
    const crotch = landmarks.crotch.y;

    // Na perna, o centro é o meio da parte abaixo do gancho (o vinco da calça).
    let legCenter = uCenter;
    if (leg) {
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = 0; i < count; i++) {
        if (top - (mesh.positions[i * 2 + 1]! - vMin) >= crotch) continue;
        lo = Math.min(lo, mesh.positions[i * 2]!);
        hi = Math.max(hi, mesh.positions[i * 2]!);
      }
      if (lo <= hi) legCenter = (lo + hi) / 2;
    }
    const legStart = placement.side === "costas" ? -Math.PI / 2 : placement.side === "esquerda" ? 0 : placement.side === "direita" ? Math.PI : Math.PI / 2;

    const out = new Float64Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = mesh.positions[i * 2]!;
      const v = mesh.positions[i * 2 + 1]!;
      const y = top - (v - vMin);
      const e = bodyEllipse(landmarks, y, clearance);
      const phi = angleAtArc(e.a, e.b, start, u - uCenter);
      let x = e.a * Math.cos(phi);
      let z = e.centerZ + e.b * Math.sin(phi);
      if (leg && y < crotch + LEG_BLEND) {
        const c = legAt(landmarks, leg, y);
        const R = c.r + clearance;
        const psi = legStart - (u - legCenter) / R; // arco positivo anda para a direita de quem olha
        const w = Math.min(1, (crotch + LEG_BLEND - y) / LEG_BLEND);
        x = x * (1 - w) + (c.x + R * Math.cos(psi)) * w;
        z = z * (1 - w) + (c.z + R * Math.sin(psi)) * w;
      }
      out[i * 3] = x;
      out[i * 3 + 1] = y;
      out[i * 3 + 2] = z;
    }
    return out;
  });
}
