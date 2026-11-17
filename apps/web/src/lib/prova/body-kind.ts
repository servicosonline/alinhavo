import type { BodyKind, BodySex } from "@alinhavo/cloth";

/**
 * Corpo da Prova: o manequim (formas simples, todas as condições) ou o
 * corpo realista (malha do MakeHuman, CC0, ajustada às medidas da tabela).
 */
export const BODY_KIND_OPTIONS: readonly { id: BodyKind; name: string; hint: string }[] = [
  { id: "manequim", name: "Manequim", hint: "Forma de costura: busto, cintura e quadril exatos; aceita membro cortado, gestante e salto." },
  { id: "makehuman", name: "Realista", hint: "Corpo humano ajustado às medidas; aceita gestante (leva um instante para carregar na primeira vez)." },
];

export const BODY_SEX_OPTIONS: readonly { id: BodySex; name: string }[] = [
  { id: "feminino", name: "Feminino" },
  { id: "masculino", name: "Masculino" },
];

export const bodyKindName = (id: BodyKind) => BODY_KIND_OPTIONS.find((k) => k.id === id)?.name ?? id;
