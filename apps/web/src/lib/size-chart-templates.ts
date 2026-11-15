/**
 * Tabelas de medidas prontas: a grade de tamanhos e as medidas que o
 * manequim da Prova lê, com o jeito de medir cada uma. **Sem números por
 * enquanto**: a referência certa é a ABNT (NBR 16933 feminino, NBR 16060
 * masculino, NBR 15800 infantil), que é paga, e nenhum valor entra sem fonte
 * (decisão do Paulo, 15/11/2026). Quando houver, os valores entram em
 * `values` com a `source`, e a tela passa a oferecê-los.
 *
 * O id fica gravado na tabela (`size_charts.template`): nunca troque um id.
 */

export type TemplateMeasurement = {
  /** Nome na tabela (minúsculo), o mesmo que o manequim lê (`readMeasurements`). */
  name: string;
  /** Como medir, para a dica na grade. */
  howTo: string;
};

export type SizeChartTemplate = {
  id: string;
  name: string;
  /** Público, para a lista. */
  audience: string;
  sizes: string[];
  base: string;
  measurements: TemplateMeasurement[];
  /** Norma ou levantamento de onde os valores sairão. */
  reference: string;
  /** Valores por tamanho (nome → mm), com a fonte. Vazio até haver fonte. */
  values: { source: string; bySize: Record<string, Record<string, number>> } | null;
};

/** Medidas do corpo, na ordem da grade, com o jeito de medir. */
const BODY: TemplateMeasurement[] = [
  { name: "altura", howTo: "Descalça, encostada na parede, do chão ao alto da cabeça." },
  { name: "busto", howTo: "Volta na parte mais saliente do busto, fita na horizontal, sem apertar." },
  { name: "cintura", howTo: "Volta na parte mais fina do tronco, acima do umbigo." },
  { name: "quadril", howTo: "Volta na parte mais saliente do bumbum, pés juntos." },
  { name: "altura do quadril", howTo: "Na lateral, da linha da cintura até a linha do quadril." },
  { name: "ombro", howTo: "Da base do pescoço até a ponta do ombro." },
  { name: "largura das costas", howTo: "Nas costas, de uma cava à outra, na altura das axilas." },
  { name: "pescoço", howTo: "Volta na base do pescoço." },
  { name: "comprimento do braço", howTo: "Da ponta do ombro ao osso do punho, braço solto ao lado do corpo." },
  { name: "braço", howTo: "Volta na parte mais larga do braço (bíceps), braço solto." },
  { name: "punho", howTo: "Volta no osso do punho." },
  { name: "entrepernas", howTo: "Do gancho (entre as pernas) até o chão, descalça." },
  { name: "coxa", howTo: "Volta na parte mais larga da coxa, logo abaixo do gancho." },
  { name: "joelho", howTo: "Volta no meio do joelho, perna esticada." },
  { name: "tornozelo", howTo: "Volta logo acima do osso do tornozelo." },
];

export const SIZE_CHART_TEMPLATES: SizeChartTemplate[] = [
  {
    id: "feminino-adulto",
    name: "Feminino adulto",
    audience: "Mulher adulta, numeração 36 a 54",
    sizes: ["36", "38", "40", "42", "44", "46", "48", "50", "52", "54"],
    base: "40",
    measurements: BODY,
    reference: "ABNT NBR 16933 (vestuário feminino)",
    values: null,
  },
  {
    id: "feminino-letras",
    name: "Feminino em letras",
    audience: "Mulher adulta, PP a GG",
    sizes: ["PP", "P", "M", "G", "GG"],
    base: "M",
    measurements: BODY,
    reference: "ABNT NBR 16933 (vestuário feminino)",
    values: null,
  },
  {
    id: "masculino-adulto",
    name: "Masculino adulto",
    audience: "Homem adulto, P a XG",
    sizes: ["P", "M", "G", "GG", "XG"],
    base: "M",
    measurements: BODY.map((m) => (m.name === "busto" ? { name: "tórax", howTo: "Volta na parte mais larga do peito, na altura das axilas." } : m)),
    reference: "ABNT NBR 16060 (vestuário masculino)",
    values: null,
  },
  {
    id: "infantil",
    name: "Infantil",
    audience: "Criança, 2 a 16 anos",
    sizes: ["2", "4", "6", "8", "10", "12", "14", "16"],
    base: "8",
    measurements: BODY.filter((m) => m.name !== "altura do quadril"),
    reference: "ABNT NBR 15800 (vestuário infantojuvenil)",
    values: null,
  },
];

export function findTemplate(id: string | null | undefined): SizeChartTemplate | null {
  return SIZE_CHART_TEMPLATES.find((t) => t.id === id) ?? null;
}

/**
 * Linhas da grade: as medidas do modelo (na ordem dele, mesmo sem valor) e
 * depois as que a tabela tem a mais, na ordem em que vieram.
 */
export function gridRows(template: SizeChartTemplate | null, withValues: readonly string[]): string[] {
  const rows = template ? template.measurements.map((m) => m.name) : [];
  for (const name of withValues) if (!rows.includes(name)) rows.push(name);
  return rows;
}
