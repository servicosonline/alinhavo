/**
 * Tipos do @kninnug/constrainautor (ISC), só com o que o Alinhavo usa.
 *
 * O pacote publica os tipos como código-fonte .ts, que não passa no nosso
 * `noUncheckedIndexedAccess`. Só o tsconfig deste pacote aponta o import
 * para cá (paths); o Vitest não lê esse paths e carrega o pacote de verdade.
 *
 * NÃO copie esse paths para o apps/web: o Turbopack respeita os paths do
 * tsconfig também em execução e trocaria a biblioteca por este arquivo vazio
 * ("is not a constructor" no Worker da Prova). O app não usa
 * noUncheckedIndexedAccess, então lá os tipos do pacote passam como estão.
 */
export interface DelaunatorLike {
  coords: { readonly length: number; readonly [n: number]: number };
  triangles: { readonly length: number; [n: number]: number };
  halfedges: { readonly length: number; [n: number]: number };
  hull: { readonly length: number; readonly [n: number]: number };
}

/** Força arestas numa triangulação do Delaunator (alterando-a no lugar). */
export default class Constrainautor {
  constructor(del: DelaunatorLike, edges?: readonly [number, number][]);
  del: DelaunatorLike;
  constrainOne(segP1: number, segP2: number): number;
  constrainAll(edges: readonly [number, number][]): this;
  delaunify(deep?: boolean): this;
}
