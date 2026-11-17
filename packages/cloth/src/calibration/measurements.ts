/**
 * Medidas de bancada dos tecidos (`packages/cloth/calibration/medidas.json`,
 * formato 1). Protocolo em `docs/10-calibracao-tecidos.md`. Tudo em mm e g.
 * Nenhum valor é inventado: cada amostra diz quem mediu, quando e as fotos.
 */
import { FABRIC_PRESETS, type FabricPreset } from "../fabrics";

export const MEASUREMENTS_FORMAT = 1;

export type Direction = "fio" | "trama" | "vies";
export const DIRECTIONS: readonly Direction[] = ["fio", "trama", "vies"];

/** Tira pendurada: distância entre as marcas sem peso, com 500 g e com 2 kg. */
export type HangReading = { zeroMm: number; g500Mm: number; g2000Mm: number };

export type Sample = {
  id: string;
  preset: FabricPreset;
  tecido: { nome: string; composicao?: string; fornecedor?: string };
  medidoEm: string;
  medidoPor: string;
  /** g/m² (quadrado de 10 × 10 cm × 100). */
  gramatura: number;
  espessuraMm: number;
  /** Tira de 25 mm para fora da borda da mesa: queda da ponta (média dos dois lados). */
  regua: { foraMm: number; fio: { quedaMm: number }; trama: { quedaMm: number } };
  /** Tira de `larguraMm` (padrão 50) pendurada, nas três direções. */
  peso: { larguraMm?: number } & Record<Direction, HangReading>;
  atrito?: { anguloGraus: number };
  /** Caimento no disco de 18 cm, círculo de 30 cm: coeficiente e ondas. */
  disco?: { cc: number; ondas: number };
  fotos: string[];
};

export type SampleFile = { formato: number; amostras: Sample[] };

/** Largura padrão da tira do peso, em mm. */
export const HANG_STRIP_WIDTH = 50;
/** Distância entre as marcas da tira do peso, em mm. */
export const HANG_GAUGE = 200;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown, lo: number, hi: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
const isText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/**
 * Confere uma amostra; devolve os problemas em português (vazio = ok). Os
 * limites só pegam erro de digitação (gramatura de 5 000, queda maior que o
 * pedaço para fora), não julgam o tecido.
 */
export function sampleProblems(raw: unknown): string[] {
  if (!isObj(raw)) return ["a amostra não é um objeto"];
  const p: string[] = [];
  const where = isText(raw.id) ? raw.id : "(sem id)";
  const bad = (msg: string) => p.push(`${where}: ${msg}`);
  if (!isText(raw.id)) bad("falta o id");
  if (!FABRIC_PRESETS.includes(raw.preset as FabricPreset)) bad(`preset desconhecido (${String(raw.preset)})`);
  if (!isObj(raw.tecido) || !isText(raw.tecido.nome)) bad("falta o nome do tecido");
  if (typeof raw.medidoEm !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw.medidoEm)) bad("medidoEm precisa ser AAAA-MM-DD");
  if (!isText(raw.medidoPor)) bad("falta quem mediu");
  if (!isNum(raw.gramatura, 20, 800)) bad("gramatura fora de 20–800 g/m²");
  if (!isNum(raw.espessuraMm, 0.05, 5)) bad("espessura fora de 0,05–5 mm");
  const r = raw.regua;
  if (!isObj(r) || !isNum(r.foraMm, 40, 300)) bad("régua: foraMm fora de 40–300 mm");
  else
    for (const d of ["fio", "trama"] as const) {
      const q = r[d];
      if (!isObj(q) || !isNum(q.quedaMm, 0, r.foraMm as number)) bad(`régua: queda no ${d} precisa ficar entre 0 e o pedaço para fora`);
    }
  const w = raw.peso;
  if (!isObj(w)) bad("falta o teste do peso");
  else {
    if (w.larguraMm !== undefined && !isNum(w.larguraMm, 10, 200)) bad("peso: larguraMm fora de 10–200 mm");
    for (const d of DIRECTIONS) {
      const h = w[d];
      if (!isObj(h) || !isNum(h.zeroMm, 50, 500) || !isNum(h.g500Mm, 50, 1000) || !isNum(h.g2000Mm, 50, 1000)) {
        bad(`peso: leitura do ${d} incompleta`);
      } else if (!(h.zeroMm <= h.g500Mm && h.g500Mm <= h.g2000Mm)) {
        bad(`peso: no ${d}, as medidas precisam crescer (zero ≤ 500 g ≤ 2 kg)`);
      }
    }
  }
  if (raw.atrito !== undefined && (!isObj(raw.atrito) || !isNum(raw.atrito.anguloGraus, 0, 80))) bad("atrito: ângulo fora de 0–80°");
  if (raw.disco !== undefined && (!isObj(raw.disco) || !isNum(raw.disco.cc, 0, 1) || !isNum(raw.disco.ondas, 0, 30))) {
    bad("disco: cc entre 0 e 1 e ondas entre 0 e 30");
  }
  if (!Array.isArray(raw.fotos) || raw.fotos.length === 0 || !raw.fotos.every(isText)) bad("sem fotos (toda medida precisa da foto de origem)");
  return p;
}

/** Lê o arquivo de medidas. Lança com a lista de problemas se algo não confere. */
export function readSamples(raw: unknown): Sample[] {
  if (!isObj(raw) || raw.formato !== MEASUREMENTS_FORMAT || !Array.isArray(raw.amostras)) {
    throw new Error(`medidas.json precisa ser { "formato": ${MEASUREMENTS_FORMAT}, "amostras": [...] }`);
  }
  const problems = raw.amostras.flatMap(sampleProblems);
  const ids = raw.amostras.map((a) => (isObj(a) ? a.id : undefined));
  ids.forEach((id, i) => {
    if (ids.indexOf(id) !== i) problems.push(`${String(id)}: id repetido`);
  });
  if (problems.length > 0) throw new Error(`Medidas com problema:\n- ${problems.join("\n- ")}`);
  return raw.amostras as Sample[];
}

/** Esticamento (fração) da tira na direção, com 500 g e com 2 kg. */
export function hangStrain(sample: Sample, d: Direction): { g500: number; g2000: number } {
  const h = sample.peso[d];
  return { g500: h.g500Mm / h.zeroMm - 1, g2000: h.g2000Mm / h.zeroMm - 1 };
}

/** Queda média da régua (fio e trama): a simulação tem uma flexão só. */
export const meanDrop = (s: Sample) => (s.regua.fio.quedaMm + s.regua.trama.quedaMm) / 2;

/** Quanto a flexão do fio e da trama diferem (maior ÷ menor queda); acima de 2, a flexão única erra muito. */
export function bendAnisotropy(s: Sample): number {
  const a = Math.max(s.regua.fio.quedaMm, s.regua.trama.quedaMm);
  const b = Math.min(s.regua.fio.quedaMm, s.regua.trama.quedaMm);
  return b > 0 ? a / b : Infinity;
}

/** Atrito do plano inclinado: tan(ângulo), no intervalo da simulação (0 a 1). */
export const frictionOf = (s: Sample) =>
  s.atrito ? Math.min(1, Math.max(0, Math.tan((s.atrito.anguloGraus * Math.PI) / 180))) : undefined;
