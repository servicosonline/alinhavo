/** Regras e textos dos webhooks no painel (o banco confere tudo de novo). */

export const WEBHOOK_EVENTS = [
  {
    id: "produto.aprovado",
    label: "Produto aprovado",
    hint: "o status do produto muda para aprovado",
  },
  {
    id: "ficha.gerada",
    label: "Ficha técnica gerada",
    hint: "uma versão nova da ficha técnica é salva",
  },
  {
    id: "risco.salvo",
    label: "Risco salvo",
    hint: "um risco novo é salvo no encaixe ou pela fila",
  },
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]["id"];

/** Webhooks por organização (o mesmo limite de create_webhook_endpoint). */
export const WEBHOOK_MAX = 5;

const EVENT_IDS = new Set<string>(WEBHOOK_EVENTS.map((e) => e.id));

export function eventLabel(id: string): string {
  if (id === "teste") return "Teste";
  return WEBHOOK_EVENTS.find((e) => e.id === id)?.label ?? id;
}

/** Só os eventos conhecidos, sem repetir, na ordem da lista. */
export function pickEvents(values: unknown[]): WebhookEvent[] {
  const chosen = new Set(values.filter((v): v is string => typeof v === "string" && EVENT_IDS.has(v)));
  return WEBHOOK_EVENTS.map((e) => e.id).filter((id) => chosen.has(id));
}

/**
 * Conferência da URL na tela, antes de ir ao banco: só https, por nome, sem
 * usuário e senha, sem localhost nem nome interno. null = aceita; senão, o motivo.
 */
export function webhookUrlProblem(raw: string): string | null {
  const text = raw.trim();
  if (!text) return "Informe a URL.";
  if (text.length > 500) return "URL longa demais.";
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return "URL inválida.";
  }
  if (url.protocol !== "https:") return "A URL precisa começar com https://.";
  if (url.username || url.password) return "Tire o usuário e a senha da URL.";
  const host = url.hostname.toLowerCase();
  if (/^\[|^[\d.]+$/.test(host)) return "Use o nome do servidor, não o IP.";
  if (!host.includes(".") || /(^|\.)(localhost|internal|local)$/.test(host))
    return "O endereço precisa ser público (sem localhost nem nome interno).";
  return null;
}

export const DELIVERY_STATUS_LABEL = {
  pendente: "Na fila",
  enviando: "Enviando",
  entregue: "Entregue",
  falhou: "Falhou",
} as const;
