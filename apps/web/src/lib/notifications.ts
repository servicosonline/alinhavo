/**
 * Notificações e novidades: público do envio, link seguro e o vídeo da novidade (YouTube ou Vimeo). Puro.
 * O banco confere de novo (migração notificacoes_novidades).
 */

export type Audience = "todos" | "plano" | "status" | "org" | "pessoa";

export const AUDIENCES: { id: Audience; label: string }[] = [
  { id: "todos", label: "Todos os clientes" },
  { id: "plano", label: "Um plano" },
  { id: "status", label: "Um status do plano" },
  { id: "org", label: "Uma organização" },
  { id: "pessoa", label: "Uma pessoa (e-mail)" },
];

export const AUDIENCE_STATUS: { id: string; label: string }[] = [
  { id: "trial", label: "Em teste" },
  { id: "vencida", label: "Teste encerrado" },
  { id: "ativa", label: "Pagantes" },
  { id: "cortesia", label: "Cortesia" },
  { id: "cancelada", label: "Cancelados" },
];

/** Link da notificação: caminho do app ("/painel/...") ou https. Vazio = sem link. Outra coisa: undefined. */
export function readLink(raw: unknown): string | null | undefined {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (s.length > 300) return undefined;
  if (/^\/[^/]/.test(s) || /^https:\/\/[^\s]+$/.test(s)) return s;
  return undefined;
}

/** Abre no app (Link) ou fora (nova aba)? */
export const isInternal = (link: string) => link.startsWith("/");

/**
 * Endereço do player embutido a partir do link que a pessoa colou (YouTube ou Vimeo). Outro site: null.
 * youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID → youtube-nocookie.com/embed/ID;
 * vimeo.com/ID → player.vimeo.com/video/ID.
 */
export function videoEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "");
  const id = (s: string | null | undefined) => (s && /^[\w-]{6,20}$/.test(s) ? s : null);
  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = id(u.searchParams.get("v")) ?? id(u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)/)?.[1]);
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === "youtu.be") {
    const v = id(u.pathname.slice(1));
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const v = u.pathname.match(/(\d{6,12})/)?.[1];
    return v ? `https://player.vimeo.com/video/${v}` : null;
  }
  return null;
}
