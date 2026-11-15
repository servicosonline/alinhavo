/**
 * Mensagem de erro do banco para a tela. Só passam as mensagens das nossas
 * funções (escritas em português, com `invalid_parameter_value` ou
 * `program_limit_exceeded`); falta de permissão vira o texto de permissão
 * da tela; o resto (erro do PostgREST, trava, função ausente) vira o texto
 * genérico, sem detalhe técnico em inglês.
 */
const OURS = new Set(["22023", "54000"]);

export function dbErrorMessage(
  error: { code?: string; message?: string } | null | undefined,
  texts: { noPermission: string; fallback: string },
): string {
  if (error?.code === "42501") return texts.noPermission;
  if (error?.code && OURS.has(error.code) && error.message) return error.message;
  return texts.fallback;
}
