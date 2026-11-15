// Entrada da Edge Function (Deno, no Supabase). A lógica está em handler.ts,
// testada em supabase/tests-pglite/edge-webhooks.test.ts.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY o próprio Supabase põe no ambiente
// da função: a chave de serviço nunca sai daqui. WEBHOOK_DISPATCH_SECRET é
// configurado à mão (docs/07-deploy.md) e é o mesmo que o Cron manda.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { handle, type Claimed } from "./handler.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function resolve(host: string): Promise<string[]> {
  const [v4, v6] = await Promise.all([
    Deno.resolveDns(host, "A").catch(() => [] as string[]),
    Deno.resolveDns(host, "AAAA").catch(() => [] as string[]),
  ]);
  return [...v4, ...v6];
}

Deno.serve((req) =>
  handle(req, {
    dispatchSecret: Deno.env.get("WEBHOOK_DISPATCH_SECRET") ?? "",
    async claim(limit) {
      const { data, error } = await supabase.rpc("claim_webhook_deliveries", {
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as Claimed[];
    },
    async finish(id, ok, statusCode, err) {
      const { error } = await supabase.rpc("finish_webhook_delivery", {
        p_id: id,
        p_ok: ok,
        p_status_code: statusCode,
        p_error: err,
      });
      if (error) throw error;
    },
    resolve,
    fetch: (url, init) => fetch(url, init),
    now: () => Date.now(),
  }),
);
