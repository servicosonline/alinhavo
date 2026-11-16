import type { PatternDocument } from "@alinhavo/geometry";

/** Um zíper do molde, para a chave "aberto" da Prova. */
export type ZipperChoice = { id: string; label: string };

/** Zíperes do molde, na ordem das partes, com o nome da parte ("Zíper 1 · Frente"). */
export function zipperChoices(doc: PatternDocument): ZipperChoice[] {
  const out: ZipperChoice[] = [];
  for (const piece of doc.pieces) {
    for (const f of piece.finishes ?? []) {
      if (f.kind === "ziper") out.push({ id: f.id, label: `Zíper ${out.length + 1} · ${piece.name}` });
    }
  }
  return out;
}

/** Só os zíperes abertos que ainda existem no molde (o molde muda na tela), na ordem do molde. */
export function openZippersIn(doc: PatternDocument, open: readonly string[]): string[] {
  const set = new Set(open);
  return zipperChoices(doc)
    .map((z) => z.id)
    .filter((id) => set.has(id));
}
