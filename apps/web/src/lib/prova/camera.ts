/**
 * Câmera da Prova. O botão do meio (e o direito) do mouse move a câmera; na
 * Prova de um tamanho, só para cima e para baixo: o corpo continua no centro
 * do giro e a altura do olhar fica entre o pé e um pouco acima da cabeça.
 * A roda continua aproximando. Coordenadas em metros, Y para cima.
 */

type Vec = { x: number; y: number; z: number };

/** Altura do ponto olhado (m): do chão até acima da cabeça mais alta (2,3 m). */
export const LOOK_MIN_Y = 0.05;
export const LOOK_MAX_Y = 2.2;

/**
 * Prende o ponto olhado: com `lockHorizontal`, volta ao eixo (x, z) dado; a
 * altura fica entre os limites. A câmera anda junto (o mesmo deslocamento),
 * então o ângulo e a distância não mudam. Muda os objetos recebidos; devolve
 * se mudou algo.
 */
export function clampLook(target: Vec, camera: Vec, axis: { x: number; z: number } | null): boolean {
  const dx = axis ? axis.x - target.x : 0;
  const dz = axis ? axis.z - target.z : 0;
  const y = Math.min(LOOK_MAX_Y, Math.max(LOOK_MIN_Y, target.y));
  const dy = y - target.y;
  if (dx === 0 && dy === 0 && dz === 0) return false;
  target.x += dx;
  target.y = y;
  target.z += dz;
  camera.x += dx;
  camera.y += dy;
  camera.z += dz;
  return true;
}
