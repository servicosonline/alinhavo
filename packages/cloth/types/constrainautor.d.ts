/**
 * Tipos do @kninnug/constrainautor (ISC), só com o que o Alinhavo usa.
 *
 * O pacote publica os tipos como código-fonte .ts, que não passa no nosso
 * `noUncheckedIndexedAccess`. O tsconfig aponta o import para este arquivo
 * (paths); em execução, o Vite/Next carregam o pacote normalmente.
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
