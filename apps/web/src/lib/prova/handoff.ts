import { migratePattern, validatePattern, type PatternDocument } from "@alinhavo/geometry";

/**
 * Leva o molde do editor de demonstração para a Prova pela memória da aba
 * (sessionStorage): nada vai para o servidor, e fechar a aba apaga.
 */
const KEY = "alinhavo:prova:molde";

export function saveForProva(doc: PatternDocument) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(doc));
  } catch {
    // Sem armazenamento (modo privado restrito): a Prova abre com o exemplo.
  }
}

/** O molde guardado, se existir e for válido; senão null. */
export function loadForProva(): PatternDocument | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const doc = migratePattern(JSON.parse(raw));
    return doc && validatePattern(doc).length === 0 ? doc : null;
  } catch {
    return null;
  }
}
