import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
import { ROLE_LABEL, ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CreateOrgForm } from "./create-org-form";

export const metadata: Metadata = { title: "Painel · Alinhavo" };

export default function PainelPage() {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando suas organizações…" />}>
      <Organizacoes />
    </Suspense>
  );
}

async function Organizacoes() {
  const user = await requireUser("/painel");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_members")
    .select("role, orgs(id, name)")
    .eq("user_id", user.id)
    .order("created_at");

  if (error) {
    return (
      <p className={ui.error} role="alert">
        Não foi possível carregar suas organizações.
      </p>
    );
  }

  const orgs = data ?? [];

  if (orgs.length === 0) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className={ui.h1}>Bem-vindo ao Alinhavo</h1>
        <p className={`mt-2 ${ui.muted}`}>
          Comece criando a sua organização. Depois você convida a equipe. Se alguém já te convidou, abra o link do
          convite.
        </p>
        <div className={`mt-8 ${ui.card}`}>
          <CreateOrgForm />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className={ui.h1}>Suas organizações</h1>
      <ul className="divide-y divide-tinta/10 overflow-hidden rounded-lg border border-tinta/15 bg-white/70">
        {orgs.map((m) => (
          <li key={m.orgs.id}>
            <Link
              href={`/painel/${m.orgs.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-papel-escuro"
            >
              <span className="font-medium">{m.orgs.name}</span>
              <span className="text-sm text-tinta-suave">{ROLE_LABEL[m.role] ?? m.role}</span>
            </Link>
          </li>
        ))}
      </ul>
      <details className={ui.card}>
        <summary className="cursor-pointer text-sm font-medium">Criar outra organização</summary>
        <div className="mt-4">
          <CreateOrgForm />
        </div>
      </details>
    </div>
  );
}
