/**
 * Valida o destino depois do login (?next=...). Só aceita caminhos internos,
 * para que um link malicioso não use o Alinhavo para redirecionar a outro site.
 */
export function safeNext(value: unknown, fallback = "/painel"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\\]/.test(value)) return fallback;
  try {
    const url = new URL(value, "http://interno.local");
    if (url.origin !== "http://interno.local") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
