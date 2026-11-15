// Entrada da Edge Function (Deno, no Supabase). A lógica está em handler.ts,
// testada em supabase/tests-pglite/edge-aprovacao-video.test.ts.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY o próprio Supabase põe no ambiente
// da função: a chave de serviço nunca sai daqui.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { handle } from "./handler.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve((req) =>
  handle(req, {
    async videoPath(token) {
      const { data, error } = await supabase.rpc("approval_video_path", { p_token: token });
      if (error) throw error;
      return typeof data === "string" ? data : null;
    },
    async signUrl(path, seconds) {
      const { data, error } = await supabase.storage.from("aprovacoes").createSignedUrl(path, seconds);
      return error ? null : data.signedUrl;
    },
  }),
);
