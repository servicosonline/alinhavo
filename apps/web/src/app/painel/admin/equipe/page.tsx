import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requirePlatform } from "@/lib/admin-server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { adminRemoveHelper } from "../actions";
import { AddHelperForm } from "../admin-forms";

export const metadata: Metadata = { title: "Equipe · Superadmin · Alinhavo" };

export default function AdminEquipePage() {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando a equipe…" />}>
      <Equipe />
    </Suspense>
  );
}

const dia = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

/** Quem ajuda na administração: Dono (tudo) e Suporte (atende, sem mexer em plano nem em ajudante). */
async function Equipe() {
  const { supabase, role } = await requirePlatform("/painel/admin/equipe");
  const { data } = await supabase.rpc("platform_admins_list");
  const admins = data ?? [];
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Superadmin"
        title="Equipe da administração"
        description="Dono: tudo, inclusive planos e ajudantes. Suporte: vê os clientes, convida, muda papel e tira da organização."
      />
      <ul className={ui.list}>
        {admins.map((a) => (
          <li key={a.user_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
            <span>
              {a.email}
              <span className="block text-xs text-tinta-suave">desde {dia.format(new Date(a.created_at))}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className={a.role === "dono" ? ui.tagAlert : ui.tag}>{a.role === "dono" ? "Dono" : "Suporte"}</span>
              {role === "dono" && (
                <form action={adminRemoveHelper}>
                  <input type="hidden" name="userId" value={a.user_id} />
                  <button type="submit" className="text-xs text-linha underline underline-offset-4">
                    Tirar
                  </button>
                </form>
              )}
            </span>
          </li>
        ))}
      </ul>
      {role === "dono" ? (
        <section className={`${ui.card} space-y-3`} aria-labelledby="novo">
          <h2 id="novo" className={ui.eyebrow}>
            Adicionar ajudante
          </h2>
          <p className={ui.muted}>A pessoa precisa ter criado a conta no Alinhavo antes.</p>
          <AddHelperForm />
        </section>
      ) : (
        <p className={ui.muted}>Só o dono da plataforma adiciona e tira ajudantes.</p>
      )}
    </div>
  );
}
