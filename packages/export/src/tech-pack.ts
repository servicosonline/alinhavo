import { cutPieces, type PatternDocument } from "@alinhavo/geometry";

/**
 * Ficha técnica: os dados montados a partir do molde, do tecido e dos
 * aviamentos (formato 1, o que fica salvo em tech_packs.data). Pura: o app
 * busca os dados e grava; aqui só se calcula.
 *
 * Consumo de tecido: ESTIMATIVA pela área das peças (com margem), dividida
 * pelo aproveitamento e pela largura do tecido. O valor real vem do Encaixe
 * (Fase 4). Medidas em mm e mm², pesos em g, dinheiro em centavos.
 */

/** Aproveitamento estimado do tecido no corte (sem encaixe), de 0 a 1. */
export const ESTIMATED_EFFICIENCY = 0.8;

export type TechPackInput = {
  generatedAt: string;
  product: { reference: string | null; name: string; status: string; collection: string | null };
  pattern: { name: string; version: number; document: PatternDocument };
  fabric: {
    name: string;
    composition: string | null;
    widthMm: number | null;
    weightGsm: number | null;
    priceCents: number | null;
  } | null;
  trims: { name: string; quantity: number; unit: string; unitPriceCents: number | null }[];
};

export type TechPackPiece = {
  name: string;
  quantity: number;
  onFold: boolean;
  bySize: Record<string, { widthMm: number; lengthMm: number; cutAreaMm2: number }>;
};

export type TechPackConsumption = {
  /** Área de corte somada (peças × quantidade), mm². */
  areaMm2: number;
  /** Metros lineares do tecido (com o aproveitamento); null sem largura. */
  meters: number | null;
  /** Peso do tecido gasto, g; null sem largura ou gramatura. */
  weightG: number | null;
  /** Custo do tecido, centavos; null sem metros ou preço. */
  fabricCents: number | null;
};

export type TechPackData = {
  schema: 1;
  generatedAt: string;
  product: TechPackInput["product"];
  pattern: { name: string; version: number; sizes: string[]; baseSize: string };
  pieces: TechPackPiece[];
  fabric: TechPackInput["fabric"];
  consumption: { method: "area"; efficiency: number; bySize: Record<string, TechPackConsumption> };
  trims: (TechPackInput["trims"][number] & { totalCents: number | null })[];
  /** Soma dos aviamentos com preço, centavos. */
  trimsCents: number;
  /** Custo de material por peça pronta (tecido + aviamentos), centavos; null sem custo do tecido. */
  materialCentsBySize: Record<string, number | null>;
};

const round1 = (v: number) => Math.round(v * 10) / 10;

export function buildTechPack(input: TechPackInput): TechPackData {
  const doc = input.pattern.document;
  const fabric = input.fabric;
  const pieces: TechPackPiece[] = doc.pieces.map((p) => ({ name: p.name, quantity: p.cutPair ? 2 : 1, onFold: p.fold !== undefined, bySize: {} }));
  const consumption: Record<string, TechPackConsumption> = {};

  for (const size of doc.sizes) {
    const cut = cutPieces(doc, size);
    cut.forEach((c, i) => {
      pieces[i]!.bySize[size] = { widthMm: round1(c.width), lengthMm: round1(c.length), cutAreaMm2: Math.round(c.cutArea) };
    });
    const area = cut.reduce((s, c) => s + c.cutArea * c.quantity, 0);
    const width = fabric?.widthMm ?? null;
    const meters = width ? area / ESTIMATED_EFFICIENCY / width / 1000 : null;
    const weightG = meters !== null && width && fabric?.weightGsm ? meters * (width / 1000) * fabric.weightGsm : null;
    const fabricCents = meters !== null && fabric?.priceCents != null ? Math.round(meters * fabric.priceCents) : null;
    consumption[size] = {
      areaMm2: Math.round(area),
      meters: meters === null ? null : Math.round(meters * 1000) / 1000,
      weightG: weightG === null ? null : Math.round(weightG),
      fabricCents,
    };
  }

  const trims = input.trims.map((t) => ({
    ...t,
    totalCents: t.unitPriceCents == null ? null : Math.round(t.quantity * t.unitPriceCents),
  }));
  const trimsCents = trims.reduce((s, t) => s + (t.totalCents ?? 0), 0);
  const materialCentsBySize = Object.fromEntries(
    doc.sizes.map((s) => [s, consumption[s]!.fabricCents === null ? null : consumption[s]!.fabricCents! + trimsCents]),
  );

  return {
    schema: 1,
    generatedAt: input.generatedAt,
    product: input.product,
    pattern: { name: input.pattern.name, version: input.pattern.version, sizes: [...doc.sizes], baseSize: doc.baseSize },
    pieces,
    fabric,
    consumption: { method: "area", efficiency: ESTIMATED_EFFICIENCY, bySize: consumption },
    trims,
    trimsCents,
    materialCentsBySize,
  };
}

// ---------------------------------------------------------------------------
// Formatação em português (a mesma na tela e no PDF)
// ---------------------------------------------------------------------------

const dec = (min: number, max: number) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: min, maximumFractionDigits: max });
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 1234 mm → "123,4 cm" */
export const cm = (mm: number) => `${dec(0, 1).format(mm / 10)} cm`;
/** 1.234 m → "1,23 m" */
export const meters = (m: number | null) => (m === null ? "—" : `${dec(2, 2).format(m)} m`);
/** mm² → "0,52 m²" */
export const squareMeters = (mm2: number) => `${dec(2, 2).format(mm2 / 1e6)} m²`;
/** g → "312 g" */
export const grams = (g: number | null) => (g === null ? "—" : `${dec(0, 0).format(g)} g`);
/** centavos → "R$ 12,34" */
export const money = (cents: number | null) => (cents === null ? "—" : brl.format(cents / 100));

export const PRODUCT_STATUS_PT: Record<string, string> = {
  ideia: "Ideia",
  modelagem: "Modelagem",
  prova: "Prova",
  aprovado: "Aprovado",
  producao: "Produção",
};
