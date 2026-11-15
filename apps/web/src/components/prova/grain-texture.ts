import * as THREE from "three";

/** Lado do quadrado da grade do fio, em mm (o UV da roupa vem em mm). */
export const GRAIN_GRID_MM = 50;

const SIZE = 512;

/**
 * Grade do fio (vista "Fio" da Prova): quadrados de 5 cm com divisões de
 * 1 cm, desenhados no tecido plano. Na roupa, quadrado que vira losango ou
 * retângulo mostra onde o tecido está esticado ou enviesado. A seta aponta o
 * fio (o urdume, para cima na imagem = +v) e a bandeira à direita dela mostra
 * se a peça saiu espelhada.
 */
export function grainGridTexture(maxAnisotropy = 1): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#f4efe6";
  g.fillRect(0, 0, SIZE, SIZE);

  const cell = SIZE / 5;
  g.strokeStyle = "rgba(42, 38, 33, 0.18)";
  g.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    g.beginPath();
    g.moveTo(i * cell, 0);
    g.lineTo(i * cell, SIZE);
    g.moveTo(0, i * cell);
    g.lineTo(SIZE, i * cell);
    g.stroke();
  }
  // Linha do quadrado de 5 cm (metade em cada borda: a repetição junta as duas).
  g.strokeStyle = "#2a2621";
  g.lineWidth = 8;
  g.strokeRect(0, 0, SIZE, SIZE);

  // Seta do fio com bandeira à direita.
  const cx = SIZE / 2;
  g.strokeStyle = "#c2412d";
  g.fillStyle = "#c2412d";
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(cx, SIZE * 0.78);
  g.lineTo(cx, SIZE * 0.3);
  g.stroke();
  g.beginPath();
  g.moveTo(cx, SIZE * 0.2);
  g.lineTo(cx - 40, SIZE * 0.32);
  g.lineTo(cx + 40, SIZE * 0.32);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(cx + 5, SIZE * 0.52);
  g.lineTo(cx + 70, SIZE * 0.58);
  g.lineTo(cx + 5, SIZE * 0.64);
  g.closePath();
  g.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1 / GRAIN_GRID_MM, 1 / GRAIN_GRID_MM);
  texture.anisotropy = maxAnisotropy;
  return texture;
}
