import { migratePattern, validatePattern, type PatternDocument } from "@alinhavo/geometry";

/**
 * Leva o molde do editor para a Prova pela memória da aba (sessionStorage):
 * nada vai para o servidor, e fechar a aba apaga. Cada molde tem a sua vaga
 * ("demo" no /experimentar, o id do molde no painel), e a cópia só vale para
 * a versão salva de onde a edição partiu: se o molde foi salvo de novo, a
 * Prova volta a usar a versão salva.
 */
const PREFIX = "alinhavo:prova:";

type Stored = { version: number; doc: unknown };

export function saveForProva(doc: PatternDocument, scope = "demo", version = 0) {
  try {
    sessionStorage.setItem(PREFIX + scope, JSON.stringify({ version, doc } satisfies Stored));
  } catch {
    // Sem armazenamento (modo privado restrito): a Prova usa o molde salvo.
  }
}

/** Texto guardado (para useSyncExternalStore comparar); null se não houver. */
export function storedForProva(scope = "demo"): string | null {
  try {
    return sessionStorage.getItem(PREFIX + scope);
  } catch {
    return null;
  }
}

/** O molde guardado para esta vaga e versão, se for válido; senão null. */
export function loadForProva(scope = "demo", version = 0): PatternDocument | null {
  const raw = storedForProva(scope);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as Stored;
    if (stored.version !== version) return null;
    const doc = migratePattern(stored.doc);
    return doc && validatePattern(doc).length === 0 ? doc : null;
  } catch {
    return null;
  }
}
