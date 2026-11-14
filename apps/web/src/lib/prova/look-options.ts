import { migratePattern, validatePattern } from "@alinhavo/geometry";
import type { LookOption } from "./look";

/** Quantos moldes da organização o look oferece (os mais recentes): cada um vai inteiro para a página. */
export const LOOK_OPTIONS_MAX = 12;

/**
 * Roupas do look na Prova do painel: os outros moldes da organização, cada um
 * na versão atual, na ordem de `patterns`. Versão que não lê ou não valida
 * fica de fora (o look não pode quebrar a Prova). `versions` vem do banco
 * (pela RLS); só conta a versão atual de cada molde.
 */
export function lookOptionsFrom(
  patterns: readonly { id: string; name: string; current_version: number }[],
  versions: readonly { pattern_id: string; number: number; document: unknown }[],
): LookOption[] {
  const out: LookOption[] = [];
  for (const p of patterns) {
    const v = versions.find((x) => x.pattern_id === p.id && x.number === p.current_version);
    if (!v) continue;
    const doc = migratePattern(v.document);
    if (!doc || validatePattern(doc).length > 0) continue;
    out.push({ id: p.id, name: p.name, doc });
  }
  return out;
}

/**
 * Filtro do PostgREST para buscar só a versão atual de cada molde, numa
 * consulta: `or=(and(pattern_id.eq.X,number.eq.N),…)`. Os ids são uuid
 * (conferidos antes), então não há o que escapar.
 */
export function currentVersionsFilter(patterns: readonly { id: string; current_version: number }[]): string {
  return patterns.map((p) => `and(pattern_id.eq.${p.id},number.eq.${Math.trunc(p.current_version)})`).join(",");
}
