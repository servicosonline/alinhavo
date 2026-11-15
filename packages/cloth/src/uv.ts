import type { PieceMesh } from "./mesh";

/**
 * UV da roupa da Prova, 2 floats por vértice, em mm, na ordem dos vértices da
 * simulação (`pieceOffset` de cada parte).
 *
 * É o lugar de cada vértice no tecido plano, como a peça é cortada: u na
 * trama, v no urdume (o fio corre ao longo de v). Vem de `grainCoords`, uma
 * rotação das coordenadas do molde, então distâncias e ângulos do molde
 * ficam iguais e a peça não sai espelhada. A textura escolhe a escala
 * (repetição a cada N mm), e o desenho do tecido fica no tamanho real e
 * alinhado ao fio em todas as partes.
 *
 * Peça aberta pela dobra é uma malha só: o UV atravessa a dobra sem emenda.
 * A cópia do par (`pairCopy`) já é a peça espelhada, como sai do tecido.
 */
export function garmentUv(meshes: readonly PieceMesh[], pieceOffset: ReadonlyMap<string, number>, vertexCount: number): Float32Array {
  const uv = new Float32Array(vertexCount * 2);
  for (const mesh of meshes) {
    const offset = pieceOffset.get(mesh.pieceId);
    if (offset === undefined) throw new Error(`A parte ${mesh.pieceId} não está na simulação.`);
    const g = mesh.grainCoords;
    const n = g.length / 2;
    if (offset + n > vertexCount) throw new Error(`A parte ${mesh.pieceId} passa do fim da malha.`);
    for (let i = 0; i < n; i++) {
      uv[(offset + i) * 2] = g[i * 2 + 1]!;
      uv[(offset + i) * 2 + 1] = g[i * 2]!;
    }
  }
  return uv;
}
