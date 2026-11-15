import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requirePlatform } from "@/lib/admin-server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Erros · Superadmin · Alinhavo" };

export default function AdminErrosPage() {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando os erros…" />}>
      <Erros />
    </Suspense>
  );
}

const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/** Os erros que aconteceram na tela de quem está logado (mais recentes primeiro), para o suporte agir antes da reclamação. */
async function Erros() {
  const { supabase } = await requirePlatform("/painel/admin/erros");
  const { data, error } = await supabase.rpc("platform_errors", { p_limit: 200 });
  const errors = data ?? [];
  // Agrupa pela mensagem: o mesmo erro em muita gente é prioridade.
  const groups = [...errors.reduce((m, e) => m.set(e.message, (m.get(e.message) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Superadmin" title="Erros na tela" description="O que deu errado para os clientes (sem dado pessoal: caminho, mensagem e quando)." />
      {error && (
        <p className={ui.error} role="alert">
          Não foi possível carregar agora.
        </p>
      )}
      {groups.length > 0 && (
        <section aria-labelledby="mais" className={`${ui.card} space-y-2`}>
          <h2 id="mais" className={ui.eyebrow}>
            Os que mais aparecem
          </h2>
          <ul className="space-y-1 text-sm">
            {groups.map(([msg, n]) => (
              <li key={msg} className="flex justify-between gap-3">
                <span className="truncate text-linha">{msg}</span>
                <span className="shrink-0 font-mono">{n}×</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {errors.length === 0 ? (
        <p className={ui.muted}>Nenhum erro registrado. Bom sinal.</p>
      ) : (
        <ul className={ui.list}>
          {errors.map((e) => (
            <li key={e.id} className="space-y-0.5 px-5 py-3 text-sm">
              <p className="font-medium text-linha">{e.message}</p>
              <p className="font-mono text-xs text-tinta-suave">
                {quando.format(new Date(e.created_at))} · {e.path} · {e.user_email ?? "—"}
                {e.org_id && (
                  <>
                    {" · "}
                    <Link href={`/painel/admin/clientes/${e.org_id}`} className={ui.link}>
                      {e.org_name}
                    </Link>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
