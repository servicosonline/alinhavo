import type { PatternDocument } from "@alinhavo/geometry";

/**
 * Tabela de medidas de demonstração (mm), para a Prova sem login. No tamanho
 * base veste a saia de exemplo com folga de costura; cada tamanho acima ou
 * abaixo anda 4 cm em busto, cintura e quadril. No painel, a Prova usa a
 * tabela de medidas ligada ao molde.
 */
export function demoMeasurements(doc: PatternDocument): Record<string, Record<string, number>> {
  const base = doc.sizes.indexOf(doc.baseSize);
  return Object.fromEntries(
    doc.sizes.map((size, i) => {
      const step = (i - base) * 40;
      return [size, { altura: 1650, busto: 880 + step, cintura: 720 + step, quadril: 900 + step, "altura do quadril": 200 }];
    }),
  );
}
