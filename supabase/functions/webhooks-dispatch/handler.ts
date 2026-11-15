/**
 * Edge Function `webhooks-dispatch`: envia a fila de webhooks. Chamada a cada
 * minuto pelo Supabase Cron com `Authorization: Bearer <WEBHOOK_DISPATCH_SECRET>`
 * (qualquer outra chamada recebe 401). Pega até DISPATCH_BATCH entregas
 * (claim_webhook_deliveries, só da chave de serviço), assina cada uma com
 * HMAC-SHA256 e faz POST; encerra cada uma (finish_webhook_delivery), que
 * agenda a nova tentativa quando falha.
 *
 * Assinatura (cabeçalho X-Alinhavo-Signature): `t=<unix>,v1=<hex>`, com
 * v1 = HMAC-SHA256(segredo do webhook, `${t}.${corpo}`), o segredo inteiro
 * (com o `whsec_`) como chave. Ver docs/08-api.md.
 *
 * Proteções: só https para endereço público, conferido de novo aqui, inclusive
 * os IPs que o nome resolve (o banco só vê o texto da URL); não segue
 * redirecionamento (3xx conta como falha); DELIVERY_TIMEOUT_MS por envio; a
 * resposta do servidor de fora não é lida além do status.
 *
 * Lógica pura (sem Deno nem Supabase): `index.ts` liga às dependências reais;
 * os testes passam dependências falsas.
 */

export const DISPATCH_BATCH = 20;
export const DELIVERY_TIMEOUT_MS = 10_000;
export const USER_AGENT = "Alinhavo-Webhooks/1";

export type Claimed = {
  id: string;
  url: string;
  secret: string;
  event: string;
  payload: unknown;
  attempt: number;
  created_at: string;
};

export type Deps = {
  /** Segredo que o Cron manda (WEBHOOK_DISPATCH_SECRET); vazio = função desligada. */
  dispatchSecret: string;
  claim(limit: number): Promise<Claimed[]>;
  finish(id: string, ok: boolean, statusCode: number | null, error: string | null): Promise<void>;
  /** IPs do nome (A e AAAA). */
  resolve(host: string): Promise<string[]>;
  fetch(url: string, init: RequestInit): Promise<Response>;
  /** Agora, em ms. */
  now(): number;
};

const encoder = new TextEncoder();

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** HMAC-SHA256 em hex (Web Crypto: igual no Deno e no Node). */
export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

/** Valor do cabeçalho X-Alinhavo-Signature. */
export async function signatureHeader(secret: string, timestamp: number, body: string): Promise<string> {
  return `t=${timestamp},v1=${await hmacHex(secret, `${timestamp}.${body}`)}`;
}

/** Compara sem sair cedo (o tempo não diz quantos caracteres bateram). */
export function sameSecret(a: string, b: string): boolean {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** IP literal (v4 ou v6) de rede privada, local, reservada ou de metadados. */
export function isPrivateIp(ip: string): boolean {
  const v = ip
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]!);
  const v4 = v.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (v.includes(":")) {
    return v === "::" || v === "::1" || /^f[cd]/.test(v) || /^fe[89ab]/.test(v) || /^ff/.test(v) || v.startsWith("64:ff9b:");
  }
  return true; // não é IP: não confia
}

/** A URL pode receber webhook? Mesma regra do banco (private.webhook_url_ok), mais os IPs resolvidos. */
export async function checkUrl(raw: string, resolve: Deps["resolve"]): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "URL inválida.";
  }
  if (url.protocol !== "https:") return "Só https.";
  if (url.username || url.password) return "URL com usuário e senha.";
  const host = url.hostname.toLowerCase();
  if (/^\[|^[\d.]+$/.test(host)) return "Endereço por IP não é aceito.";
  if (!host.includes(".") || /(^|\.)(localhost|internal|local)$/.test(host)) return "Endereço interno.";
  let ips: string[];
  try {
    ips = await resolve(host);
  } catch {
    return "O nome do servidor não foi encontrado.";
  }
  if (ips.length === 0) return "O nome do servidor não foi encontrado.";
  if (ips.some(isPrivateIp)) return "O nome aponta para uma rede interna.";
  return null;
}

/** Corpo enviado: o mesmo em todas as tentativas (o `id` serve para não processar duas vezes). */
export function deliveryBody(d: Claimed): string {
  return JSON.stringify({
    id: d.id,
    evento: d.event,
    criado_em: d.created_at,
    dados: d.payload,
  });
}

async function deliver(d: Claimed, deps: Deps): Promise<{ ok: boolean; status: number | null; error: string | null }> {
  const blocked = await checkUrl(d.url, deps.resolve);
  if (blocked) return { ok: false, status: null, error: blocked };
  const body = deliveryBody(d);
  const t = Math.floor(deps.now() / 1000);
  try {
    const res = await deps.fetch(d.url, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": USER_AGENT,
        "X-Alinhavo-Event": d.event,
        "X-Alinhavo-Delivery": d.id,
        "X-Alinhavo-Attempt": String(d.attempt),
        "X-Alinhavo-Signature": await signatureHeader(d.secret, t, body),
      },
      body,
    });
    await res.body?.cancel().catch(() => {});
    if (res.status >= 200 && res.status < 300) return { ok: true, status: res.status, error: null };
    const why = res.status >= 300 && res.status < 400 ? "Redirecionamento não é seguido." : `O servidor respondeu ${res.status}.`;
    return { ok: false, status: res.status, error: why };
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return {
      ok: false,
      status: null,
      error: timeout ? `Sem resposta em ${DELIVERY_TIMEOUT_MS / 1000} s.` : "Não foi possível conectar.",
    };
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "Use POST." });
  const auth = req.headers.get("authorization") ?? "";
  const given = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!deps.dispatchSecret || !given || !sameSecret(given, deps.dispatchSecret)) return json(401, { error: "Não autorizado." });
  let batch: Claimed[];
  try {
    batch = await deps.claim(DISPATCH_BATCH);
  } catch {
    return json(500, { error: "Não foi possível ler a fila." });
  }
  const results = await Promise.all(
    batch.map(async (d) => {
      const r = await deliver(d, deps);
      try {
        await deps.finish(d.id, r.ok, r.status, r.error);
      } catch {
        // Sem encerrar, o prazo de 2 min vence e a entrega volta para a fila.
      }
      return r.ok;
    }),
  );
  return json(200, {
    enviados: batch.length,
    entregues: results.filter(Boolean).length,
  });
}
